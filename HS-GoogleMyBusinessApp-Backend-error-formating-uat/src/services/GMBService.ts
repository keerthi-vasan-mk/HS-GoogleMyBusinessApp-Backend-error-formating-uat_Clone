import { OAuth2Client } from 'google-auth-library';
import { GaxiosOptions } from 'gaxios';
import * as fs from 'fs';
import * as dayjs from 'dayjs';
import { Stream } from '../entity/Stream';
import { LogUtility } from '../utils/LogUtility';
import { GenericError, GMBError } from '../types/errors';
import { GMBApiActionTypes } from '../types/google';
import {
  OAuthCredentials,
  GMBLocation,
  GMBAccount,
  GMBAccountResponse,
  GMBLocationResponse,
  GMBReviewResponse,
  GMBReviewReplyResponse,
  GMBQuestionResponse,
  GMBQuestionReplyResponse,
  GMBLocationResponseLocationState,
  Location,
  GMBLocationResponseLocationPostalAddress,
  GMBLocalPostResponseLocalPost,
  GMBMediaItemDataRef,
  GMBQuestionLocationResponse,
  GMBLocalPostResponseLocalPostMedia,
  GMBReviewLocationResponse,
  GMBAccountWithLocation,
  GMBLocalPostsResponse,
  LogLevel,
  GMBLocalPostInsightResponse,
} from '../interfaces/gmb';
import { MediaFormat } from '../interfaces/requests';
import { LoggerService } from '../utils/LoggerService';

export class GMBService {
  /**
   * Google My Business Base URL
   */
  private static gmbBaseUrl = 'https://mybusiness.googleapis.com/v4/';

  /**
   * Update GMB Base URL
   */
  private static GMB_ACCOUNT_MANAGEMENT_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/';
  private static GMB_ACCOUNT_BUSINESS_INFORMATION_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1/';

  /**
   * Update GMB Base URL - Question
   */
  private static GMB_ACCOUNT_QUESTION_URL = 'https://mybusinessqanda.googleapis.com/v1/';

  private static baseRequestOptions: GaxiosOptions = {
    baseURL: GMBService.gmbBaseUrl,
  };

  private static BASE_ACCOUNT_INFORMATION_REQUEST_OPTIONS: GaxiosOptions = {
    baseURL: GMBService.GMB_ACCOUNT_BUSINESS_INFORMATION_URL,
  };

  private static BASE_ACCOUNT_MANAGEMENT_REQUEST_OPTIONS: GaxiosOptions = {
    baseURL: GMBService.GMB_ACCOUNT_MANAGEMENT_URL,
  };

  private static BASE_ACCOUNT_QUESTION_REQUEST_OPTIONS: GaxiosOptions = {
    baseURL: GMBService.GMB_ACCOUNT_QUESTION_URL,
  };

  /**
   * Google OAuth instance
   */
  private instance: OAuth2Client;

  /**
   * Hootusite User ID
   */
  private uid: string;

  /**
   * GMB Stream object
   */
  private stream: Stream;

