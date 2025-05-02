import * as winston from 'winston';
import { Request } from 'express';

export class LoggerService {
  public static logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: 'http',
        format: winston.format.combine(
          winston.format.align(),
          winston.format.printf((info) => `${info.message}`),
        ),
      }),
    ],
  });

  /**
   * Logs any errors occurred on the server
   *
   * @param message - Error message
   */
  public static async error(message: string, error?) {
    try {
      if (error instanceof Error) {
        error = error.stack;
      } else if (error instanceof Object) {
        error = JSON.stringify(error);
      }
      const log = `[ERR] [${new Date().toUTCString()}] - MSG[${message}] - TRACE[${error}]\n`;
      LoggerService.logger.error(log, error);
    } catch (err) {
      LoggerService.logger.error(err);
    }
  }

  /**
   * @param message - Log data
   */
  public static async info(message: string) {
    try {
      const log = `[INFO] [${new Date().toUTCString()}] - ${message}`;
      LoggerService.logger.info(log);
    } catch (err) {
      LoggerService.logger.error(err);
    }
  }

  private static async http(message: string) {
    try {
      const log = `[HTTP] ${message}`;
      LoggerService.logger.http(log);
    } catch (err) {
      LoggerService.logger.error(err);
    }
  }

  /**
   * Logs every API transaction
   *
   * @remarks
   * @param req - Express request for the current application context
   */
  public static async logRequest(request: Request, input?: string) {
    try {
      const uid = request?.body?.streamReference?.uid ?? null;
      const pid = request?.body?.streamReference?.pid ?? null;
      const method = request.method;
      const url = request.url;
      const log = `[${new Date().toUTCString()}] - [${method}] - URL[${url}] - USER_ID[${uid}] - PID[${pid}] - INPUT[${input}]\n`;
      LoggerService.http(log);
    } catch (err) {
      LoggerService.error(err);
    }
  }

  public static async logResponse(request: Request, response) {
    if (process.env.TRACE_RESPONSE_LOGS === 'TRUE') {
      const url = request.url;
      const uid = request?.body?.streamReference?.uid ?? null;
      const method = request.method;
      const log = `[${new Date().toUTCString()}] - [${method}] - URL[${url}] - USER_ID[${uid}] - RES[${JSON.stringify(response)}]`;
      LoggerService.http(log);
    }
  }
}