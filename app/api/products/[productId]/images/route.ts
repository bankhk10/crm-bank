import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/lib/rbac";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

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
    const coverIndexRaw = formData.get("coverIndex");
    const coverIndex = coverIndexRaw ? parseInt(String(coverIndexRaw), 10) : undefined;

    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products", productId);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // create file records
    const created: Array<{ id: string; url: string; filename: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i] as any;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const originalName = file.name || `file-${Date.now()}`;
      const ext = path.extname(originalName) || ".jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
      const filepath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filepath, buffer);

      const url = `/uploads/products/${productId}/${filename}`;

      // temporary order set to 0; we'll reorder later
      const rec = await (db as any).productImage.create({
        data: {
          productId,
          url,
          filename: originalName,
          order: 0,
        },
      });

      created.push({ id: rec.id, url, filename: originalName });
    }

    // Recompute ordering. We'll place the chosen cover (if provided and valid)
    // first (order = 0), then other images in the existing order.

    const allImages = await (db as any).productImage.findMany({
      where: { productId },
      orderBy: { order: "asc" },
    });

    let orderedIds: string[] = [];

    if (typeof coverIndex === "number" && coverIndex >= 0 && coverIndex < created.length) {
      const coverId = created[coverIndex].id;
      orderedIds.push(coverId);
      for (const img of allImages) {
        if (img.id !== coverId) orderedIds.push(img.id);
      }
    } else {
      // no chosen cover among uploaded files — keep existing order + appended created
      orderedIds = allImages.map((i: any) => i.id);
    }

    // write orders sequentially
    await Promise.all(
      orderedIds.map((id, idx) =>
        (db as any).productImage.update({ where: { id }, data: { order: idx } })
      )
    );

    const result = await (db as any).productImage.findMany({ where: { productId }, orderBy: { order: "asc" } });

    return NextResponse.json({ images: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


