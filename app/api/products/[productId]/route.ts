import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/src/infrastructure/database";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";
import {
  logger,
  auditLogger,
  generateRequestId,
  extractClientIp,
  extractUserAgent,
} from "@/lib/logger";
import type { RequestContext } from "@/lib/logger/types";
import { deleteFile, deleteFolder } from "@/lib/file-storage";

const resourcePath = "/api/products";

const productSchema = z.object({
  productCode: z.string().min(1, "รหัสสินค้าต้องไม่ว่าง"),
  name: z.string().min(1, "ชื่อสินค้าต้องไม่ว่าง"),
  commonName: z.string().optional(),
  unit: z.string().optional(),
  productGroup: z.string().optional(),    // กลุ่มชื่อการค้า (Trade Name Group)
  brand: z.string().optional(),
  chemicalGroup: z.string().optional(),   // กลุ่มสินค้า (Product Group) - เดิมชื่อ "กลุ่มสาร"
  packageSize: z.string().optional(),
  packageSizePerBox: z.string().optional(),
  totalPackageSizePerBox: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  usedForPlants: z.array(z.string()).default([]),
  salesPoint: z.string().optional(),
  properties: z.string().optional(),
  pointPerUnit: z.number().int().min(0).optional(),
  // New fields
  categoryId: z.string().optional(),      // FK to ProductCategory (หมวดสินค้า)
  productChainId: z.string().optional(),  // FK to ProductChain (กรุ๊ปสินค้า)
});

export async function GET(request: Request, { params }: { params: any }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { productId } = await params;

  const product = await (db as any).product.findFirst({
    where: { id: productId, deletedAt: null },
    include: {
      images: {
        orderBy: { order: "asc" },
      },
      freeItems: {
        orderBy: { createdAt: "desc" },
      },
      promotionItems: {
        orderBy: { createdAt: "desc" },
      },
      stockLots: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const startTime = Date.now();
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(session.user.permissionKeys ?? []).includes("product.update")) {
    return NextResponse.json(
      { error: "Forbidden - missing product.update" },
      { status: 403 },
    );
  }

  // Create request context for logging
  const headersObj = Object.fromEntries(request.headers.entries());
  const context: RequestContext = {
    requestId: generateRequestId(),
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    userName: session.user.name ?? undefined,
    ipAddress: extractClientIp(headersObj),
    userAgent: extractUserAgent(headersObj),
    endpoint: "/api/products/[productId]",
    method: "PATCH",
  };

  const reqLogger = logger.child(context);

  const body = await request.json().catch(() => null);
  const parsed = productSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { productId } = await params;

    // Get existing product (old value for audit)
    const existing = await db.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    reqLogger.info("Updating product", {
      module: "products",
      metadata: { productId, productCode: existing.productCode },
    });

    // Update product
    const product = await db.product.update({
      where: { id: productId },
      data: parsed.data,
      include: {
        images: true,
      },
    });

    // Log audit event (UPDATE)
    const duration = Date.now() - startTime;
    await auditLogger.logUpdate(
      "Product",
      productId,
      {
        productCode: existing.productCode,
        name: existing.name,
        commonName: existing.commonName,
        unit: existing.unit,
        productGroup: existing.productGroup,
        brand: existing.brand,
        chemicalGroup: existing.chemicalGroup,
        status: existing.status,
        price: existing.price?.toString(),
        pointPerUnit: existing.pointPerUnit,
      },
      {
        productCode: product.productCode,
        name: product.name,
        commonName: product.commonName,
        unit: product.unit,
        productGroup: product.productGroup,
        brand: product.brand,
        chemicalGroup: product.chemicalGroup,
        status: product.status,
        price: product.price?.toString(),
        pointPerUnit: product.pointPerUnit,
      },
      context,
      {
        entityName: product.name,
        module: "products",
        duration,
      },
    );

    reqLogger.info("Product updated successfully", {
      module: "products",
      duration,
      metadata: { productId, productCode: product.productCode },
    });

    // IMAGE CLEANUP LOGIC:
    // If the client sends 'images' array, we assume it's the definitive list of images to keep.
    // Any existing images NOT in this list should be deleted.
    if (body.images && Array.isArray(body.images)) {
      const keepIds = body.images
        .map((img: any) => img.id)
        .filter((id: any) => typeof id === "string");

      const currentImages = await (db as any).productImage.findMany({
        where: { productId },
      });

      const toDelete = currentImages.filter(
        (img: any) => !keepIds.includes(img.id),
      );

      for (const img of toDelete) {
        try {
          await deleteFile(img.url);
        } catch (err) {
          reqLogger.error("Failed to delete image file during update", err, {
            module: "products",
            metadata: { imageId: img.id },
          });
        }
        await (db as any).productImage.delete({ where: { id: img.id } });
      }
    }

    return NextResponse.json({ product });
  } catch (err) {
    const duration = Date.now() - startTime;
    reqLogger.error("Failed to update product", err, {
      module: "products",
      duration,
    });

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target =
        (err.meta && (err.meta as Record<string, unknown>).target) || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return NextResponse.json(
        { error: `มีรหัสสินค้านี้อยู่ในระบบแล้ว: (${fields})` },
        { status: 409 },
      );
    }

    throw err;
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(session.user.permissionKeys ?? []).includes("product.delete")) {
    return NextResponse.json(
      { error: "Forbidden - missing product.delete" },
      { status: 403 },
    );
  }

  try {
    const { productId } = await params;

    const existing = await (db as any).product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 1. Delete all images physically
    try {
      await deleteFolder(`products/${productId}`);
    } catch (err) {
      console.error("Failed to delete product folder:", err);
    }

    // 2. Delete image records from DB
    await (db as any).productImage.deleteMany({
      where: { productId },
    });

    // 3. Soft delete the product
    await (db as any).product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    throw err;
  }
}
