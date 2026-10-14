/**
 * Type 5 Feature (สำรวจตลาดของคู่แข่ง - Competitor Market Survey)
 * Vertical Slice Module Entry Point
 */

// 1. Components (Vertical Slice)
export {
  Type5PlanForm,
  Type5Survey, // Backward-compatible alias
} from "./components/type5-plan-form";

export {
  Type5ActualForm,
  ActualType5Survey, // Backward-compatible alias
} from "./components/type5-actual-form";

export {
  Type5DetailView,
  DetailType5Survey, // Backward-compatible alias
} from "./components/type5-detail-view";

export {
  Type5ApprovalCard,
  ApprovalType5Survey, // Backward-compatible alias
} from "./components/type5-approval-card";

export { Type5PlanCard } from "./components/type5-plan-card";

// Legacy Edit Alias
export {
  Type5PlanForm as EditType5Survey,
} from "./components/type5-plan-form";

// 2. Hooks
export {
  useType5Form,
  type UseType5FormOptions,
  type UseType5FormResult,
} from "./hooks/use-type5-form";

export { useType5Actual } from "./hooks/use-type5-actual";

// 3. Application / Domain Logic
export {
  validateType5FormItems,
  type ValidateType5Options,
  type Type5ValidationResult,
} from "./application/validation";

export {
  extractType5PlanTargets,
  parseType5ActualResult,
  mapType5ToSectionItems,
} from "./application/mapper";

// Note: type5Strategy is deliberately NOT exported here to prevent Prisma Client leakage into client components.

// 4. Types & Props (Re-exported from types slice)
export * from "./types";
