import {
  JsonController,
  Get,
  Patch,
  UseBefore,
  Body,
  QueryParam,
  Post,
  Param,
  UploadedFile,
  UseAfter,
  Req,
} from 'routing-controllers';
import { GMBService } from '../services/GMBService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { StreamMiddleware } from '../middleware/StreamMiddleware';
import {
  GetPostsRequest,
  GetPostsResponse,
  GetPostsBodyResponse,
  PostItemPagination,
  PatchLocalPostRequest,
  PostLocalPostRequest,
  PostLocalPostRequestBody,
  PostMediaRequest,
  MediaFormat,
  GetPostResponse,
  CommonRequest,
  PostMultipleLocalPostRequest,
  PostGoogleDriveMediaRequest,
  FilePath,
} from '../interfaces/requests';
import { Location } from '../entity/Location';
import { GenericError, PostError, LocationError } from '../types/errors';
import { AnalyticMetrics } from '../types/analytics';
import { atob, btoa } from '../utils/GenericUtility';
import {
  GMBLocalPostResponseLocalPost,
  GMBLocalPostResponseLocalPostMedia,
  GMBLocalPostMetrics,
  GMBLocalPostTopic,
} from '../interfaces/gmb';
import * as multer from '../utils/Multer';
import { errorHandler } from '../middleware/ErrorMiddleware';
import { GAuthUtility } from '../utils/GAuthUtility';
import { deleteS3File, uploadS3File } from '../utils/S3Utility';
import { AnalyticsUtility } from '../utils/AnalyticsUtility';
import { FeatureService } from '../services/FeatureService';

// Media Upload and Validation
import * as fs from 'fs';
import * as probe from 'probe-image-size';
import * as ffprobe from 'ffprobe';
import * as ffprobeStatic from 'ffprobe-static';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { GMBLocalPostEventValidation, GMBLocalPostOfferValidation } from '../services/GMBValidation';
import { LoggerService } from '../utils/LoggerService';
import { Request } from 'express';

/**
 * Posts Endpoint
 *
 * Location must be verified at this point.
 *
 * @export
 * @class PostController
 */
@JsonController()
export class PostController {
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
   * Get a list of all posts for all locations in a stream
   * * If no parameter is specified, it returns posts for the last 7 days.
   * * If pagination array is specified, it returns posts accordingly to the page being requested.
   */
  @Get('/posts')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async getPosts(
    @Req() req: Request,
    @Body() postsRequest: GetPostsRequest,
    @QueryParam('pagination') paginationQueries: string[] = [],
  ) {
    LoggerService.logRequest(req);
    const { stream } = postsRequest;
    const paginationConfigs = paginationQueries.map((jsonString) => {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        LoggerService.error(`Error getting the posts. Error: ${error}`);
        throw GenericError.for(LocationError.UNPROCESSABLE_PAGINATION);
      }
    });

