import { Stream } from '../entity/Stream';
import { GAuthUtility } from '../utils/GAuthUtility';
import { LoggerService } from '../utils/LoggerService';

// Possible errors when attempt to generate refresh and access token

export enum GeneralError {
  UNKNOWN = 'Unknown Error',
  ENTITY_NOT_FOUND = 'EntityNotFound',
  INTERNAL_SERVER_ERROR = 'Internal Server Error. Please try again.',
}

export enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export enum GoogleOAuthError {
  USER_MISMATCH = 'Got an un-expected user. Kindly login as the same user.',
  INVALID_TOKEN = 'The provided refresh token is invalid, expired, revoked.',
  EXPIRED_TOKEN = 'Session expired. Kindly login to continue.',
  GET_TOKENS = 'Error retrieving Google oAuth tokens. Make sure tokens are valid.',
  REVOKE_TOKEN = 'Error revoking user token.',
  SAVE_TOKENS = 'Error saving tokens into the database.',
}

export enum GMBError {
  ACCOUNTS_QUERY = 'Error querying GMB accounts.',
  LOCATIONS_QUERY = 'Error querying GMB locations.',

  QUESTIONS_QUERY = 'Error querying GMB questions.',
  QUESTIONS_DELETE = 'Error removing GMB question.',
  QUESTIONS_UPDATE = 'Error updating GMB question.',

  REVIEWS_QUERY = 'Error querying GMB reviews.',
  REVIEWS_CREATE_UPDATE_REPLY = 'Error creating or updating GMB review.',
  REVIEWS_REPLY_DELETE = 'Error removing GMB review.',

  POSTS_QUERY = 'Error querying GMB posts.',
  POSTS_CREATE = 'Error creating GMB post.',
  POSTS_UPDATE = 'Error updating GMB post.',
  POST_INSIGHT = 'Error querying GMB posts insight',

  MEDIA_CREATE_UPLOAD = 'Error creating and uploading media to GMB.',
  MEDIA_UPLOAD = 'Error creating and uploading media to GMB.',
  MEDIA_CREATE = 'Error creating GMB media.',
  MEDIA_REMOVE = 'Error removing GMB media.',
  MEDIA_CREATE_REFID = 'Error creating GMB media reference.',
}

export enum AuthError {
  MIDDLEWARE_VALIDATION = "Middleware failed to validate user's current stream.",
  STREAM_QUERY = 'Error querying stream and related records.',
  STREAM_MISSING_REFERENCE = 'Missing stream reference.',
  STREAM_REVOKED_OR_INVALID = "User hasn't logged in with Google yet or refresh_token was revoked.",

  REFRESH_TOKEN_VALIDATION = "Error validating user's refresh token or username.",
  RETRIEVE_GOOGLE_USERNAME = 'Error retrieving Google username for current logged user.',

  EXCHANGE_TOKENS = 'Error validating Google tokens.',
  GENERATE_TOKEN = 'Error generating user session tokens.',
  INVALID_USER_TOKEN = 'Invalid user token.',

  INVALID_CREDENTIALS = 'Invalid credentials.',
  ADMIN_GENERATE_TOKEN = 'Error generating admin session token.',
}

export enum LocationError {
  MORE_THAN_10_LOCATIONS = 'You cannot have more than 10 locations.',
  LOCATION_INVALID_IDS = 'One or more location ids are not valid.',
  MISSING_LOCATION_IDS = 'Missing location ids.',
  NO_SELECTED_LOCATIONS = "You haven't selected any location.",
  LOCATION_UNVERIFIED = 'You selected a location that was not verified.',
  UNPROCESSABLE_PAGINATION = 'One or more pagination strings are not valid JSON.',
}

export enum PostError {
  POST_MISSING_DATA = 'Missing post data.',
  POST_MISSING_OFFER_DATA = 'Missing post offer data',
  POST_MISSING_EVENT_DATA = 'Missing post event data',
  POST_MISSING_CONTENT = 'Missing post content.',
  POST_MISSING_BUTTON_LINK = 'Missing button label or link.',
  POST_MISSING_LOCATIONS = 'You need to select at least one location.',