  public gmbLocationErrorList = {
    ERROR_CODE_UNSPECIFIED: 'Missing error code.',
    INVALID_ATTRIBUTE_NAME: 'Invalid attribute name for this location.',
    ASSOCIATE_OPERATION_ON_VERIFIED_LOCATION: 'Cannot modify a verified location.',
    ASSOCIATE_LOCATION_INVALID_PLACE_ID: 'Invalid place ID for location association.',
    LAT_LNG_UPDATES_NOT_PERMITTED: 'Cannot update location coordinates.',
    PO_BOX_IN_ADDRESS_NOT_ALLOWED: 'PO box cannot be used in address.',
    BLOCKED_REGION: 'Business from this region is not accepted.',
    MISSING_BOTH_PHONE_AND_WEBSITE: 'Phone or website is required for customer location businesses.',
    MISSING_STOREFRONT_ADDRESS_OR_SAB: 'Location must have a storefront address or a service area.',
    LAT_LNG_TOO_FAR_FROM_ADDRESS: 'Invalid location coordinates.',
    LAT_LNG_REQUIRED: 'Invalid address. Please provide latitude/longitude.',
    INVALID_CHARACTERS: 'Invalid characters found.',
    FORBIDDEN_WORDS: 'Forbidden words found.',
    INVALID_INTERCHANGE_CHARACTERS: 'Invalid characters found.',
    FIELDS_REQUIRED_FOR_CATEGORY: 'Additional fields required for this location category.',
    STOREFRONT_REQUIRED_FOR_CATEGORY: 'Your business category requires a storefront location.',
    ADDRESS_MISSING_REGION_CODE: 'Address is missing required region code.',
    ADDRESS_EDIT_CHANGES_COUNTRY: 'Cannot change the country of the address.',
    UNVERIFIED_LOCATION: 'Verify your location first to make changes.',
    INVALID_LOCATION_CATEGORY: "This category isn't allowed for this action.",
    INVALID_URL: 'Check the URL format and try again.',
    URL_PROVIDER_NOT_ALLOWED: "This website can't be used for this action.",
    TOO_MANY_VALUES: 'Simplify your request. Fewer details are needed.',
    DELETED_LINK: 'This link no longer exists.',
    LINK_ALREADY_EXISTS: 'Choose a different website link.',
    SCALABLE_DEEP_LINK_INVALID_MULTIPLICITY: 'One link per website is allowed for this action.',
    LINK_DOES_NOT_EXIST: 'The link you provided is invalid.',
    SPECIAL_HOURS_SET_WITHOUT_REGULAR_HOURS: 'Special hours require regular business hours.',
    INVALID_TIME_SCHEDULE: 'Invalid or overlapping time schedule.',
    INVALID_HOURS_VALUE: 'Invalid hours format or value.',
    OVERLAPPED_SPECIAL_HOURS: 'Special hours cannot overlap.',
    INCOMPATIBLE_MORE_HOURS_TYPE_FOR_CATEGORY: "Business category doesn't support this hours type.",
    DUPLICATE_CHILDREN_LOCATIONS: 'Duplicate children locations in relationship data.',
    INCOMPATIBLE_SERVICE_AREA_AND_CATEGORY: 'Service area business cannot have the selected primary category.',
    INVALID_SERVICE_AREA_PLACE_ID: 'Invalid place ID in service area.',
    INVALID_AREA_TYPE_FOR_SERVICE_AREA: 'Invalid area type for service area.',
    OPENING_DATE_TOO_FAR_IN_THE_FUTURE: 'Enter an opening date within a year.',
    OPENING_DATE_MISSING_YEAR_OR_MONTH: 'Opening date must have a year or a month specified.',
    OPENING_DATE_BEFORE_1AD: 'Opening date cannot be before 1 AD.',
    TOO_MANY_ENTRIES: 'Too many entries for the field.',
    INVALID_PHONE_NUMBER: 'Invalid phone number.',
    INVALID_PHONE_NUMBER_FOR_REGION: 'Invalid phone number for region.',
    MISSING_PRIMARY_PHONE_NUMBER: 'Missing primary phone number.',
    THROTTLED: 'Cannot update the field at this time.',
    UNSUPPORTED_POINT_RADIUS_SERVICE_AREA: 'Point radius service areas are no longer supported.',
    INVALID_CATEGORY: 'Invalid category ID.',
    CANNOT_REOPEN: 'Business cannot reopen.',
    INVALID_BUSINESS_OPENING_DATE: 'Invalid business opening date.',
    INVALID_LATLNG: 'Invalid latitude/longitude.',
    PROFILE_DESCRIPTION_CONTAINS_URL: 'Business description should not contain a URL.',
    LODGING_CANNOT_EDIT_PROFILE_DESCRIPTION: "Lodging location's profile description can't be edited.",
    INVALID_ADDRESS: 'Invalid address.',
    PARENT_CHAIN_CANNOT_BE_THE_LOCATION_ITSELF: 'Parent chain cannot be the location itself.',
    RELATION_CANNOT_BE_THE_LOCATION_ITSELF: 'Relation cannot be the location itself.',
    MISSING_ADDRESS_COMPONENTS: 'Missing value for address components.',
    READ_ONLY_ADDRESS_COMPONENTS: 'Cannot edit readonly address components.',
    STRING_TOO_LONG: 'The text is too long.',
    STRING_TOO_SHORT: 'The text is too short.',
    REQUIRED_FIELD_MISSING_VALUE: 'Missing value for a required field.',
    ATTRIBUTE_PROVIDER_URL_NOT_ALLOWED: 'Cannot add or edit the URL for a provider.',
    ATTRIBUTE_INVALID_ENUM_VALUE: 'Unknown value for enum attribute.',
    ATTRIBUTE_NOT_AVAILABLE: 'Scalable attribute not valid for this location.',
    ATTRIBUTE_CANNOT_BE_REPEATED: 'Scalable attribute can only be specified once.',
    ATTRIBUTE_TYPE_NOT_COMPATIBLE_FOR_CATEGORY:
      'Scalable attribute is not compatible with the categories set on the location.',
    ADDRESS_REMOVAL_NOT_ALLOWED: 'Cannot remove the address for your business.',
    AMBIGUOUS_TITLE: 'Best name is ambiguous for a language.',
    INVALID_CATEGORY_FOR_SAB: 'A pure SAB cannot have specific types of gcids.',
    RELATION_ENDPOINTS_TOO_FAR: 'Relation endpoints are too far from each other.',
    INVALID_SERVICE_ITEM: 'Service item not set.',
    SERVICE_ITEM_LABEL_NO_DISPLAY_NAME: 'Label is missing display name.',
    SERVICE_ITEM_LABEL_DUPLICATE_DISPLAY_NAME: 'Display name is not unique for all labels.',
    SERVICE_ITEM_LABEL_INVALID_UTF8: 'Label contains invalid UTF-8 symbols.',
    FREE_FORM_SERVICE_ITEM_WITH_NO_CATEGORY_ID: 'Missing category ID in freeFormServiceItem.',
    FREE_FORM_SERVICE_ITEM_WITH_NO_LABEL: 'Missing label in freeFormServiceItem.',
    SERVICE_ITEM_WITH_NO_SERVICE_TYPE_ID: 'Missing service type ID in structuredServiceItem.',
    INVALID_LANGUAGE: 'Invalid language code.',
    PRICE_CURRENCY_MISSING: 'Missing currency code.',
    PRICE_CURRENCY_INVALID: 'Invalid currency code.',
    SERVICE_TYPE_ID_DUPLICATE: 'Duplicate service type IDs within the location.',
    PIN_DROP_REQUIRED: 'Address cannot be located. Please provide a pin drop.',
    STALE_DATA:
      'One or more items were recently updated by Google. Only the owner of this business can make changes at this time.',
    PHONE_NUMBER_EDITS_NOT_ALLOWED: 'Edits to the phone number field are not allowed.',
    MULTIPLE_ORGANIZATIONALLY_PART_OF_RELATION:
      'More than one relation models the logical relation between two locations.',
  };
  /**
   * Callback function to be executed when access token or refresh token changes
   */
  private onTokensChange: ((value: OAuthCredentials) => any) | null;

