import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/shared/form/types";

export interface ValidateType7aOptions {
  items?: Type7DemoPlotItem[];
  customersList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface Type7aValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 7A (New Demo Plot) form items.
 * Validates plot name, dealer customer type, location, crop, area/tree count, product category, objective, and products.
 */
export function validateType7aFormItems({
  items = [],
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: ValidateType7aOptions): Type7aValidationResult {
  const hasType7ASelected = selectedWorkTypes.some(
    (t) => getWorkTypeCode(t) === "TYPE_7A",
  );
  if (!hasType7ASelected) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการทำแปลงสาธิตอย่างน้อย 1 รายการ",
    };
  }

  const item = items[0];
  if (!item.plotName?.trim()) {
    return {
      isValid: false,
      error: "กรุณากรอกชื่อแปลงสาธิต",
    };
  }

  const dealerId =
    item.storeId ||
    customersList.find((c) => c.name === item.ownerName)?.id;
  if (!dealerId) {
    return {
      isValid: false,
      error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงสาธิต",
    };
  }

  const dealer = customersList.find((c) => c.id === dealerId);
  if (dealer?.customerType && dealer.customerType !== "DEALER") {
    return {
      isValid: false,
      error: "ร้านค้าของแปลงสาธิตต้องเป็นประเภทร้านค้าตัวแทนจำหน่าย (DEALER) เท่านั้น",
    };
  }

  if (!item.province?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกจังหวัดของแปลงสาธิต",
    };
  }

  if (!item.district?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกอำเภอของแปลงสาธิต",
    };
  }

  if (!item.cropCategory?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกหมวดพืช",
    };
  }

  if (!item.cropName?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกหรือระบุชื่อพืช",
    };
  }

  const isCustomCrop = [
    "ผักและพืชล้มลุกอื่นๆ",
    "พืชไร่อื่นๆ",
    "พืชสวนอื่นๆ",
  ].includes(item.cropName);
  if (isCustomCrop && !item.customCropName?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุชื่อพืชเพิ่มเติม",
    };
  }

  const isRaiUnit = ["พืชไร่", "ผักและพืชล้มลุก"].includes(
    item.cropCategory,
  );
  if (isRaiUnit && (!item.areaRai || item.areaRai <= 0)) {
    return {
      isValid: false,
      error: "กรุณาระบุพื้นที่ (ไร่) ให้มากกว่า 0",
    };
  }
  if (!isRaiUnit && (!item.treeCount || item.treeCount <= 0)) {
    return {
      isValid: false,
      error: "กรุณาระบุจำนวนต้นให้มากกว่า 0",
    };
  }

  if (!item.objective?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุวัตถุประสงค์การทำแปลง",
    };
  }

  if (item.hasProductWithdrawal) {
    const selectedCatId = item.categoryId || item.chemicalGroupId;
    if (!selectedCatId?.trim()) {
      return {
        isValid: false,
        error: "กรุณาเลือกหมวดสินค้า",
      };
    }

    const prods = (item.demoProducts || []).filter(
      (p) => p.productId || p.productName,
    );
    if (prods.length === 0) {
      return {
        isValid: false,
        error: "กรุณาระบุสินค้าที่จะสาธิตอย่างน้อย 1 รายการ",
      };
    }

    for (let i = 0; i < prods.length; i++) {
      const p = prods[i];
      if (!p.quantity || p.quantity <= 0) {
        return {
          isValid: false,
          error: `จำนวนสินค้าที่จะสาธิตต้องมากกว่า 0 (รายการที่ ${i + 1})`,
        };
      }
      const matchedProd = productsList.find(
        (prod) => prod.id === p.productId || prod.name === p.productName,
      );
      if (
        matchedProd &&
        matchedProd.categoryId &&
        matchedProd.categoryId !== selectedCatId &&
        matchedProd.productGroupId &&
        matchedProd.productGroupId !== selectedCatId
      ) {
        return {
          isValid: false,
          error: `สินค้า "${p.productName}" ไม่อยู่ในหมวดสินค้าที่เลือก (รายการที่ ${i + 1})`,
        };
      }
    }
  }

  return { isValid: true };
}
