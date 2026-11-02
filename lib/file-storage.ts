import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2Config, isR2Enabled } from "./r2-client";

// Base directory for local uploads (inside public folder for easy serving)
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export interface UploadOptions {
  folder: string; // e.g., 'products/abc123' or 'customers/xyz456'
  maxWidth?: number;
  quality?: number;
  contentType?: string;
  customFilename?: string;
}

export interface UploadResult {
  url: string;
  filename: string;
  publicPath: string;
  objectKey?: string;
}

export interface PresignedUploadRequestItem {
  filename: string;
  contentType?: string;
}

export interface PresignedUploadResultItem {
  id: string;
  originalFilename: string;
  filename: string;
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  publicPath: string;
  contentType: string;
}

/**
 * Determine MIME Content-Type from filename or provided mimeType
 */
export function resolveContentType(
  filename: string,
  explicitContentType?: string,
): string {
  if (explicitContentType && explicitContentType.includes("/")) {
    return explicitContentType;
  }

  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".heic":
      return "image/heic";
    case ".heif":
      return "image/heif";
    case ".avif":
      return "image/avif";
    case ".pdf":
      return "application/pdf";
    case ".mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}

/**
 * Ensure the local upload directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Generate a unique filename for the uploaded file
 */
export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const safeExt = ext.replace(/[^a-z0-9.]/g, "") || ".jpg";
  const id = randomUUID();
  return `${id}${safeExt}`;
}

/**
 * Normalizes a folder + filename into an R2 Object Key and a public path `/uploads/...`
 */
export function buildStoragePaths(
  folder: string,
  filename: string,
): {
  cleanFolder: string;
  publicPath: string;
  objectKey: string;
  url: string;
} {
  const cleanFolder = folder
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/^uploads\/+/, "");

  const relativeUploadsPath = cleanFolder
    ? `uploads/${cleanFolder}/${filename}`
    : `uploads/${filename}`;

  const publicPath = `/${relativeUploadsPath}`;

  const r2Config = getR2Config();
  const objectKey = r2Config?.keyPrefix
    ? `${r2Config.keyPrefix}/${relativeUploadsPath}`
    : relativeUploadsPath;

  const url =
    isR2Enabled() && r2Config?.publicUrl
      ? `${r2Config.publicUrl}/${objectKey}`
      : publicPath;

  return {
    cleanFolder,
    publicPath,
    objectKey,
    url,
  };
}

/**
 * Converts a stored URL or publicPath (e.g. `/uploads/activity-plans/...` or `https://cdn.../uploads/...`)
 * into an R2 Object Key and local relative path.
 */
export function extractStorageKeyFromUrl(urlOrPath: string): {
  objectKey: string;
  localRelativePath: string;
} | null {
  if (!urlOrPath || typeof urlOrPath !== "string") return null;

  let pathname = urlOrPath.trim();

  // Strip full URL domain if present
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    try {
      const parsed = new URL(pathname);
      pathname = parsed.pathname;
    } catch {
      return null;
    }
  }

  pathname = pathname.replace(/\\/g, "/").replace(/^\/+/, "");

  if (pathname.includes("..")) {
    return null;
  }

  const r2Config = getR2Config();
  const prefix = r2Config?.keyPrefix ? `${r2Config.keyPrefix}/` : "";

  let withoutPrefix = pathname;
  if (prefix && withoutPrefix.startsWith(prefix)) {
    withoutPrefix = withoutPrefix.slice(prefix.length);
  }

  // Ensure it starts with uploads/
  const uploadsIndex = withoutPrefix.indexOf("uploads/");
  const localRelativePath =
    uploadsIndex >= 0
      ? withoutPrefix.slice(uploadsIndex)
      : `uploads/${withoutPrefix}`;

  const objectKey = prefix ? `${prefix}${localRelativePath}` : localRelativePath;

  return {
    objectKey,
    localRelativePath,
  };
}

/**
 * Upload a file to Cloudflare R2 (when enabled) or local storage.
 */
export async function uploadFile(
  buffer: Buffer,
  originalFilename: string,
  options: UploadOptions,
): Promise<UploadResult> {
  const { folder, contentType: explicitContentType, customFilename } = options;
  const filename = customFilename || generateFilename(originalFilename);
  const { cleanFolder, publicPath, objectKey, url } = buildStoragePaths(
    folder,
    filename,
  );
  const contentType = resolveContentType(originalFilename, explicitContentType);

  if (isR2Enabled()) {
    const config = getR2Config()!;
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return {
      url,
      filename,
      publicPath,
      objectKey,
    };
  }

  // Local Filesystem Storage Fallback
  const uploadDir = cleanFolder
    ? path.join(UPLOADS_DIR, cleanFolder)
    : UPLOADS_DIR;

  await ensureDir(uploadDir);

  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);

  return {
    url: publicPath,
    filename,
    publicPath,
    objectKey,
  };
}

/**
 * Generate Presigned PUT URLs for direct browser-to-R2 uploads (supports batching up to 200+ images).
 * Returns null if R2 is not enabled.
 */
export async function createPresignedUploadUrls(
  folder: string,
  items: PresignedUploadRequestItem[],
  expiresInSeconds: number = 3600,
): Promise<PresignedUploadResultItem[] | null> {
  if (!isR2Enabled()) {
    return null;
  }

  const config = getR2Config()!;
  const client = getR2Client();

  const results = await Promise.all(
    items.map(async (item) => {
      const filename = generateFilename(item.filename || "image.jpg");
      const id = filename.replace(/\.[^/.]+$/, "");
      const contentType = resolveContentType(
        item.filename || filename,
        item.contentType,
      );
      const { publicPath, objectKey, url } = buildStoragePaths(folder, filename);

      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      });

      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: expiresInSeconds,
      });

      return {
        id,
        originalFilename: item.filename,
        filename,
        objectKey,
        uploadUrl,
        publicUrl: url,
        publicPath,
        contentType,
      };
    }),
  );

  return results;
}

