import { JsonController, Get, UseBefore, Req } from 'routing-controllers';
import { AnalyticsMiddleware } from '../middleware/AnalyticsMiddleware';
import { AnalyticsUtility } from '../utils/AnalyticsUtility';
import { AnalyticsResponse } from '../interfaces/responses';
import { LoggerService } from '../utils/LoggerService';
import { Request } from 'express';

/**
 * Analytics Endpoint
 *
 * Analytics and metrics retrieval for the Hootsuite
 * GMB app usage.
 *
 * @export
 * @class AnalyticsController
 */
@JsonController('/analytics')
export class AnalyticsController {
  /**
   * Gets application analytics.
   */
  @Get()
  @UseBefore(AnalyticsMiddleware)
  async getAnalytics(@Req() req: Request): Promise<AnalyticsResponse> {
    try {
      LoggerService.logRequest(req);
      return await AnalyticsUtility.getAnalytics();
    } catch (error) {
      LoggerService.error(`Error getting the application analytics. Error: ${error}`);
      throw error;
    }
  }
}
