import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "minio",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minio123",
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "pod-flash";

export async function uploadFile(
  data: Buffer,
  key: string,
  contentType: string
): Promise<void> {
  console.log(
    `[S3] Uploading ${key} (${data.length} bytes) to bucket ${BUCKET_NAME}`
  );

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: data,
      ContentType: contentType,
    });

    await s3Client.send(command);
    console.log(`[S3] Upload completed for ${key}`);
  } catch (error) {
    console.error(`[S3] Upload failed for ${key}:`, error);
    throw error;
  }
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  console.log(`[S3] Generating signed URL for ${key}`);

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    }); // 1 hour
    console.log(`[S3] Generated signed URL for ${key}`);
    return signedUrl;
  } catch (error) {
    console.error(`[S3] Failed to generate signed URL for ${key}:`, error);
    throw error;
  }
}

export async function deleteFile(key: string): Promise<void> {
  console.log(`[S3] Deleting ${key}`);

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`[S3] Deletion completed for ${key}`);
  } catch (error) {
    console.error(`[S3] Deletion failed for ${key}:`, error);
    throw error;
  }
}
