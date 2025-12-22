import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { SaleStatus } from "@prisma/client";

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

    const { status, deliveryDate, creditDueDate } = await request.json();

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
      if (status === "PAID" && !sale.paymentDate) {
        updateData.paymentDate = new Date();
      }
    }

    // 2. Delivery Date
    if (deliveryDate) {
      updateData.deliveryDate = new Date(deliveryDate);
    }

    // 3. Credit Due Date
    if (creditDueDate) {
      updateData.creditDueDate = new Date(creditDueDate);
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

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ sale: updatedSale });
  } catch (error) {
    console.error("Error updating fulfillment:", error);
    return NextResponse.json(
      { error: "Failed to update fulfillment" },
      { status: 500 }
    );
  }
}
