// Domain Types
export type {
  CustomerOption,
  ProductOption,
  ProductCategoryOption,
  ChemicalGroupOption,
  Type7DemoProductLine,
  Type7DemoPlotItem,
  Type7aDemoProductItem,
  Type7aPlanItem,
  Type7aTargetItem,
  Type7aActualRecord,
} from "./types";

// Application Layer (Pure Mappers - Safe for Client)
export {
  extractType7aPlanTargets,
  parseType7aActualResult,
  mapType7aToSectionItems,
} from "./application/mapper";

// UI Components & Cards
export {
  Type7aPlanCard,
  type Type7aPlanCardProps,
  type Type7aPlanTarget,
} from "./shared/type7a-plan-card";
export { Type7NewDemo } from "./create/type7-new-demo";
export type { Type7NewDemoProps } from "./create/types";
export {
  validateType7aFormItems,
  type ValidateType7aOptions,
  type Type7aValidationResult,
} from "./create/validation";
export {
  EditType7aNewDemo,
  type EditCustomerOption,
  type EditProductOption,
  type EditProductCategoryOption,
  type EditChemicalGroupOption,
} from "./edit/edit-type7a";
export { DetailType7NewDemo } from "./detail/detail-type7-new-demo";
export type {
  DetailType7NewDemoProps,
  DemoResultItemData,
} from "./actual/types";
export { ApprovalType7aDemo } from "./approval/approval-type7a-demo";
export type { ApprovalType7aDemoProps } from "./actual/types";
export { ActualType7NewDemo } from "./actual/actual-type7-new-demo";
export type {
  TargetDemoItem,
  ActualType7NewDemoProps,
} from "./actual/types";
export { useType7aActual } from "./actual/use-type7a-actual";
export {
  useType7aForm,
  type UseType7aFormOptions,
  type UseType7aFormResult,
} from "./hooks/use-type7a-form";
