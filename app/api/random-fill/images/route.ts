import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/lib/rbac";
import fs from "fs";
import path from "path";

const resourcePath = "/api/random-fill";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "random-fill");
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const created: Array<{ filename: string; url: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i] as any;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const originalName = file.name || `file-${Date.now()}`;
      const ext = path.extname(originalName) || ".jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
      const filepath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filepath, buffer);

      const url = `/uploads/random-fill/${filename}`;
      created.push({ filename: originalName, url });
    }

    return NextResponse.json({ files: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
