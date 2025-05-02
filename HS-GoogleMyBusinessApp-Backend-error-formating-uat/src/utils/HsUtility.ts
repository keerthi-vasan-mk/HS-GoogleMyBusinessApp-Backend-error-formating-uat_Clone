import { createHash } from 'crypto';
import { LoginRequest, StreamReference } from '../interfaces/requests';
import { Stream } from '../entity/Stream';
import { GRefreshToken } from '../entity/GRefreshToken';

export class HsUtility {
  /**
   * Gets stream object for placement id or create a new one if it does not exist yet
   *
   * @param streamReference uid and pid
   * @param gRefreshToken Google Refresh Token
   * @returns Promise<Stream>
   */
  public static async getOrCreateStream(
    streamReference: StreamReference,
    gRefreshToken?: GRefreshToken,
  ): Promise<Stream> {
    const { pid, uid } = streamReference;

    let stream = await HsUtility.getStream(streamReference);

    // Update Stream with Google Refresh Token Reference
    if (stream && gRefreshToken && (!stream.g_refresh_token || stream.g_refresh_token.revoked)) {
      stream.g_refresh_token = gRefreshToken;
      await stream.save();
    }

    // If the stream doesn't exist yet, create it.
    if (!stream) {
      stream = new Stream();
      stream.uid = uid;
      stream.pid = pid;

      stream.g_refresh_token = gRefreshToken;

      await stream.save();
    }

    return stream;
  }

  /**
   * Get a Stream
   *
   * @param streamReference uid and pid
   */
  public static async getStream(streamReference: StreamReference): Promise<Stream> {
    const { pid, uid } = streamReference;
    return Stream.findOne({ pid, uid });
  }

  /**
   * Checks to see if the Hootsuite login token is valid
   *
   * @param loginRequest Hootsuite login request
   * @returns boolean
   */
  public static checkLoginToken(loginRequest: LoginRequest): boolean {
    const { uid, ts, token } = loginRequest;
    const checkValue = uid + ts + process.env.SHARED_SECRET;
    const shasum = createHash('sha512');

    shasum.update(checkValue);
    const hash = shasum.digest('hex');

    if (hash === token) {
      return true;
    }

    return false;
  }
}
