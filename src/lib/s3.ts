import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET || "hcp-exports-staging";

// Upload a file (buffer or stream) to S3
export async function uploadToS3(
  key: string,
  body: Buffer | ReadableStream | Blob,
  contentType?: string
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body as any,
      ContentType: contentType || "application/octet-stream",
    })
  );
}

// Upload text content (CSV, JSON, etc.)
export async function uploadTextToS3(
  key: string,
  text: string,
  contentType: string = "text/csv"
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(text, "utf-8"),
      ContentType: contentType,
    })
  );
}

// Generate a pre-signed download URL (default 24h expiry)
export async function getDownloadUrl(
  key: string,
  expiresInSeconds: number = 86400
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

// Delete a file from S3
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

// Build a consistent S3 key path for an export
export function exportS3Path(exportId: string, ...parts: string[]): string {
  return ["exports", exportId, ...parts].join("/");
}
