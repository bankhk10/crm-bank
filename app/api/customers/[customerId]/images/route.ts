import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import { db } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: Request, { params }: { params: any }) {
  // Read formData BEFORE calling auth to avoid body being locked
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  // Now check permissions
  const guard = await guardPermission("product.update");
  if ("response" in guard) {
    return guard.response;
  }

  const { productId } = await params;

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

      // Upload to Cloudinary
      const uploadResult: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `crm-bank/products/${productId}`,
            resource_type: "auto",
            transformation: [
              { width: 1280, crop: "limit" }, // Resize if larger than 1280px
              { quality: "auto:good" } // Reduce quality to efficient level (roughly equivalent to 80-90%)
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      // Save to DB
      const rec = await (db as any).productImage.create({
        data: {
          productId,
          url: uploadResult.secure_url,
          filename: originalName, // Store original name for display
          order: i,
        },
      });

      created.push({ id: rec.id, url: uploadResult.secure_url, filename: originalName });
    }

    const result = await (db as any).productImage.findMany({
      where: { productId },
      orderBy: { order: "asc" }
    });

    return NextResponse.json({ images: result, created });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  // Read body BEFORE calling auth to avoid body being locked
  let body;
  try {
    body = await request.json().catch(() => ({}));
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse body" }, { status: 400 });
  }

  // Now check permissions
  const guard = await guardPermission("product.update");
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const { productId } = await params;
    const imageIds: string[] = Array.isArray(body.imageIds) ? body.imageIds : [];

    if (imageIds.length === 0) {
      return NextResponse.json({ error: "No imageIds provided" }, { status: 400 });
    }

    // find records to delete (ensure they belong to this product)
    const recs = await (db as any).productImage.findMany({
      where: { id: { in: imageIds }, productId },
    });

    // Delete from Cloudinary
    for (const r of recs) {
      try {
        // Extract public_id from URL
        // Example: https://res.cloudinary.com/cloudname/image/upload/v1234/crm-bank/products/123/filename.jpg
        // We need: crm-bank/products/123/filename (no extension)
        const urlParts = r.url.split('/');
        const versionIndex = urlParts.findIndex((part: string) => part.startsWith('v') && !isNaN(Number(part.substring(1))));

        if (versionIndex !== -1) {
          const publicIdWithExt = urlParts.slice(versionIndex + 1).join('/');
          const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // remove extension

          await cloudinary.uploader.destroy(publicId);
        } else {
          // Try to guess if version is missing or structured differently
          // Sometimes Cloudinary URLs don't have version if not transformed?
          // But usually upload returns versioned url.
          // Fallback: look for 'crm-bank' folder start?
          const folderIndex = urlParts.indexOf('crm-bank');
          if (folderIndex !== -1) {
            const publicIdWithExt = urlParts.slice(folderIndex).join('/');
            const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
            await cloudinary.uploader.destroy(publicId);
          }
        }
      } catch (err) {
        console.error("Failed to delete from Cloudinary", r.id, err);
      }
    }

    // delete DB records
    await (db as any).productImage.deleteMany({
      where: { id: { in: imageIds }, productId },
    });

    const result = await (db as any).productImage.findMany({ where: { productId }, orderBy: { order: 'asc' } });

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
    return NextResponse.json({ error: "Failed to parse body" }, { status: 400 });
  }

  // Now check permissions
  const guard = await guardPermission("product.update");
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const { productId } = await params;
    const imageIds: string[] = Array.isArray(body.imageIds) ? body.imageIds : [];

    if (imageIds.length === 0) {
      return NextResponse.json({ error: "No imageIds provided" }, { status: 400 });
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
