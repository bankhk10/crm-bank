import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * Fallback route to serve uploaded files directly from filesystem
 * This handles cases where Next.js default static file serving (public folder)
 * hasn't picked up new files yet (common in dev mode).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;

  // Security check: Prevent directory traversal
  if (
    pathSegments.some(
      (segment) =>
        segment.includes("..") ||
        segment.includes("/") ||
        segment.includes("\\"),
    )
  ) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  // Construct absolute filesystem path
  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    ...pathSegments,
  );

  try {
    // Check if file exists
    await fs.access(filePath);

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".svg":
        contentType = "image/svg+xml";
        break;
      case ".pdf":
        contentType = "application/pdf";
        break;
      case ".mp4":
        contentType = "video/mp4";
        break;
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        // Cache control: 1 hour (less aggressive than static default to allow updates/deletes to propagate reasonably fast)
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    });
  } catch (err) {
    // File not found or error reading
    return new NextResponse("File not found", { status: 404 });
  }
}
