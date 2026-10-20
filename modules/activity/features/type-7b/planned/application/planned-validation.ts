import type {
  Type7bPlanItem,
  ValidateType7bOptions,
  Type7bValidationResult,
} from "../types/planned.types";

/**
 * Validates Type 7B Planned Form Items
 */
export function validateType7bFormItems(
  items: Type7bPlanItem[],
  options?: ValidateType7bOptions,
): Type7bValidationResult {
  if (!items || items.length === 0) {
    if (options?.requirePlots !== false) {
      return {
        isValid: false,
        error: "กรุณาระบุข้อมูลการติดตามแปลงสาธิต",
      };
    }
    return { isValid: true };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Must select either a source plan or demo plot
    const hasPlot = Boolean(
      item.selectedPlanId ||
      item.existingPlotId ||
      item.demoPlotId ||
      (item.selectedPlotIds && item.selectedPlotIds.length > 0) ||
      item.plotName?.trim(),
    );

    if (!hasPlot) {
      return {
        isValid: false,
        error: `รายการที่ ${i + 1}: กรุณาเลือกแผนกิจกรรมทำแปลงสาธิตต้นทาง หรือเลือกแปลงสาธิตที่ต้องการติดตาม`,
      };
    }

    // If withdrawal is enabled, check products
    if (item.hasProductWithdrawal && item.withdrawnProducts) {
      for (let j = 0; j < item.withdrawnProducts.length; j++) {
        const prod = item.withdrawnProducts[j];
        if (!prod.productId) {
          return {
            isValid: false,
            error: `รายการที่ ${i + 1} สินค้าเบิกลำดับที่ ${j + 1}: กรุณาเลือกสินค้าที่ต้องการเบิก`,
          };
        }
        if (prod.quantity == null || Number(prod.quantity) <= 0) {
          return {
            isValid: false,
            error: `รายการที่ ${i + 1} สินค้าเบิกลำดับที่ ${j + 1}: กรุณาระบุจำนวนสินค้าที่ถูกต้อง`,
          };
        }
      }
    }
  }

  return { isValid: true };
}
