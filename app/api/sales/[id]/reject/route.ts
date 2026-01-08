import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { createApiContext, createApiLogger, logReject } from "@/lib/logger";

// POST /api/sales/[id]/reject - Reject sale
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user has approval permission

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const sale = await prisma.sale.findUnique({
      where: { id, deletedAt: null },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (sale.status !== "PENDING") {
      return NextResponse.json(
        { error: "Sale is not pending approval" },
        { status: 400 }
      );
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        rejectedAt: new Date(),
        statusHistory: {
          create: {
            status: "REJECTED",
            notes: `Rejected: ${reason}`,
            changedById: session.user.id,
          },
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerCode: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit event (REJECT)
    const context = createApiContext(request, session.user);
    const reqLogger = createApiLogger(context);
    await logReject(
      "Sale",
      id,
      { status: sale.status, saleNumber: sale.saleNumber },
      {
        status: updatedSale.status,
        rejectionReason: reason,
        saleNumber: updatedSale.saleNumber,
      },
      context,
      {
        entityName: sale.saleNumber,
        module: "sales",
        errorMessage: reason,
      }
    );

    reqLogger.info("Sale rejected", {
      module: "sales",
      metadata: { saleId: id, saleNumber: sale.saleNumber, reason },
    });

    // TODO: Send notification to sale creator

    return NextResponse.json({ sale: updatedSale });
  } catch (error) {
    console.error("Error rejecting sale:", error);
    return NextResponse.json(
      { error: "Failed to reject sale" },
      { status: 500 }
    );
  }
}
