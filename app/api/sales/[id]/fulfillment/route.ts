import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { SaleStatus } from "@prisma/client";
import {
  confirmStockDeduction,
  revertStockDeduction,
} from "@/lib/stock-service";

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

    const { status, deliveryDate, creditDueDate, paymentDate, notes } =
      await request.json();

    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Status
    if (status && Object.values(SaleStatus).includes(status)) {
      updateData.status = status;
      // If switching to PAID and no payment date, maybe set it?
      if (status === "PAID" && !sale.paymentDate && !paymentDate) {
        // Only auto-set if not provided explicitly
        updateData.paymentDate = new Date();
      }
    }

    // 2. Delivery Date
    if (deliveryDate !== undefined) {
      updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    }

    // 3. Credit Due Date
    if (creditDueDate !== undefined) {
      updateData.creditDueDate = creditDueDate ? new Date(creditDueDate) : null;
    }

    // 4. Payment Date
    if (paymentDate !== undefined) {
      updateData.paymentDate = paymentDate ? new Date(paymentDate) : null;
    }

    // 5. Notes
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Add history if status changed
    if (updateData.status && updateData.status !== sale.status) {
      updateData.statusHistory = {
        create: {
          status: updateData.status,
          notes: "Updated from fulfillment management",
          changedById: session.user.id,
        },
      };
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      // Handle stock status transition based on delivery date change
      if (deliveryDate !== undefined) {
        const newDate = deliveryDate ? new Date(deliveryDate) : null;
        const oldDate = sale.deliveryDate;

        if (!oldDate && newDate) {
          // Transition: Reserved -> Real Deducted
          await confirmStockDeduction(id, tx);
        } else if (oldDate && !newDate) {
          // Transition: Real Deducted -> Reserved
          await revertStockDeduction(id, tx);
        }
      }

      return await tx.sale.update({
        where: { id },
        data: updateData,
      });
    });

    // Revalidate the sale detail page
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath(`/sales/${id}`);
    } catch (e) {
      console.error("Revalidate failed", e);
    }

    return NextResponse.json({ sale: updatedSale });
  } catch (error) {
    console.error("Error updating fulfillment:", error);
    return NextResponse.json(
      { error: "Failed to update fulfillment" },
      { status: 500 }
    );
  }
}