  MEDIA_GDRIVE_TOKEN_OR_URL = 'Missing Google Drive url or token.',
  MEDIA_GDRIVE_DOWNLOAD_FAIL = 'Failed downloading file from Google Drive',
  MEDIA_INVALID_TYPE = 'Invalid media type. Media should only be an image.',
  MEDIA_INVALID_FORMAT = 'Invalid media format. Image must be either png or jpeg',
  MEDIA_MISSING_FILE_OR_SOURCE = 'Missing a valid file or source url.',
  MEDIA_MISSING_VALID_FILE = 'Missing a valid image file.',
  MEDIA_PHOTO_SIZE = 'Picture size must be between 10 KB and 5 MB.',
  MEDIA_PHOTO_DIMENSION = 'Picture minimum resolution must be 720px tall, 720px wide',
  MEDIA_VIDEO_SIZE = 'Picture size must be less than 100 MB.',
  MEDIA_VIDEO_DIMENSION = 'Picture minimum size must be at least 720px high, 720px wide.',
  MEDIA_VIDEO_DURATION = 'Video cannot be longer than 30 seconds.',
  VALIDATE_MEDIA_DIMENSION = 'Failed validating media dimensions. Please try again.',

  FAILED_S3_UPLOAD = 'Unable to upload the Google Drive media.',
}

export enum QuestionError {
  QUESTION_GET_ALL = 'Error retrieving questions for your locations.',
  QUESTION_GET_FOR_LOCATION = 'Error retrieving questions for specific location.',
  QUESTION_RESPONSE_UPDATE = 'Error updating question reply.',
  QUESTION_RESPONSE_DELETE = 'Error deleting question reply.',
}

export enum ReviewError {
  REVIEW_GET_ALL = 'Error retrieving reviews for your locations.',
  REVIEW_GET_FOR_LOCATION = 'Error retrieving reviews for specific location.',
}

export enum StreamError {
  DELETE = 'Error deleting stream from database.',
}

export const ErrorCategories = {
  unknown: 'Missing error code. Try different selection',
  invalidDataInput:
    'Invalid or missing Location information <b><ErrorCode></b>. Correct the Location information or refer Google My business FAQ. ',
  operationFailure: 'Cannot complete the specified Operation Error <b><ErrorCode></b>. Check request Action. ',
  unverifiedLocationOrChainLimitation:
    'Location Verification is required to Manage this Location <ErrorCode>. Check verification Status of this Location or refer Google My business FAQ. ',
  systemError: 'Contact Hootsuite Support for assistance.',
};

