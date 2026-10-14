/**
 * Type 6 Feature (ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา - Customer Complaint / Issue Resolution)
 * Vertical Slice Module Entry Point
 */

// 1. Components (Vertical Slice)
export {
  Type6PlanForm,
  Type6Issue, // Backward-compatible alias
} from "./components/type6-plan-form";

export {
  Type6ActualForm,
  ActualType6Issue, // Backward-compatible alias
} from "./components/type6-actual-form";

export {
  Type6DetailView,
  DetailType6Issue, // Backward-compatible alias
} from "./components/type6-detail-view";

export {
  Type6ApprovalCard,
  ApprovalType6Issue, // Backward-compatible alias
} from "./components/type6-approval-card";

export { Type6PlanCard } from "./components/type6-plan-card";

// Legacy Edit Alias
export {
  Type6PlanForm as EditType6Issue,
} from "./components/type6-plan-form";

// 2. Hooks
export {
  useType6Form,
  normalizeType6Issue,
  type UseType6FormOptions,
  type UseType6FormResult,
} from "./hooks/use-type6-form";

export {
  useType6Actual,
  validateType6Actual,
} from "./hooks/use-type6-actual";

// 3. Application / Domain Logic
export {
  validateType6FormItems,
  type ValidateType6Options,
  type Type6ValidationResult,
  type Type6ActualValidationInput,
} from "./application/validation";

export {
  extractType6PlanTargets,
  parseType6ActualResult,
  mapType6ToSectionItems,
} from "./application/mapper";

// Note: type6Strategy is deliberately NOT exported here to prevent Prisma Client leakage into client components.

// 4. Types & Constants
export { ISSUE_TYPES } from "./types";
export * from "./types";
