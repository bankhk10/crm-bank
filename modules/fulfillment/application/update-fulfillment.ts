import { db, Prisma, SaleStatus } from "@/lib/db";
import { FulfillmentRepository } from "../infrastructure/fulfillment.repository";
import { updateFulfillmentSchema } from "./validations";
import {
  confirmStockDeductionUseCase as confirmStockDeduction,
  confirmStockDeductionWithLotsUseCase as confirmStockDeductionWithLots,
  releaseStockUseCase as releaseStock,
  revertStockDeductionFromLotsUseCase as revertStockDeductionFromLots,
} from "@/modules/products/application";
import { finalizePointsForSaleUseCase as finalizePointsForSale } from "@/modules/points";
import { finalizePromotionalBudgetForSaleUseCase as finalizePromotionalBudgetForSale } from "@/modules/credit-limits/application";

export async function updateFulfillmentUseCase(
  id: string,
  userId: string,
  input: unknown,
) {
  const validatedData = updateFulfillmentSchema.parse(input);

  // Fetch the existing sale to perform additional validations
  const sale = await FulfillmentRepository.getSaleById(id);
  if (!sale) {
    throw new Error("Sale not found");
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
    hasPartialDelivery,
  } = validatedData;

  const updateData: Prisma.SaleUpdateInput = {};

  // 1. Status
  if (status) {
    updateData.status = status;
    if (status === "PAID" && !sale.paymentDate && !paymentDate) {
      updateData.paymentDate = new Date();
    }
  }

  const targetStatus = status || sale.status;

  if (sale.isStockDeducted && lotAllocations !== undefined) {
    throw new Error(
      "ไม่สามารถแก้ไข LOT สินค้าได้หลังจากระบบทำการตัดสต็อกไปแล้ว",
    );
  }

  // 2. Delivery Date - with update count tracking
  let shouldMarkOverdue = false;

  if (deliveryDate !== undefined) {
    const newDate = deliveryDate ? new Date(deliveryDate) : null;
    const oldDate = sale.deliveryDate;
    const isAddingDate = !oldDate && newDate;
    const isChangingDate =
      oldDate && newDate && oldDate.getTime() !== newDate.getTime();

    // Check if delivery is locked
    if ((isAddingDate || isChangingDate) && sale.isDeliveryLocked) {
      throw new Error("ใบคำสั่งซื้อนี้ถูกล็อคการแก้ไขวันที่ระหว่างขนส่ง");
    }

    // Increment update count only when changing existing date (not first time setting)
    if (isChangingDate) {
      const maxUpdates = sale.maxDeliveryUpdates ?? 3;
      const newCount = sale.deliveryUpdateCount + 1;

      if (newCount > maxUpdates) {
        shouldMarkOverdue = true;
        updateData.status = "OVERDUE";
        updateData.isDeliveryLocked = true;
        updateData.deliveryUpdateCount = newCount;
        updateData.lastDeliveryUpdate = new Date();
      } else {
        updateData.deliveryUpdateCount = newCount;
        updateData.lastDeliveryUpdate = new Date();
        updateData.deliveryDate = newDate;
      }
    } else if (isAddingDate) {
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
    if (shippingCompanyId) {
      updateData.shippingCompany = { connect: { id: shippingCompanyId } };
    } else {
      updateData.shippingCompany = { disconnect: true };
    }
  }

  // 7. Sale Order Reference
  if (saleOrderRef !== undefined) {
    updateData.saleOrderRef = saleOrderRef || null;
  }

  // 8. Partial Delivery Flag
  if (hasPartialDelivery !== undefined) {
    updateData.hasPartialDelivery = hasPartialDelivery;
  }

  // Add history if status changed
  if (updateData.status && updateData.status !== sale.status) {
    const historyNotes =
      updateData.status === "OVERDUE"
        ? `ใบคำสั่งซื้อถูกปิดการแก้ไขเนื่องจากอัปเดตวันที่จัดส่งเกิน ${sale.maxDeliveryUpdates ?? 3} ครั้ง`
        : "Updated from fulfillment management";

    updateData.statusHistory = {
      create: {
        status: updateData.status as SaleStatus,
        notes: historyNotes,
        changedById: userId,
      },
    };
  }

  const updatedSale = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    // Handle CANCELLED or OVERDUE status: Release stock and restore credit limit
    const shouldReleaseResources =
      (status === "CANCELLED" && sale.status !== "CANCELLED") ||
      (shouldMarkOverdue && sale.status !== "OVERDUE");

    if (shouldReleaseResources) {
      // 1. Release stock (return to available)
      await releaseStock(id, tx);
      updateData.isStockDeducted = false;

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

    if (!shouldReleaseResources) {
      const targetStatus = status || sale.status;
      const newDate =
        deliveryDate !== undefined
          ? deliveryDate
            ? new Date(deliveryDate)
            : null
          : sale.deliveryDate;

      const isDeductingState = (st: string, date: Date | null) =>
        ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"].includes(st) ||
        (st === "AWAITING_DELIVERY" && !!date);

      const oldWasDeducted = sale.isStockDeducted;
      const newShouldBeDeducted =
        isDeductingState(targetStatus as string, newDate) && targetStatus !== "CANCELLED";

      if (!oldWasDeducted && newShouldBeDeducted) {
        if (lotAllocations && lotAllocations.length > 0) {
          await confirmStockDeductionWithLots(id, lotAllocations, tx);
        } else {
          await confirmStockDeduction(id, tx);
        }
        updateData.isStockDeducted = true;
      } else if (oldWasDeducted && !newShouldBeDeducted) {
        await revertStockDeductionFromLots(id, tx);
        updateData.isStockDeducted = false;
      } else if (
        oldWasDeducted &&
        newShouldBeDeducted &&
        lotAllocations &&
        lotAllocations.length > 0
      ) {
        await revertStockDeductionFromLots(id, tx);
        await confirmStockDeductionWithLots(id, lotAllocations, tx);
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
        const creditLimit = await tx.creditLimit.findFirst({
          where: {
            customerId: sale.customerId,
            status: "ACTIVE",
            deletedAt: null,
          },
        });

        if (creditLimit) {
          if (isPaying) {
            await tx.creditLimit.update({
              where: { id: creditLimit.id },
              data: {
                usedAmount: { decrement: sale.totalAmount },
                availableAmount: { increment: sale.totalAmount },
              },
            });
          } else if (isUnpaying) {
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

    return await FulfillmentRepository.updateSale(id, updateData, tx);
  });

  const shouldFinalizePoints =
    updatedSale.status !== sale.status &&
    ["COMPLETED", "DELIVERY_COMPLETED"].includes(updatedSale.status);

  if (shouldFinalizePoints) {
    try {
      await finalizePointsForSale(updatedSale.id);
      await finalizePromotionalBudgetForSale(updatedSale.id);
    } catch (error) {
      console.error("Error finalizing sale points or budget:", error);
    }
  }

  return updatedSale;
}