  constructor(stream: Stream, onTokensChange: (value: OAuthCredentials) => any) {
    this.instance = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    // access_token, expiry_date, access_token
    this.instance.setCredentials({ ...stream.getCredentials() });

    // Set Hootsuite UID for instance
    this.uid = stream.uid;
    this.stream = stream;

    this.onTokensChange = onTokensChange;
    this.watchTokensChange();
  }

  /**
   * Watch for access token or refresh token changes
   */
  private watchTokensChange() {
    this.instance.on('tokens', (tokens) => {
      this.log({ updatedTokens: tokens }, LogLevel.DEBUG);
      if (this.onTokensChange) this.onTokensChange(tokens);
    });
  }

  /**
   * Utility to log internal operations
   *
   * @param {*} message
   * @param {LogLevel} [level=LogLevel.INFO]
   */
  private log(error: any, level: LogLevel = LogLevel.INFO) {
    const defaultLevel = process.env.LOG_LEVEL || 'INFO';

    const message = JSON.stringify({
      component: 'GMBService',
      operationLevel: level,
      timestamp: new Date(),
      log: error,
    });

    switch (level) {
      case LogLevel.DEBUG:
        if (['DEBUG'].includes(defaultLevel)) LoggerService.error(message);
        break;
      case LogLevel.ERROR:
        if (['DEBUG', 'INFO', 'ERROR'].includes(defaultLevel)) LoggerService.error(message);
        break;
      case LogLevel.INFO:
        if (['DEBUG', 'INFO'].includes(defaultLevel)) LoggerService.info(message);
        break;
    }
  }

  // ----------------------------------------------------------------------------
  // Accounts
  // ----------------------------------------------------------------------------

  /**
   * Get user business for the account
   */
  public async getAccounts(): Promise<GMBAccount[]> {
    this.log({ query: 'getAccounts' }, LogLevel.INFO);

    const accounts: GMBAccount[] = [];

    // Request: https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts/list
    const requestOptions: GaxiosOptions = {
      url: 'accounts',
      method: 'GET',
      params: {},
    };

    try {
      // Fetches all accounts or groups based on nextPageToken value. (Default limit is 20 only)
      let allAccounts = [], nextPageToken, request;
      while (true) {
        request = await this.instance.request<GMBAccountResponse>({
          ...GMBService.BASE_ACCOUNT_MANAGEMENT_REQUEST_OPTIONS,
          ...requestOptions,
          params: { pageToken : nextPageToken }
        });
        allAccounts = [...allAccounts, ...request.data.accounts];
        nextPageToken = request.data.nextPageToken;
        if (!nextPageToken) {
          break;
        }
      }

      this.log({ request }, LogLevel.DEBUG);
      if (allAccounts) {
        allAccounts.forEach((account) => {
              const mappedAccount: GMBAccount = {
            nameId: account.name,
            accountName: account.accountName,
            state: account.verificationState,
            type: account.type,
          };

          accounts.push(mappedAccount);
        });
      }
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.GET_ACCOUNTS, error);
      // Throw Generic Message
      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }

