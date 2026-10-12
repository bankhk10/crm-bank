/**
 * Type 4 Feature (วางบิล / เก็บเงิน - Billing & Payment Collection)
 * Vertical Slice Module Entry Point
 */

// 1. Components (Vertical Slice)
export {
  Type4PlanForm,
  Type4Collect, // Backward-compatible alias
} from "./components/type4-plan-form";

export {
  Type4ActualForm,
  ActualType4Collect, // Backward-compatible alias
} from "./components/type4-actual-form";

export {
  Type4DetailView,
  DetailType4Collect, // Backward-compatible alias
} from "./components/type4-detail-view";

export {
  Type4ApprovalCard,
  ApprovalType4Collect, // Backward-compatible alias
} from "./components/type4-approval-card";

export { Type4PlanCard } from "./components/type4-plan-card";

// Legacy Edit Alias
export {
  Type4PlanForm as EditType4Collect,
} from "./components/type4-plan-form";

// 2. Hooks
export {
  useType4Form,
  type UseType4FormOptions,
  type UseType4FormResult,
} from "./hooks/use-type4-form";

export { useType4Actual } from "./hooks/use-type4-actual";

// 3. Application / Domain Logic
export {
  validateType4FormItems,
  type ValidateType4Options,
  type Type4ValidationResult,
} from "./application/validation";

export {
  extractType4PlanTargets,
  parseType4ActualResult,
  mapType4ToSectionItems,
} from "./application/mapper";

export { type4Strategy } from "./application/type4.strategy";

// 4. Types & Props (Re-exported from types slice)
export * from "./types";
