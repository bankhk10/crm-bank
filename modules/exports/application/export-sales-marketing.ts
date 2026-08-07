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

function getDataTypeLabel(status: string): string {
  if (status === "PENDING_APPROVAL" || status === "WAITING_FOR_CORRECTION") {
    return "Forecast";
  }
  if (status === "DELIVERY_COMPLETED" || status === "PAID" || status === "COMPLETED") {
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

export function buildSalesMarketingExportWorkbook(sales: any[]): string {
  const rows: any[] = [];

  for (const sale of sales) {
    const saleDateObj = sale.saleDate ? new Date(sale.saleDate) : null;
    const saleYear = saleDateObj ? format(saleDateObj, "yyyy") : "";
    const saleMonth = saleDateObj ? format(saleDateObj, "MM") : "";
    const formattedDate = saleDateObj ? format(saleDateObj, "dd/MM/yyyy") : "";

    const statusThai = SALE_STATUS_MAP[sale.status] || sale.status;
    const dataTypeLabel = getDataTypeLabel(sale.status);
    const regionStr = sale.region || (sale.customer?.province ? getRegionFromProvince(sale.customer.province) : "") || "";
    const salesOrderNo = getSalesOrderNumber(sale);

    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        const plantStr = Array.isArray(item.usedForPlants) ? item.usedForPlants.join(", ") : "";
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
        const productGroupStr = categoryRaw ? categoryRaw.split(":")[0].trim() : "";

        const commonNameStr = item.commonName || item.product?.commonName || "";
        const tradeNameStr =
          item.tradeNameGroupName ||
          item.product?.tradeNameGroup?.description ||
          item.name ||
          "";

        const pkgSizeRaw = item.packageSize ?? item.product?.packageSize;
        const pkgUnitRaw = item.packageSizeUnit ?? item.product?.packageSizeUnit ?? "";
        const packageSizeStr =
          pkgSizeRaw != null ? `${Number(pkgSizeRaw)} ${pkgUnitRaw}`.trim() : "";

        const totalPerBox = Number(
          item.totalPackageSizePerBox ??
            item.packageSizePerBox ??
            item.product?.totalPackageSizePerBox ??
            item.product?.packageSizePerBox ??
            0
        );

        const quantityNum = item.quantity || 0;
        const totalBoxSold = quantityNum * totalPerBox;

        rows.push({
          ปี: saleYear,
          เดือน: saleMonth,
          เลขที่เอกสารการขาย: sale.saleNumber,
          เลขที่คำสั่งขาย: salesOrderNo,
          วันที่เอกสาร: formattedDate,
          ประเภทข้อมูล: dataTypeLabel,
          สถานะ: statusThai,
          ภูมิภาค: regionStr,
          จังหวัด: sale.customer?.province || "",
          ชื่อลูกค้า: sale.customer?.name || "",
          ประเภทลูกค้า: sale.customer?.customerType || "",
          พนักงานขาย: sale.employee?.name || "",
          "กรุ๊ป ABC": abcGroup,
          กลุ่มสาร: productGroupStr,
          ชื่อสามัญ: commonNameStr,
          ชื่อการค้า: tradeNameStr,
          รหัสสินค้า: item.productCode || "",
          ชื่อสินค้า: item.name || "",
          หมวดหมู่สินค้า: item.categoryName || "",
          แบรนด์: item.brand || "",
          พืชที่ใช้: plantStr,
          ขนาดบรรจุ: packageSizeStr,
          ขนาดบรรจุรวมต่อลัง: totalPerBox,
          จำนวนที่ขาย: quantityNum,
          หน่วยนับ: item.unit || item.product?.unit || "",
          "ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย": totalBoxSold,
          "ราคาปกติต่อหน่วย (บาท)": Number(item.originalPrice) || 0,
          "ราคาขายต่อหน่วย (บาท)": Number(item.unitPrice) || 0,
          "ราคารวมยอดขาย (บาท)": Number(item.totalPrice) || 0,
          "งบโปรโมชั่นที่ใช้ (บาท)": Number(item.promotionBudget) || 0,
        });
      }
    } else {
      rows.push({
        ปี: saleYear,
        เดือน: saleMonth,
        เลขที่เอกสารการขาย: sale.saleNumber,
        เลขที่คำสั่งขาย: salesOrderNo,
        วันที่เอกสาร: formattedDate,
        ประเภทข้อมูล: dataTypeLabel,
        สถานะ: statusThai,
        ภูมิภาค: regionStr,
        จังหวัด: sale.customer?.province || "",
        ชื่อลูกค้า: sale.customer?.name || "",
        ประเภทลูกค้า: sale.customer?.customerType || "",
        พนักงานขาย: sale.employee?.name || "",
        "กรุ๊ป ABC": "-",
        กลุ่มสาร: "-",
        ชื่อสามัญ: "-",
        ชื่อการค้า: "-",
        รหัสสินค้า: "-",
        ชื่อสินค้า: "-",
        หมวดหมู่สินค้า: "-",
        แบรนด์: "-",
        พืชที่ใช้: "-",
        ขนาดบรรจุ: "-",
        ขนาดบรรจุรวมต่อลัง: 0,
        จำนวนที่ขาย: 0,
        หน่วยนับ: "-",
        "ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย": 0,
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
    { wch: 10 }, // ปี
    { wch: 10 }, // เดือน
    { wch: 18 }, // เลขที่เอกสาร
    { wch: 20 }, // เลขที่คำสั่งขาย
    { wch: 12 }, // วันที่เอกสาร
    { wch: 15 }, // ประเภทข้อมูล
    { wch: 18 }, // สถานะ
    { wch: 15 }, // ภูมิภาค
    { wch: 15 }, // จังหวัด
    { wch: 25 }, // ชื่อลูกค้า
    { wch: 15 }, // ประเภทลูกค้า
    { wch: 20 }, // พนักงานขาย
    { wch: 15 }, // กรุ๊ป ABC
    { wch: 20 }, // กลุ่มสาร
    { wch: 20 }, // ชื่อสามัญ
    { wch: 20 }, // ชื่อการค้า
    { wch: 15 }, // รหัสสินค้า
    { wch: 25 }, // ชื่อสินค้า
    { wch: 20 }, // หมวดหมู่สินค้า
    { wch: 15 }, // แบรนด์
    { wch: 20 }, // พืชที่ใช้
    { wch: 18 }, // ขนาดบรรจุ
    { wch: 20 }, // ขนาดบรรจุรวมต่อลัง
    { wch: 12 }, // จำนวนที่ขาย
    { wch: 10 }, // หน่วยนับ
    { wch: 30 }, // ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย
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
