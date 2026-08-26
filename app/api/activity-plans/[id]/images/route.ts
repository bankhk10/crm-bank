import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { uploadFile, deleteFile } from "@/lib/file-storage";

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
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: activityPlanId } = await context.params;
  const urlObj = new URL(request.url);
  const surveyItemId = urlObj.searchParams.get("surveyItemId") || "general";
  const category = urlObj.searchParams.get("category") || "images"; // "price-tag" | "shelf"

  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "กรุณาเลือกไฟล์รูปภาพที่ต้องการอัปโหลด" },
        { status: 400 },
      );
    }

    // Folder structure: activity-plans/{activityPlanId}/{surveyItemId}/{category}
    const folder = `activity-plans/${activityPlanId}/${surveyItemId}/${category}`;
    const created: Array<{ id: string; url: string; filename: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate File Size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `ไฟล์ "${file.name}" มีขนาดเกินขีดจำกัด 20MB`,
          },
          { status: 400 },
        );
      }

      // Validate File Extension & MIME
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext) && !file.type.startsWith("image/")) {
        return NextResponse.json(
          {
            error: `ไฟล์ "${file.name}" มีประเภทไฟล์ที่ไม่รองรับ`,
          },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const originalName = file.name || `image-${Date.now()}`;

      const uploadResult = await uploadFile(buffer, originalName, {
        folder,
      });

      created.push({
        id: uploadResult.filename.replace(/\.[^/.]+$/, ""), // UUID without ext
        url: uploadResult.url,
        filename: originalName,
      });
    }

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
      for (const filePath of publicPaths) {
        if (
          typeof filePath === "string" &&
          filePath.startsWith("/uploads/activity-plans/")
        ) {
          await deleteFile(filePath);
        }
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
