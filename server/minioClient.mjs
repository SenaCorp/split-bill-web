import { Client } from 'minio';

export const minioBucket = process.env.MINIO_BUCKET;

export const createMinioClient = () => {
  const endPoint = process.env.MINIO_ENDPOINT;
  const port = Number(process.env.MINIO_PORT);
  const useSSL = String(process.env.MINIO_USE_SSL || 'true').toLowerCase() === 'true';
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!endPoint || !port || !accessKey || !secretKey || !minioBucket) {
    throw new Error('MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, and MINIO_BUCKET are required for the API server.');
  }

  return new Client({ endPoint, port, useSSL, accessKey, secretKey });
};

const ignorableMinioErrorCodes = new Set([
  'AccessDenied',
  'InvalidAccessKeyId',
  'SignatureDoesNotMatch',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT'
]);

export const isIgnorableMinioError = (error) => {
  if (!error) return false;
  if (ignorableMinioErrorCodes.has(error.code)) return true;
  return error.cause ? isIgnorableMinioError(error.cause) : false;
};

export const ensureProofBucket = async (client) => {
  try {
    const exists = await client.bucketExists(minioBucket);
    if (!exists) {
      await client.makeBucket(minioBucket);
    }
    return true;
  } catch (error) {
    if (isIgnorableMinioError(error)) {
      console.warn(`Skipping MinIO bucket check because MinIO is unavailable or credentials are not authorized: ${error.message}`);
      return false;
    }

    throw error;
  }
};
