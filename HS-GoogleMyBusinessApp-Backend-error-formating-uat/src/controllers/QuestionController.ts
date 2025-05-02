import { JsonController, Req, Get, UseBefore, Body, QueryParam, Post, Delete, Param } from 'routing-controllers';
import { GMBService } from '../services/GMBService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { StreamMiddleware } from '../middleware/StreamMiddleware';
import { GetQuestionRequest, PutQuestionRequest, DeleteReplyRequest } from '../interfaces/requests';
import { GMBAuthorType } from '../types/google';
import { GMBQuestionResponse } from '../interfaces/gmb';
import { Location } from '../entity/Location';
import { GenericError, QuestionError } from '../types/errors';
import { atob, btoa } from '../utils/GenericUtility';
import { GAuthUtility } from '../utils/GAuthUtility';
import { AnalyticsUtility } from '../utils/AnalyticsUtility';
import { AnalyticMetrics } from '../types/analytics';
import { LoggerService } from '../utils/LoggerService';
import { Request } from 'express';

@JsonController()
export class QuestionController {
  /**
   * Get a list of questions for all locations in a stream
   */
  @Get('/questions')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async getAllLocationQuestions(@Req() req: Request, @Body() questionRequest: GetQuestionRequest) {
    LoggerService.logRequest(req);

    const { stream } = questionRequest;

    try {
      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      const currentSavedLocations = await Location.findByStream(stream);

      const questionsObj = await gmbService.getStartingQuestions(currentSavedLocations);
      const googleUserName = stream.g_refresh_token.g_display_name;

      // Update the questions to identify if any questions were answered by
      // the current user. Also adjust all IDs to be base64.
      const updatedLocationQuestions = questionsObj.questions.map((location) => {
        // Convert location ID
        location.locationNameId = btoa(location.locationNameId);
        // Update the location questions and answers.
        if (location.questions) location.questions = this.updateQuestionAnswers(location.questions, googleUserName);
        return location;
      });

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid);

      const reqResponse = {
        locationQuestions: updatedLocationQuestions,
        ...(questionsObj.locationsWithErrors && { errors: questionsObj.locationsWithErrors }),
      };
      LoggerService.logResponse(req, reqResponse);

      return reqResponse;
    } catch (error) {
      LoggerService.error(`${QuestionError.QUESTION_GET_ALL} Error: ${error}`);
      console.log('error', error);
      throw GenericError.for(QuestionError.QUESTION_GET_ALL, error);
    }
  }

  /**
   * Get a list of questions for a single location.
   */
  @Get('/locations/:locationNameId/questions')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async getLocationQuestions(
    @Req() req: Request,
    @Body() questionRequest: GetQuestionRequest,
    @QueryParam('nextPageToken') nextPageToken: string,
    @Param('locationNameId') locationNameId: string,
  ) {
    LoggerService.logRequest(req);

    const { stream } = questionRequest;

    try {
      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      // Convert back from base64.
      locationNameId = atob(locationNameId);

      const questions = await gmbService.getLocationQuestions(locationNameId, nextPageToken);
      console.log('Testing questions: locationNameId = ', locationNameId);
      console.log('Testing questions: questions = ', questions);

      // Check to see if the current user answered any of the questions.
      const userName = stream.g_refresh_token.g_display_name;
      const updatedQuestions = this.updateQuestionAnswers(questions, userName);
      console.log('Testing questions: userName = ', userName);
      console.log('Testing questions: updatedQuestions = ', updatedQuestions);

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid);
      LoggerService.logResponse(req, updatedQuestions);

      return updatedQuestions;
    } catch (error) {
      console.log('Testing questions: error = ', error);
      LoggerService.error(`${QuestionError.QUESTION_GET_FOR_LOCATION} Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(QuestionError.QUESTION_GET_FOR_LOCATION, error);
    }
  }

  /**
   * Update or create a response to a question.
   */
  @Post('/questions/responses/:questionNameId')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async addUpdateQuestionReply(
    @Req() req: Request,
    @Body() questionRequest: PutQuestionRequest,
    @Param('questionNameId') questionNameId: string,
  ) {
    LoggerService.logRequest(req);

    const { stream, text } = questionRequest;

    try {
      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      // Convert back to base64.
      questionNameId = atob(questionNameId);

      const question = await gmbService.putLocationQuestionReply(questionNameId, text);

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid, 1, AnalyticMetrics.NUM_OF_ANSWERS);
      LoggerService.logResponse(req, { success: true, question });

      return { success: true, question };
    } catch (error) {

      LoggerService.error(`Error creating or updating a response to a question. Error: ${error}`);

      throw error;
    }
  }

  /**
   * Deletes the response to a question.
   */
  @Delete('/questions/responses/:questionNameId')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async deleteReviewReply(
    @Req() req: Request,
    @Body() reviewRequest: DeleteReplyRequest,
    @Param('questionNameId') questionNameId: string,
  ) {
    LoggerService.logRequest(req);

    const { stream } = reviewRequest;

    try {
      // Change ID back from base64.
      questionNameId = atob(questionNameId);

      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      const response = await gmbService.deleteLocationQuestionReply(questionNameId);

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid);
      LoggerService.logResponse(req, { success: response });

      return { success: response };
    } catch (error) {

      LoggerService.error(`${QuestionError.QUESTION_RESPONSE_DELETE} Error: ${error}`);

      if (error instanceof GenericError) throw error;
      throw GenericError.for(QuestionError.QUESTION_RESPONSE_DELETE, error);
    }
  }

  /**
   * Identifies if an answer belongs to the current user and injects a new
   * property into the answer object to identify this.
   *
   * @param {GMBQuestionResponse | GMBQuestionResponse[]} questions
   * @param {String} accountName
   */
  private updateQuestionAnswers(questions: GMBQuestionResponse, userDisplayName: string) {
    // Convert question IDs, reply IDs, and check if the current user answered the question.
    if (questions.questions) {
      questions.questions.forEach((question) => {
        question.name = btoa(question.name);
        if (question.topAnswers) {
          question.topAnswers.forEach((answer) => {
            answer.name = btoa(answer.name);
            if (answer.author.type === GMBAuthorType.MERCHANT && answer.author.displayName === userDisplayName) {
              answer['currentUserReply'] = true;
            }
          });
        }
      });
    }

    return questions;
  }
}
