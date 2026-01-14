/**
 * Order Expiry Service
 * Handles order expiration and overdue logic
 */

import { db as prisma } from "@/src/infrastructure/database";
import { Prisma, SaleStatus } from "@prisma/client";
import { releaseStock } from "@/src/core/stock";
import { ORDER_CONFIG } from "@/src/shared/constants";
import type {
  OrderExpiryInfo,
  OrderCheckResult,
  DeliveryDateUpdateResult,
} from "./sales.types";
import { IMMUTABLE_STATUSES, isCreditPaymentTerm } from "./sales.types";

/**
 * Restores customer credit limit when an order is cancelled/expired/overdue
 */
async function restoreCreditLimit(
  saleId: string,
  tx: Prisma.TransactionClient
) {
  const sale = await tx.sale.findUnique({
    where: { id: saleId },
    include: { customer: { include: { creditLimits: true } } },
  });

  if (!sale) return;

  // Only restore credit for credit-based payment terms
  if (!isCreditPaymentTerm(sale.paymentTerm)) return;

  // Find active credit limit
  const activeCreditLimit = sale.customer.creditLimits.find(
    (cl) => cl.status === "ACTIVE"
  );

  if (activeCreditLimit) {
    const saleAmount = Number(sale.totalAmount);

    await tx.creditLimit.update({
      where: { id: activeCreditLimit.id },
      data: {
        usedAmount: { decrement: saleAmount },
        availableAmount: { increment: saleAmount },
      },
    });

    console.log(`Credit restored for sale ${saleId}: ${saleAmount}`);
  }
}

/**
 * Check and mark expired orders (approved but no delivery date after 3 days)
 * Should be called periodically via cron job
 */
export async function checkExpiredOrders(): Promise<OrderCheckResult> {
  const now = new Date();
  const errors: string[] = [];
  let processed = 0;

  try {
    const expiredSales = await prisma.sale.findMany({
      where: {
        status: SaleStatus.APPROVED,
        deliveryDate: null,
        orderExpiryDate: { lte: now },
        deletedAt: null,
      },
      select: {
        id: true,
        saleNumber: true,
      },
    });

    console.log(`Found ${expiredSales.length} expired orders`);

    for (const sale of expiredSales) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Release reserved stock
          await releaseStock(sale.id, tx);

          // 2. Restore credit limit
          await restoreCreditLimit(sale.id, tx);

          // 3. Update status to EXPIRED
          await tx.sale.update({
            where: { id: sale.id },
            data: {
              status: SaleStatus.EXPIRED,
              isDeliveryLocked: true,
            },
          });

          // 4. Record status history
          await tx.saleStatusHistory.create({
            data: {
              saleId: sale.id,
              status: SaleStatus.EXPIRED,
              notes:
                "ใบคำสั่งซื้อหมดอายุเนื่องจากไม่ได้ระบุวันที่จัดส่งภายใน 3 วัน",
              changedById: "SYSTEM",
            },
          });
        });

        processed++;
        console.log(`Order ${sale.saleNumber} marked as EXPIRED`);
      } catch (error) {
        const errorMsg = `Failed to expire order ${sale.saleNumber}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
  } catch (error) {
    console.error("Error checking expired orders:", error);
    errors.push(`System error: ${error}`);
  }

  return { processed, errors };
}

/**
 * Check and mark overdue orders (delivery date updated more than 3 times and past due)
 * Should be called periodically via cron job
 */
export async function checkOverdueOrders(): Promise<OrderCheckResult> {
  const now = new Date();
  const errors: string[] = [];
  let processed = 0;

  try {
    const overdueSales = await prisma.sale.findMany({
      where: {
        status: SaleStatus.AWAITING_DELIVERY,
        deliveryUpdateCount: { gte: ORDER_CONFIG.MAX_DELIVERY_UPDATES },
        deliveryDate: { lt: now },
        isDeliveryLocked: false,
        deletedAt: null,
      },
      select: {
        id: true,
        saleNumber: true,
        deliveryUpdateCount: true,
      },
    });

    console.log(`Found ${overdueSales.length} overdue orders`);

    for (const sale of overdueSales) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Release reserved stock back to available
          await releaseStock(sale.id, tx);

          // 2. Restore credit limit
          await restoreCreditLimit(sale.id, tx);

          // 3. Update status to OVERDUE and lock
          await tx.sale.update({
            where: { id: sale.id },
            data: {
              status: SaleStatus.OVERDUE,
              isDeliveryLocked: true,
            },
          });

          // 4. Record status history
          await tx.saleStatusHistory.create({
            data: {
              saleId: sale.id,
              status: SaleStatus.OVERDUE,
              notes: `ใบคำสั่งซื้อถูกปิดการแก้ไขเนื่องจากอัปเดตวันที่จัดส่ง ${sale.deliveryUpdateCount} ครั้งและยังไม่ได้จัดส่ง`,
              changedById: "SYSTEM",
            },
          });
        });

        processed++;
        console.log(`Order ${sale.saleNumber} marked as OVERDUE`);
      } catch (error) {
        const errorMsg = `Failed to mark order ${sale.saleNumber} as overdue: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
  } catch (error) {
    console.error("Error checking overdue orders:", error);
    errors.push(`System error: ${error}`);
  }

  return { processed, errors };
}