const referenceLinks = {
  INELIGIBLE_PLACE:
    'https://support.google.com/contributionpolicy/answer/12473822?hl=en-GB&sjid=7410568640173031358-AP',
  ACCESS_TOKEN_SCOPE_INSUFFICIENT: 'https://support.google.com/cloud/answer/13464325?hl=en&sjid=7410568640173031358-AP',
  UNVERIFIED_LOCATION: 'https://support.google.com/business/answer/4669139?hl=en&sjid=7410568640173031358-AP',
  ERROR_CODE_UNSPECIFIED: '',
  ASSOCIATE_LOCATION_INVALID_PLACE_ID:
    'https://support.google.com/business/answer/4495875?hl=en&sjid=12930847905735908828-AP',
  LAT_LNG_UPDATES_NOT_PERMITTED:
    'https://support.google.com/business/thread/169386950?hl=en&sjid=12930847905735908828-AP',
  PO_BOX_IN_ADDRESS_NOT_ALLOWED:
    'https://support.google.com/business/answer/9876800?hl=en-GB&co=GENIE.Platform%3DAndroid&sjid=12930847905735908828-AP',
  BLOCKED_REGION: 'https://support.google.com/business/answer/9157481?hl=en-GB&sjid=12930847905735908828-AP',
  LAT_LNG_TOO_FAR_FROM_ADDRESS:
    'https://support.google.com/business/thread/169386950?hl=en&sjid=12930847905735908828-AP',
  LAT_LNG_REQUIRED: 'https://support.google.com/business/thread/169386950?hl=en&sjid=12930847905735908828-AP',
  ADDRESS_MISSING_REGION_CODE: 'https://support.google.com/business/answer/6397478?hl=en&sjid=12930847905735908828-AP',
  ADDRESS_EDIT_CHANGES_COUNTRY:
    'https://support.google.com/business/answer/2853879?hl=en-GB&sjid=12930847905735908828-AP',
  ADDRESS_REMOVAL_NOT_ALLOWED:
    'https://support.google.com/business/answer/2853879?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_SERVICE_AREA_PLACE_ID:
    'https://support.google.com/business/answer/9157481?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_AREA_TYPE_FOR_SERVICE_AREA:
    'https://support.google.com/business/answer/9157481?hl=en&sjid=12930847905735908828-AP',
  INVALID_LATLNG:
    'https://support.google.com/business/answer/3500741?hl=en-GB&sjid=12930847905735908828-AP#:~:text=Latitude%20and%20longitude%20errors',
  INVALID_ADDRESS: 'https://support.google.com/business/thread/136606019?hl=en&sjid=12930847905735908828-AP',
  RELATION_ENDPOINTS_TOO_FAR: '',
  INVALID_SERVICE_ITEM: 'https://support.google.com/business/answer/9455399?hl=en&sjid=12930847905735908828-AP',
  PIN_DROP_REQUIRED: 'https://support.google.com/business/answer/6279343?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_ATTRIBUTE_NAME: 'https://support.google.com/business/answer/4495875?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_CHARACTERS: 'https://support.google.com/business/answer/13769188?hl=en-GB&sjid=12930847905735908828-AP',
  FORBIDDEN_WORDS: 'https://support.google.com/business/answer/3038177?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_INTERCHANGE_CHARACTERS:
    'https://support.google.com/business/answer/3500741?hl=en-GB&sjid=12930847905735908828-AP#:~:text=Characters%20that%20aren%E2%80%99t%20allowed',
  FIELDS_REQUIRED_FOR_CATEGORY:
    'https://support.google.com/business/answer/3039617?hl=en-GB&sjid=12930847905735908828-AP#zippy=%2Ccategory',
  STOREFRONT_REQUIRED_FOR_CATEGORY:
    'https://support.google.com/business/answer/3038177?hl=en&sjid=12930847905735908828-AP',
  INVALID_LOCATION_CATEGORY: 'https://support.google.com/business/answer/4495875?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_URL: 'https://support.google.com/business/answer/13769188?hl=en&sjid=12930847905735908828-AP',
  URL_PROVIDER_NOT_ALLOWED:
    'https://support.google.com/business/answer/3500741?hl=en-GB&sjid=12930847905735908828-AP#:~:text=URL%20in%20the%20store%20code%20field',
  INVALID_PHONE_NUMBER: 'https://support.google.com/business/thread/59795699?hl=en&sjid=12930847905735908828-AP',
  INVALID_PHONE_NUMBER_FOR_REGION: '',
  MISSING_PRIMARY_PHONE_NUMBER:
    'https://support.google.com/business/answer/3039617?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_CATEGORY:
    'https://support.google.com/business/answer/3500741?hl=en-GB&sjid=12930847905735908828-AP#:~:text=only%20allowed%20characters.-,Invalid%20categories%3A,-Certain%20categories%20are',
  INVALID_BUSINESS_OPENING_DATE:
    'https://support.google.com/business/answer/9174409?hl=en-GB&sjid=12930847905735908828-AP',
  PROFILE_DESCRIPTION_CONTAINS_URL:
    'https://support.google.com/business/answer/9273900?hl=en&co=GENIE.Platform%3DDesktop&sjid=12930847905735908828-AP',
  LODGING_CANNOT_EDIT_PROFILE_DESCRIPTION: '',
  PARENT_CHAIN_CANNOT_BE_THE_LOCATION_ITSELF:
    'https://support.google.com/business/answer/4495875?hl=en&sjid=12930847905735908828-AP',
  RELATION_CANNOT_BE_THE_LOCATION_ITSELF:
    'https://support.google.com/business/answer/4495875?hl=en&sjid=12930847905735908828-AP',
  ATTRIBUTE_PROVIDER_URL_NOT_ALLOWED:
    'https://support.google.com/business/answer/3500741?hl=en&sjid=12930847905735908828-AP#:~:text=URL%20in%20the%20store%20code%20field',
  ATTRIBUTE_INVALID_ENUM_VALUE: '',
  ATTRIBUTE_NOT_AVAILABLE: 'https://support.google.com/business/answer/9049526?hl=en-GB&sjid=12930847905735908828-AP',
  ATTRIBUTE_CANNOT_BE_REPEATED:
    'https://support.google.com/business/answer/9049526?hl=en-GB&sjid=12930847905735908828-AP',
  ATTRIBUTE_TYPE_NOT_COMPATIBLE_FOR_CATEGORY:
    'https://support.google.com/business/answer/9049526?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_CATEGORY_FOR_SAB:
    'https://support.google.com/business/answer/3500741?hl=en&sjid=12930847905735908828-AP#:~:text=only%20allowed%20characters.-,Invalid%20categories,-Certain%20categories%20are',
  SERVICE_ITEM_LABEL_NO_DISPLAY_NAME:
    'https://support.google.com/business/answer/9455399?hl=en&sjid=12930847905735908828-AP',
  SERVICE_ITEM_LABEL_DUPLICATE_DISPLAY_NAME:
    'https://support.google.com/business/answer/9455399?hl=en&sjid=12930847905735908828-AP',
  SERVICE_ITEM_LABEL_INVALID_UTF8:
    'https://support.google.com/business/answer/9455399?hl=en&sjid=12930847905735908828-AP',
  FREE_FORM_SERVICE_ITEM_WITH_NO_CATEGORY_ID:
    'https://support.google.com/business/answer/9455399?hl=en&sjid=12930847905735908828-AP',
  FREE_FORM_SERVICE_ITEM_WITH_NO_LABEL:
    'https://support.google.com/business/answer/9455399?hl=en-GB&sjid=12930847905735908828-AP',
  SERVICE_ITEM_WITH_NO_SERVICE_TYPE_ID:
    'https://support.google.com/business/answer/9455399?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_LANGUAGE: 'https://support.google.com/business/thread/238452791?hl=en&sjid=12930847905735908828-AP',
  OPENING_DATE_TOO_FAR_IN_THE_FUTURE:
    'https://support.google.com/business/answer/9174409?hl=en&sjid=12930847905735908828-AP',
  OPENING_DATE_MISSING_YEAR_OR_MONTH:
    'https://support.google.com/business/answer/9174409?hl=en&sjid=12930847905735908828-AP',
  OPENING_DATE_BEFORE_1AD: 'https://support.google.com/business/answer/9174409?hl=en&sjid=12930847905735908828-AP',
  SPECIAL_HOURS_SET_WITHOUT_REGULAR_HOURS:
    'https://support.google.com/business/answer/6303076?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_TIME_SCHEDULE: 'https://support.google.com/business/answer/6303076?hl=en-GB&sjid=12930847905735908828-AP',
  INVALID_HOURS_VALUE:
    'https://support.google.com/business/answer/9876800?hl=en-GB&co=GENIE.Platform%3DDesktop&sjid=12930847905735908828-AP',
  OVERLAPPED_SPECIAL_HOURS: 'https://support.google.com/business/answer/6303076?hl=en-GB&sjid=12930847905735908828-AP',
  INCOMPATIBLE_MORE_HOURS_TYPE_FOR_CATEGORY:
    'https://support.google.com/business/answer/9876800?hl=en-GB&co=GENIE.Platform%3DDesktop&sjid=12930847905735908828-AP',
  DUPLICATE_CHILDREN_LOCATIONS:
    'https://support.google.com/business/answer/4669139?hl=en-GB&sjid=12930847905735908828-AP',
  INCOMPATIBLE_SERVICE_AREA_AND_CATEGORY:
    'https://support.google.com/business/answer/9157481?hl=en&sjid=12930847905735908828-AP',
  CANNOT_REOPEN: 'https://support.google.com/business/answer/10417060?hl=en-GB&sjid=12930847905735908828-AP',
  PHONE_NUMBER_EDITS_NOT_ALLOWED:
    'https://support.google.com/business/answer/10417060?hl=en-GB&sjid=12930847905735908828-AP',
  TOO_MANY_VALUES:
    'https://support.google.com/business/answer/3500741?hl=en&sjid=12930847905735908828-AP#:~:text=your%20store%20codes.-,Too%20many%20characters,-Some%20of%20your',
  DELETED_LINK: 'https://support.google.com/business/answer/13580646?hl=en-GB&sjid=12930847905735908828-AP',
  LINK_ALREADY_EXISTS: 'https://support.google.com/business/answer/13769188?hl=en&sjid=12930847905735908828-AP',
  SCALABLE_DEEP_LINK_INVALID_MULTIPLICITY:
    'https://support.google.com/business/answer/13769188?hl=en&sjid=12930847905735908828-AP',
  LINK_DOES_NOT_EXIST: 'https://support.google.com/business/answer/13769188?hl=en&sjid=12930847905735908828-AP',
  TOO_MANY_ENTRIES:
    'https://support.google.com/business/answer/3500741?hl=en&sjid=12930847905735908828-AP#:~:text=your%20shop%20codes.-,Too%20many%20characters,-Some%20of%20your',
  UNSUPPORTED_POINT_RADIUS_SERVICE_AREA:
    'https://support.google.com/business/answer/9157481?hl=en-GB&sjid=12930847905735908828-AP',
  MISSING_ADDRESS_COMPONENTS:
    'https://support.google.com/business/answer/6397478?hl=en-GB&sjid=12930847905735908828-AP',
  READ_ONLY_ADDRESS_COMPONENTS:
    'https://support.google.com/business/answer/2853879?hl=en-GB&sjid=12930847905735908828-AP#zippy=%2Cadd-or-edit-your-address:~:text=Add%2C%20edit%20or%20remove%20your%20address',
  STRING_TOO_LONG:
    'https://support.google.com/business/answer/3370250?hl=en-GB&sjid=12930847905735908828-AP#zippy=%2Cbusiness-name:~:text=Important%3A%20A%20business%20name%20is%20required%20for%20each%20location.',
  STRING_TOO_SHORT:
    'https://support.google.com/business/answer/3370250?hl=en-GB&sjid=12930847905735908828-AP#zippy=%2Cbusiness-name:~:text=Include%20an%20acronym%20of%20up%20to%20four%20letters',
  REQUIRED_FIELD_MISSING_VALUE: 'https://support.google.com/business/answer/3370250?sjid=12930847905735908828-AP',
  AMBIGUOUS_TITLE: 'https://support.google.com/business/answer/3038177?hl=en&sjid=12930847905735908828-AP',
  SERVICE_TYPE_ID_DUPLICATE:
    'https://support.google.com/business/answer/12756178?hl=en-GB&sjid=12930847905735908828-AP',
  PRICE_CURRENCY_MISSING: '',
  PRICE_CURRENCY_INVALID: '',
  STALE_DATA: 'https://support.google.com/business/answer/10018786?hl=en-GB&sjid=12930847905735908828-AP',
  MULTIPLE_ORGANIZATIONALLY_PART_OF_RELATION:
    'https://support.google.com/business/answer/7655842?hl=en-GB&sjid=12930847905735908828-AP',
  THROTTLED: '',
};

