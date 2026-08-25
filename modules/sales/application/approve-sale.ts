/**
 * Application Layer – Approve/Reject Sale Use Cases
 *
 * Business logic for approving and rejecting a sale.
 * Handles stock reservation and credit limit deduction on approval.
 */

import { db } from "@/lib/db";
import { upsertProductStock } from "@/modules/products/infrastructure/stock.repository";
import type { SaleDetailResponse } from "../types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function serializeSaleDetail(sale: any): any {
  if (sale === null || sale === undefined) return sale;
  if (typeof sale !== "object") return sale;
  if (sale instanceof Date) return sale;
  if (
    typeof sale.toNumber === "function" &&
    typeof sale.toFixed === "function" &&
    "d" in sale
  ) {
    return sale.toNumber();
  }
  if (Array.isArray(sale)) return sale.map(serializeSaleDetail);
  const result: any = {};
  for (const [key, value] of Object.entries(sale)) {
    result[key] = serializeSaleDetail(value);
  }
  return result;
}

/**
 * Build the SaleDetailResponse payload used by the approve page.
 * Calculates price warnings, stock warnings, and credit info.
 */
export async function getSaleDetailForApproval(
  id: string,
): Promise<SaleDetailResponse | null> {
  const sale = await db.sale.findUnique({
    where: { id, deletedAt: null },
    include: {
      customer: {
        include: {
          creditLimits: {
            where: {
              status: "ACTIVE",
              OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      employee: true,
      createdBy: true,
      approvedBy: true,
      saleAddress: true,
      budgetDetails: true,
      items: {
        include: {
          product: {
            include: {
              stock: true,
              freeItems: true,
              promotionItems: true,
            },
          },
        },
      },
    },
  });

  if (!sale) return null;

  // Price warnings
  const priceWarnings = sale.items
    .filter((item) => item.priceModified)
    .map((item) => {
      const original = Number(item.originalPrice ?? 0);
      const modified = Number(item.unitPrice ?? 0);
      const difference = modified - original;
      const percentageDiff = original ? (difference / original) * 100 : 0;
      return {
        productId: item.productId,
        productName: item.product.name,
        originalPrice: original,
        modifiedPrice: modified,
        difference,
        percentageDiff,
      };
    });

  // Stock warnings
  const stockWarnings = sale.items
    .filter((item) => {
      const available = Number(item.product.stock?.availableQuantity ?? 0);
      return available < Number(item.quantity ?? 0);
    })
    .map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      productCode: item.product.productCode,
      requested: Number(item.quantity),
      available: Number(item.product.stock?.availableQuantity ?? 0),
      reserved: Number(item.product.stock?.reservedQuantity ?? 0),
    }));

  // Credit info
  const creditLimit = sale.customer.creditLimits?.[0];
  const creditLimitAmount = Number(creditLimit?.limitAmount ?? 0);
  const usedCredit = Number(creditLimit?.usedAmount ?? 0);
  let availableCredit = Number(creditLimit?.availableAmount ?? 0);
  const currentSaleAmount = Number(sale.totalAmount ?? 0);

  // Include active temporary credit
  const tempAmount = Number(creditLimit?.temporaryCreditAmount || 0);
  if (tempAmount > 0) {
    const tempExpiryDate = creditLimit?.temporaryCreditExpiryDate;
    if (!tempExpiryDate) {
      availableCredit += tempAmount; // No expiry, assume valid
    } else {
      const tempExpiry = new Date(tempExpiryDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Include the current day

      if (tempExpiry >= now) {
        availableCredit += tempAmount;
      }
    }
  }

  const willExceedLimit =
    sale.paymentTerm !== "PREPAID" &&
    creditLimitAmount > 0 &&
    currentSaleAmount > availableCredit;

  const creditInfo = {
    creditLimit: creditLimitAmount,
    usedCredit,
    availableCredit,
    currentSaleAmount,
    willExceedLimit,
  };

  return serializeSaleDetail({
    sale,
    priceWarnings,
    stockWarnings,
    creditInfo,
  }) as SaleDetailResponse;
}

// ─────────────────────────────────────────────
// Use Cases
// ─────────────────────────────────────────────

/**
 * Use case: Approve a sale.
 * - Reserves stock for each item
 * - Deducts credit limit for non-PREPAID payment terms
 * - Updates sale status to APPROVED
 */
export async function approveSaleUseCase(
  id: string,
  userId: string,
  notes?: string,
) {
  return db.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!sale) throw new Error("Sale not found");
    if (sale.status !== "PENDING_APPROVAL")
      throw new Error("Sale is not pending approval");

    // Reserve stock for each item
    for (const item of sale.items) {
      const qty = Number(item.quantity);
      if (qty > 0) {
        await upsertProductStock(
          item.productId,
          {
            reservedQuantityIncrement: qty,
            availableQuantityIncrement: -qty,
          },
          tx,
        );
      }
    }

    // Deduct credit limit (non-PREPAID)
    if (sale.paymentTerm !== "PREPAID") {
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
            usedAmount: { increment: sale.totalAmount },
            availableAmount: { decrement: sale.totalAmount },
          },
        });
      }
    }

    // Handle promotional credit usage
    if (sale.promotionalCreditUsed && Number(sale.promotionalCreditUsed) > 0) {
      const year = sale.saleDate.getFullYear();
      const promoBudget = await tx.promotionalBudget.findFirst({
        where: {
          customerId: sale.customerId,
          year,
          deletedAt: null,
        },
      });

      if (promoBudget) {
        await tx.promotionalBudget.update({
          where: { id: promoBudget.id },
          data: {
            salesPromotionUsed: { increment: sale.promotionalCreditUsed },
          },
        });

        // Create budget detail for the usage
        await tx.promotionalBudgetDetail.create({
          data: {
            budgetId: promoBudget.id,
            type: "SALES_PROMOTION",
            usedAmount: sale.promotionalCreditUsed,
            description: `ใช้ในรายการขาย ${sale.saleNumber}`,
            saleId: sale.id,
          },
        });
      }
    }

    // Fetch approver's employee signature
    const approverEmployee = await tx.employee.findUnique({
      where: { userId },
      select: { signature: true },
    });

    // Update sale status
    const updated = await tx.sale.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: userId,
        approverNotes: notes || undefined,
        approvedBySignatureDate: new Date(),
        approvedBySignatureImage: approverEmployee?.signature || null,
        statusHistory: {
          create: {
            status: "APPROVED",
            notes: notes || "Approved",
            changedById: userId,
          },
        },
      },
    });

    return { success: true as const, sale: updated, existingSale: sale };
  });
}

/**
 * Use case: Reject a sale.
 * - Updates sale status to REJECTED
 */
export async function rejectSaleUseCase(
  id: string,
  userId: string,
  reason: string,
) {
  const sale = await db.sale.findUnique({
    where: { id, deletedAt: null },
  });

  if (!sale) throw new Error("Sale not found");
  if (sale.status !== "PENDING_APPROVAL")
    throw new Error("Sale is not pending approval");

  const updated = await db.sale.update({
    where: { id },
    data: {
      status: "REJECTED",
      approverNotes: reason,
      statusHistory: {
        create: {
          status: "REJECTED",
          notes: reason,
          changedById: userId,
        },
      },
    },
  });

  return { success: true as const, sale: updated, existingSale: sale };
}
