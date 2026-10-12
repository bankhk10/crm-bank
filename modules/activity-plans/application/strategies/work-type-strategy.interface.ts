import type { PrismaClient } from "@prisma/client";

export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface StrategyValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Universal Strategy Interface for each Work Type (TYPE_1 to TYPE_14)
 */
export interface WorkTypeStrategy<TPlan = any, TActual = any> {
  readonly code: string;

  /**
   * Validate business rules & database records before Plan creation/update
   */
  validatePlan?(planData: TPlan, db: any): Promise<StrategyValidationResult>;

  /**
   * Validate business rules before Actual creation/update
   */
  validateActual?(actualData: TActual, db: any): Promise<StrategyValidationResult>;

  /**
   * Save Type-specific plan data inside an atomic Prisma transaction
   */
  savePlan(tx: PrismaTransaction, activityPlanId: string, planData: TPlan): Promise<void>;

  /**
   * Save Type-specific actual outcome data inside an atomic Prisma transaction
   */
  saveActual?(tx: PrismaTransaction, activityPlanId: string, actualData: TActual): Promise<void>;

  /**
   * Load Type-specific plan data for rendering or hydration
   */
  loadPlan?(tx: PrismaTransaction, activityPlanId: string): Promise<TPlan | null>;

  /**
   * Load Type-specific actual outcome data
   */
  loadActual?(tx: PrismaTransaction, activityPlanId: string): Promise<TActual | null>;
}
