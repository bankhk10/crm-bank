import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { type11PlannedStrategy } from "../../planned/infrastructure/type11-planned.strategy";
import type { Type11UnplannedItem } from "../types/unplanned.types";
import { validateType11UnplannedItems } from "../application/unplanned-validation";

/**
 * Strategy for TYPE_11 Unplanned Activities (Store Stock Check)
 * In an unplanned stock check, targets, stock items, and actual outcome records
 * are saved together 2-in-1 into activity_type_11_targets, activity_type_11_products,
 * and activity_type_11_result atomically in 1 transaction.
 */
export const type11UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_11",

  /**
   * Validate Type 11 Unplanned Data
   */
  async validatePlan(
    planData: any,
    db: any,
  ): Promise<StrategyValidationResult> {
    const unplannedItems: Type11UnplannedItem[] =
      planData.type11UnplannedItems || [];

    if (unplannedItems.length > 0) {
      const result = validateType11UnplannedItems(unplannedItems);
      if (!result.isValid) {
        return {
          valid: false,
          error: result.error || "ข้อมูลการตรวจเช็คสต๊อกไม่ถูกต้อง",
        };
      }
    }

    return type11PlannedStrategy.validatePlan!(planData, db);
  },

  /**
   * Save Type 11 Unplanned Plan stores, stock audit products, and results
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Delegate saving targets, products, and results to type11PlannedStrategy
    await type11PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If top-level actual outcome passed (2-in-1 unplanned submission)
    if (planData.actualOutcome || planData.actualData) {
      await type11PlannedStrategy.saveActual!(tx, activityPlanId, {
        ...(planData.actualOutcome || planData.actualData),
      });
    }
  },

  /**
   * Save Type 11 Unplanned Actual stock items
   */
  async saveActual(
    tx: PrismaTransaction,
    resultId: string,
    actualData: any,
  ): Promise<void> {
    return type11PlannedStrategy.saveActual!(tx, resultId, actualData);
  },

  /**
   * Load Type 11 Unplanned Data
   */
  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type11PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  /**
   * Load Type 11 Actual Data
   */
  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type11PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
