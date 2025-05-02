import { JsonController, Get, Req } from 'routing-controllers';
import { LoggerService } from '../utils/LoggerService';
import { Request } from 'express';

@JsonController()
export class HomeController {
  /**
   * Application Healthcheck
   *
   */
  @Get('/healthcheck')
  healthcheck(@Req() req: Request) {
    LoggerService.logRequest(req);
    return { success: true };
  }
}
