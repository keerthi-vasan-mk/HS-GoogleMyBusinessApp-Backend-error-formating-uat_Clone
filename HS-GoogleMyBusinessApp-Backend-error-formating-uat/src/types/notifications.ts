/**
 * Enum that stores the types of notifications.
 */
export enum NotificationTypes {
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Enum that stores the stream types a
 * notification can be stored in.
 */
export enum NotificationStreamTypes {
  REVIEWS = 'reviews',
  QUESTIONS = 'questions',
  POSTS = 'posts'
}

/**
 * Code that denotes there is no notification
 * stored in the database.
 */
export const NO_NOTIFICATION_CODE = 1;