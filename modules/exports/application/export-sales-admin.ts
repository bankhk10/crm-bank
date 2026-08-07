import * as XLSX from "xlsx";
import { format } from "date-fns";
import { getRegionFromProvince } from "@/modules/reports/application/utils";

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

function getDataTypeLabel(status: string): string {
  if (status === "PENDING_APPROVAL" || status === "WAITING_FOR_CORRECTION") {
    return "Forecast";
  }
  if (
    status === "DELIVERY_COMPLETED" ||
    status === "PAID" ||
    status === "COMPLETED"
  ) {
    return "Invoice";
  }
  return "Sales Note";
}

function getSalesOrderNumber(sale: any): string {
  if (sale.shipments && sale.shipments.length > 0) {
    const shipmentWithRef = sale.shipments.find(
      (s: any) => s.salesOrderNumber && s.salesOrderNumber.trim() !== "",
    );
    if (shipmentWithRef) {
      return shipmentWithRef.salesOrderNumber.trim();
    }
  }
  return sale.saleOrderRef?.trim() || "";
}

export function buildSalesAdminExportWorkbook(sales: any[]): string {
  const rows: any[] = [];

  for (const sale of sales) {
    const saleDateObj = sale.saleDate ? new Date(sale.saleDate) : null;
    const saleYear = saleDateObj ? format(saleDateObj, "yyyy") : "";
    const saleMonth = saleDateObj ? format(saleDateObj, "MMM") : "";
    const formattedDate = saleDateObj ? format(saleDateObj, "dd/MM/yyyy") : "";

    const statusThai = SALE_STATUS_MAP[sale.status] || sale.status;
    const dataTypeLabel = getDataTypeLabel(sale.status);
    const regionStr =
      sale.region ||
      (sale.customer?.province
        ? getRegionFromProvince(sale.customer.province)
        : "") ||
      "";
    const salesOrderNo = getSalesOrderNumber(sale);

    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        const abcGroup =
          item.productABCTypeName ||
          item.product?.productABCType?.name ||
          item.product?.productABCType?.code ||
          "";

        // กลุ่มสาร: ดึงจากหมวดสินค้า (categoryName) และตัดคำหลัง : ออก
        const categoryRaw =
          item.categoryName ||
          item.product?.category?.description ||
          item.product?.category?.code ||
          "";
        const productGroupStr = categoryRaw
          ? categoryRaw.split(":")[0].trim()
          : "";

        const commonNameStr = item.commonName || item.product?.commonName || "";
        const tradeNameStr =
          item.tradeNameGroupName ||
          item.product?.tradeNameGroup?.description ||
          item.name ||
          "";

        const pkgSizeRaw = item.packageSize ?? item.product?.packageSize;
        const pkgUnitRaw =
          item.packageSizeUnit ?? item.product?.packageSizeUnit ?? "";
        const packageSizeStr =
          pkgSizeRaw != null
            ? `${Number(pkgSizeRaw)} ${pkgUnitRaw}`.trim()
            : "";

        const totalPerBox = Number(
          item.totalPackageSizePerBox ??
            item.packageSizePerBox ??
            item.product?.totalPackageSizePerBox ??
            item.product?.packageSizePerBox ??
            0,
        );

        const quantityNum = item.quantity || 0;
        const totalBoxSold = quantityNum * totalPerBox;

        rows.push({
          ปี: saleYear,
          ประเภทข้อมูล: dataTypeLabel,
          เดือน: saleMonth,
          กรุ๊ป: abcGroup,
          กลุ่มสาร: productGroupStr,
          ชื่อสามัญ: commonNameStr,
          รหัสสินค้า: item.productCode || "",
          ชื่อการค้า: tradeNameStr,
          ขนาดบรรจุ: packageSizeStr,
          ขนาดบรรจุรวมต่อลัง: totalPerBox,
          พนักงานขาย: sale.employee?.name || "",
          ภูมิภาค: regionStr,
          ชื่อลูกค้า: sale.customer?.name || "",
          จังหวัด: sale.customer?.province || "",
          จำนวนที่ขาย: quantityNum,
          "ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย": totalBoxSold,
          "ราคาที่ขาย (บาท)": Number(item.unitPrice) || 0,
          "ราคาที่ขายรวม (บาท)": Number(item.totalPrice) || 0,
          เลขที่คำสั่งขาย: salesOrderNo,

          วันที่สร้างออเดอร์: formattedDate,
          สถานะ: statusThai,

          ชื่อสินค้า: item.name || "",

          หน่วยนับ: item.unit || item.product?.unit || "",

          "ยอดรวมสินค้า (บาท)": Number(sale.subtotalAmount) || 0,
          "ค่าจัดส่ง (บาท)": Number(sale.shippingCost) || 0,
          "ส่วนลดหน้าบิล (บาท)": Number(sale.otherCosts) || 0,
          "ยอดรวมสุทธิ (บาท)": Number(sale.totalAmount) || 0,
          หมายเหตุ: sale.notes || "",
        });
      }
    } else {
      rows.push({
        ปี: saleYear,
        ประเภทข้อมูล: dataTypeLabel,
        เดือน: saleMonth,
        กรุ๊ป: "-",
        กลุ่มสาร: "-",
        ชื่อสามัญ: "-",
        รหัสสินค้า: "-",
        ชื่อการค้า: "-",
        ขนาดบรรจุ: "-",
        ขนาดบรรจุรวมต่อลัง: 0,
        พนักงานขาย: sale.employee?.name || "",
        ภูมิภาค: regionStr,
        ชื่อลูกค้า: sale.customer?.name || "",
        จังหวัด: sale.customer?.province || "",
        จำนวนที่ขาย: 0,
        "ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย": 0,
        "ราคาที่ขาย (บาท)": 0,
        "ราคาที่ขายรวม (บาท)": 0,
        เลขที่คำสั่งขาย: salesOrderNo,
        วันที่สร้างออเดอร์: formattedDate,
        สถานะ: statusThai,

        ชื่อสินค้า: "-",

        หน่วยนับ: "-",

        "ยอดรวมสินค้า (บาท)": Number(sale.subtotalAmount) || 0,
        "ค่าจัดส่ง (บาท)": Number(sale.shippingCost) || 0,
        "ส่วนลดหน้าบิล (บาท)": Number(sale.otherCosts) || 0,
        "ยอดรวมสุทธิ (บาท)": Number(sale.totalAmount) || 0,
        หมายเหตุ: sale.notes || "",
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 10 }, // ปี
    { wch: 15 }, // ประเภทข้อมูล
    { wch: 10 }, // เดือน
    { wch: 15 }, // กรุ๊ป
    { wch: 20 }, // กลุ่มสาร
    { wch: 20 }, // ชื่อสามัญ
    { wch: 15 }, // รหัสสินค้า
    { wch: 20 }, // ชื่อการค้า
    { wch: 18 }, // ขนาดบรรจุ
    { wch: 20 }, // ขนาดบรรจุรวมต่อลัง
    { wch: 20 }, // พนักงานขาย
    { wch: 15 }, // ภูมิภาค
    { wch: 25 }, // ชื่อลูกค้า
    { wch: 15 }, // จังหวัด
    { wch: 10 }, // จำนวนที่ขาย
    { wch: 30 }, // ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย
    { wch: 20 }, // เลขที่คำสั่งขาย
    { wch: 15 }, // วันที่สร้างออเดอร์
    { wch: 18 }, // สถานะ

    { wch: 25 }, // ชื่อสินค้า

    { wch: 10 }, // หน่วยนับ

    { wch: 18 }, // ราคาต่อหน่วย
    { wch: 18 }, // ราคารวมสินค้า
    { wch: 18 }, // ยอดรวมสินค้า
    { wch: 14 }, // ค่าจัดส่ง
    { wch: 18 }, // ส่วนลดหน้าบิล
    { wch: 18 }, // ยอดรวมสุทธิ
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
