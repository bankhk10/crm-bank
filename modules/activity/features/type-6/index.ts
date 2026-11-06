/**
 * Type 6 Feature: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (Customer Complaint / Issue Resolution)
 * Vertical Slice Module Entry Point
 */

// 1. Components (Vertical Slice)
export {
  Type6PlannedForm,
  Type6PlanForm, // Backward-compatible alias
  Type6Issue, // Backward-compatible alias
  EditType6Issue, // Legacy Edit Alias
} from "./planned/components/type6-planned-form";

export { Type6PlanCard } from "./planned/components/type6-plan-card";

export {
  Type6ActualForm,
  ActualType6Issue, // Backward-compatible alias
} from "./planned/components/type6-actual-form";

export {
  Type6DetailView,
  DetailType6Issue, // Backward-compatible alias
} from "./planned/components/type6-detail-view";

export {
  Type6ApprovalCard,
  ApprovalType6Issue, // Backward-compatible alias
} from "./planned/components/type6-approval-card";

// 2. Hooks
export {
  useType6PlannedForm,
  useType6Form, // Backward-compatible alias
  normalizeType6Issue,
  type UseType6FormOptions,
  type UseType6FormResult,
  type UseType6PlannedFormOptions,
  type UseType6PlannedFormResult,
} from "./planned/hooks/use-type6-planned-form";

export {
  useType6Actual,
  validateType6Actual,
} from "./planned/hooks/use-type6-actual";

// 3. Application / Domain Logic
export {
  validateType6FormItems,
  type ValidateType6Options,
  type Type6ValidationResult,
} from "./planned/application/planned-validation";

export {
  extractType6PlanTargets,
  hydrateType6PlannedData,
  mapType6ToSectionItems,
} from "./planned/application/planned-mapper";

export {
  parseType6ActualResult,
} from "./planned/application/actual-mapper";

// 5. Types & Constants

// 5. Types & Constants
export * from "./shared/constants";
export * from "./shared/types";
export * from "./planned/types/planned.types";
export * from "./planned/types/actual.types";

// 6. Unplanned Sub-slice
export { Type6UnplannedForm } from "./unplanned/components/type6-unplanned-form";
export {
  useType6UnplannedForm,
  type UseType6UnplannedFormOptions,
} from "./unplanned/hooks/use-type6-unplanned-form";
export {
  validateType6UnplannedItems,
  type Type6UnplannedValidationResult,
} from "./unplanned/application/unplanned-validation";
export {
  hydrateType6UnplannedData,
  mapType6UnplannedToPayload,
} from "./unplanned/application/unplanned-mapper";
export * from "./unplanned/types/unplanned.types";
