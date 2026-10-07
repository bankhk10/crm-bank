/**
 * Shared Drug Withdrawal (การเบิกยา) Module Entrypoint
 *
 * Single source of truth for constants, validation schemas, types,
 * and UI components shared across TYPE_7A, TYPE_7B, TYPE_13, and TYPE_14.
 */

export {
  DRUG_WITHDRAWAL_SUPPORTED_TYPES,
  DRUG_WITHDRAWAL_SUPPORTED_TYPE_CODES,
  type DrugWithdrawalSupportedType,
  isDrugWithdrawalSupported,
} from "../../../constants";

export {
  drugWithdrawalItemSchema,
  drugWithdrawalInputSchema,
  type DrugWithdrawalItemInput,
  type DrugWithdrawalInput,
  type ValidateDrugWithdrawalResult,
  validateDrugWithdrawal,
} from "../../../application/validations";

export { DrugWithdrawalStatus } from "../../../types";

export { DrugWithdrawalCard } from "./drug-withdrawal-card";
export { DrugWithdrawalForm } from "./drug-withdrawal-form";

export type {
  DrugWithdrawalPlotOption,
  DrugWithdrawalProductOption,
  DrugWithdrawalCardProps,
  DrugWithdrawalPlotGroupState,
  DrugWithdrawalItemRowState,
} from "./types";

export {
  groupItemsIntoPlots,
  flattenPlotsToItems,
} from "./utils";
