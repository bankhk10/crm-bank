import * as XLSX from "xlsx";
import { format } from "date-fns";

const SALE_STATUS_MAP: Record<string, string> = {
  PENDING_APPROVAL: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่อนุมัติ",
  PAID: "ชำระเงินแล้ว",
  AWAITING_DELIVERY: "รอดำเนินการจัดส่ง",
  DELIVERY_COMPLETED: "จัดส่งสำเร็จ",
  PARTIALLY_DELIVERED: "จัดส่งบางส่วน",
  OVERDUE: "เกินกำหนดชำระ",
  WAITING_FOR_CORRECTION: "รอแก้ไข",
  CANCELLED: "ยกเลิก",
  COMPLETED: "เสร็จสิ้น",
};

export function buildSalesMarketingExportWorkbook(sales: any[]): string {
  const rows: any[] = [];

  for (const sale of sales) {
    const formattedDate = sale.saleDate ? format(new Date(sale.saleDate), "dd/MM/yyyy") : "";
    const statusThai = SALE_STATUS_MAP[sale.status] || sale.status;

    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        const plantStr = Array.isArray(item.usedForPlants) ? item.usedForPlants.join(", ") : "";

        rows.push({
          "เลขที่เอกสารการขาย": sale.saleNumber,
          "วันที่เอกสาร": formattedDate,
          "สถานะ": statusThai,
          "ภูมิภาค": sale.region || "",
          "จังหวัด": sale.customer?.province || "",
          "ชื่อลูกค้า": sale.customer?.name || "",
          "ประเภทลูกค้า": sale.customer?.customerType || "",
          "พนักงานขาย": sale.employee?.name || "",
          "รหัสสินค้า": item.productCode || "",
          "ชื่อสินค้า": item.name || "",
          "ชื่อสามัญ": item.commonName || "",
          "หมวดหมู่สินค้า": item.categoryName || "",
          "กลุ่มชื่อการค้า": item.tradeNameGroupName || "",
          "กลุ่มสินค้า": item.productGroupName || "",
          "ประเภท (ABC Code)": item.productABCTypeName || "",
          "แบรนด์": item.brand || "",
          "พืชที่ใช้": plantStr,
          "จำนวนที่ขาย": item.quantity || 0,
          "หน่วยนับ": item.unit || "",
          "ราคาปกติต่อหน่วย (บาท)": Number(item.originalPrice) || 0,
          "ราคาขายต่อหน่วย (บาท)": Number(item.unitPrice) || 0,
          "ราคารวมยอดขาย (บาท)": Number(item.totalPrice) || 0,
          "งบโปรโมชั่นที่ใช้ (บาท)": Number(item.promotionBudget) || 0,
        });
      }
    } else {
      rows.push({
        "เลขที่เอกสารการขาย": sale.saleNumber,
        "วันที่เอกสาร": formattedDate,
        "สถานะ": statusThai,
        "ภูมิภาค": sale.region || "",
        "จังหวัด": sale.customer?.province || "",
        "ชื่อลูกค้า": sale.customer?.name || "",
        "ประเภทลูกค้า": sale.customer?.customerType || "",
        "พนักงานขาย": sale.employee?.name || "",
        "รหัสสินค้า": "-",
        "ชื่อสินค้า": "-",
        "ชื่อสามัญ": "-",
        "หมวดหมู่สินค้า": "-",
        "กลุ่มชื่อการค้า": "-",
        "กลุ่มสินค้า": "-",
        "ประเภท (ABC Code)": "-",
        "แบรนด์": "-",
        "พืชที่ใช้": "-",
        "จำนวนที่ขาย": 0,
        "หน่วยนับ": "-",
        "ราคาปกติต่อหน่วย (บาท)": 0,
        "ราคาขายต่อหน่วย (บาท)": 0,
        "ราคารวมยอดขาย (บาท)": 0,
        "งบโปรโมชั่นที่ใช้ (บาท)": 0,
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 18 }, // เลขที่เอกสาร
    { wch: 12 }, // วันที่เอกสาร
    { wch: 18 }, // สถานะ
    { wch: 15 }, // ภูมิภาค
    { wch: 15 }, // จังหวัด
    { wch: 25 }, // ชื่อลูกค้า
    { wch: 15 }, // ประเภทลูกค้า
    { wch: 20 }, // พนักงานขาย
    { wch: 15 }, // รหัสสินค้า
    { wch: 25 }, // ชื่อสินค้า
    { wch: 20 }, // ชื่อสามัญ
    { wch: 20 }, // หมวดหมู่สินค้า
    { wch: 20 }, // กลุ่มชื่อการค้า
    { wch: 20 }, // กลุ่มสินค้า
    { wch: 15 }, // ประเภท ABC
    { wch: 15 }, // แบรนด์
    { wch: 20 }, // พืชที่ใช้
    { wch: 12 }, // จำนวนที่ขาย
    { wch: 10 }, // หน่วยนับ
    { wch: 20 }, // ราคาปกติต่อหน่วย
    { wch: 20 }, // ราคาขายต่อหน่วย
    { wch: 20 }, // ราคารวมยอดขาย
    { wch: 20 }, // งบโปรโมชั่น
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Marketing Sales Data");

  const base64: string = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  return base64;
}
