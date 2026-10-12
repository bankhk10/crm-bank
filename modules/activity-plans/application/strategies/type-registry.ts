import type { WorkTypeStrategy } from "./work-type-strategy.interface";
import { type1Strategy } from "@/modules/activity-plans/features/type-1/application/type1.strategy";

const strategyRegistry = new Map<string, WorkTypeStrategy>();

// Register Available Strategies
function registerStrategy(strategy: WorkTypeStrategy) {
  strategyRegistry.set(strategy.code.toUpperCase(), strategy);
}

// Initial Registrations
registerStrategy(type1Strategy);

/**
 * Retrieve the Strategy Handler for a given Work Type code
 */
export function getTypeStrategy(workTypeCode: string): WorkTypeStrategy | null {
  if (!workTypeCode) return null;
  return strategyRegistry.get(workTypeCode.toUpperCase()) || null;
}

/**
 * Check if a Strategy exists for a given Work Type code
 */
export function hasTypeStrategy(workTypeCode: string): boolean {
  if (!workTypeCode) return false;
  return strategyRegistry.has(workTypeCode.toUpperCase());
}
