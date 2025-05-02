import { GMBStarRating, GMBAuthorType } from '../types/google';
import { MediaFormat } from './requests';

export interface GMBOAuthRequest {
  /**
   * How many objects to fetch per page.
   */
  pageSize?: number;

  /**
   * If specified, the next page of the entity is retrieved. The pageToken is returned
   * when a call to endpoint returns more results than can fit into the requested
   * page size.
   */
  pageToken?: string;

  /**
   * A filter constraining the objects to return.
   *
   * The response includes only entries that match the filter.
   * If filter is empty, then no constraints are applied and all
   * objects (paginated) are retrieved for the requested account.
   *
   * For example, a request with the filter type=USER_GROUP will only
   * return user groups.
   */
  filter?: string;
}

export interface OAuthCredentials {
  refresh_token?: string;
  expiry_date?: number;
  access_token?: string;
  id_token?: string;
}

export enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

// -----------------------------------------------------------------------
// Accounts
// -----------------------------------------------------------------------

export interface GMBUserDetails {
  userId: string;
  userName: string;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts#Account.AccountState
export interface GMBAccountResponseDataAccountState {
  status: string;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts#Account
export interface GMBAccountResponseDataAccount {
  accountName: string;
  name: string;
  type: string;
  verificationState: string;
  // ...
}

// https://developers.google.com/my-business/reference/rest/v4/accounts/list
export interface GMBAccountResponse {
  accounts: [GMBAccountResponseDataAccount];
  nextPageToken: string;
}

// Base for Account Object for Internal Use
export interface GMBAccount {
  nameId: string;
  accountName: string;
  state: string;
  type: string;
}

export interface GMBAccountWithLocation {
  accountName: string;
  accountNameId: string;
  locations: GMBLocation[];
}

// -----------------------------------------------------------------------
// Locations
// -----------------------------------------------------------------------

export interface Location {
  location_name: string;
  name_id: string;
  address: string;
}

// https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations#Location.Metadata
export interface GMBLocationResponseLocationState {
  canOperateLocalPost: boolean;
  placeId?: string;
  hasVoiceOfMerchant: boolean;
  // ...
}

// https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations#Location.PostalAddress
export interface GMBLocationResponseLocationPostalAddress {
  addressLines: string[]; // Unstructured address lines describing the lower levels of an address.
  locality?: string; // Generally refers to the city/town portion of the address.
  administrativeArea?: string; // Province
  regionCode?: string; // Country
  postalCode?: string;
  // ...
}

// https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations#Location
export interface GMBLocationResponseLocation {
  name: string; // locationNameId
  title: string;
  metadata: GMBLocationResponseLocationState;
  storefrontAddress: GMBLocationResponseLocationPostalAddress;
  // ...
}

// https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list
export interface GMBLocationResponse {
  locations: [GMBLocationResponseLocation];
  nextPageToken?: string;
  // totalSize: number; // It is not being returned by the request, even tho the documentation states it should
}

// Base for Location Object for Internal Use
export interface GMBLocation {
  locationNameId: string;
  name: string;
  address: string;
  canPost: boolean;
  isPublished: boolean;
  isVerified: boolean;
}

// -----------------------------------------------------------------------
// Reviews
// -----------------------------------------------------------------------

export interface GMBReviewResponse {
  locationNameId?: string;
  sort?(arg0: (locationA: any, locationB: any) => number): unknown;
  forEach?(arg0: (location: any) => void): unknown;
  reviews?: any;
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
  locationName: string;
  error: any;
}

export interface GMBReviewLocationResponse {
  locationName?: string;
  locationNameId?: string;
  locationAddress?: string;
  reviews: GMBReviewResponse[];
  error?: any;
  locationsWithErrors?: string[];
}

export interface GMBReviewReplyResponse {
  comment: string;
  updateTime: string;
}

export interface GMBReview {
  name: string;
  reviewId: string;
  reviewer: GMBReviewer;
  starRating: GMBStarRating; // enum
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply: GMBReviewReply;
}

export interface GMBReviewer {
  profilePhotoUrl: string;
  displayName: string;
  isAnonymous: boolean;
}

export interface GMBReviewReply {
  comment: string;
  updateTime: string;
}

// -----------------------------------------------------------------------
// Questions
// -----------------------------------------------------------------------

export interface GMBQuestionResponse {
  questions?: [GMBQuestion];
  totalSize?: number;
  nextPageToken?: string;
  locationName: string;
  error: any;
}
export interface GMBQuestionLocationResponse1 {
  locationName: string;
  locationNameId: string;
  locationAddress: string;
  locationsWithErrors: any;
  error: any;
  questions: GMBQuestionResponse;
}
export interface GMBQuestionLocationResponse {
  questions?: GMBQuestionLocationResponse1[]; // Assuming GMBQuestionLocationResponse1 represents your question object
  locationsWithErrors?: any[];
}

export interface GMBQuestion {
  name: string;
  author: GMBQuestionAuthor;
  upvoteCount: number;
  text: string;
  createTime: string;
  updateTime: string;
  topAnswers: GMBQuestionAnswer[];
  totalAnswerCount: number;
}

export interface GMBQuestionAuthor {
  displayName: string;
  profilePhotoUrl: string;
  type: GMBAuthorType;
}

export interface GMBQuestionAnswer {
  name: string;
  author: GMBQuestionAuthor;
  upvoteCount: number;
  text: string;
  createTime: string;
  updateTime: string;
}

export interface GMBQuestionReplyResponse {
  name: string;
  updateTime: string;
}

// -----------------------------------------------------------------------
// Posts
// -----------------------------------------------------------------------

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts/list
export interface GMBLocalPostsResponse {
  localPosts?: [GMBLocalPostResponseLocalPost];
  nextPageToken?: string;
  error?: any;
  locationName?: any;
}

export interface GMBLocalPostResponse {
  localPost: GMBLocalPostResponseLocalPost;
  nextPageToken: string;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts#CallToAction
export interface GMBLocalPostResponseLocalPostCallToAction {
  actionType: string;
  url: string;
}

export interface GMBLocalPostResponseLocalPostMediaDimension {
  widthPixels: number;
  heightPixels: number;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.media#MediaItem
export interface GMBLocalPostResponseLocalPostMedia {
  name?: string;
  description?: string;
  thumbnailUrl?: string;
  dimensions?: GMBLocalPostResponseLocalPostMediaDimension;
  googleUrl?: string;
  sourceUrl?: string;
  mediaFormat: MediaFormat;
  dataRef?: {
    resourceName: string;
  };
  locationAssociation?: { category: string };
}

// https://developers.google.com/my-business/reference/rest/v4/Date
export interface GMBDate {
  year: number;
  month: number;
  day: number;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts#TimeOfDay
export interface GMBTime {
  hours: number;
  minutes: number;
  seconds?: number;
  nanos?: number;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts#TimeInterval
export interface GMBTimeInterval {
  startDate?: GMBDate;
  startTime?: GMBTime;
  endDate?: GMBDate;
  endTime?: GMBTime;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts#LocalPostEvent
export interface GMBLocalPostEvent {
  title?: string;
  schedule?: GMBTimeInterval;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts#LocalPostOffer
export interface GMBLocalPostOffer {
  couponCode?: string;
  redeemOnlineUrl?: string;
  termsConditions?: string;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts#LocalPost
export interface GMBLocalPostResponseLocalPost {
  name?: string;
  state?: string;
  topicType?: GMBLocalPostTopic;
  languageCode?: string;
  summary: string;
  callToAction?: GMBLocalPostResponseLocalPostCallToAction;
  createTime?: string;
  updateTime?: string;
  media?: GMBLocalPostResponseLocalPostMedia[];
  event?: GMBLocalPostEvent;
  offer?: GMBLocalPostOffer;
  metrics?: GMBLocalPostMetrics;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts#LocalPostTopicType
export enum GMBLocalPostTopic {
  event = 'EVENT',
  offer = 'OFFER',
  standard = 'STANDARD',
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.media?hl=id#MediaItem.MediaItemDataRef
export interface GMBMediaItemDataRef {
  resourceName: string;
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts/reportInsights#LocalPostMetrics
export interface GMBLocalPostMetrics {
  localPostName: string;
  metricValues: any[];
}

// https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts/reportInsights
export interface GMBLocalPostInsightResponse {
  name?: string;
  localPostMetrics?: GMBLocalPostMetrics[];
  timeZone?: string;
}
