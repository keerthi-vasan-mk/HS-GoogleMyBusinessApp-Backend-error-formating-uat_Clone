import { JsonController, Get, Req, Post, Body, UseBefore } from 'routing-controllers';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { AdminMiddleware } from '../middleware/AdminMiddleware';
import { Notification } from '../entity/Notification';
import { NotificationResponse, NoNotificationResponse } from '../interfaces/responses';
import { CreateNotificationRequest } from '../interfaces/requests';
import { NotificationStreamTypes, NotificationTypes, NO_NOTIFICATION_CODE } from '../types/notifications';
import { GeneralError, GenericError } from '../types/errors';
import { LoggerService } from '../utils/LoggerService';
import { Request } from 'express';

/**
 * Notifications Endpoint
 *
 * Notification retrieval and management.
 *
 * @export
 * @class NotificationController
 */
@JsonController('/notifications')
export class NotificationController {
  /**
   * Gets the current notification stored in the database.
   */
  @Get()
  @UseBefore(AuthMiddleware)
  getNotification(@Req() req: Request): Promise<NotificationResponse | NoNotificationResponse> {
    LoggerService.logRequest(req);
    return this.getCurrentNotification();
  }

  /**
   * Gets the current notification stored in the database.
   */
  @Get('/admin')
  @UseBefore(AdminMiddleware)
  getNotificationAdmin(@Req() req: Request): Promise<NotificationResponse | NoNotificationResponse> {
    LoggerService.logRequest(req);
    return this.getCurrentNotification();
  }

  /**
   * Creates a new notification if none exist, or updates the existing one.
   */
  @Post()
  @UseBefore(AdminMiddleware)
  async createNotification(
    @Req() req: Request,
    @Body() notificationRequest: CreateNotificationRequest,
  ): Promise<NoNotificationResponse | Notification> {
    try {
      LoggerService.logRequest(req);
      return await this.replaceNotification(notificationRequest);
    } catch (error) {
      LoggerService.error(`Error creating new notification. Error: ${error}`);
      throw GenericError.for(error.message);
    }
  }

  /**
   * Private method that gets the current notification.
   *
   * @returns {Promise<NotificationResponse | NoNotificationResponse>} Returns the current notification.
   */
  private async getCurrentNotification(): Promise<NotificationResponse | NoNotificationResponse> {
    try {
      const notification = await Notification.findOneOrFail({ single_row_id: true });
      return notification && notification.toResponseObject();
    } catch (error) {
      LoggerService.error(`Error getting current notifications. Error: ${error}`);
      // If there is no notification in the database, send back appropriate response
      if (error.name === GeneralError.ENTITY_NOT_FOUND) {
        return {
          success: true,
          code: NO_NOTIFICATION_CODE,
          message: 'No notifications found.',
        };
      }

      throw error;
    }
  }

  /**
   * Private method that validates and either creates a new notification or replaces the old one
   * if one already exists.
   *
   * @param {CreateNotificationRequest} newNotification
   * @returns {Promise<Notification>} Returns whether the notification was successfully updated or not.
   */
  private async replaceNotification(newNotification: CreateNotificationRequest): Promise<Notification> {
    const notification = (await Notification.findOne({ single_row_id: true })) || new Notification();

    // Check that streams have been set
    if (!newNotification.streams.length || !Array.isArray(newNotification.streams)) {
      throw new Error('You must specify which streams you want this notification to appear in.');
    }

    // Check that stream types are valid
    const invalidStreamTypes = newNotification.streams.filter(
      (stream) => !Object.values(NotificationStreamTypes).includes(stream),
    );
    if (invalidStreamTypes.length) {
      throw new Error(
        `Invalid stream types: ${invalidStreamTypes.join(
          ', ',
        )}. Valid stream types are 'posts', 'reviews', and 'questions'.`,
      );
    }

    // check that the notification type is valid
    if (![NotificationTypes.INFO, NotificationTypes.WARNING].includes(newNotification.type)) {
      throw new Error(`Invalid notification type: ${newNotification.type}. Valid types are 'info' and 'warning'.`);
    }

    // Check that the notification text has been set
    if (!newNotification.text) {
      throw new Error('You must specify the text for the notification to display.');
    }

    // Check that expiry date is in the future and valid
    if (new Date().getTime() > new Date(newNotification.expiry).getTime()) {
      throw new Error('Invalid expiry date. This date has already passed.');
    }

    notification.text = newNotification.text;
    notification.type = newNotification.type;
    notification.streams = newNotification.streams;
    notification.expiry = newNotification.expiry;

    return await notification.save();
  }
}
