import type {
  Type9UnplannedItem,
  Type9UnplannedValidationResult,
} from "../types/unplanned.types";

export function validateType9UnplannedItems(
  items: Type9UnplannedItem[],
): Type9UnplannedValidationResult {
  if (!items || items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลกิจกรรมหน้าร้านอย่างน้อย 1 รายการ",
    };
  }

  const errors: string[] = [];

  items.forEach((item, idx) => {
    const itemPrefix = `รายการกิจกรรมหน้าร้านที่ ${idx + 1}: `;

    if (item.isUnregisteredSubdealer) {
      if (!item.subDealerStore || !item.subDealerStore.trim()) {
        errors.push(`${itemPrefix}กรุณาระบุชื่อร้านค้า Sub Dealer`);
      }
      if (!item.province || !item.province.trim()) {
        errors.push(`${itemPrefix}กรุณาระบุจังหวัด`);
      }
      if (!item.district || !item.district.trim()) {
        errors.push(`${itemPrefix}กรุณาระบุอำเภอ`);
      }
    } else {
      if (!item.subdealerId) {
        errors.push(`${itemPrefix}กรุณาเลือกร้านค้า Sub Dealer จากระบบ`);
      }
    }

    if (item.actualSales && item.actualSales.trim()) {
      const salesNum = Number(item.actualSales.replace(/,/g, ""));
      if (isNaN(salesNum) || salesNum < 0) {
        errors.push(`${itemPrefix}ยอดขายจริงต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0`);
      }
    }

    if (item.actualAttendees && item.actualAttendees.trim()) {
      const attNum = Number(item.actualAttendees.replace(/,/g, ""));
      if (isNaN(attNum) || attNum < 0) {
        errors.push(`${itemPrefix}จำนวนผู้เข้าร่วมจริงต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    error: errors.length > 0 ? errors[0] : undefined,
  };
}
