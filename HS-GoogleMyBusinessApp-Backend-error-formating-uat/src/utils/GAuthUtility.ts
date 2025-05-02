import { OAuth2Client, Credentials } from 'google-auth-library';
import { GAccessToken } from '../entity/GAccessToken';
import { GRefreshToken } from '../entity/GRefreshToken';
import { StreamReference } from '../interfaces/requests';
import { GenericError, GoogleOAuthError } from '../types/errors';
import { Stream } from '../entity/Stream';
import { GMBUserDetails, OAuthCredentials } from '../interfaces/gmb';
import * as jwt from 'jsonwebtoken';

export class GAuthUtility {
  /**
   * Handler to update user refresh token and/or access token on request events by GMBServer
   *
   * @param {GRefreshToken} currentRefreshToken
   * @returns {((authCredentials: OAuthCredentials) => void)}
   */
  public static onTokenUpdateHandler(currentRefreshToken: GRefreshToken): (authCredentials: OAuthCredentials) => void {
    return (authCredentials) => {
      // Safe guard. Verify access token we got back is being assigned to the right GRefreshToken/AccessToken
      const userData = jwt.decode(authCredentials.id_token);

      if (userData.sub !== currentRefreshToken.g_user_id) {
        throw GenericError.for(GoogleOAuthError.USER_MISMATCH);
      }

      if (authCredentials.access_token && authCredentials.expiry_date) {
        const accessToken = currentRefreshToken.g_access_token;

        accessToken.access_token = authCredentials.access_token;
        accessToken.expires_at = authCredentials.expiry_date;
        accessToken.save();
      }

      if (authCredentials.refresh_token) {
        currentRefreshToken.refresh_token = authCredentials.refresh_token;
        currentRefreshToken.save();
      }
    };
  }

  /**
   * Creates or updates google tokens (Refresh Token + Access Token)
   *
   * @param googleCredentials Contains Google refresh_token and access_token, expiry_date
   * @param uid HootSuite User ID
   * @param pid HootSuite Placement ID
   *
   * @returns GRefreshToken object
   */
  public static async saveGoogleTokens(
    googleCredentials: Credentials,
    googleUserDetails: GMBUserDetails,
    streamReference: StreamReference,
  ): Promise<GRefreshToken> {
    let gToken: GRefreshToken;

    const { access_token, expiry_date, refresh_token } = googleCredentials;
    const { pid, uid } = streamReference;

    try {
      // Verify if there is already a GToken for the user google account
      gToken = await GRefreshToken.findOne({ g_user_id: googleUserDetails.userId });

      if (!gToken) {
        // Creates new Google Refresh Token
        gToken = new GRefreshToken();
        gToken.g_access_token = new GAccessToken();
      }

      // Original Reference; Stream that created the refresh token
      gToken.pid = pid;
      gToken.uid = uid;

      gToken.g_user_id = googleUserDetails.userId;
      gToken.g_display_name = googleUserDetails.userName;
      gToken.refresh_token = refresh_token;
      gToken.revoked = false;

      // Eager Loading
      gToken.g_access_token.access_token = access_token;
      gToken.g_access_token.expires_at = expiry_date;
      await gToken.g_access_token.save();

      await gToken.save();

      return gToken;
    } catch (error) {
      throw GenericError.for(GoogleOAuthError.SAVE_TOKENS, error);
    }
  }

  /**
   * Gets a Google user's ID and name from an ID token.
   *
   * @param {string} idToken Google user ID token
   * @returns {GMBUserDetails} Google user details
   */
  public static async getUserDetails(idToken: string): Promise<GMBUserDetails> {
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return {
      userId: payload.sub,
      userName: payload.name,
    };
  }

  /**
   * Changes a temporary access code into oAuth tokens
   *
   * @param code temporary access code
   *
   * @returns Google credentials
   */
  public static async getAuthenticatedTokens(code: string): Promise<Credentials> {
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    try {
      const response = await oAuth2Client.getToken(code);
      return await response.tokens;
    } catch (error) {
      console.log('error from athenticated token-->', error);
      throw GenericError.for(GoogleOAuthError.GET_TOKENS, error);
    }
  }

  /**
   * Revokes a stream's refresh token (and in turn all access tokens)
   * and updates the database to indicate it is revoked.
   *
   * @param stream Current stream
   */
  public static async revokeGoogleTokens(stream: Stream) {
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const { g_refresh_token } = stream;

    try {
      // Revoke the refresh token with Google if it exists.
      // Swallow error on failure, as we need to log the user out
      // of the stream regardless of the response from Google.
      try {
        if (g_refresh_token) {
          await oAuth2Client.revokeToken(g_refresh_token.refresh_token);
        }
      } catch (e) {}

      // Unlink locations and refresh tokens from all streams logged into the same
      // Google account after logout to ensure that the user will be redirected to
      // the Locations page after logging in again.
      // All unlinking must be completed before deleting the refresh tokens to prevent
      // Foreign Key errors (deleting a object that is actively referenced).
      const streamsWithSameGoogleUserId = await Stream.findByGoogleUserId(stream);
      for (const userStream of streamsWithSameGoogleUserId) {
        userStream.locations = [];
        userStream.g_refresh_token = null;
        await userStream.save();
      }

      // Delete Google refresh tokens
      await GRefreshToken.deleteTokensByGoogleId(g_refresh_token.g_user_id);
    } catch (error) {
      throw GenericError.for(GoogleOAuthError.REVOKE_TOKEN, error);
    }
  }
}
