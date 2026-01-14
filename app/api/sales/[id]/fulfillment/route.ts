import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/src/infrastructure/database";
import { SaleStatus } from "@prisma/client";
import {
  confirmStockDeduction,
  revertStockDeduction,
  releaseStock,
} from "@/src/core/stock";

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
      // Validate: CANCELLED requires notes
      if (status === "CANCELLED" && (!notes || !notes.trim())) {
        return NextResponse.json(
          { error: "กรุณาระบุหมายเหตุเมื่อยกเลิกรายการขาย" },
          { status: 400 }
        );
      }

      updateData.status = status;
      // If switching to PAID and no payment date, maybe set it?
      if (status === "PAID" && !sale.paymentDate && !paymentDate) {
        // Only auto-set if not provided explicitly
        updateData.paymentDate = new Date();
      }
    }

    // 2. Delivery Date - with update count tracking
    let shouldMarkOverdue = false; // Flag to mark as OVERDUE if exceeds max updates

    if (deliveryDate !== undefined) {
      const newDate = deliveryDate ? new Date(deliveryDate) : null;
      const oldDate = sale.deliveryDate;
      const isAddingDate = !oldDate && newDate;
      const isChangingDate =
        oldDate && newDate && oldDate.getTime() !== newDate.getTime();

      // Check if delivery is locked
      if ((isAddingDate || isChangingDate) && sale.isDeliveryLocked) {
        return NextResponse.json(
          { error: "ใบคำสั่งซื้อนี้ถูกล็อคการแก้ไขวันที่จัดส่งแล้ว" },
          { status: 400 }
        );
      }

      // Increment update count only when changing existing date (not first time setting)
      if (isChangingDate) {
        const maxUpdates = sale.maxDeliveryUpdates ?? 3;
        const newCount = sale.deliveryUpdateCount + 1;

        if (newCount > maxUpdates) {
          // Exceeds max updates → Mark as OVERDUE immediately
          shouldMarkOverdue = true;
          updateData.status = "OVERDUE";
          updateData.isDeliveryLocked = true;
          updateData.deliveryUpdateCount = newCount;
          updateData.lastDeliveryUpdate = new Date();
          // Don't update delivery date - keep it as is
        } else {
          updateData.deliveryUpdateCount = newCount;
          updateData.lastDeliveryUpdate = new Date();
          updateData.deliveryDate = newDate;
        }
      } else if (isAddingDate) {
        // First time setting delivery date
        updateData.lastDeliveryUpdate = new Date();
        updateData.deliveryDate = newDate;
      } else {
        updateData.deliveryDate = newDate;
      }
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
      // Custom notes for OVERDUE status
      const historyNotes =
        updateData.status === "OVERDUE"
          ? `ใบคำสั่งซื้อถูกปิดการแก้ไขเนื่องจากอัปเดตวันที่จัดส่งเกิน ${
              sale.maxDeliveryUpdates ?? 3
            } ครั้ง`
          : "Updated from fulfillment management";

      updateData.statusHistory = {
        create: {
          status: updateData.status,
          notes: historyNotes,
          changedById: session.user.id,
        },
      };
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      // Handle CANCELLED or OVERDUE status: Release stock and restore credit limit
      const shouldReleaseResources =
        (status === "CANCELLED" && sale.status !== "CANCELLED") ||
        (shouldMarkOverdue && sale.status !== "OVERDUE");

      if (shouldReleaseResources) {
        // 1. Release stock (return to available)
        await releaseStock(id, tx);

        // 2. Restore credit limit (for non-PREPAID and not yet paid)
        if (sale.paymentTerm !== "PREPAID" && !sale.paymentDate) {
          const creditLimit = await tx.creditLimit.findFirst({
            where: {
              customerId: sale.customerId,
              status: "ACTIVE",
              deletedAt: null,
            },
          });

          if (creditLimit) {
            await tx.creditLimit.update({
              where: { id: creditLimit.id },
              data: {
                usedAmount: { decrement: sale.totalAmount },
                availableAmount: { increment: sale.totalAmount },
              },
            });
          }
        }
      }

      // Handle stock status transition based on delivery date change
      if (deliveryDate !== undefined && status !== "CANCELLED") {
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

      // Handle Credit Limit restoration on Payment (for non-PREPAID)
      if (
        paymentDate !== undefined &&
        sale.paymentTerm !== "PREPAID" &&
        status !== "CANCELLED"
      ) {
        const newPaymentDate = paymentDate ? new Date(paymentDate) : null;
        const oldPaymentDate = sale.paymentDate;

        const isPaying = !oldPaymentDate && newPaymentDate;
        const isUnpaying = oldPaymentDate && !newPaymentDate;

        if (isPaying || isUnpaying) {
          // Find active credit limit
          const creditLimit = await tx.creditLimit.findFirst({
            where: {
              customerId: sale.customerId,
              status: "ACTIVE",
              deletedAt: null,
            },
          });

          if (creditLimit) {
            if (isPaying) {
              // Return credit: decrease used, increase available
              await tx.creditLimit.update({
                where: { id: creditLimit.id },
                data: {
                  usedAmount: { decrement: sale.totalAmount },
                  availableAmount: { increment: sale.totalAmount },
                },
              });
            } else if (isUnpaying) {
              // Re-deduct credit: increase used, decrease available
              // Note: This assumes they still have enough credit, but since we are reverting a payment,
              // we are just putting it back to "Owing" state.
              await tx.creditLimit.update({
                where: { id: creditLimit.id },
                data: {
                  usedAmount: { increment: sale.totalAmount },
                  availableAmount: { decrement: sale.totalAmount },
                },
              });
            }
          }
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

      // If status is COMPLETED, sync the sales summary for this date
      if (updatedSale.status === "COMPLETED") {
        const { syncSalesSummary } = await import(
          "@/lib/sales-summary-service"
        );
        // Run in background (fire and forget) to avoid delaying response
        syncSalesSummary(updatedSale.saleDate).catch((err) =>
          console.error("Error syncing sales summary:", err)
        );
      }
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
