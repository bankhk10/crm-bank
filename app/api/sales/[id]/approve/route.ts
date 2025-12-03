import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

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

    // Determine next status based on payment term
    let nextStatus: "AWAITING_PAYMENT" | "AWAITING_DELIVERY";
    if (sale.paymentTerm === "PREPAID") {
      nextStatus = "AWAITING_PAYMENT";
    } else {
      nextStatus = "AWAITING_DELIVERY";
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        status: nextStatus,
        approvedById: session.user.id,
        approvedAt: new Date(),
        statusHistory: {
          create: {
            status: nextStatus,
            notes: notes || "Sale approved",
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
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send notification to sale creator
    // TODO: Handle stock reservation based on payment term and delivery date

    return NextResponse.json({ sale: updatedSale });
  } catch (error) {
    console.error("Error approving sale:", error);
    return NextResponse.json(
      { error: "Failed to approve sale" },
      { status: 500 }
    );
  }
}
