import { Request, Response, NextFunction } from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';
import { HsUtility } from '../utils/HsUtility';
import { GenericError, AuthError } from '../types/errors';

export class StreamMiddleware implements ExpressMiddlewareInterface {
  /**
   * Embed stream object into the request and makes sure google access token is still valid
   * Refreshing access token or pointing user to the google login page if necessary
   *
   * @param request Express request
   * @param response Express response
   * @param next Express next function
   */
  async use(request: Request, _response: Response, next: NextFunction) {
    const streamReference = request.body.streamReference;

    try {
      // If stream reference is not present, user is not logged in
      if (!streamReference) throw GenericError.for(AuthError.STREAM_MISSING_REFERENCE);

      const stream = await HsUtility.getStream(streamReference);
      request.body.stream = stream;

      // Bypass type checking
      const currentRequest: any = request;
      // Multer (file uploading) clean the body removing anything we injected into it,
      // In places were Multer is used, we need to inject our variables again after the
      // they are removed by Multer.
      currentRequest.appendBody = { stream };

      // stream.g_refresh_token is eager loaded so it should be accessible at this point.
      if (!stream || !stream.g_refresh_token || stream.g_refresh_token.revoked) {
        // A Stream is created when user logs in with google
        throw GenericError.for(AuthError.STREAM_REVOKED_OR_INVALID);
      }

      next();
    } catch (error) {
      if (error instanceof GenericError) throw error;
      console.log('strem error', error);
      throw GenericError.for(AuthError.MIDDLEWARE_VALIDATION, error);
    }
  }
}
