import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';

export class AuthMiddleware implements ExpressMiddlewareInterface {
  /**
   * Checks that a request has a valid authorization token.
   * Injects the uid and pid into the request body.
   *
   * @param request Express request
   * @param response Express response
   * @param next Express next function
   */
  use(request: Request, response: Response, next: NextFunction) {
    let token = request.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    } else {
      return response.sendStatus(401);
    }

    try {
      const payload: any = jwt.verify(token, process.env.SECRET);

      request.body.streamReference = {
        uid: payload.uid,
        pid: payload.pid,
      };

      next();
    } catch (error) {
      console.log('auth error', error);
      // TokenExpiredError
      return response.sendStatus(401);
    }
  }
}
