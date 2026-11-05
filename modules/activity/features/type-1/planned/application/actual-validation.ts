import type { Type1TargetItem } from "../types/planned.types";
import type { Type1TargetActualItem } from "../types/actual.types";

export interface Type1ActualValidationInput {
  discussionResult?: string;
  salesOpportunity?: string;
  productAdvice?: string;
  targetItems?: Type1TargetActualItem[];
}

export interface Type1ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates Type 1 Actual Data according to business rules:
 * 1. ผลการพูดคุย (discussionResult) is strictly required per target
 * 2. ประเมินโอกาสการขาย (salesOpportunity) is required if the target is for product advice
 */
export function validateType1Actual(
  input: Type1ActualValidationInput,
  targets: Type1TargetItem[] = [],
): Type1ValidationResult {
  const errors: string[] = [];
  const targetItems = input.targetItems || [];

  if (targets.length > 1) {
    targets.forEach((tgt, idx) => {
      const item = targetItems[idx] || tgt;
      const customerName = tgt.customer || `เป้าหมายที่ ${idx + 1}`;

      // Required: ผลการพูดคุย
      if (!item.discussionResult || !item.discussionResult.trim()) {
        errors.push(`ผลการพูดคุย (${customerName})`);
      }

      // Conditional: ประเมินโอกาสการขาย
      const isAdvice =
        tgt.topic?.trim() === "ให้คำแนะนำการใช้สินค้า" ||
        Boolean(item.productAdvice) ||
        Boolean(item.salesOpportunity);
      if (isAdvice && !item.salesOpportunity) {
        errors.push(`ประเมินโอกาสการขาย (${customerName})`);
      }
    });
  } else {
    const disc =
      input.discussionResult?.trim() ||
      targetItems[0]?.discussionResult?.trim() ||
      "";
    if (!disc) {
      errors.push("ผลการพูดคุย");
    }

    const target0 = targets[0];
    const isAdvice =
      target0?.topic?.trim() === "ให้คำแนะนำการใช้สินค้า" ||
      Boolean(input.productAdvice) ||
      Boolean(input.salesOpportunity);
    if (isAdvice && !input.salesOpportunity) {
      errors.push("ประเมินโอกาสการขาย");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
