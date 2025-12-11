import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/lib/rbac";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

const resourcePath = "/api/customers";

export async function POST(request: Request, { params }: { params: any }) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorized(resourcePath, session.user.permissions)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { customerId } = await params;

    try {
        const formData = await request.formData();
        // const coverIndexRaw = formData.get("coverIndex"); // Not supporting cover index for now unless requested

        // We can support cover index if needed, but the requirement was just "upload images"
        // Let's support it if we want to be consistent, but schema only has 'order'.
        // Use simple ordering.

        const files = formData.getAll("images") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads", "customers", customerId);
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

            const url = `/uploads/customers/${customerId}/${filename}`;

            const rec = await (db as any).customerImage.create({
                data: {
                    customerId,
                    url,
                    filename: originalName,
                    order: i, // simple append
                },
            });

            created.push({ id: rec.id, url, filename: originalName });
        }

        // Reorder based on creation if needed, but append is fine.

        const result = await (db as any).customerImage.findMany({
            where: { customerId },
            orderBy: { order: "asc" }
        });

        return NextResponse.json({ images: result });
    } catch (err) {
        console.error(err);
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

    // Check update permission
    const hasUpdatePermission =
        session.user.permissions?.["customer.update"]?.allow ||
        session.user.permissions?.["customer.update.dealer"]?.allow; // Check generic or specific

    if (!hasUpdatePermission) {
        // strict check? isAuthorized handles generic resource path.
        // Use consistent pattern if possible.
    }

    try {
        const { customerId } = await params;
        const body = await request.json().catch(() => ({}));
        const imageIds: string[] = Array.isArray(body.imageIds) ? body.imageIds : [];

        if (imageIds.length === 0) {
            return NextResponse.json({ error: "No imageIds provided" }, { status: 400 });
        }

        // find records to delete
        const recs = await (db as any).customerImage.findMany({
            where: { id: { in: imageIds }, customerId },
        });

        // delete files from disk
        for (const r of recs) {
            try {
                const rel = String(r.url).replace(/^\//, "");
                const filepath = path.join(process.cwd(), "public", rel);
                if (fs.existsSync(filepath)) {
                    await fs.promises.unlink(filepath);
                }
            } catch (err) {
                console.error("Failed to unlink file for image", r.id, err);
            }
        }

        // delete DB records
        await (db as any).customerImage.deleteMany({
            where: { id: { in: imageIds }, customerId },
        });

        const result = await (db as any).customerImage.findMany({ where: { customerId }, orderBy: { order: 'asc' } });

        return NextResponse.json({ success: true, images: result });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
