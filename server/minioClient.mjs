import { Client } from 'minio';

export const minioBucket = process.env.MINIO_BUCKET || 'split-bill-proofs';

const makeClient = ({ endpointEnv = 'MINIO_ENDPOINT', portEnv = 'MINIO_PORT', sslEnv = 'MINIO_USE_SSL' } = {}) => {
  const endPoint = process.env[endpointEnv] || process.env.MINIO_ENDPOINT || 'localhost';
  const port = Number(process.env[portEnv] || process.env.MINIO_PORT || 9000);
  const useSSL = String(process.env[sslEnv] || process.env.MINIO_USE_SSL || 'false').toLowerCase() === 'true';
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error('MINIO_ACCESS_KEY and MINIO_SECRET_KEY are required for the API server.');
  }

  return new Client({ endPoint, port, useSSL, accessKey, secretKey });
};

export const createMinioClient = () => makeClient();

// Presigned URLs must use a browser-reachable host. In Docker, the API talks to
// MinIO through the internal `minio` hostname but the browser uses localhost:9000.
export const createPublicMinioClient = () => makeClient({
  endpointEnv: 'MINIO_PUBLIC_ENDPOINT',
  portEnv: 'MINIO_PUBLIC_PORT',
  sslEnv: 'MINIO_PUBLIC_USE_SSL'
});

export const ensureProofBucket = async (client) => {
  const exists = await client.bucketExists(minioBucket);
  if (!exists) {
    await client.makeBucket(minioBucket);
  }
};