/**
 * GenericError Supported Types
 */
export type ErrorType =
  | GoogleOAuthError
  | GeneralError
  | GMBError
  | AuthError
  | LocationError
  | PostError
  | QuestionError
  | ReviewError
  | StreamError;

/**
 * Generic Error to be returned to client
 */
let errorCategoryGlobal;
let errorActionGlobal;
const messageWithHyperlinkCategories = ['invalidDataInput', 'operationFailure', 'unverifiedLocationOrChainLimitation'];
const errorData = {
  unknown: ['ERROR_CODE_UNSPECIFIED'],
  invalidDataInput: [
    'ASSOCIATE_LOCATION_INVALID_PLACE_ID',
    'PO_BOX_IN_ADDRESS_NOT_ALLOWED',
    'BLOCKED_REGION',
    'LAT_LNG_TOO_FAR_FROM_ADDRESS',
    'LAT_LNG_REQUIRED',
    'ADDRESS_MISSING_REGION_CODE',
    'INVALID_SERVICE_AREA_PLACE_ID',
    'INVALID_AREA_TYPE_FOR_SERVICE_AREA',
    'INVALID_LATLNG',
    'INVALID_ADDRESS',
    'INVALID_SERVICE_ITEM',
    'INVALID_ATTRIBUTE_NAME',
    'INVALID_CHARACTERS',
    'FORBIDDEN_WORDS',
    'INVALID_INTERCHANGE_CHARACTERS',
    'FIELDS_REQUIRED_FOR_CATEGORY',
    'INVALID_LOCATION_CATEGORY',
    'INVALID_URL',
    'INVALID_PHONE_NUMBER',
    'INVALID_PHONE_NUMBER_FOR_REGION',
    'MISSING_PRIMARY_PHONE_NUMBER',
    'INVALID_CATEGORY',
    'INVALID_BUSINESS_OPENING_DATE',
    'PROFILE_DESCRIPTION_CONTAINS_URL',
    'ATTRIBUTE_INVALID_ENUM_VALUE',
    'ATTRIBUTE_NOT_AVAILABLE',
    'ATTRIBUTE_TYPE_NOT_COMPATIBLE_FOR_CATEGORY',
    'INVALID_CATEGORY_FOR_SAB',
    'SERVICE_ITEM_LABEL_NO_DISPLAY_NAME',
    'SERVICE_ITEM_LABEL_DUPLICATE_DISPLAY_NAME',
    'SERVICE_ITEM_LABEL_INVALID_UTF8',
    'FREE_FORM_SERVICE_ITEM_WITH_NO_CATEGORY_ID',
    'FREE_FORM_SERVICE_ITEM_WITH_NO_LABEL',
    'SERVICE_ITEM_WITH_NO_SERVICE_TYPE_ID',
    'INVALID_LANGUAGE',
    'OPENING_DATE_TOO_FAR_IN_THE_FUTURE',
    'OPENING_DATE_MISSING_YEAR_OR_MONTH',
    'OPENING_DATE_BEFORE_1AD',
    'SPECIAL_HOURS_SET_WITHOUT_REGULAR_HOURS',
    'INVALID_TIME_SCHEDULE',
    'INVALID_HOURS_VALUE',
    'OVERLAPPED_SPECIAL_HOURS',
    'INCOMPATIBLE_MORE_HOURS_TYPE_FOR_CATEGORY',
    'LINK_ALREADY_EXISTS',
    'SCALABLE_DEEP_LINK_INVALID_MULTIPLICITY',
    'LINK_DOES_NOT_EXIST',
    'TOO_MANY_ENTRIES',
    'MISSING_ADDRESS_COMPONENTS',
    'STRING_TOO_LONG',
    'STRING_TOO_SHORT',
    'REQUIRED_FIELD_MISSING_VALUE',
    'AMBIGUOUS_TITLE',
    'SERVICE_TYPE_ID_DUPLICATE',
    'PRICE_CURRENCY_MISSING',
    'PRICE_CURRENCY_INVALID',
    'INELIGIBLE_PLACE',
    'UNVERIFIED_LOCATION',
  ],
  operationFailure: [
    'LAT_LNG_UPDATES_NOT_PERMITTED',
    'ADDRESS_EDIT_CHANGES_COUNTRY',
    'ADDRESS_REMOVAL_NOT_ALLOWED',
    'ADDRESS_REMOVAL_NOT_ALLOWED',
    'RELATION_ENDPOINTS_TOO_FAR',
    'PIN_DROP_REQUIRED',
    'STOREFRONT_REQUIRED_FOR_CATEGORY',
    'URL_PROVIDER_NOT_ALLOWED',
    'LODGING_CANNOT_EDIT_PROFILE_DESCRIPTION',
    'PARENT_CHAIN_CANNOT_BE_THE_LOCATION_ITSELF',
    'RELATION_CANNOT_BE_THE_LOCATION_ITSELF',
    'ATTRIBUTE_PROVIDER_URL_NOT_ALLOWED',
    'ATTRIBUTE_CANNOT_BE_REPEATED',
    'DUPLICATE_CHILDREN_LOCATIONS',
    'INCOMPATIBLE_SERVICE_AREA_AND_CATEGORY',
    'CANNOT_REOPEN',
    'PHONE_NUMBER_EDITS_NOT_ALLOWED',
    'TOO_MANY_VALUES',
    'DELETED_LINK',
    'UNSUPPORTED_POINT_RADIUS_SERVICE_AREA',
    'READ_ONLY_ADDRESS_COMPONENTS',
    'STALE_DATA',
    'MULTIPLE_ORGANIZATIONALLY_PART_OF_RELATION',
    'THROTTLED',
    'ACCESS_TOKEN_SCOPE_INSUFFICIENT',
  ],
  unverifiedLocationOrChainLimitation: ['UNVERIFIED_LOCATION'],
  systemError: ['SYSTEM_ERROR'],
};

