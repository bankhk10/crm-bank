/**
 * Domain Layer: Pure TypeScript Budget & Financial Math
 * 
 * Rules:
 * - NO imports of Prisma / @prisma/client
 * - NO database queries
 * - Client-safe, zero server-only dependencies
 * - Fully unit testable
 */

export interface MarketingItemCalculationInput {
  quantity?: number | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
}

export interface PromotionItemCalculationInput {
  amount?: number | null;
}

export interface ProductCalculationInput {
  targetQuantity?: number | null;
  unitPrice?: number | null;
  targetAmount?: number | null;
  masterPrice?: number | null;
}

/**
 * Calculate total amount for a single marketing material row: quantity * unitPrice
 */
export function calculateMarketingItemTotal(quantity: number, unitPrice: number): number {
  if (!quantity || quantity < 0 || !unitPrice || unitPrice < 0) return 0;
  return Number((quantity * unitPrice).toFixed(2));
}

/**
 * Calculate total requested marketing budget from a collection of marketing items
 */
export function calculateMarketingBudget(items: MarketingItemCalculationInput[]): number {
  if (!items || items.length === 0) return 0;
  const sum = items.reduce((acc, item) => {
    const rowTotal = item.totalAmount ?? calculateMarketingItemTotal(item.quantity || 0, item.unitPrice || 0);
    return acc + (Number(rowTotal) || 0);
  }, 0);
  return Number(sum.toFixed(2));
}

/**
 * Calculate total requested sales promotion budget from a collection of promotion items
 */
export function calculatePromotionBudget(items: PromotionItemCalculationInput[]): number {
  if (!items || items.length === 0) return 0;
  const sum = items.reduce((acc, item) => {
    return acc + (Number(item.amount) || 0);
  }, 0);
  return Number(sum.toFixed(2));
}

/**
 * Calculate grand total requested budget: marketing + sales promotion
 */
export function calculateTotalBudget(marketingBudget: number, promotionBudget: number): number {
  const m = Number(marketingBudget) || 0;
  const p = Number(promotionBudget) || 0;
  return Number((m + p).toFixed(2));
}

/**
 * Calculate target sales amount for a product row: targetQuantity * unitPrice
 */
export function calculateProductTargetAmount(quantity: number, unitPrice: number): number {
  if (!quantity || quantity < 0 || !unitPrice || unitPrice < 0) return 0;
  return Number((quantity * unitPrice).toFixed(2));
}

/**
 * Calculate total planned target sales across all products
 */
export function calculateTargetSales(products: ProductCalculationInput[]): number {
  if (!products || products.length === 0) return 0;
  const sum = products.reduce((acc, p) => {
    const rowTotal = p.targetAmount ?? calculateProductTargetAmount(p.targetQuantity || 0, p.unitPrice || 0);
    return acc + (Number(rowTotal) || 0);
  }, 0);
  return Number(sum.toFixed(2));
}

/**
 * Calculate budget to sales ratio percentage: (totalBudget / totalTargetSales) * 100
 * Returns null if totalTargetSales is zero or negative
 */
export function calculateBudgetSalesRatio(totalBudget: number, totalTargetSales: number): number | null {
  const budget = Number(totalBudget) || 0;
  const sales = Number(totalTargetSales) || 0;
  if (sales <= 0) return null;
  return Number(((budget / sales) * 100).toFixed(2));
}

/**
 * Audit check: Determine if unit price differs from catalog master price
 */
export function isPriceOverridden(unitPrice: number, masterPrice?: number | null): boolean {
  if (masterPrice == null || masterPrice === undefined) return false;
  return Math.abs(Number(unitPrice) - Number(masterPrice)) > 0.001;
}
