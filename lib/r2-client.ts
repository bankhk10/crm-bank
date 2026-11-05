import { S3Client } from "@aws-sdk/client-s3";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
  endpoint: string;
  keyPrefix?: string;
}

let cachedR2Client: S3Client | null = null;
let cachedConfigSignature: string | null = null;

/**
 * Checks whether Cloudflare R2 is configured and enabled.
 * R2 is enabled when STORAGE_PROVIDER is "r2" (or not explicitly set to "local")
 * AND required R2 credentials (ACCOUNT_ID / ENDPOINT, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME) are present.
 */
export function isR2Enabled(): boolean {
  const provider = (process.env.STORAGE_PROVIDER || "").toLowerCase().trim();
  if (provider === "local") {
    return false;
  }

  const config = getR2Config();
  return Boolean(
    config &&
      config.endpoint &&
      config.accessKeyId &&
      config.secretAccessKey &&
      config.bucketName,
  );
}

/**
 * Resolves Cloudflare R2 configuration from environment variables.
 */
export function getR2Config(): R2Config | null {
  const accountId = (process.env.R2_ACCOUNT_ID || "").trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
  const bucketName = (process.env.R2_BUCKET_NAME || "").trim();
  const customEndpoint = (process.env.R2_ENDPOINT || "").trim();
  const publicUrl = (
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  const keyPrefix = (process.env.R2_KEY_PREFIX || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  const endpoint =
    customEndpoint ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl: publicUrl || undefined,
    endpoint,
    keyPrefix: keyPrefix || undefined,
  };
}

/**
 * Returns a singleton S3Client instance configured for Cloudflare R2.
 */
export function getR2Client(): S3Client {
  const config = getR2Config();
  if (!config) {
    throw new Error(
      "Cloudflare R2 is not configured. Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_BUCKET_NAME.",
    );
  }

  const signature = `${config.endpoint}|${config.accessKeyId}|${config.bucketName}`;
  if (cachedR2Client && cachedConfigSignature === signature) {
    return cachedR2Client;
  }

  cachedR2Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  cachedConfigSignature = signature;

  return cachedR2Client;
}

