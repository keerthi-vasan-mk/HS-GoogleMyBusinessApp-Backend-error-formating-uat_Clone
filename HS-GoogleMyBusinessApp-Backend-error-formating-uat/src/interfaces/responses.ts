import { NotificationTypes, NotificationStreamTypes } from 'notifications';
import { GMBApiActionTypes } from '../types/google';

// -----------------------------------------------------------------------
// MARK: - Logs

export interface ErrorLogRO {
  logId: number;
  uid: string;
  apiActionRequest: GMBApiActionTypes;
  httpCode: number;
  error: object;
  createdAt: Date;
}

// -----------------------------------------------------------------------
// MARK: - Notifications

export interface NotificationResponse {
  text: string;
  type: NotificationTypes;
  streams: NotificationStreamTypes[];
  expiry: string;
  created_at: Date;
  updated_at: Date;
}

export interface NoNotificationResponse {
  success: boolean;
  code: number;
  message: string;
}

// -----------------------------------------------------------------------
// MARK: - Analytics

export interface AnalyticsCountry {
  code: string;
  count: number;
}

export interface AnalyticsResponse {
  locationMetrics: {
    numOfTenOrMoreLocations: number;
    numOfLessThanTenLocations: number;
    averageLocationsPerUser: number;
  };
  userMetrics: {
    averageNumOfAPICallsPerUser: number;
    averageNumOfPostsPerUser: number;
    averageNumOfAnswersPerUser: number;
    averageNumOfRepliesPerUser: number;
  };
  totalAppMetrics: {
    totalNumOfAPICalls: number;
    totalNumOfAnswers: number;
    totalNumOfPosts: number;
    totalNumOfReplies: number;
    totalNumOfUsersWhoReplied: number;
    averagePostsPerUserVsTotalPosts: number;
    createdAt: Date;
    updatedAt: Date;
  };
  countries: Array<AnalyticsCountry>;
}