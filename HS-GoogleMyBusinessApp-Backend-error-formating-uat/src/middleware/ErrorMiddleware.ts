import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { GeneralError, GenericError, UnhandledApiError } from '../types/errors';

/**
 * Error Handling Middleware
 *
 * @export
 * @param {ErrorRequestHandler} err
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
export function errorHandler(err: ErrorRequestHandler, _req: Request, res: Response, next: NextFunction) {
  // If you call next() with an error after you have started writing the response (for
  // example, if you encounter an error while streaming the response to the client) the
  // Express default error handler closes the connection and fails the request.
  //
  // So when you add a custom error handler, you must delegate to the default Express error
  // handler, when the headers have already been sent to the client.
  if (res.headersSent) {
    return next(err);
  }

  // UnhandledApiError
  if (err instanceof UnhandledApiError) {
    const statusCode = err.status || 404;

    return res.status(statusCode).json({
      success: false,
      error: {
        code: ' Not Found',
        message: err.message,
      },
    });
  }

  // Generic Error
  if (err instanceof GenericError) {
    const statusCode = err.httpErrorCode || 500;

    return res.status(statusCode).json({
      success: false,
      error: err.parseToJSON(),
    });
  }

  // Error upload files
  if (err.name === 'MulterError') {
    const error: any = err; // Bypass typechecking

    return res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Log Error
  // Any non-GenericError was not properly handled by the application.
  // We want to show a user-friendly message while hiding details of the internal
  // implementation when running in production.
  // Unfortunately if it got here, it means we don't have a user-friendly message to show.
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'Internal',
        message: GeneralError.INTERNAL_SERVER_ERROR,
      },
    });
  }

  // Syntax Error
  if (err instanceof SyntaxError) {
    const errAny: any = err; // statusCode is not included in the object default type
    const statusCode = errAny.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errAny.type || 'Undefined',
        message: err.message,
      },
    });
  }

  // Other Errors

  return res.status(500).json({
    success: false,
    error: err,
  });
}

export const unhandledApis = (_req: Request, _res: Response, next: NextFunction) => {
  const error = new UnhandledApiError(`Route not found`, 404);
  next(error);
};
