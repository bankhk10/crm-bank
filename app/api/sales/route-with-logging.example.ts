/**
 * Example: Sales API Route with Logging Integration
 *
 * นี่คือตัวอย่างการ integrate logging system เข้ากับ Sales API
 * สามารถ copy pattern นี้ไปใช้กับ routes อื่นได้
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db as prisma } from "@/lib/db";
import { Prisma } from "@/lib/db";
import {
  logger,
  auditLogger,
  generateRequestId,
  extractClientIp,
  extractUserAgent,
} from "@/lib/logger";
import type { RequestContext } from "@/lib/logger/types";

// Helper to create request context
function createContext(
  request: NextRequest,
  session: {
    user: { id: string; email?: string | null; name?: string | null };
  },
): RequestContext {
  const headersObj = Object.fromEntries(request.headers.entries());

  return {
    requestId: generateRequestId(),
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    userName: session.user.name ?? undefined,
    ipAddress: extractClientIp(headersObj),
    userAgent: extractUserAgent(headersObj),
    endpoint: request.nextUrl.pathname,
    method: request.method,
  };
}

// POST /api/sales - Create new sale with logging
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let context: RequestContext | null = null;
  let reqLogger = logger;

  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Create request context and child logger
    context = createContext(request, {
      user: session.user as { id: string; email: string; name: string },
    });
    reqLogger = logger.child(context);

    reqLogger.info("Creating new sale", { module: "sales" });

    // 3. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      reqLogger.warn("Session user not found in database", { module: "sales" });
      return NextResponse.json(
        { error: "Session expired or invalid. Please sign in again." },
        { status: 401 },
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();

    if (!body.customerId || !body.employeeId || !body.items?.length) {
      reqLogger.warn("Missing required fields in sale request", {
        module: "sales",
        metadata: {
          hasCustomerId: !!body.customerId,
          hasEmployeeId: !!body.employeeId,
          itemsCount: body.items?.length ?? 0,
        },
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 5. Get customer (for logging entity name)
    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
      select: { id: true, name: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // 6. Calculate totals
    const subtotal = body.items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0,
    );
    const total = subtotal - (body.shippingCost || 0) - (body.otherCosts || 0);

    // 7. Generate sale number
    const lastSale = await prisma.sale.findFirst({
      orderBy: { createdAt: "desc" },
      select: { saleNumber: true },
    });
    const saleNumber = generateSaleNumber(lastSale?.saleNumber);

    reqLogger.debug("Creating sale in database", {
      module: "sales",
      metadata: { saleNumber, customerId: body.customerId, total },
    });

    // 8. Create sale
    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        customerId: body.customerId,
        employeeId: body.employeeId,
        status: "PENDING_APPROVAL",
        paymentTerm: body.paymentTerm,
        creditDays: body.creditDays,
        saleDate: new Date(body.saleDate),
        subtotalAmount: new Prisma.Decimal(subtotal),
        shippingCost: new Prisma.Decimal(body.shippingCost || 0),
        otherCosts: new Prisma.Decimal(body.otherCosts || 0),
        totalAmount: new Prisma.Decimal(total),
        notes: body.notes,
        createdById: session.user.id,
        items: {
          create: body.items.map(
            (item: {
              productId: string;
              quantity: number;
              unitPrice: number;
              originalPrice: number;
              priceModified: boolean;
            }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              originalPrice: new Prisma.Decimal(item.originalPrice),
              priceModified: item.priceModified,
              totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
            }),
          ),
        },
        statusHistory: {
          create: {
            status: "PENDING_APPROVAL",
            notes: "Sale created",
            changedById: session.user.id,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        employee: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, productCode: true } },
          },
        },
      },
    });

    // 9. Log audit event (CREATE)
    const duration = Date.now() - startTime;
    await auditLogger.logCreate(
      "Sale",
      sale.id,
      {
        saleNumber: sale.saleNumber,
        customerId: sale.customerId,
        customerName: sale.customer.name,
        employeeId: sale.employeeId,
        employeeName: sale.employee.name,
        status: sale.status,
        paymentTerm: sale.paymentTerm,
        totalAmount: sale.totalAmount.toString(),
        itemCount: sale.items.length,
      },
      context,
      {
        entityName: sale.saleNumber,
        module: "sales",
        duration,
      },
    );

    reqLogger.info("Sale created successfully", {
      module: "sales",
      duration,
      metadata: {
        saleId: sale.id,
        saleNumber: sale.saleNumber,
        total: sale.totalAmount.toString(),
      },
    });

    // Add request ID to response header for tracing
    const response = NextResponse.json({ sale });
    response.headers.set("X-Request-ID", context.requestId ?? "");
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    reqLogger.error("Failed to create sale", error, {
      module: "sales",
      duration,
    });

    // Log failed audit attempt
    if (context) {
      await auditLogger.log({
        action: "CREATE",
        entityType: "Sale",
        context,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        duration,
        module: "sales",
      });
    }

    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 },
    );
  }
}

function generateSaleNumber(lastNumber?: string | null): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const prefix = `SO${year}${month}`;

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const lastSeq = parseInt(lastNumber.slice(-4));
  const newSeq = String(lastSeq + 1).padStart(4, "0");
  return `${prefix}${newSeq}`;
}

/**
 * Example: Update Sale with Audit Logging
 */
