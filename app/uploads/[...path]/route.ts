import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getObjectFromR2, resolveContentType } from "@/lib/file-storage";
import { getR2Config, isR2Enabled } from "@/lib/r2-client";

/**
 * Fallback route to serve uploaded files from local filesystem or Cloudflare R2.
 * 1. Checks local `public/uploads/...` first (handles seed files and legacy local uploads).
 * 2. If not found locally and Cloudflare R2 is enabled:
 *    - If R2_PUBLIC_URL is configured, redirects or fetches from R2.
 *    - Streams the object from R2 with proper Content-Type and Cache-Control headers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;

  // Security check: Prevent directory traversal
  if (
    !pathSegments ||
    pathSegments.length === 0 ||
    pathSegments.some(
      (segment) =>
        segment.includes("..") ||
        segment.includes("/") ||
        segment.includes("\\"),
    )
  ) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  // 1. Try local filesystem first (fast path for seed images & legacy local files)
  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    ...pathSegments,
  );

  try {
    await fs.access(filePath);
    const fileBuffer = await fs.readFile(filePath);
    const contentType = resolveContentType(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    });
  } catch {
    // Not found on local disk; proceed to check Cloudflare R2 if enabled
  }

  // 2. Fallback to Cloudflare R2
  if (isR2Enabled()) {
    const r2Config = getR2Config();
    if (r2Config?.publicUrl) {
      const relativePath = `uploads/${pathSegments.join("/")}`;
      const objectKey = r2Config.keyPrefix
        ? `${r2Config.keyPrefix}/${relativePath}`
        : relativePath;
      const targetUrl = `${r2Config.publicUrl}/${objectKey}`;
      return NextResponse.redirect(targetUrl, 307);
    }

    const r2Object = await getObjectFromR2(pathSegments);
    if (r2Object) {
      return new NextResponse(new Uint8Array(r2Object.buffer), {
        headers: {
          "Content-Type": r2Object.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  return new NextResponse("File not found", { status: 404 });
}
