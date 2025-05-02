import { Request, Response, NextFunction } from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';
import * as jwt from 'jsonwebtoken';

export class AnalyticsMiddleware implements ExpressMiddlewareInterface {
  /**
   * Checks that a request has a valid admin token.
   *
   * @param request Express request
   * @param response Express response
   * @param next Express next function
   */
  use(request: Request, response: Response, next: NextFunction) {

    if (!request.headers['authorization']) {
      return response.sendStatus(401);
    }

    const [ bearer, token ] = request.headers['authorization'].split(' ');

    if (bearer === 'Bearer' && token) {
      try {
        jwt.verify(token, process.env.ADMIN_SECRET);
        next();
      } catch (error) {
        return response.sendStatus(401);
      }
    } else {
      return response.sendStatus(401);
    }
  }
}