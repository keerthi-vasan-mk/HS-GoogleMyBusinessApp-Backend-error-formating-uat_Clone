import { JsonController, Req, Get, UseBefore, Body, QueryParam, Put, Param, Delete } from 'routing-controllers';
import { GMBService } from '../services/GMBService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { StreamMiddleware } from '../middleware/StreamMiddleware';
import { GetReviewRequest, PutReviewRequest, DeleteReviewRequest } from '../interfaces/requests';
import { GMBReviewResponse } from '../interfaces/gmb';
import { atob, btoa } from '../utils/GenericUtility';
import { Location } from '../entity/Location';
import { GenericError, ReviewError } from '../types/errors';
import { GAuthUtility } from '../utils/GAuthUtility';
import { AnalyticsUtility } from '../utils/AnalyticsUtility';
import { AnalyticMetrics } from '../types/analytics';
import { LoggerService } from '../utils/LoggerService';
import { Request } from 'express';

@JsonController()
export class ReviewController {
  /**
   * Get a list of reviews for all locations in a stream
   */
  @Get('/reviews')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async getAllLocationReviews(@Req() req: Request, @Body() reviewRequest: GetReviewRequest) {
    LoggerService.logRequest(req);

    const { stream } = reviewRequest;

    try {
      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      // Pass Locations
      const currentSavedLocations = await Location.findByStream(stream);
      const allLocationReviews = await gmbService.getStartingReviews(currentSavedLocations);
      console.log('Testing reviews: currentSavedLocations = ', currentSavedLocations);
      console.log('Testing reviews: allLocationReviews = ', allLocationReviews);

      // Convert the location name ID and all review name IDs to base64.
      allLocationReviews.reviews.forEach((location) => {
        location.locationNameId = btoa(location.locationNameId);
        location.reviews = this.convertLocationReviewIds(location.reviews);
        console.log('Testing reviews: location = ', location);
      });

      // Order locations by latest reviews
      const orderedLocationReviews = allLocationReviews.reviews.sort((locationA, locationB) => {
        const firstReviewForLocA = locationA?.reviews?.reviews && locationA?.reviews?.reviews[0];
        const firstReviewForLocB = locationB?.reviews?.reviews && locationB?.reviews?.reviews[0];

        if (firstReviewForLocA === undefined && firstReviewForLocB === undefined) {
          return 0;
        } else if (firstReviewForLocA === undefined) {
          return 1; // Makes A greater than B (Ordering Asc)
        } else if (firstReviewForLocB === undefined) {
          return -1; // Makes B greater than A (Ordering Asc)
        }

        return new Date(firstReviewForLocB.createTime).getTime() - new Date(firstReviewForLocA.createTime).getTime();
      });
      console.log('Testing reviews: orderedLocationReviews = ', orderedLocationReviews);

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid);

      const reqResponse = {
        locationReviews: orderedLocationReviews,
        ...(allLocationReviews.locationsWithErrors && { errors: allLocationReviews.locationsWithErrors }),
      };
      LoggerService.logResponse(req, reqResponse);

      return reqResponse;
      //  orderedLocationReviews;
    } catch (error) {
      console.log('Testing reviews: error = ', error);
      LoggerService.error(`${ReviewError.REVIEW_GET_ALL} Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(ReviewError.REVIEW_GET_ALL, error);
    }
  }

  /**
   * Get a list of reviews for a single location.
   */
  @Get('/locations/:locationNameId/reviews')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async getLocationReviews(
    @Req() req: Request,
    @Body() reviewRequest: GetReviewRequest,
    @Param('locationNameId') locationNameId: string,
    @QueryParam('nextPageToken') nextPageToken: string,
  ) {
    LoggerService.logRequest(req);

    const { stream } = reviewRequest;

    try {
      // Change the location name ID back from base64.
      locationNameId = atob(locationNameId);

      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      const reviews = await gmbService.getLocationReviews(locationNameId, nextPageToken);
      const updatedReviews = this.convertLocationReviewIds(reviews);

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid);
      LoggerService.logResponse(req, updatedReviews);

      return updatedReviews;
    } catch (error) {
      LoggerService.error(`${ReviewError.REVIEW_GET_FOR_LOCATION} Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(ReviewError.REVIEW_GET_FOR_LOCATION, error);
    }
  }

  /**
   * Update or create a response to a review.
   */
  @Put('/reviews/replies/:reviewNameId')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async addUpdateReviewReply(
    @Req() req: Request,
    @Body() reviewRequest: PutReviewRequest,
    @Param('reviewNameId') reviewNameId: string,
  ) {
    LoggerService.logRequest(req);

    const { stream, comment } = reviewRequest;

    try {
      // Change the review name ID back from base64.
      reviewNameId = atob(reviewNameId);

      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);
      const review = await gmbService.putLocationReviewReply(reviewNameId, comment);

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid, 1, AnalyticMetrics.NUM_OF_REPLIES);
      LoggerService.logResponse(req, { success: true, review });

      return { success: true, review };
    } catch (error) {
      LoggerService.error(`Error creating or updating response to a review. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a response to a review.
   */
  @Delete('/reviews/replies/:reviewNameId')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async deleteReviewReply(
    @Req() req: Request,
    @Body() reviewRequest: DeleteReviewRequest,
    @Param('reviewNameId') reviewNameId: string,
  ) {
    LoggerService.logRequest(req);

    const { stream } = reviewRequest;

    try {
      // Change the review name ID back from base64.
      reviewNameId = atob(reviewNameId);

      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);
      const response = await gmbService.deleteLocationReviewReply(reviewNameId);

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid);
      LoggerService.logResponse(req, { success: response });

      return { success: response };
    } catch (error) {
      LoggerService.error(`Error deleting response to a review. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Converts a location's review IDs to a base64 string.
   *
   * @param {GMBReviewResponse} review
   * @returns {GMBReviewResponse}
   */
  private convertLocationReviewIds(reviewResponse: GMBReviewResponse): GMBReviewResponse {
    if (reviewResponse && reviewResponse.reviews) {
      reviewResponse.reviews.forEach((review) => {
        review.name = btoa(review.name);
      });
    }

    return reviewResponse;
  }
}
