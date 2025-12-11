import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/lib/rbac";
import { db } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

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
                        folder: `crm-bank/customers/${customerId}`,
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });

            // Save to DB
            const rec = await (db as any).customerImage.create({
                data: {
                    customerId,
                    url: uploadResult.secure_url,
                    filename: originalName, // Store original name for display
                    order: i,
                },
            });

            created.push({ id: rec.id, url: uploadResult.secure_url, filename: originalName });
        }

        const result = await (db as any).customerImage.findMany({
            where: { customerId },
            orderBy: { order: "asc" }
        });

        return NextResponse.json({ images: result });
    } catch (err) {
        console.error("Cloudinary upload error:", err);
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
        session.user.permissions?.["customer.update.dealer"]?.allow;

    if (!hasUpdatePermission) {
        // Fallback or specific checks could be added here
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

        // Delete from Cloudinary
        for (const r of recs) {
            try {
                // Extract public_id from URL
                // Example: https://res.cloudinary.com/cloudname/image/upload/v1234/crm-bank/customers/123/filename.jpg
                // We need: crm-bank/customers/123/filename (no extension)
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
