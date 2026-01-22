import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { uploadFile, deleteFile } from "@/lib/file-storage";

export async function POST(request: Request, { params }: { params: any }) {
  // Read formData BEFORE calling auth to avoid body being locked
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse form data" },
      { status: 400 },
    );
  }

  // Now check permissions
  const guard = await guardPermission("customer.edit");
  if ("response" in guard) {
    return guard.response;
  }

  const { customerId } = await params;

  try {
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
      const uploadResult = await uploadFile(buffer, originalName, {
        folder: `customers/${customerId}`,
        maxWidth: 1280,
        quality: 85,
      });

      // Save to DB
      const rec = await db.customerImage.create({
        data: {
          customerId,
          url: uploadResult.url,
          filename: originalName, // Store original name for display
          order: i,
        },
      });

      created.push({
        id: rec.id,
        url: uploadResult.url,
        filename: originalName,
      });
    }

    const result = await db.customerImage.findMany({
      where: { customerId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ images: result, created });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  // Read body BEFORE calling auth to avoid body being locked
  let body;
  try {
    body = await request.json().catch(() => ({}));
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse body" },
      { status: 400 },
    );
  }

  // Now check permissions
  const guard = await guardPermission("customer.edit");
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const { customerId } = await params;
    const imageIds: string[] = Array.isArray(body.imageIds)
      ? body.imageIds
      : [];

    if (imageIds.length === 0) {
      return NextResponse.json(
        { error: "No imageIds provided" },
        { status: 400 },
      );
    }

    // find records to delete (ensure they belong to this customer)
    const recs = await db.customerImage.findMany({
      where: { id: { in: imageIds }, customerId },
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
    await db.customerImage.deleteMany({
      where: { id: { in: imageIds }, customerId },
    });

    const result = await db.customerImage.findMany({
      where: { customerId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, images: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: any }) {
  // Read body BEFORE calling auth to avoid body being locked
  let body;
  try {
    body = await request.json().catch(() => ({}));
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse body" },
      { status: 400 },
    );
  }

  // Now check permissions
  const guard = await guardPermission("customer.edit");
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const { customerId } = await params;
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
      await db.customerImage.updateMany({
        where: { id: imageIds[i], customerId },
        data: { order: i },
      });
    }

    const result = await db.customerImage.findMany({
      where: { customerId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, images: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
}
