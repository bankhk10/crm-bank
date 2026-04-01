import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db as prisma } from "@/lib/db";
import { SaleStatus } from "@/lib/db";
import {
  confirmStockDeductionUseCase as confirmStockDeduction,
  confirmStockDeductionWithLotsUseCase as confirmStockDeductionWithLots,
  revertStockDeductionFromLotsUseCase as revertStockDeductionFromLots,
  releaseStockUseCase as releaseStock,
} from "@/modules/products/application";
import { finalizePointsForSaleUseCase as finalizePointsForSale } from "@/modules/points";
import type { LotAllocation } from "@/modules/products/types/stock";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      status,
      deliveryDate,
      creditDueDate,
      paymentDate,
      notes,
      lotAllocations,
      shippingCompanyId,
      saleOrderRef,
    } = (await request.json()) as {
      status?: string;
      deliveryDate?: string | null;
      creditDueDate?: string | null;
      paymentDate?: string | null;
      notes?: string;
      lotAllocations?: LotAllocation[];
      shippingCompanyId?: string | null;
      saleOrderRef?: string | null;
    };

    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Status
    if (status && Object.values(SaleStatus).includes(status as SaleStatus)) {
      // Validate: CANCELLED requires notes
      if (status === "CANCELLED" && (!notes || !notes.trim())) {
        return NextResponse.json(
          { error: "กรุณาระบุหมายเหตุเมื่อยกเลิกรายการขาย" },
          { status: 400 },
        );
      }

      updateData.status = status;
      // If switching to PAID and no payment date, maybe set it?
      if (status === "PAID" && !sale.paymentDate && !paymentDate) {
        // Only auto-set if not provided explicitly
        updateData.paymentDate = new Date();
      }

      // Validate: DELIVERED or DELIVERY_COMPLETED requires delivery date
      if (status === "DELIVERED" || status === "DELIVERY_COMPLETED") {
        const finalDeliveryDate =
          deliveryDate !== undefined ? deliveryDate : sale.deliveryDate;
        if (!finalDeliveryDate) {
          return NextResponse.json(
            {
              error: `กรุณาระบุวันที่จัดส่งสินค้าเมื่อสถานะเป็น '${
                status === "DELIVERED" ? "ระหว่างขนส่ง" : "ส่งเสร็จแล้ว"
              }'`,
            },
            { status: 400 },
          );
        }
      }
    }

    // Protect against modifying LOTs if already delivered
    // If the *current* status is DELIVERED (or later), we should not allow modifying LOTs
    // unless we are also changing the status back to a non-delivered state.
    const isCurrentlyDelivered = [
      "DELIVERED",
      "DELIVERY_COMPLETED",
      "COMPLETED",
    ].includes(sale.status);

    // Check if we are staying in a delivered state
    const targetStatus = status || sale.status;
    const isStayingDelivered = [
      "DELIVERED",
      "DELIVERY_COMPLETED",
      "COMPLETED",
    ].includes(targetStatus);

    if (
      isCurrentlyDelivered &&
      isStayingDelivered &&
      lotAllocations !== undefined
    ) {
      return NextResponse.json(
        {
          error:
            "ไม่สามารถแก้ไข LOT สินค้าได้หลังจากสถานะเป็น 'ระหว่างขนส่ง' หรือ 'เสร็จสิ้น'",
        },
        { status: 400 },
      );
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
          { error: "ใบคำสั่งซื้อนี้ถูกล็อคการแก้ไขวันที่ระหว่างขนส่ง" },
          { status: 400 },
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

    // 6. Shipping Company
    if (shippingCompanyId !== undefined) {
      updateData.shippingCompanyId = shippingCompanyId || null;
    }

    // 7. Sale Order Reference
    if (saleOrderRef !== undefined) {
      updateData.saleOrderRef = saleOrderRef || null;
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
          // FIRST TIME setting delivery date - create stock deduction
          if (lotAllocations && lotAllocations.length > 0) {
            await confirmStockDeductionWithLots(id, lotAllocations, tx);
          } else {
            await confirmStockDeduction(id, tx);
          }
        } else if (oldDate && !newDate) {
          // Removing delivery date - revert stock
          await revertStockDeductionFromLots(id, tx);
        } else if (
          oldDate &&
          newDate &&
          lotAllocations &&
          lotAllocations.length > 0
        ) {
          // Delivery date already exists AND LOT allocations provided
          // This means user wants to UPDATE LOT allocations
          // Revert existing allocations first, then apply new ones
          await revertStockDeductionFromLots(id, tx);
          await confirmStockDeductionWithLots(id, lotAllocations, tx);
        }
      } else if (
        lotAllocations &&
        lotAllocations.length > 0 &&
        sale.deliveryDate &&
        status !== "CANCELLED"
      ) {
        // LOT allocations provided but deliveryDate not being changed
        // This means user is only updating LOT allocations
        await revertStockDeductionFromLots(id, tx);
        await confirmStockDeductionWithLots(id, lotAllocations, tx);
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

    const shouldFinalizePoints =
      updatedSale.status !== sale.status &&
      ["COMPLETED", "DELIVERY_COMPLETED"].includes(updatedSale.status);

    if (shouldFinalizePoints) {
      try {
        await finalizePointsForSale(updatedSale.id);
      } catch (error) {
        console.error("Error finalizing sale points:", error);
      }
    }

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
      { status: 500 },
    );
  }
}

