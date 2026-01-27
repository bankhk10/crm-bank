import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Base directory for uploads (inside public folder for easy serving)
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

interface UploadOptions {
  folder: string; // e.g., 'products/abc123' or 'customers/xyz456'
  maxWidth?: number;
  quality?: number;
}

interface UploadResult {
  url: string;
  filename: string;
  publicPath: string;
}

/**
 * Ensure the upload directory exists
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
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const id = randomUUID();
  return `${id}${ext}`;
}

/**
 * Upload a file to local storage
 * - Stores files as-is (no image processing to reduce dependencies)
 * - Returns the URL path that can be used to serve the file
 */
export async function uploadFile(
  buffer: Buffer,
  originalFilename: string,
  options: UploadOptions,
): Promise<UploadResult> {
  const { folder } = options;

  // Create the full directory path
  const uploadDir = path.join(UPLOADS_DIR, folder);
  console.log(`[Upload] Preparing to upload to: ${uploadDir}`);

  await ensureDir(uploadDir);

  // Generate unique filename
  const filename = generateFilename(originalFilename);
  const filepath = path.join(uploadDir, filename);

  console.log(`[Upload] Writing file to: ${filepath}`);

  // Save the file as-is
  await fs.writeFile(filepath, buffer);
  console.log(`[Upload] File written successfully`);

  // Return the public URL path
  // Ensure we use forward slashes for URL
  const publicPath = `/uploads/${folder}/${filename}`;
  console.log(`[Upload] Public path: ${publicPath}`);

  return {
    url: publicPath,
    filename,
    publicPath,
  };
}

/**
 * Delete a file from local storage
 */
export async function deleteFile(publicPath: string): Promise<boolean> {
  try {
    // Convert public URL path to file system path
    // e.g., /uploads/products/abc123/image.jpg -> public/uploads/products/abc123/image.jpg
    const relativePath = publicPath.replace(/^\//, "");
    const filepath = path.join(process.cwd(), "public", relativePath);

    await fs.unlink(filepath);
    return true;
  } catch (err) {
    console.error("Failed to delete file:", publicPath, err);
    return false;
  }
}

/**
 * Delete an entire folder from local storage
 */
export async function deleteFolder(folder: string): Promise<boolean> {
  try {
    const folderPath = path.join(UPLOADS_DIR, folder);
    await fs.rm(folderPath, { recursive: true, force: true });
    return true;
  } catch (err) {
    console.error("Failed to delete folder:", folder, err);
    return false;
  }
}

/**
 * Get the base URL for serving uploaded files
 * In development, this is just the relative path
 * In production, you might want to use a CDN URL
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}
