/**
 * Sales Module
 * Exports sales domain services and types
 */

// Order Expiry Service
export {
  checkExpiredOrders,
  checkOverdueOrders,
  updateDeliveryDate,
  calculateOrderExpiryDate,
  getOrderExpiryInfo,
} from "./order-expiry.service";

// Sales Service
export {
  listSales,
  getSaleById,
  generateSaleNumber,
  calculateTotals,
  validateCreditLimit,
  checkStockAvailability,
  verifyUserSession,
  createSale,
  applyDataAccessFilters,
  type StockWarning,
  type CreateSaleInput,
} from "./sales.service";

// Sales Repository
export {
  buildSalesWhereClause,
  findSales,
  findSaleById,
  findSaleBySaleNumber,
  getLastSale,
  createSale as createSaleRecord,
  updateSale,
  createStatusHistory,
  getCustomerWithCredit,
  getProductWithStock,
  verifyUserExists,
  type SalesQueryFilters,
  type PaginationParams,
} from "./sales.repository";

// Types
export * from "./sales.types";