export class GenericError extends Error {
  constructor(message: string, public code: string, public httpErrorCode?: number) {
    super(message);
    LoggerService.error(message, { code, httpErrorCode });
  }

  /**
   * Utility to log internal errors
   *
   * @param {*} message
   */
  public static logError(message: any) {
    LoggerService.error(message);
  }

  /**
   * Returns a GenericError object based off ErrorType
   * @param {ErrorType} errorItem
   * @param {any} error If error is specified, log it out.
   * @param {boolean} logError Log error
   */
  public static for(
    errorCategory: any,
    error: any = null,
    stream: Stream = null,
    logError: boolean = true,
    errorAction: string = null,
  ): GenericError {
    errorCategoryGlobal = errorCategory;
    errorActionGlobal = errorAction;

    // Checks whether the error is GMB error or custom error. If GMB, assign category message.
    const isGMBError = Object.keys(referenceLinks).includes(errorAction);
    let updatedErrorItem = isGMBError ? ErrorCategories[`${errorCategory}`] : errorCategory;

    // Updated the ERROR_ACTION in the message
    if (errorAction) {
      updatedErrorItem = updatedErrorItem.replace('<ErrorCode>', errorAction);
    }

    if (updatedErrorItem === 'systemError') {
      updatedErrorItem = ErrorCategories.systemError;
    }

    if (error) {
      if (logError) GenericError.logError(error);

      // Assumption Stream is used only for GMB APIs
      if (stream) {
        GenericError.forCode(error.message, stream);
        return new GenericError(
          `${updatedErrorItem.toString()}`,
          error?.response?.statusText || error?.message || 'INTERNAL_SERVER_ERROR',
          error?.response?.status || error?.code || 500,
        );
      }

      // Check for any common error first
      if (error instanceof Error) {
        const parsedError = GenericError.forCode(error.message, stream);
        if (parsedError.message !== GeneralError.UNKNOWN) return parsedError;
      }
    }

    return new GenericError(
      updatedErrorItem.toString(),
      GenericError.code(updatedErrorItem),
      GenericError.httpErrorCode(updatedErrorItem),
    );
  }