    try {
      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      // uncomment the below comments later
      const currentSavedLocations = await Location.findByStream(stream);
      console.log('Testing post: currentSavedLocations = ', currentSavedLocations);

      if (currentSavedLocations.length === 0) throw GenericError.for(LocationError.NO_SELECTED_LOCATIONS);

      const paginationTokens = {};
      let isPaginationOptionDeclared = false; // To make sure all pagination elements are valid and not missing.

      if (Array.isArray(paginationConfigs) && paginationConfigs.length > 0) {
        // Make sure pagination options are valid and unique
        paginationConfigs.forEach((paginationElement) => {
          if (
            !paginationElement.locationId ||
            paginationElement.nextTokenPage === undefined ||
            paginationElement.nextTokenPage === null
          )
            return;
          paginationTokens[paginationElement.locationId] = paginationElement.nextTokenPage;
        });

        isPaginationOptionDeclared = true;
      }

      console.log('Testing post: paginationConfigs = ', paginationConfigs);
      console.log('Testing post: paginationTokens = ', paginationTokens);

      const allPosts: GetPostsBodyResponse[] = [];
      const pagination: PostItemPagination[] = [];
      const locationsWithErrors = [];

      // Run multiple requests at the same time
      await Promise.all(
        currentSavedLocations.map(async (location) => {
          // Do not try to retrieve posts for location that didn't have a token when pagination was declared
          if (isPaginationOptionDeclared && !paginationTokens[location.name_id]) return;

          const postsRequest = await gmbService.getLocationPosts(
            location.name_id,
            30,
            paginationTokens[location.name_id],
          );

          console.log('Testing post: postsRequest = ', postsRequest);
          // Pagination
          if (postsRequest.error) {
            let errorMessage = this.gmbLocationErrorList[postsRequest.error.response.data.error.status];
            if (!errorMessage) {
              errorMessage = postsRequest.error.response.data.error.message;
            }
            console.log('Testing post: errorMessage = ', errorMessage);
           // locationsWithErrors.push({ locationName: postsRequest.locationName, error: errorMessage });
          }
          if (postsRequest.nextPageToken) {
            const locationPostsPagination: PostItemPagination = {
              locationId: location.name_id,
              nextTokenPage: postsRequest.nextPageToken,
            };

            pagination.push(locationPostsPagination);
          }

          // Posts

          // It might be possible that the request has another page token, even though
          // no local posts were returned. This behaviour was observed in other Google APIs.
          const localPosts = postsRequest.localPosts;

          if (!localPosts) return;

          // Checking for feature flag of post insight
          const allLocationPostMetrics: GMBLocalPostMetrics[] = [];
          if (FeatureService.shared.features.LocalPostInsight) {
            // try {
            //   // Getting insight of all local post and updating respective post object
            //   const listOfPosts = localPosts.map((post) => {
            //     return post.name;
            //   });
            //   // GMB API can fetch max 10 post per report insight API call. So looping it accordingly
            //   do {
            //     const first10 = listOfPosts.splice(0, 10);
            //     try {
            //       const postInsight = await gmbService.getLocationPostInsight(location.name_id, first10);
            //       if (postInsight?.localPostMetrics?.length > 0) {
            //         allLocationPostMetrics = [...allLocationPostMetrics, ...postInsight?.localPostMetrics];
            //       }
            //     } catch (excp) {}
            //   } while (listOfPosts.length > 0);
            // } catch (excp) {}
          }

          // location
          const mappedPosts = localPosts.map((post) => {
            // Getting post metrics
            let metrics: GMBLocalPostMetrics = {
              localPostName: btoa(post.name),
              metricValues: [],
            };
            if (allLocationPostMetrics.length > 0) {
              const filter = allLocationPostMetrics.filter((postMetric) => postMetric.localPostName === post.name);
              if (filter.length > 0) {
                metrics = filter[0];
              }
            }
            const mappedPost: GetPostsBodyResponse = {
              id: btoa(post.name),
              createTime: post.createTime,
              locationId: btoa(location.name_id),
              location: location.location_name,
              locationAddress: location.address.split(',')[0],
              content: post.summary || '',
              media: post.media,
              state: post.state,
              topicType: post.topicType,
              updateTime: post.updateTime,
              ctaButtonLink: (post.callToAction || { url: '' }).url,
              ctaButtonType: (post.callToAction || { actionType: '' }).actionType,
              postInsight: {
                localPostName: btoa(metrics.localPostName),
                metricValues: metrics.metricValues,
              },
            };

            return mappedPost;
          });

          allPosts.push(...mappedPosts);
        }),
      );

      console.log('Testing post: allPosts = ', allPosts);
      console.log('Testing post: pagination = ', pagination);
      console.log('Testing post: locationsWithErrors = ', locationsWithErrors);
      // Order posts
      allPosts.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

      const requestReturn: GetPostsResponse = {
        success: true,
        posts: allPosts,
        pagination,
        errors: locationsWithErrors,
      };

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid);
      LoggerService.logResponse(req, requestReturn);