/**
 * Update delivery date for an order with validation
 */
export async function updateDeliveryDate(
  saleId: string,
  deliveryDate: Date,
  userId: string,
  notes?: string
): Promise<DeliveryDateUpdateResult> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
  });

  if (!sale) {
    return { success: false, error: "ไม่พบใบคำสั่งซื้อ" };
  }

  // Check if locked
  if (sale.isDeliveryLocked) {
    return { success: false, error: "ใบคำสั่งซื้อนี้ถูกล็อคการแก้ไขแล้ว" };
  }

  // Check if already delivered/completed/cancelled
  if (IMMUTABLE_STATUSES.includes(sale.status)) {
    return {
      success: false,
      error: "ไม่สามารถแก้ไขวันที่จัดส่งสำหรับสถานะนี้ได้",
    };
  }

  const isFirstDeliveryDate = !sale.deliveryDate;
  const newUpdateCount = sale.deliveryUpdateCount + 1;
  const maxUpdates =
    sale.maxDeliveryUpdates || ORDER_CONFIG.MAX_DELIVERY_UPDATES;

  try {
    await prisma.$transaction(async (tx) => {
      // Check if this update will exceed max updates
      if (newUpdateCount > maxUpdates && !isFirstDeliveryDate) {
        throw new Error(
          `ไม่สามารถอัปเดตวันที่จัดส่งได้อีก (ครบ ${maxUpdates} ครั้งแล้ว)`
        );
      }

      // Update sale
      await tx.sale.update({
        where: { id: saleId },
        data: {
          deliveryDate,
          deliveryUpdateCount: isFirstDeliveryDate ? 0 : newUpdateCount,
          lastDeliveryUpdate: new Date(),
          status: SaleStatus.AWAITING_DELIVERY,
        },
      });

      // Record status history if status changed
      if (sale.status !== SaleStatus.AWAITING_DELIVERY) {
        await tx.saleStatusHistory.create({
          data: {
            saleId,
            status: SaleStatus.AWAITING_DELIVERY,
            notes:
              notes ||
              (isFirstDeliveryDate
                ? "ระบุวันที่จัดส่งครั้งแรก"
                : `อัปเดตวันที่จัดส่งครั้งที่ ${newUpdateCount}`),
            changedById: userId,
          },
        });
      }
    });

    return {
      success: true,
      isFirstDeliveryDate,
      newUpdateCount: isFirstDeliveryDate ? 0 : newUpdateCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

/**
 * Calculate order expiry date (3 days from approval)
 */
export function calculateOrderExpiryDate(approvedAt: Date): Date {
  const expiryDate = new Date(approvedAt);
  expiryDate.setDate(expiryDate.getDate() + ORDER_CONFIG.EXPIRY_DAYS);
  return expiryDate;
}

/**
 * Get remaining time before order expires
 */
export function getOrderExpiryInfo(sale: {
  orderExpiryDate: Date | null;
  deliveryDate: Date | null;
  deliveryUpdateCount: number;
  maxDeliveryUpdates: number;
  isDeliveryLocked: boolean;
}): OrderExpiryInfo {
  const remainingUpdates = Math.max(
    0,
    (sale.maxDeliveryUpdates || ORDER_CONFIG.MAX_DELIVERY_UPDATES) -
      sale.deliveryUpdateCount
  );

  if (sale.isDeliveryLocked) {
    return {
      isLocked: true,
      expiresIn: null,
      remainingUpdates: 0,
      warningLevel: "critical",
    };
  }

  // If has delivery date, expiry doesn't apply
  if (sale.deliveryDate) {
    let warningLevel: "none" | "warning" | "critical" = "none";
    if (remainingUpdates <= 1) warningLevel = "critical";
    else if (remainingUpdates === 2) warningLevel = "warning";

    return {
      isLocked: false,
      expiresIn: null,
      remainingUpdates,
      warningLevel,
    };
  }

  // Calculate time until expiry
  const expiresIn = sale.orderExpiryDate
    ? sale.orderExpiryDate.getTime() - Date.now()
    : null;

  let warningLevel: "none" | "warning" | "critical" = "none";
  if (expiresIn !== null) {
    const hoursLeft = expiresIn / (1000 * 60 * 60);
    if (hoursLeft <= 12) warningLevel = "critical";
    else if (hoursLeft <= 24) warningLevel = "warning";
  }

  return {
    isLocked: false,
    expiresIn,
    remainingUpdates,
    warningLevel,
  };
}
