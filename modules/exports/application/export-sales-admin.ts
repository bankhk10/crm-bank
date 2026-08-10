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

    const paymentDateRaw =
      sale.paymentDate ||
      (sale.shipments && sale.shipments.length > 0
        ? sale.shipments.find((s: any) => s.paymentDate)?.paymentDate
        : null);
    const paymentDateObj = paymentDateRaw ? new Date(paymentDateRaw) : null;
    const paymentDateStr = paymentDateObj
      ? format(paymentDateObj, "dd/MM/yyyy")
      : "";

    const deliveryDateRaw =
      sale.actualDeliveryDate ||
      sale.deliveryDate ||
      (sale.shipments && sale.shipments.length > 0
        ? sale.shipments.find((s: any) => s.actualDate || s.scheduledDate)
            ?.actualDate ||
          sale.shipments.find((s: any) => s.actualDate || s.scheduledDate)
            ?.scheduledDate
        : null);
    const deliveryDateObj = deliveryDateRaw ? new Date(deliveryDateRaw) : null;
    const deliveryDateStr = deliveryDateObj
      ? format(deliveryDateObj, "dd/MM/yyyy")
      : "";

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
          ข้อมูล: dataTypeLabel,
          เดือน: saleMonth,
          กรุ๊ป: abcGroup,
          กลุ่มสาร: productGroupStr,
          ชื่อสามัญ: commonNameStr,
          รหัสสินค้า: item.productCode || "",
          ชื่อการค้า: tradeNameStr,
          ขนาด: packageSizeStr,
          "ลิตร/กก.": totalPerBox,

          พนักงานขาย: sale.employee?.nickname || "",
          ภูมิภาค: regionStr,
          ร้านค้า: sale.customer?.name || "",
          จังหวัด: sale.customer?.province || "",
          "SALES BY Q (Carton)": quantityNum,
          "ผลรวมลิตร/กก.": totalBoxSold,
          "SALES BY VALUE (฿)": Number(item.totalPrice) || 0,
          "Remark / Price": paymentDateStr,
          SN: salesOrderNo,
          Inv: deliveryDateStr,
          REMARK: sale.notes || "",

          วันที่สร้างออเดอร์: formattedDate,
          ราคาที่ขาย: Number(item.unitPrice) || 0,
          สถานะ: statusThai,
          ชื่อสินค้า: item.name || "",
          หน่วยนับ: item.unit || item.product?.unit || "",
          ยอดรวมสินค้า: Number(sale.subtotalAmount) || 0,
          ค่าจัดส่ง: Number(sale.shippingCost) || 0,
          ส่วนลดหน้าบิล: Number(sale.otherCosts) || 0,
          ยอดรวมสุทธิ: Number(sale.totalAmount) || 0,
          หมายเหตุของผู้จัดการ: sale.managerNotes || "",
          "ชื่อ-สกุล พนักงานขาย": sale.employee?.name || "",
        });
      }
    } else {
      rows.push({
        ปี: saleYear,
        ข้อมูล: dataTypeLabel,
        เดือน: saleMonth,
        กรุ๊ป: "-",
        กลุ่มสาร: "-",
        ชื่อสามัญ: "-",
        รหัสสินค้า: "-",
        ชื่อการค้า: "-",
        ขนาด: "-",
        "ลิตร/กก.": 0,

        พนักงานขาย: sale.employee?.nickname || "",
        ภูมิภาค: regionStr,
        ร้านค้า: sale.customer?.name || "",
        จังหวัด: sale.customer?.province || "",
        "SALES BY Q (Carton)": 0,
        "ผลรวมลิตร/กก.": 0,
        "SALES BY VALUE (฿)": 0,
        "Remark / Price": paymentDateStr,
        SN: salesOrderNo,
        Inv: deliveryDateStr,
        REMARK: sale.notes || "",

        วันที่สร้างออเดอร์: formattedDate,
        ราคาที่ขาย: 0,
        สถานะ: statusThai,
        ชื่อสินค้า: "-",
        หน่วยนับ: "-",
        ยอดรวมสินค้า: Number(sale.subtotalAmount) || 0,
        ค่าจัดส่ง: Number(sale.shippingCost) || 0,
        ส่วนลดหน้าบิล: Number(sale.otherCosts) || 0,
        ยอดรวมสุทธิ: Number(sale.totalAmount) || 0,
        หมายเหตุของผู้จัดการ: sale.managerNotes || "",
        "ชื่อ-สกุล พนักงานขาย": sale.employee?.name || "",
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 10 }, // ปี
    { wch: 15 }, // ข้อมูล
    { wch: 10 }, // เดือน
    { wch: 15 }, // กรุ๊ป
    { wch: 20 }, // กลุ่มสาร
    { wch: 20 }, // ชื่อสามัญ
    { wch: 15 }, // รหัสสินค้า
    { wch: 20 }, // ชื่อการค้า
    { wch: 18 }, // ขนาด
    { wch: 20 }, // ลิตร/กก.
    { wch: 15 }, // พนักงานขาย
    { wch: 15 }, // ภูมิภาค
    { wch: 25 }, // ร้านค้า
    { wch: 15 }, // จังหวัด
    { wch: 10 }, // SALES BY Q (Carton)
    { wch: 30 }, // ผลรวมลิตร/กก.
    { wch: 18 }, // SALES BY VALUE (฿)
    { wch: 15 }, // Remark / Price
    { wch: 20 }, // SN
    { wch: 15 }, // Inv
    { wch: 25 }, // REMARK

    { wch: 15 }, // วันที่สร้างออเดอร์
    { wch: 18 }, // ราคาที่ขาย
    { wch: 18 }, // สถานะ
    { wch: 25 }, // ชื่อสินค้า
    { wch: 10 }, // หน่วยนับ
    { wch: 18 }, // ยอดรวมสินค้า
    { wch: 14 }, // ค่าจัดส่ง
    { wch: 18 }, // ส่วนลดหน้าบิล
    { wch: 18 }, // ยอดรวมสุทธิ
    { wch: 25 }, // หมายเหตุของผู้จัดการ
    { wch: 20 }, // ชื่อ-สกุล พนักงานขาย
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
