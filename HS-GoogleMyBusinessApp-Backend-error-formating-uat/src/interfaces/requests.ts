import { Stream } from '../entity/Stream';
import { GMBAccountWithLocation, GMBLocation, GMBLocalPostEvent, GMBLocalPostOffer, GMBLocalPostMetrics } from './gmb';
import { NotificationTypes, NotificationStreamTypes } from 'notifications';

// -----------------------------------------------------------------------
// API Type Alias
// -----------------------------------------------------------------------

/**
 * Hootsuite User ID
 */
export type HSUID = string;

/**
 * Hootsuite Stream's placement ID
 */
export type HSPID = string;

// -----------------------------------------------------------------------
// Utility Interfaces
// -----------------------------------------------------------------------

/**
 * Use this request to extend any requests that use the Auth Middleware.
 */
export interface ProtectedRequest {
  pid: HSPID;
  uid: HSUID;
}

/**
 * Contains a stream reference (pid and uid)
 * Alias to ProtectedRequest
 */
export interface StreamReference extends ProtectedRequest {}

/**
 * Interface for a Common Request that expects a
 * `streamReference` and a `stream`
 */
export interface CommonRequest {
  streamReference: StreamReference;
  stream: Stream;
}

// -----------------------------------------------------------------------
// API Responses
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// MARK: - Login

export interface LoginRequest extends ProtectedRequest {
  ts: string;
  token: string;
}

export interface GetTokenRequest {
  streamReference: StreamReference;
  code: string;
  idToken: string;
}

export interface PostTokenCheckRequest {
  streamReference: StreamReference;
  code: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface RevokeTokenRequest extends CommonRequest {}

// -----------------------------------------------------------------------
// MARK: - Reviews

export interface GetReviewRequest extends CommonRequest {}

export interface PutReviewRequest extends CommonRequest {
  comment: string;
  reviewNameId: string;
}

export interface DeleteReviewRequest extends CommonRequest {}

// -----------------------------------------------------------------------
// MARK: - Locations

export interface GetLocationRequest extends CommonRequest {}

export interface GetLocationResponse {
  success: boolean;
  locations: GMBLocation[];
}

export interface GetAccountLocationResponse {
  success: boolean;
  accounts: GMBAccountWithLocation[];
}

export interface LocationBodyResponse {
  locationNameId: string;
  name: string;
  address: string;
  isActive: boolean;
  isPublished: boolean;
  isVerified: boolean;
  canPost: boolean;
}

export type LocationNameId = string;

export interface PutLocationRequest extends CommonRequest {
  locationIds: LocationNameId[];
}

// -----------------------------------------------------------------------
// MARK: - Questions

export interface GetQuestionRequest extends CommonRequest {}

export interface DeleteReplyRequest extends CommonRequest {}

export interface PutQuestionRequest extends CommonRequest {
  text: string;
  questionNameId: string;
}

// -----------------------------------------------------------------------
// MARK: - Posts

export interface PostItemPagination {
  locationId: string;
  nextTokenPage?: string;
}

export interface GetPostsRequest extends CommonRequest {
  pagination?: PostItemPagination[];
}

export interface GetPostsResponse {
  success: boolean;
  pagination: PostItemPagination[];
  posts: GetPostsBodyResponse[];
  errors: any;
}

export interface GetPostResponse {
  success: boolean;
  post: GetPostsBodyResponse;
}

export interface GetPostsBodyResponse {
  id: string;
  content: string;
  location: string;
  locationId: string;
  locationAddress: string;
  createTime: string;
  updateTime: string;
  media: GetPostsBodyMediaResponse[];
  topicType: string;
  state: string;
  ctaButtonType: string;
  ctaButtonLink: string;
  postInsight?: GMBLocalPostMetrics;
}

export interface GetPostsBodyMediaDimensionResponse {
  widthPixels: number;
  heightPixels: number;
}

export enum MediaFormat {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

export interface GetPostsBodyMediaResponse {
  description?: string;
  thumbnailUrl?: string;
  dimensions?: GetPostsBodyMediaDimensionResponse;
  googleUrl?: string;
  sourceUrl?: string;
  dataRef?: { resourceName: string };
  mediaFormat?: MediaFormat;
}

export interface FilePath {
  location: string;
  fileName: string;
  mediaFormat: MediaFormat;
}

export interface PostMediaRequest extends CommonRequest, PostBodyMediaRequest {}

export interface PostGoogleDriveMediaRequest extends CommonRequest, PostBodyMediaRequest {
  googleDriveToken: string;
}

export interface PostBodyMediaRequest {
  description: string;
  mediaFormat: MediaFormat;
  sourceUrl: string;
}

export enum PostTopicType {
  LOCAL_POST_TOPIC_TYPE_UNSPECIFIED, // No post type is specified.
  STANDARD, // Post contains basic information, like summary and images.
  EVENT, // Post contains basic information and an event.
  OFFER, // Post contains basic information, an event and offer related content (e.g. coupon code)
  PRODUCT, // Post contains basic information and product related content (e.g. name, price).
}

export interface PostLocalPostRequestBody {
  content: string;
  media: any[];
  type: string;
  ctaButtonType: string;
  ctaButtonLink: string;
  event?: GMBLocalPostEvent;
  offer?: GMBLocalPostOffer;
}

export interface PostLocalPostRequest extends CommonRequest {
  post: PostLocalPostRequestBody;
  tempFileKey: string;
}

export interface PostMultipleLocalPostRequest extends PostLocalPostRequest {
  locations: string[];
}

export interface PatchLocalPostRequest extends PostLocalPostRequest {}

export interface RemoveMediaRequest extends CommonRequest {}

// MARK: - Streams
export interface DeleteStreamRequest {
  streamReference: StreamReference;
  stream: Stream;
}

// -----------------------------------------------------------------------
// MARK: - Notifications

export interface CreateNotificationRequest {
  text: string;
  type: NotificationTypes;
  streams: NotificationStreamTypes[];
  expiry: Date;
}
