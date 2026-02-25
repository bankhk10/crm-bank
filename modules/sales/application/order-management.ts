import { db as prisma, Prisma } from "@/src/infrastructure/database";
import { releaseStockUseCase as releaseStock } from "@/modules/products/application";
import { ORDER_CONFIG } from "@/src/shared/constants";
import {
  OrderCheckResult,
  DeliveryDateUpdateResult,
  OrderExpiryInfo,
  IMMUTABLE_STATUSES,
  isCreditPaymentTerm,
} from "../types";

/**
 * Internal: Restores customer credit limit when an order is cancelled/expired/overdue
 */
async function restoreCreditLimit(
  saleId: string,
  tx: Prisma.TransactionClient,
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
    (cl) => cl.status === "ACTIVE",
  );

  if (activeCreditLimit) {
    // totalAmount is Decimal in Prisma
    const saleAmount = sale.totalAmount;

    await tx.creditLimit.update({
      where: { id: activeCreditLimit.id },
      data: {
        usedAmount: { decrement: saleAmount },
        availableAmount: { increment: saleAmount },
      },
    });
  }
}

/**
 * Check and mark expired orders (approved but no delivery date after 3 days)
 */
export async function checkExpiredOrdersUseCase(): Promise<OrderCheckResult> {
  const now = new Date();
  const errors: string[] = [];
  let processed = 0;

  try {
    const expiredSales = await prisma.sale.findMany({
      where: {
        status: "APPROVED",
        deliveryDate: null,
        orderExpiryDate: { lte: now },
        deletedAt: null,
      },
      select: {
        id: true,
        saleNumber: true,
      },
    });

    for (const sale of expiredSales) {
      try {
        await prisma.$transaction(async (tx) => {
          await releaseStock(sale.id, tx);
          await restoreCreditLimit(sale.id, tx);

          await tx.sale.update({
            where: { id: sale.id },
            data: {
              status: "EXPIRED",
              isDeliveryLocked: true,
            },
          });

          await tx.saleStatusHistory.create({
            data: {
              saleId: sale.id,
              status: "EXPIRED",
              notes:
                "ใบคำสั่งซื้อหมดอายุเนื่องจากไม่ได้ระบุวันที่จัดส่งภายในระยะเวลาที่กำหนด",
              changedById: "SYSTEM",
            },
          });
        });

        processed++;
      } catch (error) {
        errors.push(`Failed to expire order ${sale.saleNumber}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`System error: ${error}`);
  }

  return { processed, errors };
}

/**
 * Check and mark overdue orders
 */
export async function checkOverdueOrdersUseCase(): Promise<OrderCheckResult> {
  const now = new Date();
  const errors: string[] = [];
  let processed = 0;

  try {
    const overdueSales = await prisma.sale.findMany({
      where: {
        status: "AWAITING_DELIVERY",
        deliveryUpdateCount: { gte: ORDER_CONFIG.MAX_DELIVERY_UPDATES || 3 },
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

    for (const sale of overdueSales) {
      try {
        await prisma.$transaction(async (tx) => {
          await releaseStock(sale.id, tx);
          await restoreCreditLimit(sale.id, tx);

          await tx.sale.update({
            where: { id: sale.id },
            data: {
              status: "OVERDUE",
              isDeliveryLocked: true,
            },
          });

          await tx.saleStatusHistory.create({
            data: {
              saleId: sale.id,
              status: "OVERDUE",
              notes: `ใบคำสั่งซื้อถูกปิดการแก้ไขเนื่องจากอัปเดตวันที่จัดส่ง ${sale.deliveryUpdateCount} ครั้งและยังไม่ได้จัดส่งตามกำหนด`,
              changedById: "SYSTEM",
            },
          });
        });

        processed++;
      } catch (error) {
        errors.push(
          `Failed to mark order ${sale.saleNumber} as overdue: ${error}`,
        );
      }
    }
  } catch (error) {
    errors.push(`System error: ${error}`);
  }

  return { processed, errors };
}

/**
 * Update delivery date for an order with validation
 */
export async function updateDeliveryDateUseCase(
  saleId: string,
  deliveryDate: Date,
  userId: string,
  notes?: string,
): Promise<DeliveryDateUpdateResult> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
  });

  if (!sale) {
    return { success: false, error: "ไม่พบใบคำสั่งซื้อ" };
  }

  if (sale.isDeliveryLocked) {
    return { success: false, error: "ใบคำสั่งซื้อนี้ถูกล็อคการแก้ไขแล้ว" };
  }

  if (IMMUTABLE_STATUSES.includes(sale.status)) {
    return {
      success: false,
      error: "ไม่สามารถแก้ไขวันที่จัดส่งสำหรับสถานะนี้ได้",
    };
  }

  const isFirstDeliveryDate = !sale.deliveryDate;
  const newUpdateCount = sale.deliveryUpdateCount + 1;
  const maxUpdates =
    sale.maxDeliveryUpdates || ORDER_CONFIG.MAX_DELIVERY_UPDATES || 3;

  try {
    await prisma.$transaction(async (tx) => {
      if (newUpdateCount > maxUpdates && !isFirstDeliveryDate) {
        throw new Error(
          `ไม่สามารถอัปเดตวันที่จัดส่งได้อีก (ครง ${maxUpdates} ครั้งแล้ว)`,
        );
      }

      await tx.sale.update({
        where: { id: saleId },
        data: {
          deliveryDate,
          deliveryUpdateCount: isFirstDeliveryDate ? 0 : newUpdateCount,
          lastDeliveryUpdate: new Date(),
          status: "AWAITING_DELIVERY",
        },
      });

      if (sale.status !== "AWAITING_DELIVERY") {
        await tx.saleStatusHistory.create({
          data: {
            saleId,
            status: "AWAITING_DELIVERY",
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
 * Get remaining time before order expires
 */
export function getOrderExpiryInfoUseCase(sale: {
  orderExpiryDate: Date | null;
  deliveryDate: Date | null;
  deliveryUpdateCount: number;
  maxDeliveryUpdates: number;
  isDeliveryLocked: boolean;
}): OrderExpiryInfo {
  const maxUpdates =
    sale.maxDeliveryUpdates || ORDER_CONFIG.MAX_DELIVERY_UPDATES || 3;
  const remainingUpdates = Math.max(0, maxUpdates - sale.deliveryUpdateCount);

  if (sale.isDeliveryLocked) {
    return {
      isLocked: true,
      expiresIn: null,
      remainingUpdates: 0,
      warningLevel: "critical",
    };
  }

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
