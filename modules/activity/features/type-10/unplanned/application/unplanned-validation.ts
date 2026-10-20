import type {
  Type10UnplannedItem,
  Type10UnplannedValidationResult,
} from "../types/unplanned.types";

export function validateType10UnplannedItems(
  items: Type10UnplannedItem[],
): Type10UnplannedValidationResult {
  if (!items || items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลการจัดงาน Field Day อย่างน้อย 1 รายการ",
      errors: ["กรุณาระบุข้อมูลการจัดงาน Field Day อย่างน้อย 1 รายการ"],
    };
  }

  const errors: string[] = [];

  items.forEach((item, index) => {
    const prefix = items.length > 1 ? `รายการที่ ${index + 1}: ` : "";

    if (!item.demoPlotId && !item.plotName && !item.location) {
      errors.push(`${prefix}กรุณาเลือกแปลงสาธิตหรือระบุสถานที่จัดงาน Field Day`);
    }

    if (item.actualAttendees === undefined || item.actualAttendees === null || String(item.actualAttendees).trim() === "") {
      errors.push(`${prefix}กรุณาระบุจำนวนผู้เข้าร่วมงานจริง`);
    } else {
      const attendeesNum = Number(String(item.actualAttendees).replace(/,/g, ""));
      if (isNaN(attendeesNum) || attendeesNum < 0) {
        errors.push(`${prefix}จำนวนผู้เข้าร่วมงานจริงต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0`);
      }
    }

    if (item.actualSalesOrBooking !== undefined && item.actualSalesOrBooking !== null && String(item.actualSalesOrBooking).trim() !== "") {
      const salesNum = Number(String(item.actualSalesOrBooking).replace(/,/g, ""));
      if (isNaN(salesNum) || salesNum < 0) {
        errors.push(`${prefix}ยอดขายหรือยอดจองจริงต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0`);
      }
    }

    if (item.soldProducts && item.soldProducts.length > 0) {
      item.soldProducts.forEach((p, pIdx) => {
        const prodPrefix = `${prefix}สินค้าที่ ${pIdx + 1}: `;
        if (!p.productName || !p.productName.trim()) {
          errors.push(`${prodPrefix}กรุณาระบุชื่อสินค้า`);
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : undefined,
    errors,
  };
}
