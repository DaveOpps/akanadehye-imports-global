import "server-only";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * Product photos live in a Railway bucket (S3-compatible), not in Postgres.
 * `InventoryItem.images` holds object keys like "products/<id>/00.jpg" instead
 * of the multi-megabyte base64 data URIs it used to carry — see
 * scripts/README or the migration notes for the one-time move.
 */

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

export const bucketConfigured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);

let client: S3Client | null = null;

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? "auto",
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      // Railway hands out virtual-host style buckets.
      forcePathStyle: process.env.S3_URL_STYLE === "path",
    });
  }
  return client;
}

// Backed by a plain ArrayBuffer so it satisfies BodyInit — the SDK's own
// byte array is typed ArrayBufferLike, which a Response won't accept.
export type BucketObject = { body: Uint8Array<ArrayBuffer>; contentType: string };

/** Fetch one object. Returns null when the key doesn't exist. */
export async function getObject(key: string): Promise<BucketObject | null> {
  if (!bucketConfigured) return null;
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: bucket!, Key: key }));
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    const body = new Uint8Array(new ArrayBuffer(bytes.byteLength));
    body.set(bytes);
    return {
      body,
      contentType: res.ContentType ?? "image/jpeg",
    };
  } catch {
    return null;
  }
}