/**
 * Delete a single file from Cloudflare R2 and/or local storage
 */
export async function deleteFile(publicPathOrUrl: string): Promise<boolean> {
  const extracted = extractStorageKeyFromUrl(publicPathOrUrl);
  if (!extracted) return false;

  let r2Deleted = true;
  if (isR2Enabled()) {
    try {
      const config = getR2Config()!;
      const client = getR2Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: extracted.objectKey,
        }),
      );
    } catch (err) {
      console.error("[R2] Failed to delete object:", extracted.objectKey, err);
      r2Deleted = false;
    }
  }

  // Also attempt local cleanup if file exists locally (hybrid / legacy files)
  try {
    const filepath = path.join(
      process.cwd(),
      "public",
      extracted.localRelativePath,
    );
    await fs.unlink(filepath);
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      console.warn(
        "[LocalStorage] Failed to delete file:",
        extracted.localRelativePath,
        err,
      );
    }
  }

  return r2Deleted;
}

/**
 * Batch delete multiple files at once (up to 1,000 keys per R2 DeleteObjects call).
 */
export async function deleteFilesBatch(
  publicPathsOrUrls: string[],
): Promise<boolean> {
  if (!publicPathsOrUrls || publicPathsOrUrls.length === 0) return true;

  const extractedList = publicPathsOrUrls
    .map((p) => extractStorageKeyFromUrl(p))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (extractedList.length === 0) return true;

  let allSuccess = true;

  if (isR2Enabled()) {
    try {
      const config = getR2Config()!;
      const client = getR2Client();

      // S3/R2 DeleteObjects supports up to 1000 keys per request
      const CHUNK_SIZE = 1000;
      for (let i = 0; i < extractedList.length; i += CHUNK_SIZE) {
        const chunk = extractedList.slice(i, i + CHUNK_SIZE);
        await client.send(
          new DeleteObjectsCommand({
            Bucket: config.bucketName,
            Delete: {
              Objects: chunk.map((item) => ({ Key: item.objectKey })),
              Quiet: true,
            },
          }),
        );
      }
    } catch (err) {
      console.error("[R2] Failed batch delete objects:", err);
      allSuccess = false;
    }
  }

  // Best-effort local cleanup for legacy files
  await Promise.all(
    extractedList.map(async (item) => {
      try {
        const filepath = path.join(
          process.cwd(),
          "public",
          item.localRelativePath,
        );
        await fs.unlink(filepath);
      } catch {
        // Ignore ENOENT
      }
    }),
  );

  return allSuccess;
}

/**
 * Delete an entire folder from Cloudflare R2 and/or local storage
 */
export async function deleteFolder(folder: string): Promise<boolean> {
  const cleanFolder = folder
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/^uploads\/+/, "");

  if (!cleanFolder || cleanFolder.includes("..")) {
    return false;
  }

  let r2Success = true;

  if (isR2Enabled()) {
    try {
      const config = getR2Config()!;
      const client = getR2Client();
      const prefix = config.keyPrefix
        ? `${config.keyPrefix}/uploads/${cleanFolder}/`
        : `uploads/${cleanFolder}/`;

      let continuationToken: string | undefined = undefined;

      do {
        const listRes: any = await client.send(
          new ListObjectsV2Command({
            Bucket: config.bucketName,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );

        const contents = listRes.Contents || [];
        if (contents.length > 0) {
          await client.send(
            new DeleteObjectsCommand({
              Bucket: config.bucketName,
              Delete: {
                Objects: contents
                  .filter((obj: any) => Boolean(obj.Key))
                  .map((obj: any) => ({ Key: obj.Key })),
                Quiet: true,
              },
            }),
          );
        }

        continuationToken = listRes.IsTruncated
          ? listRes.NextContinuationToken
          : undefined;
      } while (continuationToken);
    } catch (err) {
      console.error("[R2] Failed to delete folder:", folder, err);
      r2Success = false;
    }
  }

  try {
    const folderPath = path.join(UPLOADS_DIR, cleanFolder);
    await fs.rm(folderPath, { recursive: true, force: true });
  } catch (err) {
    console.warn("[LocalStorage] Failed to delete local folder:", folder, err);
  }

  return r2Success;
}

/**
 * Fetch an object from R2 by its relative path segments under `/uploads/...`
 */
export async function getObjectFromR2(pathSegments: string[]): Promise<{
  buffer: Buffer;
  contentType: string;
} | null> {
  if (!isR2Enabled()) return null;

  const config = getR2Config()!;
  const client = getR2Client();

  const relativePath = `uploads/${pathSegments.join("/")}`;
  const objectKey = config.keyPrefix
    ? `${config.keyPrefix}/${relativePath}`
    : relativePath;

  try {
    const res = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
      }),
    );

    if (!res.Body) return null;

    const byteArray = await res.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);
    const contentType =
      res.ContentType ||
      resolveContentType(pathSegments[pathSegments.length - 1] || "");

    return { buffer, contentType };
  } catch {
    return null;
  }
}

/**
 * Get the base URL for serving uploaded files
 */
export function getBaseUrl(): string {
  const r2Config = getR2Config();
  if (isR2Enabled() && r2Config?.publicUrl) {
    return r2Config.publicUrl;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}