      return requestReturn;
    } catch (error) {
      console.log('Testing post: error = ', error);
      LoggerService.error(`Error getting the posts. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Upload a new Media (video or image) using Google drive
   */
  @Post('/posts/gMedia')
  @UseAfter(errorHandler) // Add Error Middleware to handle any application level error including Multer (File Upload)
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async postMediaFromGoogleDrive(@Req() req: Request, @Body() postMediaRequest: PostGoogleDriveMediaRequest) {
    const { googleDriveToken, sourceUrl } = postMediaRequest;
    LoggerService.logRequest(req);
    let file: FilePath;

    try {
      // Validate that it has a google drive token and sourceUrl
      if (!googleDriveToken || !sourceUrl) throw GenericError.for(PostError.MEDIA_GDRIVE_TOKEN_OR_URL);

      // Download Image
      file = await this.downloadGoogleDriveMedia(sourceUrl, googleDriveToken);
      await this.validateMedia(file, file.mediaFormat);

      return { success: true, imageLocation: file.location, imageKey: file.fileName };
    } catch (error) {
      LoggerService.error(`Error uploading a new media using Google drive. Error: ${error}`);
      if (file) deleteS3File(file.fileName);
      throw error;
    }
  }

  /**
   * Upload a new Media (video or image)
   */
  @Post('/posts/media')
  @UseAfter(errorHandler) // Add Error Middleware to handle any application level error including Multer (File Upload)
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async postMedia(
    @Req() req: Request,
    @Body() postMediaRequest: PostMediaRequest,
    @UploadedFile('file', { required: true, options: multer.fileUploadOptions() }) file: any,
  ) {
    const { mediaFormat } = postMediaRequest;
    LoggerService.logRequest(req, mediaFormat);
    try {
      await this.validateMedia(file, mediaFormat);

      return { success: true, imageLocation: file.location, imageKey: file.key };
    } catch (error) {
      LoggerService.error(`Error uploading a new media. Error: ${error}`);
      if (file) deleteS3File(file.key);
      throw error;
    }
  }

  /**
   * Create a new Post to multiple locations
   */
  @Post('/posts')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async addPostToMultipleLocations(@Req() req: Request, @Body() postRequest: PostMultipleLocalPostRequest) {
    const { stream, post, locations, tempFileKey } = postRequest;
    LoggerService.logRequest(req);
    try {
      const gmbPost = this.validateAndCreateGMBPostObject(post);
      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      if (!locations || !Array.isArray(locations) || locations.length === 0)
        throw GenericError.for(PostError.POST_MISSING_LOCATIONS);

      const postObjs = await Promise.all(
        locations.map(async (locationBase64NameId) => {
          // Decode locationNameId from base64
          const locationNameId = atob(locationBase64NameId);

          return gmbService.postLocationPost(locationNameId, gmbPost);
        }),
      );

      // Delete the media file if one was temprarily uploaded to S3
      if (tempFileKey) {
        deleteS3File(tempFileKey);
      }

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid, locations.length, AnalyticMetrics.NUM_OF_POSTS);
      LoggerService.logResponse(req, { success: true, posts: postObjs });

      return { success: true, posts: postObjs };
    } catch (error) {
      LoggerService.error(`Error creating new posts to multiple locations. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new Post
   */
  @Post('/locations/:locationNameIdBase64/posts')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async addPost(
    @Req() req: Request,
    @Param('locationNameIdBase64') locationNameIdBase64: string,
    @Body() postRequest: PostLocalPostRequest,
  ) {
    const { stream, post, tempFileKey } = postRequest;
    LoggerService.logRequest(req, locationNameIdBase64);
    try {
      const locationNameId = atob(locationNameIdBase64);
      const gmbPost = this.validateAndCreateGMBPostObject(post);

      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      const postObj = await gmbService.postLocationPost(locationNameId, gmbPost);

      // Delete the media file if one was temprarily uploaded to S3
      if (tempFileKey) {
        deleteS3File(tempFileKey);
      }

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid, 1, AnalyticMetrics.NUM_OF_POSTS);
      LoggerService.logResponse(req, { success: true, post: postObj });

      return { success: true, post: postObj };
    } catch (error) {
      LoggerService.error(`Error creating new posts. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Get an existing Post
   */
  @Get('/posts/:postNameIdBase64')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async getPost(
    @Req() req: Request,
    @Param('postNameIdBase64') postNameIdBase64: string,
    @Body() postRequest: CommonRequest,
  ) {
    const { stream } = postRequest;
    LoggerService.logRequest(req, postNameIdBase64);
    try {
      const postNameId = atob(postNameIdBase64);
      // Strip locationNameId from postNameId
      const locationNameId = postNameId.substring(0, postNameId.lastIndexOf('/localPosts'));

      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);
      const localPost = await gmbService.getLocationPost(postNameId);

      // Retrieve location data for post.
      const location = await Location.findOne({ where: { name_id: locationNameId } });
      const locationName = location ? location.location_name : 'Undefined';
      const addressComponents = location && location.address && location.address.split(',');
      const locationAddress = addressComponents ? addressComponents[0] : 'Unknown';

      // Post
      const mappedPost: GetPostsBodyResponse = {
        id: btoa(localPost.name),
        createTime: localPost.createTime,
        locationId: btoa(locationNameId),
        location: locationName,
        locationAddress,
        content: localPost.summary || '',
        media: localPost.media,
        state: localPost.state,
        topicType: localPost.topicType,
        updateTime: localPost.updateTime,
        ctaButtonLink: (localPost.callToAction || { url: '' }).url,
        ctaButtonType: (localPost.callToAction || { actionType: '' }).actionType,
      };

      const requestReturn: GetPostResponse = {
        success: true,
        post: mappedPost,
      };

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid);
      LoggerService.logResponse(req, requestReturn);

      return requestReturn;
    } catch (error) {
      LoggerService.error(`Error getting an existing posts. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Update an existing Post
   */
  @Patch('/posts/:postNameIdBase64')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async updatePost(
    @Req() req: Request,
    @Param('postNameIdBase64') postNameIdBase64: string,
    @Body() postRequest: PatchLocalPostRequest,
  ) {
    const { stream, post, tempFileKey } = postRequest;
    LoggerService.logRequest(req, postNameIdBase64);
    try {
      const locationPostId = atob(postNameIdBase64);

      // Validate only defined fields
      const gmbPost = this.validateAndCreateGMBPostObject(post, true);

      // Only update fields that were defined
      const fieldToBeUpdate = [];

      if (post.content) fieldToBeUpdate.push('summary');
      if (post.ctaButtonLink !== undefined && post.ctaButtonType !== undefined) fieldToBeUpdate.push('callToAction');
      if (post.media) fieldToBeUpdate.push('media');

      // Fields to be updated comma-separated
      const updateMask = fieldToBeUpdate.join(',');

      const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
      const gmbService = new GMBService(stream, onTokensChange);

      const postObj = await gmbService.putLocationPost(locationPostId, updateMask, gmbPost);

      // Delete the media file if one was temprarily uploaded to S3
      if (tempFileKey) {
        deleteS3File(tempFileKey);
      }

      // Log requests to analytics
      await AnalyticsUtility.updateAnalyticLog(stream.uid);
      LoggerService.logResponse(req, { success: true, post: postObj });

      return { success: true, post: postObj };
    } catch (error) {
      LoggerService.error(`Error updating an existing posts. Error: ${error}`);
      throw error;
    }
  }

  // ---------------------------------------------------------------
  // Post and Media Validation & Others
  // ---------------------------------------------------------------

  /**
   * Download Google Drive Media
   *
   * @param {string} sourceUrl
   * @param {string} googleDriveToken
   * @param {MediaFormat} mediaFormat
   * @returns {Promise<FilePath>}
   */
  private async downloadGoogleDriveMedia(sourceUrl: string, googleDriveToken: string): Promise<FilePath> {
    // Download request.
    try {
      const authorizationHeader = { Authorization: `Bearer ${googleDriveToken}` };

      const headResponse = await axios.head(sourceUrl, {
        headers: authorizationHeader,
      });

      const contentSize = parseInt(headResponse.headers['content-length']);
      const mimetype = headResponse.headers['content-type'];

      let mediaFormat: MediaFormat;

      // Validate file size and mimetype before actual downloading the image
      if (multer.acceptableImageMimeTypes.includes(mimetype)) {
        if (contentSize > multer.imageSizeLimit) throw GenericError.for(PostError.MEDIA_PHOTO_SIZE);
        mediaFormat = MediaFormat.PHOTO;
      } else if (multer.acceptableVideoMimeTypes.includes(mimetype)) {
        if (contentSize > multer.videoSizeLimit) throw GenericError.for(PostError.MEDIA_VIDEO_SIZE);
        mediaFormat = MediaFormat.VIDEO;
      } else {
        throw GenericError.for(PostError.MEDIA_INVALID_FORMAT);
      }

      const getResponse = await axios.get(sourceUrl, {
        responseType: 'stream',
        headers: authorizationHeader,
      });

      // Get the file ending form the mime type
      const index = mimetype.indexOf('/');
      const mediaType = mimetype.slice(index + 1);
      const fileName = `${uuidv4()}.${new Date().getTime()}.${mediaType}`;
      const path = `/tmp/${fileName}`;
      const writeStream = fs.createWriteStream(path);
      const pipeStream = getResponse.data.pipe(writeStream);

      return new Promise((resolve) => {
        pipeStream.on('close', async () => {
          const location = await uploadS3File(fileName, path);

          // Delete the local temporary file.
          this.deleteTempFile(path);

          const successReturn: FilePath = { location, fileName, mediaFormat };
          resolve(successReturn);
        });

        pipeStream.on('error', () => {
          throw 'Failed downloading image';
        });
      });
    } catch (error) {
      LoggerService.error(`Error downloading file from Google drive. Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(PostError.MEDIA_GDRIVE_DOWNLOAD_FAIL);
    }
  }

  /**
   * Validate photo accordingly to Google guidelines
   *
   * @param {*} file
   * @memberof PostController
   */
  private async validatePhoto(file) {
    // Format: JPG or PNG. (Validated by Multer checking the acceptableMimeTypes)
    try {
      // Minimum resolution: 720 px tall, 720 px wide.
      const dimensions = await probe(file.location);

      // Between 10 KB and 5 MB. Multer set max limit to 100mb, but unfortunately we have to check here.
      // Size is in bytes
      if (dimensions.size < multer.imageMinimumSize || dimensions.size > multer.imageSizeLimit)
        throw GenericError.for(PostError.MEDIA_PHOTO_SIZE);

      if (dimensions.width < 720 || dimensions.height < 720) throw GenericError.for(PostError.MEDIA_PHOTO_DIMENSION);
    } catch (error) {
      LoggerService.error(`Error validating the photo. Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(PostError.VALIDATE_MEDIA_DIMENSION, error);
    }
  }

  /**
   * Validate video accordingly to Google guidelines
   *
   * @param {*} file
   * @memberof PostController
   */
  private async validateVideo(file) {
    // File size: Up to 100 MB -  Validated by Multer.
    try {
      const fileStreams = await ffprobe(file.path, { path: ffprobeStatic.path });

      if (!fileStreams || !fileStreams.streams) throw 'No file streams';
      const fileStats = fileStreams.streams[0];

      // Duration: Up to 30 seconds long
      if (parseFloat(fileStats.duration) > 30.0) throw GenericError.for(PostError.MEDIA_VIDEO_DURATION);

      // Resolution: 720p or higher
      if (fileStats.coded_height < 720) throw GenericError.for(PostError.MEDIA_VIDEO_DIMENSION);
    } catch (error) {
      LoggerService.error(`Error validating the video. Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(PostError.VALIDATE_MEDIA_DIMENSION, error);
    }
  }

  /**
   * Validate Media
   *
   * @param {*} file
   * @param {*} mediaFormat
   * @returns {Promise<void>}
   */
  private async validateMedia(file, mediaFormat): Promise<void> {
    // Validate the file
    if (!file) throw GenericError.for(PostError.MEDIA_MISSING_VALID_FILE);

    // Validate Media Format
    if (!Object.values(MediaFormat).includes(mediaFormat)) throw GenericError.for(PostError.MEDIA_INVALID_FORMAT);

    // Validate Media Format according to Google Guidelines
    if (mediaFormat === MediaFormat.PHOTO) {
      await this.validatePhoto(file);
    } else {
      await this.validateVideo(file);
    }
  }

  /**
   * Validate (Post and Medias) and create GMB Post Object
   *
   * @param {*} post
   * @param {boolean} verifyOnlyDefined Do not validate fields that weren't defined.
   * @returns {GMBLocalPostResponseLocalPost}
   */
  private validateAndCreateGMBPostObject(
    post: PostLocalPostRequestBody,
    verifyOnlyDefined: boolean = false,
  ): GMBLocalPostResponseLocalPost {
    // Validate data before posting it
    if (!verifyOnlyDefined) {
      this.validatePost(post);
    }

    // Validating offer data
    if (post.offer) {
      const offerError = GMBLocalPostOfferValidation.validate(post.offer).error;
      if (offerError) {
        throw GenericError.for(PostError.POST_MISSING_OFFER_DATA, offerError);
      }
    }

    // Validating event data
    if (post.event) {
      const eventError = GMBLocalPostEventValidation.validate(post.event).error;
      if (eventError) {
        throw GenericError.for(PostError.POST_MISSING_EVENT_DATA, eventError);
      }
    }

    // Validating media
    const media = this.validateAndParseMediaPost(post.media, verifyOnlyDefined);

    const callToAction = !post.ctaButtonType
      ? null
      : {
          actionType: post.ctaButtonType,
          url: post.ctaButtonLink,
        };

    let topic = GMBLocalPostTopic.standard;
    if (post.offer && post.event) {
      topic = GMBLocalPostTopic.offer;
    } else if (post.event) {
      topic = GMBLocalPostTopic.event;
    }

    const gmbPost: GMBLocalPostResponseLocalPost = {
      callToAction,
      summary: post.content || '',
      languageCode: 'en-US',
      media,
      topicType: topic,
      offer: post.offer,
      event: post.event,
    };

    return gmbPost;
  }

  /**
   * Validate Post Data
   *
   * @param {PostLocalPostRequestBody} post
   */
  private validatePost(post: PostLocalPostRequestBody) {
    if (!post) throw GenericError.for(PostError.POST_MISSING_DATA);
    if (!post.content) throw GenericError.for(PostError.POST_MISSING_CONTENT);
    if ((post.ctaButtonLink && !post.ctaButtonLink) || (!post.ctaButtonLink && post.ctaButtonLink))
      throw GenericError.for(PostError.POST_MISSING_BUTTON_LINK);
  }

  /**
   * Validate Post Media Object parameter and parse into a GMB Media object
   * @param {any[]} media
   * @param {boolean} verifyOnlyDefined Do not validate fields that weren't defined.
   * @returns {GMBLocalPostResponseLocalPostMedia[]}
   */
  private validateAndParseMediaPost(
    media: any[],
    verifyOnlyDefined: boolean = false,
  ): GMBLocalPostResponseLocalPostMedia[] {
    if (!verifyOnlyDefined && !Array.isArray(media)) throw GenericError.for(PostError.MEDIA_INVALID_TYPE);

    const parsedMedia: GMBLocalPostResponseLocalPostMedia[] = !media
      ? []
      : media.map((mediaItem) => {
          if (mediaItem === null || typeof mediaItem !== 'object')
            throw GenericError.for(PostError.MEDIA_INVALID_FORMAT);

          // Validate the file or sourceUrl were specified
          if (!mediaItem.fileRef && !mediaItem.sourceUrl)
            throw GenericError.for(PostError.MEDIA_MISSING_FILE_OR_SOURCE);

          // Validate Media Format
          if (!Object.values(MediaFormat).includes(mediaItem.mediaFormat))
            throw GenericError.for(PostError.MEDIA_INVALID_TYPE);

          const postMedia: GMBLocalPostResponseLocalPostMedia = {
            name: mediaItem.name, // Optional
            mediaFormat: mediaItem.mediaFormat,
            sourceUrl: mediaItem.sourceUrl,
            dataRef: !mediaItem.fileRef
              ? null
              : {
                  resourceName: mediaItem.fileRef,
                },
          };
          return postMedia;
        });

    return parsedMedia;
  }

  // ---------------------------------------------------------------
  // Utility functions
  // ---------------------------------------------------------------

  /**
   * Remove temporary local file.
   *
   * @param {string} path Path to local file.
   */
  private deleteTempFile(path) {
    fs.unlink(path, function (err) {
      if (err) LoggerService.error('Error unlinking temp file', err);
    });
  }
}
