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

const PAYMENT_TERM_MAP: Record<string, string> = {
  CREDIT_90: "เครดิต 90 วัน",
  CASH_7: "เงินสด 7 วัน",
  CASH_DISCOUNT_3_7: "เงินสด ลด 3% (7 วัน)",
  PREPAID: "โอนเงินก่อนส่งสินค้า",
  CREDIT_OVER_90: "เครดิตมากกว่า 90 วัน",
};

export function buildSalesAdminExportWorkbook(sales: any[]): string {
  const rows: any[] = [];

  for (const sale of sales) {
    const formattedDate = sale.saleDate
      ? format(new Date(sale.saleDate), "dd/MM/yyyy")
      : "";
    const formattedDueDate = sale.creditDueDate
      ? format(new Date(sale.creditDueDate), "dd/MM/yyyy")
      : "";
    const formattedActualDeliveryDate = sale.actualDeliveryDate
      ? format(new Date(sale.actualDeliveryDate), "dd/MM/yyyy")
      : "";

    const statusThai = SALE_STATUS_MAP[sale.status] || sale.status;
    const paymentTermThai =
      PAYMENT_TERM_MAP[sale.paymentTerm] || sale.paymentTerm;

    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        rows.push({
          เลขที่ออเดอร์: sale.saleNumber,
          วันที่สร้างออเดอร์: formattedDate,
          สถานะ: statusThai,
          ชื่อลูกค้า: sale.customer?.name || "",
          จังหวัด: sale.customer?.province || "",
          พนักงานขาย: sale.employee?.name || "",
          "ยอดรวมสินค้า (บาท)": Number(sale.subtotalAmount) || 0,
          "ค่าจัดส่ง (บาท)": Number(sale.shippingCost) || 0,
          "ค่าใช้จ่ายอื่นๆ (บาท)": Number(sale.otherCosts) || 0,
          "ยอดรวมสุทธิ (บาท)": Number(sale.totalAmount) || 0,
          รหัสสินค้า: item.productCode || "",
          ชื่อสินค้า: item.name || "",
          จำนวน: item.quantity || 0,
          หน่วยนับ: item.unit || "",
          "ราคาต่อหน่วย (บาท)": Number(item.unitPrice) || 0,
          "ราคารวมสินค้า (บาท)": Number(item.totalPrice) || 0,
          หมายเหตุ: sale.notes || "",
        });
      }
    } else {
      rows.push({
        เลขที่ออเดอร์: sale.saleNumber,
        วันที่สร้างออเดอร์: formattedDate,
        สถานะ: statusThai,
        ชื่อลูกค้า: sale.customer?.name || "",
        จังหวัด: sale.customer?.province || "",
        พนักงานขาย: sale.employee?.name || "",
        "ยอดรวมสินค้า (บาท)": Number(sale.subtotalAmount) || 0,
        "ค่าจัดส่ง (บาท)": Number(sale.shippingCost) || 0,
        "ค่าใช้จ่ายอื่นๆ (บาท)": Number(sale.otherCosts) || 0,
        "ยอดรวมสุทธิ (บาท)": Number(sale.totalAmount) || 0,
        รหัสสินค้า: "-",
        ชื่อสินค้า: "-",
        จำนวน: 0,
        หน่วยนับ: "-",
        "ราคาต่อหน่วย (บาท)": 0,
        "ราคารวมสินค้า (บาท)": 0,
        หมายเหตุ: sale.notes || "",
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 18 }, // เลขที่ออเดอร์
    { wch: 12 }, // วันที่สร้างออเดอร์
    { wch: 18 }, // สถานะ
    { wch: 25 }, // ชื่อลูกค้า
    { wch: 15 }, // จังหวัด
    { wch: 20 }, // พนักงานขาย
    { wch: 18 }, // ยอดรวมสินค้า
    { wch: 14 }, // ค่าจัดส่ง
    { wch: 18 }, // ค่าใช้จ่ายอื่นๆ
    { wch: 18 }, // ยอดรวมสุทธิ
    { wch: 15 }, // รหัสสินค้า
    { wch: 25 }, // ชื่อสินค้า
    { wch: 10 }, // จำนวน
    { wch: 10 }, // หน่วยนับ
    { wch: 18 }, // ราคาต่อหน่วย
    { wch: 18 }, // ราคารวมสินค้า
    { wch: 25 }, // หมายเหตุ
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Admin Data");

  const base64: string = XLSX.write(workbook, {
    type: "base64",
    bookType: "xlsx",
  });
  return base64;
}
