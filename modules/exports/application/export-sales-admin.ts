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
    const saleMonth = saleDateObj ? format(saleDateObj, "MM") : "";
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
        const productGroupStr =
          item.productGroupName ||
          item.product?.productGroup?.name ||
          item.product?.productGroup?.code ||
          "";
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
          เดือน: saleMonth,
          เลขที่ออเดอร์: sale.saleNumber,
          เลขที่คำสั่งขาย: salesOrderNo,
          วันที่สร้างออเดอร์: formattedDate,
          ประเภทข้อมูล: dataTypeLabel,
          สถานะ: statusThai,
          ภูมิภาค: regionStr,
          ชื่อลูกค้า: sale.customer?.name || "",
          จังหวัด: sale.customer?.province || "",
          พนักงานขาย: sale.employee?.name || "",
          "กรุ๊ป ABC": abcGroup,
          กลุ่มสาร: productGroupStr,
          ชื่อสามัญ: commonNameStr,
          ชื่อการค้า: tradeNameStr,
          รหัสสินค้า: item.productCode || "",
          ชื่อสินค้า: item.name || "",
          ขนาดบรรจุ: packageSizeStr,
          ขนาดบรรจุรวมต่อลัง: totalPerBox,
          จำนวน: quantityNum,
          หน่วยนับ: item.unit || item.product?.unit || "",
          "ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย": totalBoxSold,
          "ราคาต่อหน่วย (บาท)": Number(item.unitPrice) || 0,
          "ราคารวมสินค้า (บาท)": Number(item.totalPrice) || 0,
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
        เดือน: saleMonth,
        เลขที่ออเดอร์: sale.saleNumber,
        เลขที่คำสั่งขาย: salesOrderNo,
        วันที่สร้างออเดอร์: formattedDate,
        ประเภทข้อมูล: dataTypeLabel,
        สถานะ: statusThai,
        ภูมิภาค: regionStr,
        ชื่อลูกค้า: sale.customer?.name || "",
        จังหวัด: sale.customer?.province || "",
        พนักงานขาย: sale.employee?.name || "",
        "กรุ๊ป ABC": "-",
        กลุ่มสาร: "-",
        ชื่อสามัญ: "-",
        ชื่อการค้า: "-",
        รหัสสินค้า: "-",
        ชื่อสินค้า: "-",
        ขนาดบรรจุ: "-",
        ขนาดบรรจุรวมต่อลัง: 0,
        จำนวน: 0,
        หน่วยนับ: "-",
        "ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย": 0,
        "ราคาต่อหน่วย (บาท)": 0,
        "ราคารวมสินค้า (บาท)": 0,
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
    { wch: 10 }, // เดือน
    { wch: 18 }, // เลขที่ออเดอร์
    { wch: 20 }, // เลขที่คำสั่งขาย
    { wch: 15 }, // วันที่สร้างออเดอร์
    { wch: 15 }, // ประเภทข้อมูล
    { wch: 18 }, // สถานะ
    { wch: 15 }, // ภูมิภาค
    { wch: 25 }, // ชื่อลูกค้า
    { wch: 15 }, // จังหวัด
    { wch: 20 }, // พนักงานขาย
    { wch: 15 }, // กรุ๊ป ABC
    { wch: 20 }, // กลุ่มสาร
    { wch: 20 }, // ชื่อสามัญ
    { wch: 20 }, // ชื่อการค้า
    { wch: 15 }, // รหัสสินค้า
    { wch: 25 }, // ชื่อสินค้า
    { wch: 18 }, // ขนาดบรรจุ
    { wch: 20 }, // ขนาดบรรจุรวมต่อลัง
    { wch: 10 }, // จำนวน
    { wch: 10 }, // หน่วยนับ
    { wch: 30 }, // ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย
    { wch: 18 }, // ราคาต่อหน่วย
    { wch: 18 }, // ราคารวมสินค้า
    { wch: 18 }, // ยอดรวมสินค้า
    { wch: 14 }, // ค่าจัดส่ง
    { wch: 18 }, // ค่าใช้จ่ายอื่นๆ
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
