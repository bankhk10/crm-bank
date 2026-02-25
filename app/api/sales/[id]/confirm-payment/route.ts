import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import type { PaymentConfirmationData } from "@/modules/sales/types";

// POST /api/sales/[id]/confirm-payment - Confirm payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PaymentConfirmationData = await request.json();

    if (!body.paymentDate) {
      return NextResponse.json(
        { error: "Payment date is required" },
        { status: 400 }
      );
    }

    const sale = await prisma.sale.findUnique({
      where: { id, deletedAt: null },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (sale.status !== "AWAITING_PAYMENT") {
      return NextResponse.json(
        { error: "Sale is not awaiting payment" },
        { status: 400 }
      );
    }

    // Determine next status
    let nextStatus: "PAID" | "AWAITING_DELIVERY" | "DELIVERED";
    if (body.deliveryDate) {
      nextStatus = "DELIVERED";
    } else {
      nextStatus = "AWAITING_DELIVERY";
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        status: nextStatus,
        paymentDate: new Date(body.paymentDate),
        paymentNotes: body.paymentNotes,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : sale.deliveryDate,
        deliveryNotes: body.deliveryNotes || sale.deliveryNotes,
        statusHistory: {
          create: {
            status: nextStatus,
            notes: `Payment confirmed${body.deliveryDate ? " and delivery date set" : ""}`,
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
              },
            },
          },
        },
      },
    });

    // TODO: Handle stock deduction based on delivery date
    // If deliveryDate is set, deduct from stock
    // If not set, reserve stock

    return NextResponse.json({ sale: updatedSale });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
