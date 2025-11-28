import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

// POST /api/sales/[id]/reject - Reject sale
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user has approval permission

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id, deletedAt: null },
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
      where: { id: params.id },
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