  /**
   * Cast any other type of error that is not of type GenericError into
   * a GenericError and returns as a JSON
   */
  public static parseToJSON(error: any): any {
    if (!(error instanceof GenericError)) error = GenericError.for(GeneralError.UNKNOWN);
    return {
      code: error.code,
      message: error.message ? error.message : ErrorCategories.systemError,
      formattedError: `${error.message ? error.message : ErrorCategories.systemError}${
        error.message && messageWithHyperlinkCategories.includes(errorCategoryGlobal)
          ? ` <a href=${
              referenceLinks?.[`${errorActionGlobal}`]
            } target="_blank" style="color: white; font-weight: bold">Learn more</a> about resolving this error.`
          : ''
      }`,
    };
  }

  public parseToJSON(): any {
    return GenericError.parseToJSON(this);
  }

  /**
   * Parse error into a GenericError object
   */
  public static parse(error: any, shouldLogError: boolean = true): GenericError {
    if (shouldLogError) GenericError.logError(error);
    if (error && error.name) return GenericError.forCode(error.name);
    return GenericError.for(GeneralError.UNKNOWN);
  }

  /**
   * Parse code into GenericError object
   */
  public static forCode(code: string, stream: Stream = null): GenericError {
    let errorType: ErrorType;

    switch (code) {
      case 'invalid_grant':
        GAuthUtility.revokeGoogleTokens(stream);
        errorType = GoogleOAuthError.INVALID_TOKEN;
        break;

      case 'invalid_token':
        GAuthUtility.revokeGoogleTokens(stream);
        errorType = GoogleOAuthError.EXPIRED_TOKEN;
        break;

      // Forces frontend to logout the streams when user
      // manually revokes Google account access.
      case 'Invalid Credentials':
        code = 'invalid_token';
        GAuthUtility.revokeGoogleTokens(stream);
        errorType = AuthError.STREAM_REVOKED_OR_INVALID;
        break;

      default:
        errorType = GeneralError.UNKNOWN;
        break;
    }

    return new GenericError(errorType.toString(), code, 401);
  }

