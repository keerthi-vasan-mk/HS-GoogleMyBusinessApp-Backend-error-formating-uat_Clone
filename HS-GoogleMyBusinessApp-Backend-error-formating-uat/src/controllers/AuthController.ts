import * as jwt from 'jsonwebtoken';
import { Response, Request } from 'express';
import { JsonController, Req, Res, Get, Post, UseBefore, Body } from 'routing-controllers';
import {
  LoginRequest,
  GetTokenRequest,
  RevokeTokenRequest,
  CommonRequest,
  StreamReference,
  PostTokenCheckRequest,
  AdminLoginRequest,
} from '../interfaces/requests';
import { GAuthUtility } from '../utils/GAuthUtility';
import { HsUtility } from '../utils/HsUtility';
import { AnalyticsUtility } from '../utils/AnalyticsUtility';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { StreamMiddleware } from '../middleware/StreamMiddleware';
import { Stream } from '../entity/Stream';
import { GRefreshToken } from '../entity/GRefreshToken';
import { AdminUser } from '../entity/AdminUser';
import { RoutePage } from '../types/auth';
import { GenericError, AuthError } from '../types/errors';
import { LoggerService } from '../utils/LoggerService';

@JsonController('/auth')
export class AuthController {
  /**
   * Log in Hootsuite user
   *
   * @param loginRequest Hootsuite login request
   */
  @Post('/login')
  async login(@Req() req: Request, @Body() loginRequest: LoginRequest) {
    const { uid, pid } = loginRequest;
    LoggerService.logRequest(req, `UID-${uid}`);
    try {
      const validUser = HsUtility.checkLoginToken(loginRequest);
      if (!validUser) throw GenericError.for(AuthError.INVALID_USER_TOKEN);

      // Create Authentication Token
      const token = jwt.sign(
        {
          pid,
          uid,
        },
        process.env.SECRET,
        { expiresIn: '24h' },
      );

      // Log user's location based of the request's IP address
      AnalyticsUtility.updateAnalyticLogCountry(uid, req.ip);

      const page = await this.getInitialPage({ uid, pid });
      return { success: true, token, page };
    } catch (error) {
      LoggerService.error(`Error logging in the user. Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(AuthError.GENERATE_TOKEN);
    }
  }

  /**
   * Changes a one time access code into an access token and saves it
   * creating a stream object if necessary
   *
   * Usually used only the first time user authorizes their google account
   *
   * @param request Token request
   */
  // @Post('/gtokens')
  // @UseBefore(AuthMiddleware)
  // async authorize(@Req() req: Request, @Body() request: GetTokenRequest) {
  //   const { code, idToken, streamReference } = request;
  //   LoggerService.logRequest(req);
  //   try {
  //     // Get Google credentials
  //     const [googleCredentials, googleUserDetails] = await Promise.all([
  //       GAuthUtility.getAuthenticatedTokens(code),
  //       GAuthUtility.getUserDetails(idToken),
  //     ]);

  //     // Save or update stream with new tokens from a Google OAuth response object
  //     const gRefreshToken = await GAuthUtility.saveGoogleTokens(googleCredentials, googleUserDetails, streamReference);

  //     // Create or update current stream
  //     await HsUtility.getOrCreateStream(streamReference, gRefreshToken);

  //     return { success: true };
  //   } catch (error) {
  //     if (error instanceof GenericError) throw error;
  //     throw GenericError.for(AuthError.EXCHANGE_TOKENS, error);
  //   }
  // }

  @Post('/gtokens')
  @UseBefore(AuthMiddleware)
  async authorize(@Req() req: Request, @Body() request: GetTokenRequest) {
    const { code, streamReference } = request;
    LoggerService.logRequest(req);
    try {
      // Get Google credentials
      const googleCredentials = await GAuthUtility.getAuthenticatedTokens(code);
      const idToken = (await (googleCredentials && googleCredentials.id_token)) ? googleCredentials.id_token : '';
      const googleUserDetails = await GAuthUtility.getUserDetails(idToken);

      const refreshToken = await GRefreshToken.findOne({ g_user_id: await googleUserDetails.userId });
      const tokenFound = refreshToken && !refreshToken.revoked;
      // If the user already has valid tokens then create a new stream.
      if (tokenFound) {
        // Create or update current stream
        await HsUtility.getOrCreateStream(streamReference, refreshToken);
      }

      // Save or update stream with new tokens from a Google OAuth response object
      const gRefreshToken = await GAuthUtility.saveGoogleTokens(
        await googleCredentials,
        await googleUserDetails,
        streamReference,
      );

      // Create or update current stream
      await HsUtility.getOrCreateStream(streamReference, gRefreshToken);

      return { success: true };
    } catch (error) {
      LoggerService.error(`Error authorizing the user for the first time. Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(AuthError.EXCHANGE_TOKENS, error);
    }
  }
  /**
   * Checks to see if a user already has a valid refresh token.
   * Creates the initial stream if one does not exist.
   *
   * @param {PostTokenCheckRequest} request Token check request
   * @param {express.Response} response
   */
  // @Post('/validtokens')
  // @UseBefore(AuthMiddleware)
  // async checkTokens(@Req() req: Request, @Body() request: PostTokenCheckRequest, @Res() response: Response) {
  //   LoggerService.logRequest(req);
  //    const { idToken, streamReference } = request;
  //   try {
  //        const userDetails = await GAuthUtility.getUserDetails(idToken);
  //       console.log('userDetails', userDetails);
  //       const refreshToken = await GRefreshToken.findOne({ g_user_id: userDetails.userId });
  //       console.log('refreshToken', refreshToken);
  //       const tokenFound = refreshToken && !refreshToken.revoked;

  //       // If the user already has valid tokens then create a new stream.
  //       if (tokenFound) {
  //         // Create or update current stream
  //         await HsUtility.getOrCreateStream(streamReference, refreshToken);
  //       }
  //      return response.status(200).json({ success: true, tokenFound });

  //   } catch (error) {
  //     throw GenericError.for(AuthError.REFRESH_TOKEN_VALIDATION, error);
  //   }
  // }

  @Post('/validtokens')
  @UseBefore(AuthMiddleware)
  async checkTokens(@Req() req: Request, @Body() request: PostTokenCheckRequest, @Res() response: Response) {
    LoggerService.logRequest(req);
    const { code, streamReference } = request;
    try {
      GAuthUtility.getAuthenticatedTokens(code)
        .then(async (res) => {
          const userDetails = await GAuthUtility.getUserDetails(res.id_token);
          const refreshToken = await GRefreshToken.findOne({ g_user_id: await userDetails.userId });
          const tokenFound = refreshToken && !refreshToken.revoked;
          // If the user already has valid tokens then create a new stream.
          if (tokenFound) {
            // Create or update current stream
            await HsUtility.getOrCreateStream(streamReference, refreshToken);
          }
        })
        .catch((error) => {
          console.log(error);
        });
      return response.status(200).json({ success: true });
    } catch (error) {
      LoggerService.error(`${AuthError.REFRESH_TOKEN_VALIDATION} Error: ${error}`);
      throw GenericError.for(AuthError.REFRESH_TOKEN_VALIDATION, error);
    }
  }

  /**
   * Gets the current user's Google display name.
   *
   * @param request Token request
   */
  @Get('/gusername')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async getGoogleUserName(@Req() req: Request, @Body() request: CommonRequest) {
    LoggerService.logRequest(req);
    const { stream } = request;
    try {
      const username = stream.g_refresh_token.g_display_name;
      return { success: true, username };
    } catch (error) {
      LoggerService.error(`${AuthError.RETRIEVE_GOOGLE_USERNAME} Error: ${error}`);
      throw GenericError.for(AuthError.RETRIEVE_GOOGLE_USERNAME, error);
    }
  }

  /**
   * Revokes a refresh token (and by extension any access tokens)
   *
   * @param request Token request
   */
  @Post('/revoketokens')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async revokeTokens(@Req() req: Request, @Body() request: RevokeTokenRequest) {
    LoggerService.logRequest(req);

    const { stream } = request;

    try {
      await GAuthUtility.revokeGoogleTokens(stream);
      return { success: true };
    } catch (error) {
      LoggerService.error(`Error revoking the refresh token. Error: ${error}`);
      // Re-throw error thrown by revokeGoogleTokens
      throw error;
    }
  }

  /**
   * Log in admin user.
   *
   * @param {AdminLoginRequest} loginRequest
   * @returns {Object} Returns an admin access token.
   */
  @Post('/admin/login')
  async adminLogin(@Req() req: Request, @Body() loginRequest: AdminLoginRequest) {
    LoggerService.logRequest(req);

    const { username, password } = loginRequest;

    try {
      const adminUser = await AdminUser.findOne({ username });
      const adminPassword = await adminUser.comparePassword(password);

      if (!adminUser || !adminPassword) {
        throw GenericError.for(AuthError.INVALID_CREDENTIALS);
      }

      // Create Authentication Token
      const token = jwt.sign(
        {
          username,
          password,
          analytics_only: adminUser.analytics_only,
          timestamp: new Date().getTime(),
        },
        process.env.ADMIN_SECRET,
        { expiresIn: '24h' },
      );

      return {
        success: true,
        token,
        analytics_only: adminUser.analytics_only,
      };
    } catch (error) {
      LoggerService.error(`Error logging in admin user. Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(AuthError.ADMIN_GENERATE_TOKEN);
    }
  }

  /**
   * Returns which stage/page the user is at
   * @param streamReference Object with HootSuite user ID and Placement ID
   *
   * @returns {Promise<string>} route to load
   */
  private async getInitialPage(streamReference: StreamReference): Promise<string> {
    const { uid, pid } = streamReference;

    let stream: Stream;

    try {
      // Retrieve stream, locations, and refresh token for current user session (StreamReference)
      stream = await Stream.createQueryBuilder('stream')
        .leftJoinAndMapOne('stream.g_refresh_token', 'stream.g_refresh_token', 'g_refresh_token')
        .leftJoinAndMapMany('stream.locations', 'stream.locations', 'locations')
        .where('stream.uid = :uid', { uid })
        .andWhere('stream.pid = :pid', { pid })
        .getOne();
    } catch (error) {
      LoggerService.error(`${AuthError.STREAM_QUERY}. Error: ${error}`);
      throw GenericError.for(AuthError.STREAM_QUERY, error);
    }

    // Verify there is a valid stream and that refresh token is still valid
    if (!stream || !stream.g_refresh_token || stream.g_refresh_token.revoked) {
      return RoutePage.LOGIN;
    }

    // Check that they have set at least one location
    if (!stream.locations || stream.locations.length === 0) {
      return RoutePage.LOCATIONS;
    }

    // If all checks pass then they are logged in, have at least one location,
    // and can load their desired stream
    return RoutePage.STREAM;
  }
}
