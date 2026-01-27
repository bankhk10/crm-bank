import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/lib/rbac";
import { db } from "@/lib/db";
import { uploadFile, deleteFile } from "@/lib/file-storage";

const resourcePath = "/api/products";

export async function POST(request: Request, { params }: { params: any }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { productId } = await params;

  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const created: Array<{ id: string; url: string; filename: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i] as any;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const originalName = file.name || `file-${Date.now()}`;

      // Upload to local storage
      console.log(
        `[API] Processing file: ${originalName}, size: ${buffer.length}`,
      );

      const uploadResult = await uploadFile(buffer, originalName, {
        folder: `products/${productId}`,
        maxWidth: 1280,
        quality: 85,
      });

      console.log(`[API] Upload success, url: ${uploadResult.url}`);

      // Save to DB
      const rec = await (db as any).productImage.create({
        data: {
          productId,
          url: uploadResult.url,
          filename: originalName, // Store original name for display
          order: i,
        },
      });
      console.log(`[API] DB Record created: ${rec.id}`);

      created.push({
        id: rec.id,
        url: uploadResult.url,
        filename: originalName,
      });
    }

    const result = await (db as any).productImage.findMany({
      where: { productId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ images: result, created });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["product.update"]?.allow) {
    return NextResponse.json(
      { error: "Forbidden - missing product.update" },
      { status: 403 },
    );
  }

  try {
    const { productId } = await params;
    const body = await request.json().catch(() => ({}));
    const imageIds: string[] = Array.isArray(body.imageIds)
      ? body.imageIds
      : [];

    if (imageIds.length === 0) {
      return NextResponse.json(
        { error: "No imageIds provided" },
        { status: 400 },
      );
    }

    // find records to delete (ensure they belong to this product)
    const recs = await (db as any).productImage.findMany({
      where: { id: { in: imageIds }, productId },
    });

    // Delete from local storage
    for (const r of recs) {
      try {
        await deleteFile(r.url);
      } catch (err) {
        console.error("Failed to delete file", r.id, err);
      }
    }

    // delete DB records
    await (db as any).productImage.deleteMany({
      where: { id: { in: imageIds }, productId },
    });

    const result = await (db as any).productImage.findMany({
      where: { productId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, images: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: any }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["product.update"]?.allow) {
    return NextResponse.json(
      { error: "Forbidden - missing product.update" },
      { status: 403 },
    );
  }

  try {
    const { productId } = await params;
    const body = await request.json().catch(() => ({}));
    const imageIds: string[] = Array.isArray(body.imageIds)
      ? body.imageIds
      : [];

    if (imageIds.length === 0) {
      return NextResponse.json(
        { error: "No imageIds provided" },
        { status: 400 },
      );
    }

    // Update order for each image
    for (let i = 0; i < imageIds.length; i++) {
      await (db as any).productImage.updateMany({
        where: { id: imageIds[i], productId },
        data: { order: i },
      });
    }

    const result = await (db as any).productImage.findMany({
      where: { productId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, images: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
}
