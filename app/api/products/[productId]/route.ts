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

const resourcePath = "/api/products";

const productSchema = z.object({
  productCode: z.string().min(1, "รหัสสินค้าต้องไม่ว่าง"),
  name: z.string().min(1, "ชื่อสินค้าต้องไม่ว่าง"),
  commonName: z.string().optional(),
  unit: z.string().optional(),
  productGroup: z.string().optional(),
  brand: z.string().optional(),
  chemicalGroup: z.string().optional(),
  packageSize: z.string().optional(),
  packageSizePerBox: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  usedForPlants: z.array(z.string()).default([]),
  salesPoint: z.string().optional(),
  properties: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: any }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
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

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["product.update"]?.allow) {
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

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["product.delete"]?.allow) {
    return NextResponse.json(
      { error: "Forbidden - missing product.delete" },
      { status: 403 },
    );
  }

  try {
    const { productId } = await params;

    const result = await (db as any).product.updateMany({
      where: { id: productId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

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
