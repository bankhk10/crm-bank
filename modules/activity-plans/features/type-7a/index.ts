/**
 * Type 7A Feature (ทำแปลงสาธิตใหม่ - New Demo Plot Creation)
 * Vertical Slice Module Entry Point
 */

// 1. Components (Vertical Slice)
export {
  Type7aPlanForm,
  Type7NewDemo, // Backward-compatible alias
  EditType7aNewDemo, // Backward-compatible alias
} from "./components/type7a-plan-form";

export {
  Type7aActualForm,
  ActualType7NewDemo, // Backward-compatible alias
} from "./components/type7a-actual-form";

export {
  Type7aDetailView,
  DetailType7NewDemo, // Backward-compatible alias
} from "./components/type7a-detail-view";

export {
  Type7aApprovalCard,
  ApprovalType7aDemo, // Backward-compatible alias
} from "./components/type7a-approval-card";

export {
  Type7aPlanCard,
  type Type7aPlanCardProps,
  type Type7aPlanTarget,
} from "./components/type7a-plan-card";

// 2. Hooks
export {
  useType7aForm,
  type UseType7aFormOptions,
  type UseType7aFormResult,
} from "./hooks/use-type7a-form";

export { useType7aActual } from "./hooks/use-type7a-actual";

// 3. Application / Domain Logic (Client-Safe)
export {
  validateType7aFormItems,
  validateType7aActual,
  type ValidateType7aOptions,
  type Type7aValidationResult,
  type Type7aActualValidationInput,
} from "./application/validation";

export {
  extractType7aPlanTargets,
  parseType7aActualResult,
  mapType7aToSectionItems,
} from "./application/mapper";

// Note: type7aStrategy is deliberately NOT exported here to prevent Prisma Client leakage into client components.
// Server repositories should import directly from '@/modules/activity-plans/features/type-7a/application/type7a.strategy'

// 4. Types & Props
export * from "./types";
