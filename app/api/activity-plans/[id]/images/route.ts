import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import {
  uploadFile,
  deleteFilesBatch,
  createPresignedUploadUrls,
  type PresignedUploadRequestItem,
} from "@/lib/file-storage";

// Context params type in Next.js App Router
type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".gif",
  ".avif",
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function isAllowedImageFile(filename: string, mimeType?: string): boolean {
  const dotIdx = filename.lastIndexOf(".");
  const ext = dotIdx >= 0 ? filename.substring(dotIdx).toLowerCase() : "";
  return (
    ALLOWED_EXTENSIONS.includes(ext) ||
    Boolean(mimeType && mimeType.startsWith("image/"))
  );
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: activityPlanId } = await context.params;
  const urlObj = new URL(request.url);
  const rawItemId =
    urlObj.searchParams.get("surveyItemId") ||
    urlObj.searchParams.get("itemId") ||
    "general";
  const rawCategory = urlObj.searchParams.get("category") || "images";
  const action = urlObj.searchParams.get("action");

  // Sanitize path segments to prevent directory traversal
  const surveyItemId = rawItemId.replace(/[^a-zA-Z0-9_-]/g, "") || "general";
  const category = rawCategory.replace(/[^a-zA-Z0-9_-]/g, "") || "images";

  // Folder structure: activity-plans/{activityPlanId}/{surveyItemId}/{category}
  const folder = `activity-plans/${activityPlanId}/${surveyItemId}/${category}`;

  try {
    const contentTypeHeader = request.headers.get("content-type") || "";

    // ─── Mode A: Presigned URL Batch Generation (Supports 200+ concurrent images directly to R2) ───
    if (
      action === "presign" ||
      contentTypeHeader.includes("application/json")
    ) {
      const body = await request.json().catch(() => ({}));
      const rawFiles = Array.isArray(body.files) ? body.files : [];

      if (rawFiles.length === 0) {
        return NextResponse.json(
          { error: "กรุณาระบุรายการไฟล์รูปภาพที่ต้องการอัปโหลด" },
          { status: 400 },
        );
      }

      if (rawFiles.length > 500) {
        return NextResponse.json(
          { error: "รองรับการขอ URL อัปโหลดสูงสุด 500 รูปต่อครั้ง" },
          { status: 400 },
        );
      }

      const presignItems: PresignedUploadRequestItem[] = [];
      for (const f of rawFiles) {
        const fname = String(f.filename || f.name || "image.jpg");
        const ftype = String(f.contentType || f.type || "image/jpeg");
        const fsize = Number(f.size || 0);

        if (fsize > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `ไฟล์ "${fname}" มีขนาดเกินขีดจำกัด 20MB` },
            { status: 400 },
          );
        }

        if (!isAllowedImageFile(fname, ftype)) {
          return NextResponse.json(
            { error: `ไฟล์ "${fname}" มีประเภทไฟล์ที่ไม่รองรับ (รองรับเฉพาะรูปภาพ)` },
            { status: 400 },
          );
        }

        presignItems.push({ filename: fname, contentType: ftype });
      }

      const presigned = await createPresignedUploadUrls(folder, presignItems);
      if (!presigned) {
        // R2 is not configured; tell client to use multipart server upload
        return NextResponse.json({
          success: true,
          r2Enabled: false,
          presigned: [],
        });
      }

      return NextResponse.json({
        success: true,
        r2Enabled: true,
        presigned,
      });
    }

    // ─── Mode B: Standard Multipart Form Upload (R2 or Local Storage) ───
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "กรุณาเลือกไฟล์รูปภาพที่ต้องการอัปโหลด" },
        { status: 400 },
      );
    }

    // Validate all files upfront before uploading
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `ไฟล์ "${file.name}" มีขนาดเกินขีดจำกัด 20MB`,
          },
          { status: 400 },
        );
      }

      if (!isAllowedImageFile(file.name, file.type)) {
        return NextResponse.json(
          {
            error: `ไฟล์ "${file.name}" มีประเภทไฟล์ที่ไม่รองรับ`,
          },
          { status: 400 },
        );
      }
    }

    // Upload files in parallel (preserving original order)
    const created = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const originalName = file.name || `image-${Date.now()}.jpg`;

        const uploadResult = await uploadFile(buffer, originalName, {
          folder,
          contentType: file.type || undefined,
        });

        return {
          id: uploadResult.filename.replace(/\.[^/.]+$/, ""), // UUID without ext
          url: uploadResult.url,
          filename: originalName,
        };
      }),
    );

    return NextResponse.json({ success: true, created });
  } catch (err: any) {
    console.error("Activity Plan Image Upload error:", err);
    return NextResponse.json(
      { error: err.message || "อัปโหลดรูปภาพล้มเหลว" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { publicPaths } = body as { publicPaths?: string[] };

    if (publicPaths && Array.isArray(publicPaths)) {
      const validPaths = publicPaths.filter(
        (filePath) =>
          typeof filePath === "string" &&
          filePath.includes("/uploads/activity-plans/") &&
          !filePath.includes(".."),
      );

      if (validPaths.length > 0) {
        await deleteFilesBatch(validPaths);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Activity Plan Image Delete error:", err);
    return NextResponse.json(
      { error: err.message || "ลบรูปภาพล้มเหลว" },
      { status: 500 },
    );
  }
}
