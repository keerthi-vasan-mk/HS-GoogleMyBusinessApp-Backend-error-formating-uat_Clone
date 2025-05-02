import * as multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as aws from 'aws-sdk';
import * as multerS3 from 'multer-s3';
import * as dotenv from 'dotenv';
import { GenericError, PostError } from '../types/errors';
dotenv.config();

// Settings
export const acceptableImageMimeTypes = [
  // Image formats
  'image/jpeg',
  'image/png',
];

export const acceptableVideoMimeTypes = [
  // Video formats
  // GMB API does not seem to support video upload at the moment
  // 'video/mp4',
  // 'video/mpeg',
  // 'video/quicktime',
  // 'video/x-msvideo',
  // 'video/ogg',
  // 'video/webm',
  // 'video/3gpp',
  // 'video/3gpp2'
];

/** Video Size Limit in Bytes */
export const videoSizeLimit = 100 * 1024 * 1024; // 100 MB in bytes

/** Image Size Limit in Bytes */
export const imageSizeLimit = 5 * 1024 * 1024;

/** Image Minimum Size in Bytes */
export const imageMinimumSize = 10 * 1024;

// Configure AWS client
aws.config.update({
  secretAccessKey: process.env.MEDIA_ACCESS_SECRET,
  accessKeyId: process.env.MEDIA_ACCESS_KEY,
  region: process.env.MEDIA_ACCESS_REGION,
});

const s3 = new aws.S3();

function fileFilter(req, file, cb) {
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted

  // Multer (file uploading) cleans the body removing anything we injected into it,
  // In places where Multer is used, we need to inject our variables again after the
  // they are removed by Multer.
  // appendBody holds any injected variable that were manually added by other middlewares
  if (req.appendBody) req.body = { ...req.body, ...req.appendBody };

  const acceptableMimeTypes = acceptableImageMimeTypes.concat(acceptableVideoMimeTypes);

  // To reject this file we pass `false`, otherwise `true`
  if (!acceptableMimeTypes.includes(file.mimetype)) return cb(GenericError.for(PostError.MEDIA_INVALID_TYPE), false);

  cb(null, true);
}

function getStorageOptions(): multer.StorageEngine {
  const storage = multerS3({
    acl: 'public-read',
    s3,
    bucket: process.env.MEDIA_BUCKET_NAME,
    key: function (_req, file, cb) {
      cb(null, `${uuidv4()}.${file.originalname.split('.').pop() || 'none'}`);
    },
  });

  return storage;
}

export const fileUploadOptions = () => {
  const options: multer.Options = {
    storage: getStorageOptions(),
    fileFilter: fileFilter,
    limits: {
      parts: 3,
      files: 1,
      fileSize: videoSizeLimit,
    },
  };

  return options;
};
