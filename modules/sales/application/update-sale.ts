/**
 * Update Sale Use Case
 *
 * Orchestrates validation, permission checks, credit/stock reversal,
 * recalculation, and persistence for updating an existing sale.
 */

import type { SaleFormData } from "@/types/sales";
import {
  findSaleById,
  findProductsByIds,
  updateSale,
} from "../infrastructure/sale.repository";
import { db } from "@/src/infrastructure/database";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getPackMultiplier(packageSizePerBox?: string | null): number {
  const packSize = parseFloat(packageSizePerBox || "1");
  return isNaN(packSize) || packSize <= 0 ? 1 : packSize;
}

// ─────────────────────────────────────────────
// Use Case
// ─────────────────────────────────────────────

export async function updateSaleUseCase(
  id: string,
  body: SaleFormData,
  userId: string,
) {
  // 1. Check if sale exists
  const existingSale = await db.sale.findUnique({
    where: { id, deletedAt: null },
    include: { customer: true },
  });

  if (!existingSale) {
    return { success: false as const, error: "Sale not found" };
  }

  // 2. Permission check for rejected/waiting sales
  if (
    existingSale.status === "REJECTED" ||
    existingSale.status === "WAITING_FOR_CORRECTION"
  ) {
    const isCreator = userId === existingSale.createdById;
    if (!isCreator) {
      return {
        success: false as const,
        error:
          "Only the creator or admin can edit rejected or waiting for correction sales",
      };
    }
  }

  // 3. Check delivery date updates
  let newDeliveryUpdateCount = existingSale.deliveryUpdateCount;
  if (
    body.deliveryDate &&
    (!existingSale.deliveryDate ||
      new Date(body.deliveryDate).getTime() !==
        existingSale.deliveryDate.getTime())
  ) {
    if (existingSale.deliveryUpdateCount >= 3) {
      return {
        success: false as const,
        error: "Maximum number of delivery date updates exceeded (3 times).",
      };
    }
    newDeliveryUpdateCount++;
  }

  // 4. fetch products for calculation
  const productIds = body.items.map((item) => item.productId);
  const products = await findProductsByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 5. Determine if re-approval needed
  const needsReapproval =
    existingSale.status === "APPROVED" ||
    existingSale.status === "AWAITING_PAYMENT" ||
    existingSale.status === "AWAITING_DELIVERY" ||
    existingSale.status === "REJECTED" ||
    existingSale.status === "WAITING_FOR_CORRECTION";

  // 6. Calculate totals
  const subtotal = body.items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    const multiplier = getPackMultiplier(product?.packageSizePerBox);
    return sum + item.quantity * item.unitPrice * multiplier;
  }, 0);
  const total = subtotal - body.shippingCost - body.otherCosts;

  // 7. Persist
  const sale = await updateSale(id, {
    existingSale,
    customerId: body.customerId,
    employeeId: body.employeeId,
    paymentTerm: body.paymentTerm,
    creditDays: body.creditDays,
    creditDueDate: body.creditDueDate ? new Date(body.creditDueDate) : null,
    usePromotionalCredit: body.usePromotionalCredit,
    promotionalCreditUsed: body.promotionalCreditUsed,
    deliveryMethod: body.deliveryMethod,
    pickupCompanyId: body.pickupCompanyId,
    shippingCompanyId: body.shippingCompanyId,
    saleDate: new Date(body.saleDate),
    requestedDeliveryDate: body.requestedDeliveryDate
      ? new Date(body.requestedDeliveryDate)
      : null,
    deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
    deliveryUpdateCount: newDeliveryUpdateCount,
    billingAddress: body.billingAddress,
    shippingAddress: body.shippingAddress,
    useCustomShipping: body.useCustomShipping,
    selectedAddressId: body.selectedAddressId,
    subtotalAmount: subtotal,
    shippingCost: body.shippingCost,
    otherCosts: body.otherCosts,
    otherCostsDescription: body.otherCostsDescription,
    totalAmount: total,
    notes: body.notes,
    userId,
    needsReapproval,
    items: body.items.map((item) => {
      const product = productMap.get(item.productId);
      const multiplier = getPackMultiplier(product?.packageSizePerBox);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        originalPrice: item.originalPrice,
        priceModified: item.priceModified,
        totalPrice: item.quantity * item.unitPrice * multiplier,
      };
    }),
  });

  return { success: true as const, sale, existingSale };
}
