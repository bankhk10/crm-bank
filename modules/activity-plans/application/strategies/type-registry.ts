import type { WorkTypeStrategy } from "./work-type-strategy.interface";
import { type1Strategy } from "@/modules/activity-plans/features/type-1/application/type1.strategy";
import { type2Strategy } from "@/modules/activity-plans/features/type-2/application/type2.strategy";
import { type3Strategy } from "@/modules/activity-plans/features/type-3/application/type3.strategy";
import { type4Strategy } from "@/modules/activity-plans/features/type-4/application/type4.strategy";
import { type5Strategy } from "@/modules/activity-plans/features/type-5/application/type5.strategy";
import { type6Strategy } from "@/modules/activity-plans/features/type-6/application/type6.strategy";
import { type7aStrategy } from "@/modules/activity-plans/features/type-7a/application/type7a.strategy";
import { type7bStrategy } from "@/modules/activity-plans/features/type-7b/application/type7b.strategy";
import { type8Strategy } from "@/modules/activity-plans/features/type-8/application/type8.strategy";
import { type9Strategy } from "@/modules/activity-plans/features/type-9/application/type9.strategy";
import { type10Strategy } from "@/modules/activity-plans/features/type-10/application/type10.strategy";
import { type11Strategy } from "@/modules/activity-plans/features/type-11/application/type11.strategy";
import { type12Strategy } from "@/modules/activity-plans/features/type-12/application/type12.strategy";

const strategyRegistry = new Map<string, WorkTypeStrategy>();

// Register Available Strategies
function registerStrategy(strategy: WorkTypeStrategy) {
  strategyRegistry.set(strategy.code.toUpperCase(), strategy);
}

// Initial Registrations
registerStrategy(type1Strategy);
registerStrategy(type2Strategy);
registerStrategy(type3Strategy);
registerStrategy(type4Strategy);
registerStrategy(type5Strategy);
registerStrategy(type6Strategy);
registerStrategy(type7aStrategy);
registerStrategy(type7bStrategy);
registerStrategy(type8Strategy);
registerStrategy(type9Strategy);
registerStrategy(type10Strategy);
registerStrategy(type11Strategy);
registerStrategy(type12Strategy);

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
