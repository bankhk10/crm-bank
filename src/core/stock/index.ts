/**
 * Stock Module
 * Exports stock domain services, types, and repository
 */

// Service
export {
  allocateStock,
  releaseStock,
  confirmStockDeduction,
  revertStockDeduction,
} from "./stock.service";

// Repository
export * as StockRepository from "./stock.repository";

// Types
export * from "./stock.types";
