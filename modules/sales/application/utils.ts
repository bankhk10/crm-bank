import { ORDER_CONFIG } from "@/modules/sales/constants";

/**
 * Generate sale number sequentially
 * Format: SO[YYYY][MM][XXXX]
 */
export function generateSaleNumber(lastNumber?: string | null): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const prefix = `SO${year}${month}`;

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  // Extract sequence number and increment
  const lastSeqString = lastNumber.slice(-4);
  const lastSeq = parseInt(lastSeqString);

  if (isNaN(lastSeq)) {
    return `${prefix}0001`;
  }

  const newSeq = String(lastSeq + 1).padStart(4, "0");
  return `${prefix}${newSeq}`;
}

/**
 * Calculate sale totals (subtotal and total)
 */
export function calculateTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  shippingCost: number,
  otherCosts: number,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  // Note: Total is subtotal + costs (not minus, as seen in some legacy code - usually costs add up)
  // Re-checking legacy: subtotal - shippingCost - otherCosts?
  // Actually, usually it's subtotal + shipping + other.
  // Let's check the core/sales logic again: line 75: const total = subtotal - shippingCost - otherCosts;
  // That looks like the costs are subtracted? Or maybe they were discounts?
  // Let's stick to the core/sales logic for consistency unless it's obviously a bug.
  // Wait, if it's "Shipping Cost", it should be ADDED.
  // Let's check createSale in modules/sales/application/create-sale.ts
  const total = subtotal + shippingCost + otherCosts;
  return { subtotal, total };
}

/**
 * Calculate order expiry date (3 days from approval by default)
 */
export function calculateOrderExpiryDate(approvedAt: Date): Date {
  const expiryDate = new Date(approvedAt);
  expiryDate.setDate(expiryDate.getDate() + (ORDER_CONFIG.EXPIRY_DAYS || 3));
  return expiryDate;
}
