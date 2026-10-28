import type {
  Type13UnplannedItem,
  Type13UnplannedValidationResult,
} from "../types/unplanned.types";

/**
 * Validates a single Type 13 Unplanned plot/village item
 */
export function validateType13UnplannedItem(
  item: Type13UnplannedItem,
): Type13UnplannedValidationResult {
  if (!item) {
    return { isValid: false, error: "กรุณาระบุข้อมูลการฉีดแปลงแฮตแทค" };
  }

  if (!item.storeId?.trim()) {
    return { isValid: false, error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงแฮตแทค" };
  }

  if (!item.province?.trim()) {
    return { isValid: false, error: "กรุณาระบุจังหวัดของแปลงแฮตแทค" };
  }

  if (!item.district?.trim()) {
    return { isValid: false, error: "กรุณาระบุอำเภอของแปลงแฮตแทค" };
  }

  if (
    item.actualPlotsCount == null ||
    String(item.actualPlotsCount).trim() === "" ||
    Number(item.actualPlotsCount) <= 0
  ) {
    return { isValid: false, error: "กรุณาระบุจำนวนแปลงที่ฉีดพ่นจริง (ต้องมากกว่า 0)" };
  }

  if (item.products && item.products.length > 0) {
    for (let i = 0; i < item.products.length; i++) {
      const prod = item.products[i];
      if (!prod.productId?.trim()) {
        return { isValid: false, error: `สินค้าลำดับที่ ${i + 1}: กรุณาเลือกผลิตภัณฑ์` };
      }
      if (
        (prod.actualQuantity == null && prod.quantityUsed == null) ||
        (prod.actualQuantity !== undefined && Number(prod.actualQuantity) < 0) ||
        (prod.quantityUsed !== undefined && Number(prod.quantityUsed) < 0)
      ) {
        return {
          isValid: false,
          error: `สินค้า "${prod.productName || `ลำดับที่ ${i + 1}`}": กรุณาระบุจำนวนที่ใช้จริง`,
        };
      }
      if (!prod.actualRate || !String(prod.actualRate).trim()) {
        return {
          isValid: false,
          error: `สินค้า "${prod.productName || `ลำดับที่ ${i + 1}`}": กรุณาระบุอัตราการใช้`,
        };
      }
    }
  }

  const imageCount = (item.images?.length || item.afterSprayImages?.length || 0);
  if (imageCount > 20) {
    return { isValid: false, error: "อัปโหลดรูปภาพได้สูงสุด 20 รูปต่อหมู่บ้าน" };
  }

  return { isValid: true };
}

/**
 * Validates multiple Type 13 Unplanned items (1 to 10 villages)
 */
export function validateType13UnplannedItems(
  items: Type13UnplannedItem[],
): Type13UnplannedValidationResult {
  if (!items || items.length === 0) {
    return { isValid: false, error: "กรุณาระบุข้อมูลแปลงแฮตแทคอย่างน้อย 1 หมู่บ้าน" };
  }

  if (items.length > 10) {
    return { isValid: false, error: "สามารถเพิ่มข้อมูลแปลงแฮตแทคได้สูงสุด 10 หมู่บ้าน" };
  }

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const prefix = items.length > 1 ? `หมู่บ้านที่ ${idx + 1}: ` : "";
    const res = validateType13UnplannedItem(item);
    if (!res.isValid) {
      return { isValid: false, error: `${prefix}${res.error}` };
    }
  }

  return { isValid: true };
}
