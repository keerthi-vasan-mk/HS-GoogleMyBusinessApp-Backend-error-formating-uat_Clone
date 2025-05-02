import { JsonController, Get, UseBefore, Req } from 'routing-controllers';
import { AdminMiddleware } from '../middleware/AdminMiddleware';
import { LogUtility } from '../utils/LogUtility';
import { ErrorLogRO } from '../interfaces/responses';
import { LoggerService } from '../utils/LoggerService';
import { Request } from 'express';

/**
 * Log Endpoint
 *
 * Error log retrieval for the Hootsuite
 * GMB app.
 *
 * @export
 * @class LogController
 */
@JsonController('/logs')
export class LogController {
  /**
   * Gets application error logs.
   */
  @Get('/errors')
  @UseBefore(AdminMiddleware)
  async getErrorLogs(@Req() req: Request): Promise<ErrorLogRO[]> {
    try {
      LoggerService.logRequest(req);
      return await LogUtility.getLogs();
    } catch (error) {
      throw error;
    }
  }
}