  /**
   * Get code for error type
   *
   * @param {ErrorType} updatedErrorItem
   */
  private static code(item: ErrorType): string {
    switch (item) {
      case GoogleOAuthError.INVALID_TOKEN:
        return 'invalid_grant';

      case GoogleOAuthError.EXPIRED_TOKEN:
      case AuthError.STREAM_REVOKED_OR_INVALID:
        return 'invalid_token';

      case GeneralError.UNKNOWN:
        return 'unknown';

      default:
        return 'none';
    }
  }

  /**
   * Get http error status for error type
   *
   * @param {ErrorType} updatedErrorItem
   */
  private static httpErrorCode(item: ErrorType): number {
    switch (item) {
      case LocationError.UNPROCESSABLE_PAGINATION:
        return 422;

      // Problem with Google oAuth tokens
      // Should ask the user to log in again.
      case GoogleOAuthError.INVALID_TOKEN:
      case GoogleOAuthError.EXPIRED_TOKEN:
      case AuthError.EXCHANGE_TOKENS:
        return 403;

      // Problem with stream or app session
      // Should reload the app with new tokens
      case AuthError.STREAM_REVOKED_OR_INVALID:
      case AuthError.STREAM_MISSING_REFERENCE:
      case AuthError.STREAM_QUERY:
      case AuthError.INVALID_USER_TOKEN:
      case AuthError.MIDDLEWARE_VALIDATION:
      case AuthError.INVALID_CREDENTIALS:
        return 401;

      case PostError.MEDIA_INVALID_FORMAT:
      case PostError.MEDIA_INVALID_TYPE:
      case PostError.MEDIA_MISSING_FILE_OR_SOURCE:
      case PostError.POST_MISSING_BUTTON_LINK:
      case PostError.POST_MISSING_CONTENT:
      case PostError.POST_MISSING_DATA:
      case PostError.MEDIA_MISSING_VALID_FILE:
      case PostError.POST_MISSING_LOCATIONS:
      case PostError.MEDIA_PHOTO_SIZE:
      case LocationError.LOCATION_INVALID_IDS:
      case LocationError.LOCATION_UNVERIFIED:
      case LocationError.MISSING_LOCATION_IDS:
      case LocationError.MORE_THAN_10_LOCATIONS:
      case LocationError.NO_SELECTED_LOCATIONS:
      case AuthError.REFRESH_TOKEN_VALIDATION:
        return 400;

      default:
        return 500;
    }
  }

