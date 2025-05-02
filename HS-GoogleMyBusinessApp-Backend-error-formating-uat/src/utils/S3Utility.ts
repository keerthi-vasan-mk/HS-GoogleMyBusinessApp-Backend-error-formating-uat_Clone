import * as aws from 'aws-sdk';
import * as fs from 'fs';
import { GenericError, PostError } from '../types/errors';
import { LoggerService } from './LoggerService';

/**
 * Deletes a file stored on S3.
 *
 * @param {String} file
 */
export function deleteS3File(fileKey: string) {
  const s3 = new aws.S3();
  const params = {
    Bucket: process.env.MEDIA_BUCKET_NAME,
    Key: fileKey,
  };

  s3.deleteObject(params, (err, _data) => {
    if (err) {
      LoggerService.error('Error deleting object from S3', err);
    }
  });
}

/**
 * Uploads a new file to be stored on S3.
 *
 * @param {string} fileName File name to be used as key on S3.
 * @param {string} path Path to the local file to upload.
 * @returns {Promise<string>} Returns the public URL of the uploaded file.
 */
export function uploadS3File(fileName: string, path: string): Promise<string> {
  const s3 = new aws.S3();

  return new Promise((resolve, _reject) => {
    fs.readFile(path, (err, data) => {
      if (err) throw GenericError.for(PostError.FAILED_S3_UPLOAD);
      const params = {
        Bucket: process.env.MEDIA_BUCKET_NAME,
        Key: fileName,
        ACL: 'public-read',
        Body: data,
      };
      s3.upload(params, function (err, data) {
        if (err) throw GenericError.for(PostError.FAILED_S3_UPLOAD);
        resolve(data.Location);
      });
    });
  });
}