    return accounts;
  }

  // ----------------------------------------------------------------------------
  // Locations
  // ----------------------------------------------------------------------------

  /**
   * Parse GMB address object into a readable string
   *
   * @param {GMBLocationPostalAddress} address
   */
  private parseLocationAddress(address: GMBLocationResponseLocationPostalAddress): string {
    let addressStr = '';

    if (!address) return addressStr;

    if (address.addressLines) {
      addressStr = address.addressLines.join(', ');
    }

    // City
    if (address.locality) {
      if (addressStr) addressStr += ', ';
      addressStr += address.locality;
    }

    // Province
    if (address.administrativeArea) {
      if (addressStr) addressStr += ', ';
      addressStr += address.administrativeArea;
    }

    // Country
    if (address.regionCode) {
      if (addressStr) addressStr += ', ';
      addressStr += address.regionCode;
    }

    // Postal Code
    if (address.postalCode) {
      if (addressStr) addressStr += ' ';
      addressStr += address.postalCode;
    }

    return addressStr;
  }

  /**
   * Get locations for an account
   *
   * @param {GMBAccount} account
   * @param {boolean} recursively If set get all locations handling pagination
   * @param {string} pageToken If specified, it fetches the next page of locations. The page token is returned by previous call.
   */
  private async getLocationsForAccount(
    account: GMBAccount,
    recursively?: boolean,
    pageToken?: string,
  ): Promise<GMBLocation[]> {
    this.log({ query: 'getLocationsForAccount' }, LogLevel.INFO);

    let locations: GMBLocation[] = [];

    // Request https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list
    const requestOptions: GaxiosOptions = {
      url: `${account.nameId}/locations`,
      params: {
        pageSize: 100, // Set for clarity. 100 is already the default on GMB API
        pageToken: pageToken,
        readMask: `name,title,metadata,storefrontAddress`,
      },
    };

    try {
      const request = await this.instance.request<GMBLocationResponse>({
        ...GMBService.BASE_ACCOUNT_INFORMATION_REQUEST_OPTIONS,
        ...requestOptions,
      });
      this.log({ request }, LogLevel.INFO);

      const dataLocations = request.data.locations;

      if (dataLocations) {
        request.data.locations.forEach((location) => {
          // Parse Address accounting for its optionality
          const address = this.parseLocationAddress(location.storefrontAddress);

          const defaultBaseState: GMBLocationResponseLocationState = {
            canOperateLocalPost: false,
            hasVoiceOfMerchant: false,
          };

          // Make sure all state variables are set filling default variable if necessary
          const locationState = { ...defaultBaseState, ...(location.metadata || {}) };
          const mappedLocation: GMBLocation = {
            locationNameId: `${account.nameId}/${location.name}`,
            isVerified: locationState.hasVoiceOfMerchant,
            isPublished: locationState.hasVoiceOfMerchant,
            canPost: locationState.hasVoiceOfMerchant,
            name: location.title,
            address,
          };

          locations.push(mappedLocation);
        });
      }

      const nextPageToken = request.data.nextPageToken;

      // Should it run recursively parsing all pages?
      // Remotely possible that there are more locations but probably not desirable
      if (recursively && nextPageToken) {
        const locationsForNextPage = await this.getLocationsForAccount(account, recursively, nextPageToken);
        locations = locations.concat(locationsForNextPage);
      }

      return locations;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.GET_LOCATIONS_FOR_ACCOUNT, error);
      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Get user locations for all their accounts
   * @param accounts
   */
  public async getLocations(accounts: GMBAccount[]): Promise<GMBLocation[]> {
    this.log({ query: 'getLocations' }, LogLevel.INFO);

    let locations: GMBLocation[] = [];

    try {
      // Run multiple requests at the same time if necessary
      await Promise.all(
        accounts.map(async (account) => {
          const accountLocations = await this.getLocationsForAccount(account, true);
          locations = locations.concat(accountLocations);
        }),
      );
    } catch (error) {
      if (error instanceof GenericError) throw error;

      this.log(error, LogLevel.ERROR);
      throw GenericError.for(GMBError.LOCATIONS_QUERY, error, this.stream);
    }

    return locations;
  }

  /**
   * Gets all accounts and their locations.
   *
   * @returns {Promise<GMBAccountWithLocation>}
   */
  public async getAccountsWithLocations(): Promise<GMBAccountWithLocation[]> {
    this.log({ query: 'getAccountsWithLocations' }, LogLevel.INFO);

    const accountsWithLocations: GMBAccountWithLocation[] = [];

    const accounts = await this.getAccounts();

    try {
      // Run multiple requests at the same time if necessary
      await Promise.all(
        accounts.map(async (account) => {
          const accountLocations = await this.getLocationsForAccount(account, true);
          accountsWithLocations.push({
            accountName: account.accountName,
            accountNameId: account.nameId,
            locations: accountLocations,
          });
        }),
      );
    } catch (error) {
      if (error instanceof GenericError) throw error;

      this.log(error, LogLevel.ERROR);
      throw GenericError.for(GMBError.LOCATIONS_QUERY, error, this.stream);
    }

    return accountsWithLocations;
  }

  // ----------------------------------------------------------------------------
  // Media Upload
  // ----------------------------------------------------------------------------

  /**
   * Create a new Media with a physical file
   *
   * @param {String} locationNameId
   * @param {GMBLocalPostResponseLocalPost} localPost
   */
  public async postLocationMediaFile(
    mediaFileStream: fs.ReadStream,
    locationNameId: string,
  ): Promise<GMBMediaItemDataRef> {
    this.log({ query: 'postLocationMediaFile' }, LogLevel.INFO);

    try {
      const postMediaDataRef = await this.createPostMediaDataRef(locationNameId);
      await this.uploadLocationMedia(postMediaDataRef, mediaFileStream);

      return postMediaDataRef;
    } catch (error) {
      if (error instanceof GenericError) throw error;

      this.log(error, LogLevel.ERROR);
      throw GenericError.for(GMBError.MEDIA_CREATE_UPLOAD, error, this.stream);
    }
  }

  /**
   * Remove Location Media
   *
   * @param {string} locationMediaNameId
   * @returns {Promise<void>}
   * @memberof GMBService
   */
  public async removeLocationMedia(locationMediaNameId: string): Promise<void> {
    this.log({ query: 'removeLocationMedia' }, LogLevel.INFO);

    try {
      const requestOptions: GaxiosOptions = {
        method: 'DELETE',
        url: `${locationMediaNameId}`,
      };

      const request = await this.instance.request<GMBMediaItemDataRef>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request }, LogLevel.DEBUG);
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.DELETE_LOCATION_MEDIA, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Generates `GMBMediaItemDataRef` (resourceName) to be used in media uploads
   *
   * In order to upload media, we first need to make a request a media id (`GMBMediaItemDataRef`) to GMB.
   * Then, we can use this mediaId (`GMBMediaItemDataRef`) to upload the media `uploadLocationMedia`
   */
  private async createPostMediaDataRef(locationNameId: string): Promise<GMBMediaItemDataRef> {
    this.log({ query: 'createPostMediaDataRef' }, LogLevel.INFO);

    const requestOptions: GaxiosOptions = {
      method: 'POST',
      url: `${locationNameId}/media:startUpload`,
    };

    try {
      const response = await this.instance.request<GMBMediaItemDataRef>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      const mediaNameId = response.data.resourceName;

      if (!mediaNameId) throw 'Failed to create media id';

      return response.data;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.POST_MEDIA_DATA_REF, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Create Media Item
   * This method should only be called if a media needs to be added to the Business Photos section
   * For Posts, media is created on the same request of the post.
   *
   * @param {string} locationNameId
   * @param {string} mediaPostId
   * @returns {Promise<GMBLocalPostResponseLocalPostMedia>}
   * @memberof GMBService
   */
  async createMedia(
    locationNameId: string,
    mediaPostId: string,
    mediaFormat: MediaFormat,
    locationAssociationCategory: string = 'EXTERIOR',
  ): Promise<GMBLocalPostResponseLocalPostMedia> {
    this.log({ query: 'createMedia' }, LogLevel.INFO);

    // Build Media Object
    const postMedia: GMBLocalPostResponseLocalPostMedia = {
      mediaFormat,
      dataRef: {
        resourceName: mediaPostId,
      },
      locationAssociation: {
        category: locationAssociationCategory,
      },
    };

    const requestOptions: GaxiosOptions = {
      method: 'POST',
      url: `${locationNameId}/media`,
      data: postMedia,
    };

    try {
      const response = await this.instance.request<GMBLocalPostResponseLocalPostMedia>({
        ...requestOptions,
        ...GMBService.baseRequestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      const postMediaResponse = response.data;

      return postMediaResponse;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.POST_MEDIA, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Upload location media after having a media id (GMBMediaItemDataRef)
   *
   * @param {GMBMediaItemDataRef} mediaDataRef
   * @param {*} mediaFileStream
   * @returns {Promise<void>}
   */
  private async uploadLocationMedia(mediaDataRef: GMBMediaItemDataRef, mediaFileStream: any): Promise<void> {
    this.log({ query: 'uploadLocationMedia' }, LogLevel.INFO);

    try {
      const requestOptions: GaxiosOptions = {
        method: 'POST',
        baseURL: 'https://mybusiness.googleapis.com/upload/v1/media/',
        url: mediaDataRef.resourceName,
        params: {
          upload_type: 'media',
        },
        data: mediaFileStream,
      };

      const request = await this.instance.request<GMBMediaItemDataRef>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request }, LogLevel.DEBUG);

      return;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.POST_LOCATION_MEDIA, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  // ----------------------------------------------------------------------------
  // Location Posts
  // ----------------------------------------------------------------------------

  /**
   * Get an individual location's posts
   * - Conditions:
   *    - Location must be verified.
   *
   * @param {String} locationNameId
   * @param {String} nextPageToken
   * @param {number} defaultPageSize
   */
  public async getLocationPosts(
    locationNameId: string,
    defaultPageSize: number = 10,
    nextPageToken?: string,
  ): Promise<GMBLocalPostsResponse> {
    this.log({ query: 'getLocationPosts' }, LogLevel.INFO);

    const requestOptions: GaxiosOptions = {
      method: 'GET',
      url: `${locationNameId}/localPosts`,
      params: {
        pageSize: defaultPageSize,
        pageToken: nextPageToken,
      },
    };

    try {
      const response = await this.instance.request<GMBLocalPostsResponse>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      return response.data;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.GET_LOCAL_POSTS, error);
      console.error(`Error for posts: ${error}`);

      // const errorDetails = GenericError.getCategoryErrorDetails(error);
      // throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
      return {
        locationName: locationNameId,
        error: error,
      };
      // throw GenericError.for(GMBError.POSTS_QUERY, error, this.stream);
    }
  }

  /**
   * Get insight of local post
   *  - Conditions:
   *    - Location must be verified.
   *    - Location post name must be verified
   * @param {String} locationNameId
   * @param {String[]} localPostNames
   */
  public async getLocationPostInsight(
    locationNameId: string,
    localPostNames: string[],
  ): Promise<GMBLocalPostInsightResponse> {
    this.log({ query: 'getLocationPostInsight' }, LogLevel.INFO);

    const requestOptions: GaxiosOptions = {
      method: 'POST',
      url: `${locationNameId}/localPosts:reportInsights`,
      data: {
        localPostNames,
        basicRequest: {
          metricRequests: [
            {
              metric: 'ALL',
              options: ['AGGREGATED_TOTAL'],
            },
            {
              metric: 'LOCAL_POST_VIEWS_SEARCH',
              options: ['AGGREGATED_TOTAL'],
            },
            {
              metric: 'LOCAL_POST_ACTIONS_CALL_TO_ACTION',
              options: ['AGGREGATED_TOTAL'],
            },
          ],
          timeRange: {
            startTime: dayjs().subtract(1, 'year').toISOString(),
            endTime: dayjs().toISOString(),
          },
        },
      },
    };

    try {
      const response = await this.instance.request<GMBLocalPostInsightResponse>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      return response.data;
    } catch (error) {
      this.log(
        {
          error,
          time: dayjs().toISOString(),
        },
        LogLevel.ERROR,
      );
      LogUtility.logError(this.uid, GMBApiActionTypes.GET_LOCAL_POSTS_INSIGHT, {
        error,
        time: dayjs().toISOString(),
      });

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Get specific post
   *
   * @param {string} postNameId
   * @returns {Promise<GMBLocalPostResponse>}
   * @memberof GMBService
   */
  public async getLocationPost(postNameId: string): Promise<GMBLocalPostResponseLocalPost> {
    this.log({ query: 'getLocationPost' }, LogLevel.INFO);

    const requestOptions: GaxiosOptions = {
      method: 'GET',
      url: `${postNameId}`,
      params: {},
    };

    try {
      const response = await this.instance.request<GMBLocalPostResponseLocalPost>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      return response.data;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.GET_LOCAL_POST_BY_ID, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Create a new Local Post
   *
   * @param {String} locationNameId
   * @param {GMBLocalPostResponseLocalPost} localPost
   */
  public async postLocationPost(
    locationNameId: string,
    localPost: GMBLocalPostResponseLocalPost,
  ): Promise<GMBLocalPostResponseLocalPost> {
    this.log({ query: 'postLocationPost' }, LogLevel.INFO);

    const requestOptions: GaxiosOptions = {
      method: 'POST',
      url: `${locationNameId}/localPosts`,
      data: localPost,
    };

    try {
      const response = await this.instance.request<GMBLocalPostResponseLocalPost>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      return response.data;
    } catch (error) {
      this.log(
        {
          error,
          tag: 'POST_CREATE_ERROR',
        },
        LogLevel.ERROR,
      );
      LogUtility.logError(this.uid, GMBApiActionTypes.POST_LOCAL_POST, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Update a Local Post
   *
   * @param {String} postNameId
   * @param {String} updateMask The specific fields to be updated comma separated.
   * @param {GMBLocalPostResponseLocalPost} localPost Local post must contain location id
   */
  public async putLocationPost(
    postNameId: string,
    updateMask: string,
    localPost: GMBLocalPostResponseLocalPost,
  ): Promise<GMBLocalPostResponseLocalPost> {
    this.log({ query: 'putLocationPost' }, LogLevel.INFO);

    const requestOptions: GaxiosOptions = {
      method: 'PATCH',
      url: `${postNameId}`,

      params: {
        // Fields to be updated
        updateMask,
      },
      data: localPost,
    };

    try {
      const response = await this.instance.request<GMBLocalPostResponseLocalPost>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      return response.data;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.PATCH_LOCAL_POST, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  // ----------------------------------------------------------------------------
  // Location Reviews
  // ----------------------------------------------------------------------------

  /**
   * Get an individual location's reviews
   *
   * @param {String} locationNameId
   * @param {String} nextPageToken
   */

  public async getLocationReviews(locationNameId: string, nextPageToken?: string): Promise<GMBReviewResponse> {
    this.log({ query: 'getLocationReviews' }, LogLevel.INFO);
    // Make request object. Paging is always restricted to 3. There is no option to adjust this number.
    const requestOptions: GaxiosOptions = {
      method: 'GET',
      url: `${locationNameId}/reviews`,
      params: {
        pageSize: 3,
        pageToken: nextPageToken,
      },
    };

    try {
      const response = await this.instance.request<GMBReviewResponse>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      return response.data;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.GET_REVIEWS, error);

      console.error(`Error for location--: ${error}`);

      // const errorDetails = GenericError.getCategoryErrorDetails(error);
     // throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
        const errorObj = {
          locationName: locationNameId,
          error: error,
        };
        return errorObj;
      // throw GenericError.for(GMBError.REVIEWS_QUERY, error, this.stream);
    }
  }

  /**
   * Updates a review reply or creates one if it does not exist.
   *
   * @param {string} reviewId
   * @param {string} comment
   */
  public async putLocationReviewReply(reviewId: string, comment: string): Promise<GMBReviewReplyResponse> {
    this.log({ query: 'putLocationReviewReply' }, LogLevel.INFO);

    const requestOptions: GaxiosOptions = {
      method: 'PUT',
      url: `${reviewId}/reply`,
      data: {
        comment,
      },
    };

    try {
      const response = await this.instance.request<GMBReviewReplyResponse>({
        ...GMBService.baseRequestOptions,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      return response.data;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.PUT_REVIEW_REPLY, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Deletes a review reply.
   *
   * @param {string} reviewId
   */
  public async deleteLocationReviewReply(reviewId: string): Promise<Boolean> {
    this.log({ query: 'deleteLocationReviewReply' }, LogLevel.INFO);

    const requestOptions: GaxiosOptions = {
      method: 'DELETE',
      url: `${reviewId}/reply`,
    };

    try {
      const request = await this.instance.request({ ...requestOptions, ...GMBService.baseRequestOptions });
      this.log({ request }, LogLevel.DEBUG);

      return true;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.DELETE_REVIEW_REPLY, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Get reviews for all locations. Only returns the initial three reviews
   * @param locations
   */
  public async getStartingReviews(locations): Promise<GMBReviewLocationResponse> {
    this.log({ query: 'getStartingReviews' }, LogLevel.INFO);

    const allReviews = [];
    // let filteredReviews = [];
    const locationsWithErrors = [];
    let hasErrors = false;

    try {
      // Run multiple requests at the same time if necessary
      await Promise.all(
        locations.map(async (location) => {
          const reviews = await this.getLocationReviews(location.name_id, null);
          const locationAddress = location.address && location.address.split(',')[0];
          if (!reviews.error) {
            allReviews.push({
              locationName: location.location_name,
              locationNameId: location.name_id,
              locationAddress,
              reviews,
            });
          }

          if (reviews.error) {
            LogUtility.logError(this.uid, GMBApiActionTypes.GET_STARTING_REVIEWS, reviews.error);

            hasErrors = true;
            let errorMessage = this.gmbLocationErrorList[reviews.error.response.data.error.status];
            if (!errorMessage) {
              errorMessage = reviews.error.response.data.error.message;
            }
           // locationsWithErrors.push({ locationName: reviews.locationName, error: errorMessage });
          }
        }),
      );
      if (hasErrors) {
        hasErrors = false;
        return {
          reviews: allReviews,
          locationsWithErrors: locationsWithErrors,
        };
      } else {
        return {
          reviews: allReviews,
        };
      }

      // return allReviews;
    } catch (error) {
      if (error instanceof GenericError) // throw error;

      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.GET_STARTING_REVIEWS, error);

      console.error(`Error for Reviews: ${error}`);
      // throw GenericError.for(GMBError.REVIEWS_QUERY, error, this.stream);
    }
  }

  // ----------------------------------------------------------------------------
  // Location Questions
  // ----------------------------------------------------------------------------

  /**
   * Get questions for all locations. Only returns the initial three questions.
   *
   * @param locations
   */

  public async getStartingQuestions(locations: Location[]): Promise<GMBQuestionLocationResponse> {
    this.log({ query: 'getStartingQuestions' }, LogLevel.INFO);

    const allQuestions = [];
    const locationsWithErrors = [];

    try {
      // Run multiple requests at the same time if necessary.

      for (const location of locations) {
        const questions = await this.getLocationQuestions(location.name_id, null);
        const locationAddress = location.address && location.address.split(',')[0];
        if (questions.error) {
          let errorMessage = this.gmbLocationErrorList[questions.error.response.data.error.status];
          if (!errorMessage) {
            errorMessage = questions.error.response.data.error.message;
            // questions.error.response.statusText;
          }
          // locationsWithErrors.push({ locationName: questions.locationName, error: errorMessage });
        } else {
          allQuestions.push({
            locationName: location.location_name,
            locationNameId: location.name_id,
            locationAddress,
            questions,
          });
        }
      }
    } catch (error) {
      // if (error instanceof GenericError) throw error;

      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.GET_STARTING_QUESTIONS, error);

      console.error(`Error for location: ${error}`);
    }
    return {
      questions: allQuestions,
      ...(locationsWithErrors.length > 0 && { locationsWithErrors: locationsWithErrors }),
    };
  }

  /**
   * Get an individual location's questions.
   *
   * @param {String} locationNameId
   * @param {String} nextPageToken
   */

  public async getLocationQuestions(locationNameId: string, nextPageToken?: string): Promise<GMBQuestionResponse> {
    this.log({ query: 'getLocationQuestions' }, LogLevel.INFO);

    // Request https://developers.google.com/my-business/reference/qanda/rest/v1/locations.questions/list

    const requestOptions: GaxiosOptions = {
      method: 'GET',
      url: `locations${locationNameId.split('locations')[1]}/questions`,
      params: {
        answersPerQuestion: 10, // This is the maximum the API can return.
        pageToken: nextPageToken,
      },
    };

    try {
      const response = await this.instance.request<GMBQuestionResponse>({
        ...GMBService.BASE_ACCOUNT_QUESTION_REQUEST_OPTIONS,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      return response.data;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.GET_QUESTIONS, error);

      // const errorDetails = GenericError.getCategoryErrorDetails(error);
      // throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);

      return {
        locationName: locationNameId,
        error: error,
      };
      // throw GenericError.for(GMBError.QUESTIONS_QUERY, error, this.stream);
    }
  }

  /**
   * Updates a question reply or creates one if it does not exist.
   *
   * @param {string} questionsId
   * @param {string} text
   */
  public async putLocationQuestionReply(questionId: string, text: string): Promise<GMBQuestionReplyResponse> {
    this.log({ query: 'putLocationQuestionReply' }, LogLevel.INFO);

    // Request https://developers.google.com/my-business/reference/qanda/rest/v1/locations.questions.answers/upsert
    const requestOptions: GaxiosOptions = {
      method: 'POST',
      url: `${questionId}/answers:upsert`,
      data: {
        answer: {
          text,
        },
      },
    };

    try {
      const response = await this.instance.request<GMBQuestionReplyResponse>({
        ...GMBService.BASE_ACCOUNT_QUESTION_REQUEST_OPTIONS,
        ...requestOptions,
      });
      this.log({ request: response }, LogLevel.DEBUG);

      return response.data;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.PUT_QUESTION_REPLY, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }

  /**
   * Deletes a question reply.
   *
   * @param {string} reviewId
   */
  public async deleteLocationQuestionReply(replyId: string): Promise<Boolean> {
    this.log({ query: 'deleteLocationQuestionReply' }, LogLevel.INFO);

    // Request https://developers.google.com/my-business/reference/qanda/rest/v1/locations.questions/deleteAnswers
    const requestOptions: GaxiosOptions = {
      method: 'DELETE',
      url: `${replyId}/answers:delete`,
    };

    try {
      const request = await this.instance.request({
        ...requestOptions,
        ...GMBService.BASE_ACCOUNT_QUESTION_REQUEST_OPTIONS,
      });
      this.log({ request }, LogLevel.DEBUG);

      return true;
    } catch (error) {
      this.log(error, LogLevel.ERROR);
      LogUtility.logError(this.uid, GMBApiActionTypes.DELETE_QUESTION_REPLY, error);

      const errorDetails = GenericError.getCategoryErrorDetails(error);
      throw GenericError.for(errorDetails.category, error, this.stream, true, errorDetails.errorCode);
    }
  }
}