export async function PUT_example(request: NextRequest) {
  const startTime = Date.now();
  let context: RequestContext | null = null;
  let reqLogger = logger;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    context = createContext(request, {
      user: session.user as { id: string; email: string; name: string },
    });
    reqLogger = logger.child(context);

    const body = await request.json();
    const { id: saleId, ...updateData } = body;

    // Get old value before update
    const oldSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: { select: { name: true } },
        items: true,
      },
    });

    if (!oldSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    reqLogger.info("Updating sale", {
      module: "sales",
      metadata: { saleId, saleNumber: oldSale.saleNumber },
    });

    // Update sale
    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: updateData,
      include: {
        customer: { select: { name: true } },
        items: true,
      },
    });

    // Log audit event (UPDATE)
    const duration = Date.now() - startTime;
    await auditLogger.logUpdate(
      "Sale",
      saleId,
      {
        status: oldSale.status,
        totalAmount: oldSale.totalAmount.toString(),
        notes: oldSale.notes,
        // Include other fields that matter
      },
      {
        status: updatedSale.status,
        totalAmount: updatedSale.totalAmount.toString(),
        notes: updatedSale.notes,
      },
      context,
      {
        entityName: oldSale.saleNumber,
        module: "sales",
        duration,
      },
    );

    reqLogger.info("Sale updated successfully", {
      module: "sales",
      duration,
      metadata: { saleId, saleNumber: oldSale.saleNumber },
    });

    return NextResponse.json({ sale: updatedSale });
  } catch (error) {
    reqLogger.error("Failed to update sale", error, { module: "sales" });
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 },
    );
  }
}

/**
 * Example: Approve Sale with Audit Logging
 */
export async function PATCH_approve_example(request: NextRequest) {
  let context: RequestContext | null = null;
  let reqLogger = logger;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    context = createContext(request, {
      user: session.user as { id: string; email: string; name: string },
    });
    reqLogger = logger.child(context);

    const { saleId } = await request.json();

    // Get sale before approval
    const oldSale = await prisma.sale.findUnique({
      where: { id: saleId },
    });

    if (!oldSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (oldSale.status !== "PENDING_APPROVAL") {
      reqLogger.warn("Cannot approve non-pending sale", {
        module: "sales",
        metadata: { saleId, currentStatus: oldSale.status },
      });
      return NextResponse.json(
        { error: "Sale is not pending" },
        { status: 400 },
      );
    }

    reqLogger.info("Approving sale", {
      module: "sales",
      metadata: { saleId, saleNumber: oldSale.saleNumber },
    });

    // Approve sale
    const approvedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    // Log APPROVE action
    await auditLogger.logApprove(
      "Sale",
      saleId,
      { status: oldSale.status },
      { status: approvedSale.status, approvedById: session.user.id },
      context,
      {
        entityName: oldSale.saleNumber,
        module: "sales",
      },
    );

    reqLogger.info("Sale approved successfully", {
      module: "sales",
      metadata: { saleId, saleNumber: oldSale.saleNumber },
    });

    return NextResponse.json({ sale: approvedSale });
  } catch (error) {
    reqLogger.error("Failed to approve sale", error, { module: "sales" });
    return NextResponse.json(
      { error: "Failed to approve sale" },
      { status: 500 },
    );
  }
}

/**
 * Example: Delete Sale with Audit Logging
 */
export async function DELETE_example(request: NextRequest) {
  let context: RequestContext | null = null;
  let reqLogger = logger;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    context = createContext(request, {
      user: session.user as { id: string; email: string; name: string },
    });
    reqLogger = logger.child(context);

    const { saleId } = await request.json();

    // Get sale before deletion
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: { select: { name: true } },
        items: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    reqLogger.info("Deleting sale (soft delete)", {
      module: "sales",
      metadata: { saleId, saleNumber: sale.saleNumber },
    });

    // Soft delete
    await prisma.sale.update({
      where: { id: saleId },
      data: { deletedAt: new Date() },
    });

    // Log DELETE action
    await auditLogger.logDelete(
      "Sale",
      saleId,
      {
        saleNumber: sale.saleNumber,
        customerId: sale.customerId,
        customerName: sale.customer.name,
        status: sale.status,
        totalAmount: sale.totalAmount.toString(),
        itemCount: sale.items.length,
      },
      context,
      {
        entityName: sale.saleNumber,
        module: "sales",
      },
    );

    reqLogger.info("Sale deleted successfully", {
      module: "sales",
      metadata: { saleId, saleNumber: sale.saleNumber },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    reqLogger.error("Failed to delete sale", error, { module: "sales" });
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 },
    );
  }
}
