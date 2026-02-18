import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createApiContext, createApiLogger, logApprove } from "@/lib/logger";
import { sendNotification } from "@/src/core/notifications";
import { approveSaleWorkflow } from "@/src/workflows/sales/approve-sale.workflow";

// POST /api/sales/[id]/approve - Approve sale
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
    const { notes } = body;

    const { previousSale: sale, updatedSale } = await approveSaleWorkflow({
      saleId: id,
      approvedById: session.user.id,
      notes,
    });

    // Send notification to sale creator
    await sendNotification({
      userId: updatedSale.sale.createdById,
      title: "Sale Approved",
      message: `Sale Order ${updatedSale.sale.saleNumber} has been approved.`,
      type: "APPROVED",
      link: `/sales/${id}`,
    });

    // Log audit event (APPROVE)
    const context = createApiContext(request, session.user);
    const reqLogger = createApiLogger(context);
    await logApprove(
      "Sale",
      id,
      { status: sale.status, saleNumber: sale.saleNumber },
      {
        status: updatedSale.sale.status,
        approvedById: updatedSale.sale.approvedById,
        saleNumber: updatedSale.sale.saleNumber,
      },
      context,
      {
        entityName: sale.saleNumber,
        module: "sales",
      }
    );

    reqLogger.info("Sale approved successfully", {
      module: "sales",
      metadata: {
        saleId: id,
        saleNumber: sale.saleNumber,
        newStatus: updatedSale.sale.status,
        hasBackorders: updatedSale.stockResult.backorders.length > 0,
      },
    });

    return NextResponse.json({
      sale: updatedSale.sale,
      backorders: updatedSale.stockResult.backorders,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Sale not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Error &&
      error.message === "Sale is not pending approval"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Failed to approve sale";
    console.error("Error approving sale:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
