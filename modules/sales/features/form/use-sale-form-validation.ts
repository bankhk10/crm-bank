"use client";

/**
 * useSaleFormValidation Hook
 * Handles validation logic for sale form
 */

import { useCallback } from "react";
import type {
  SaleFormState,
  SaleFormErrors,
  SaleFormCustomer,
  SaleFormProduct,
  PaymentTermType,
} from "../../types";

interface ValidationOptions {
  selectedCustomer: SaleFormCustomer | null;
  products: SaleFormProduct[];
  total: number;
}

/**
 * Hook to validate sale form
 */
export function useSaleFormValidation() {
  const validateForm = useCallback(
    (state: SaleFormState, options: ValidationOptions): SaleFormErrors => {
      const { selectedCustomer, products, total } = options;
      const errors: string[] = [];
      const warnings: string[] = [];
      const fieldErrors: Record<string, string> = {};

      // Required fields
      if (!state.customerId) {
        errors.push("กรุณาเลือกลูกค้า");
        fieldErrors.customerId = "กรุณาเลือกลูกค้า";
      }
      if (!state.employeeId) {
        errors.push("กรุณาเลือกพนักงานขาย");
        fieldErrors.employeeId = "กรุณาเลือกพนักงานขาย";
      }
      if (state.items.length === 0) {
        errors.push("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
        fieldErrors.items = "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ";
      }
      if (!state.saleDate) {
        errors.push("กรุณาระบุวันที่ออเดอร์");
        fieldErrors.saleDate = "กรุณาระบุวันที่ออเดอร์";
      }

      // Delivery method specific validation
      if (
        state.deliveryMethod === "CUSTOMER_PICKUP" &&
        !state.pickupCompanyId
      ) {
        errors.push("กรุณาเลือกสถานที่รับสินค้า");
        fieldErrors.pickupCompanyId = "กรุณาเลือกสถานที่รับสินค้า";
      }
      if (state.deliveryMethod === "COURIER" && !state.customShippingAddress) {
        errors.push("กรุณาเลือกบริษัทขนส่ง");
        fieldErrors.customShippingAddress =
          "";
      }

      // Validate items
      state.items.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`รายการที่ ${index + 1}: กรุณาเลือกสินค้า`);
          fieldErrors[`item_${index}_productId`] = "กรุณาเลือกสินค้า";
        }
        if (item.quantity < 0) {
          errors.push(`รายการที่ ${index + 1}: จำนวนต้องไม่ติดลบ`);
        }
        if (item.unitPrice < 0) {
          errors.push(`รายการที่ ${index + 1}: ราคาต้องไม่ติดลบ`);
        }

        // Check stock
        const product = products.find((p) => p.id === item.productId);
        // Check price modification
        if (item.priceModified) {
          warnings.push(
            `${product?.name || "สินค้า"}: ราคาถูกแก้ไขจาก ${item.originalPrice
            } เป็น ${item.unitPrice}`,
          );
        }
      });

      // Check credit limit for credit-based payment terms
      const isCreditPayment = isCreditBasedPayment(state.paymentTerm);
      if (isCreditPayment && selectedCustomer) {
        const creditLimit = selectedCustomer.creditLimits?.[0];
        const availableCredit = creditLimit?.availableAmount
          ? Number(creditLimit.availableAmount)
          : 0;
        const promoAmount = creditLimit?.promoAmount
          ? Number(creditLimit.promoAmount)
          : 0;
        const promotionalAvailable = state.usePromotionalCredit
          ? promoAmount - state.promotionalCreditUsed
          : 0;

        // Include active temporary credit
        let activeTempCredit = 0;
        const tempAmount = Number(creditLimit?.temporaryCreditAmount || 0);
        if (tempAmount > 0) {
          const tempExpiryDate = creditLimit?.temporaryCreditExpiryDate;
          if (!tempExpiryDate) {
            activeTempCredit = tempAmount;
          } else {
            const tempExpiry = new Date(tempExpiryDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Include the expiry day

            if (tempExpiry >= now) {
              activeTempCredit = tempAmount;
            }
          }
        }

        const totalAvailableCredit = availableCredit + activeTempCredit + promotionalAvailable;

        if (total > totalAvailableCredit) {
          errors.push(
            `ยอดขายเกินวงเงินเครดิต (วงเงินคงเหลือ: ${totalAvailableCredit.toLocaleString()})`,
          );
        }
      }

      // Net Total validation
      if (total < 0) {
        errors.push("ยอดเงินสุทธิ ต้องไม่ติดลบ");
      }

      return { errors, warnings, fieldErrors };
    },
    [],
  );

  return { validateForm };
}

/**
 * Check if payment term is credit-based
 */
export function isCreditBasedPayment(paymentTerm: PaymentTermType): boolean {
  return (
    paymentTerm === "CREDIT_90" ||
    paymentTerm === "CASH_7" ||
    paymentTerm === "CREDIT_OVER_90"
  );
}

/**
 * Get credit days for payment term
 */
export function getCreditDaysForTerm(paymentTerm: PaymentTermType): number {
  switch (paymentTerm) {
    case "CREDIT_90":
      return 90;
    case "CASH_7":
      return 7;
    case "PREPAID":
      return 0;
    case "CREDIT_OVER_90":
      return 91;
    default:
      return 90;
  }
}

export default useSaleFormValidation;