  // private static getGenericErrorMessage(error: any): string {
  //   return (
  //     error?.response?.data?.error?.message ||
  //     error?.response?.data?.errors[0]?.message ||
  //     error?.message ||
  //     GeneralError.INTERNAL_SERVER_ERROR
  //   );
  // }

  // Returns category details for the given error
  public static getCategoryErrorDetails(error: any) {
    let category: any, errorCode: any;
    // Check for server error
    if (error?.response?.data?.error?.code >= 500 && error?.response?.data?.error?.code <= 600) {
      category = ErrorCategories.systemError;
      errorCode = 'SYSTEM_ERROR';
    }
    else {
      errorCode = error?.response?.data?.error?.details?.[0].reason ||
                  error?.response?.data?.errors?.[0]?.details?.[0].reason ||
                  error?.details?.[0].reason ||
                  errorData.systemError;

      category = Object.keys(errorData).find((item) => errorData[`${item}`].includes(errorCode))
                  ? Object.keys(errorData).find((item) => errorData[`${item}`].includes(errorCode))
                  : 'systemError';
    }
      return {
        category: category,
        errorCode: errorCode,
      };
  }
}

/**
 * Unhandled Api Error to be returned to client
 */
export class UnhandledApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, UnhandledApiError.prototype);
  }
}
