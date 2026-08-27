import ExcelJS from "exceljs";
import { format } from "date-fns";
import { getRegionFromProvince } from "@/modules/reports/application/utils";
import {
  allocateNetItemAmounts,
  resolveShipmentReportingDate,
  resolveLegacyInvoiceReportingDate,
} from "@/modules/reports/application/sales-reporting-logic";

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

function getSalesOrderNumber(sale: any): string {
  if (sale.shipments && sale.shipments.length > 0) {
    const shipmentWithRef = sale.shipments.find(
      (s: any) => s.salesOrderNumber && s.salesOrderNumber.trim() !== "",
    );
    if (shipmentWithRef) {
      return shipmentWithRef.salesOrderNumber.trim();
    }
  }
  return sale.saleOrderRef?.trim() || sale.saleNumber?.trim() || "";
}

function formatCustomerName(name?: string | null): string {
  const trimmed = name?.trim() || "";
  if (trimmed === "เงินสด") {
    return "บริษัท เสถียรมั่นคงการเกษตร จำกัด";
  }
  return name || "";
}


function parseValidDate(value: any): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return !isNaN(d.getTime()) ? d : null;
}

function roundNumber(num: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Calculate volume/weight in Liters (L) or Kilograms (KG) per sales unit and total sold
 */
export function calculateLitersOrKg(item: {
  quantity?: number | null;
  packageSize?: number | string | null;
  packageSizeUnit?: string | null;
  packageSizePerBox?: number | string | null;
  totalPackageSizePerBox?: number | string | null;
  unit?: string | null;
  product?: {
    packageSize?: number | string | null;
    packageSizeUnit?: string | null;
    packageSizePerBox?: number | string | null;
    totalPackageSizePerBox?: number | string | null;
    unit?: string | null;
  } | null;
}): {
  litersOrKgPerUnit: number;
  totalLitersOrKg: number;
} {
  const rawSize =
    item.packageSize ?? item.product?.packageSize ?? 0;
  const rawUnit = (
    item.packageSizeUnit ??
    item.product?.packageSizeUnit ??
    ""
  )
    .trim()
    .toUpperCase();
  const rawPerBox =
    item.packageSizePerBox ??
    item.product?.packageSizePerBox ??
    1;
  const rawTotalPerBox =
    item.totalPackageSizePerBox ??
    item.product?.totalPackageSizePerBox;

  const size = Number(rawSize) || 0;
  const perBox = Number(rawPerBox) || 1;

  function rawTotalTotalSafe(val: any) {
    return val;
  }

  let baseTotalPerBox = 0;
  if (rawTotalPerBox != null && !isNaN(Number(rawTotalTotalSafe(rawTotalPerBox)))) {
    baseTotalPerBox = Number(rawTotalPerBox);
  } else {
    baseTotalPerBox = size * perBox;
  }

  let convertedPerUnit = 0;
  if (
    [
      "CC",
      "ซีซี",
      "ML",
      "มล.",
      "มิลลิลิตร",
      "G",
      "กรัม",
      "GM",
      "GR",
    ].includes(rawUnit)
  ) {
    convertedPerUnit = baseTotalPerBox / 1000;
  } else if (
    [
      "L",
      "KG",
      "กก.",
      "กก",
      "ลิตร",
      "กิโลกรัม",
      "L.",
      "KG.",
      "LTR",
      "LITER",
      "LITRE",
      "KILO",
      "KILOGRAM",
    ].includes(rawUnit)
  ) {
    convertedPerUnit = baseTotalPerBox;
  } else {
    convertedPerUnit = baseTotalPerBox;
  }

  const roundedPerUnit = roundNumber(convertedPerUnit, 4);
  const quantity = Number(item.quantity) || 0;
  const totalLitersOrKg = roundNumber(quantity * roundedPerUnit, 4);

  return {
    litersOrKgPerUnit: roundedPerUnit,
    totalLitersOrKg: totalLitersOrKg,
  };
}

const MONTH_NAMES_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getUtcMonthStr(d: Date): string {
  return MONTH_NAMES_EN[d.getUTCMonth()] || "";
}

function getUtcYearStr(d: Date): string {
  return d.getUTCFullYear().toString();
}

function getUtcFormattedDate(d: Date): string {
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = d.getUTCFullYear().toString();
  return `${day}/${month}/${year}`;
}

function createSaleEventRows(
  sale: any,
  eventType: "Sales Note" | "Invoice",
  eventDate: Date,
): any[] {
  const saleDateObj = parseValidDate(sale.saleDate);
  const formattedDate = saleDateObj ? getUtcFormattedDate(saleDateObj) : "";

  const paymentDateRaw =
    sale.paymentDate ||
    (sale.shipments && sale.shipments.length > 0
      ? sale.shipments.find((s: any) => s.paymentDate)?.paymentDate
      : null);
  const paymentDateObj = parseValidDate(paymentDateRaw);
  const paymentDateStr = paymentDateObj
    ? getUtcFormattedDate(paymentDateObj)
    : "";

  const statusThai = SALE_STATUS_MAP[sale.status] || sale.status;
  const isInvoice = eventType === "Invoice";

  // Column "Inv"
  const deliveryDateStr = isInvoice ? getUtcFormattedDate(eventDate) : "";

  // Column "เดือน" and "ปี"
  const saleMonth = getUtcMonthStr(eventDate);
  const saleYear = getUtcYearStr(eventDate);
  const regionStr =
    sale.region ||
    (sale.customer?.province
      ? getRegionFromProvince(sale.customer.province)
      : "") ||
    "";
  const salesOrderNo = getSalesOrderNumber(sale);
  const customerName = formatCustomerName(sale.customer?.name);

  const saleTotal = Number(sale.totalAmount || 0);
  const items = sale.items || [];
  const netAmounts = allocateNetItemAmounts(items, saleTotal);

  const rows: any[] = [];

  if (items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const product = item.product || {};

      const abcGroup =
        item.productABCTypeName ||
        product.productABCType?.name ||
        product.productABCType?.code ||
        "";

      const categoryRaw =
        item.categoryName ||
        product.category?.description ||
        product.category?.code ||
        "";
      const productGroupStr = categoryRaw
        ? categoryRaw.split(":")[0].trim()
        : "";

      const commonNameStr = item.commonName || product.commonName || "";
      const tradeNameStr =
        item.tradeNameGroupName ||
        product.tradeNameGroup?.description ||
        item.name ||
        "";

      const pkgSizeRaw = item.packageSize ?? product.packageSize;
      const pkgUnitRaw =
        item.packageSizeUnit ?? product.packageSizeUnit ?? "";
      const packageSizeStr =
        pkgSizeRaw != null
          ? `${Number(pkgSizeRaw)} ${pkgUnitRaw}`.trim()
          : "";

      const { litersOrKgPerUnit, totalLitersOrKg } = calculateLitersOrKg(item);
      const quantityNum = Number(item.quantity) || 0;
      const netItemPrice = netAmounts[i] ?? 0;

      rows.push({
        year: saleYear,
        dataTypeLabel: eventType,
        month: saleMonth,
        abcGroup: abcGroup || "-",
        productGroupStr: productGroupStr || "-",
        commonNameStr: commonNameStr || "-",
        productCode: item.productCode || product.productCode || "-",
        tradeNameStr: tradeNameStr || "-",
        packageSizeStr: packageSizeStr || "-",
        totalPerBox: litersOrKgPerUnit,

        employeeNickname: sale.employee?.nickname || "",
        regionStr: regionStr,
        customerName: customerName,
        province: sale.customer?.province || "",
        quantityNum: quantityNum,
        totalBoxSold: totalLitersOrKg,
        totalItemPrice: netItemPrice,
        paymentDateStr: paymentDateStr,
        salesOrderNo: salesOrderNo,
        deliveryDateStr: deliveryDateStr,
        notes: sale.notes || "",

        formattedDate: formattedDate,
        unitPrice: Number(item.unitPrice) || 0,
        statusThai: statusThai,
        itemName: item.name || product.name || "-",
        unit: item.unit || product.unit || "-",
        subtotalAmount: Number(sale.subtotalAmount) || 0,
        shippingCost: Number(sale.shippingCost) || 0,
        otherCosts: Number(sale.otherCosts) || 0,
        totalAmount: saleTotal,
        managerNotes: sale.managerNotes || "",
        employeeName: sale.employee?.name || "",
        _sortDate: eventDate.getTime(),
      });
    }
  } else {
    rows.push({
      year: saleYear,
      dataTypeLabel: eventType,
      month: saleMonth,
      abcGroup: "-",
      productGroupStr: "-",
      commonNameStr: "-",
      productCode: "-",
      tradeNameStr: "-",
      packageSizeStr: "-",
      totalPerBox: "-",

      employeeNickname: sale.employee?.nickname || "",
      regionStr: regionStr,
      customerName: customerName,
      province: sale.customer?.province || "",
      quantityNum: 0,
      totalBoxSold: "-",
      totalItemPrice: saleTotal,
      paymentDateStr: paymentDateStr,
      salesOrderNo: salesOrderNo,
      deliveryDateStr: deliveryDateStr,
      notes: sale.notes || "",

      formattedDate: formattedDate,
      unitPrice: 0,
      statusThai: statusThai,
      itemName: "-",
      unit: "-",
      subtotalAmount: Number(sale.subtotalAmount) || 0,
      shippingCost: Number(sale.shippingCost) || 0,
      otherCosts: Number(sale.otherCosts) || 0,
      totalAmount: saleTotal,
      managerNotes: sale.managerNotes || "",
      employeeName: sale.employee?.name || "",
      _sortDate: eventDate.getTime(),
    });
  }

  return rows;
}

function createShipmentEventRows(
  shipment: any,
  eventDate: Date,
): any[] {
  const sale = shipment.sale || {};
  const saleDateObj = parseValidDate(sale.saleDate);
  const formattedDate = saleDateObj ? getUtcFormattedDate(saleDateObj) : "";

  const paymentDateRaw = shipment.paymentDate || sale.paymentDate;
  const paymentDateObj = parseValidDate(paymentDateRaw);
  const paymentDateStr = paymentDateObj
    ? getUtcFormattedDate(paymentDateObj)
    : "";

  const statusThai = SALE_STATUS_MAP[sale.status] || sale.status || "จัดส่งแล้ว";
  const deliveryDateStr = getUtcFormattedDate(eventDate);

  const saleMonth = getUtcMonthStr(eventDate);
  const saleYear = getUtcYearStr(eventDate);
  const regionStr =
    sale.region ||
    (sale.customer?.province
      ? getRegionFromProvince(sale.customer.province)
      : "") ||
    "";
  const salesOrderNo =
    shipment.salesOrderNumber?.trim() ||
    sale.saleOrderRef?.trim() ||
    sale.saleNumber?.trim() ||
    "";
  const customerName = formatCustomerName(sale.customer?.name);

  const shipmentTotal = Number(shipment.totalAmount || 0);
  const items = shipment.items || [];
  const netAmounts = allocateNetItemAmounts(items, shipmentTotal);

  const rows: any[] = [];

  if (items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const saleItem = item.saleItem || {};
      const product = saleItem.product || {};

      const abcGroup =
        saleItem.productABCTypeName ||
        product.productABCType?.name ||
        product.productABCType?.code ||
        "";

      const categoryRaw =
        saleItem.categoryName ||
        product.category?.description ||
        product.category?.code ||
        "";
      const productGroupStr = categoryRaw
        ? categoryRaw.split(":")[0].trim()
        : "";

      const commonNameStr = saleItem.commonName || product.commonName || "";
      const tradeNameStr =
        saleItem.tradeNameGroupName ||
        product.tradeNameGroup?.description ||
        saleItem.name ||
        "";

      const pkgSizeRaw = saleItem.packageSize ?? product.packageSize;
      const pkgUnitRaw =
        saleItem.packageSizeUnit ?? product.packageSizeUnit ?? "";
      const packageSizeStr =
        pkgSizeRaw != null
          ? `${Number(pkgSizeRaw)} ${pkgUnitRaw}`.trim()
          : "";

      const quantityNum = Number(item.quantity) || 0;
      const { litersOrKgPerUnit } = calculateLitersOrKg(saleItem);
      const totalBoxSold = roundNumber(quantityNum * litersOrKgPerUnit, 4);

      const netItemPrice = netAmounts[i] ?? 0;
      const unitPrice = Number(item.unitPrice || saleItem.unitPrice) || 0;

      rows.push({
        year: saleYear,
        dataTypeLabel: "Invoice",
        month: saleMonth,
        abcGroup: abcGroup || "-",
        productGroupStr: productGroupStr || "-",
        commonNameStr: commonNameStr || "-",
        productCode: saleItem.productCode || product.productCode || "-",
        tradeNameStr: tradeNameStr || "-",
        packageSizeStr: packageSizeStr || "-",
        totalPerBox: litersOrKgPerUnit,

        employeeNickname: sale.employee?.nickname || "",
        regionStr: regionStr,
        customerName: customerName,
        province: sale.customer?.province || "",
        quantityNum: quantityNum,
        totalBoxSold: totalBoxSold,
        totalItemPrice: netItemPrice,
        paymentDateStr: paymentDateStr,
        salesOrderNo: salesOrderNo,
        deliveryDateStr: deliveryDateStr,
        notes: shipment.notes || sale.notes || "",

        formattedDate: formattedDate,
        unitPrice: unitPrice,
        statusThai: statusThai,
        itemName: saleItem.name || product.name || "-",
        unit: saleItem.unit || product.unit || "-",
        subtotalAmount: shipmentTotal,
        shippingCost: 0,
        otherCosts: Number(shipment.billDiscount) || 0,
        totalAmount: shipmentTotal,
        managerNotes: sale.managerNotes || "",
        employeeName: sale.employee?.name || "",
        _sortDate: eventDate.getTime(),
      });
    }
  } else {
    rows.push({
      year: saleYear,
      dataTypeLabel: "Invoice",
      month: saleMonth,
      abcGroup: "-",
      productGroupStr: "-",
      commonNameStr: "-",
      productCode: "-",
      tradeNameStr: "-",
      packageSizeStr: "-",
      totalPerBox: "-",

      employeeNickname: sale.employee?.nickname || "",
      regionStr: regionStr,
      customerName: customerName,
      province: sale.customer?.province || "",
      quantityNum: 0,
      totalBoxSold: "-",
      totalItemPrice: shipmentTotal,
      paymentDateStr: paymentDateStr,
      salesOrderNo: salesOrderNo,
      deliveryDateStr: deliveryDateStr,
      notes: shipment.notes || sale.notes || "",

      formattedDate: formattedDate,
      unitPrice: 0,
      statusThai: statusThai,
      itemName: "-",
      unit: "-",
      subtotalAmount: shipmentTotal,
      shippingCost: 0,
      otherCosts: Number(shipment.billDiscount) || 0,
      totalAmount: shipmentTotal,
      managerNotes: sale.managerNotes || "",
      employeeName: sale.employee?.name || "",
      _sortDate: eventDate.getTime(),
    });
  }

  return rows;
}

export async function buildSalesAdminExportWorkbook(
  exportData: any[] | {
    sales?: any[];
    shipments?: any[];
    targets?: any[];
    filterStatus?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<string> {
  const sales = Array.isArray(exportData) ? exportData : exportData.sales || [];
  const shipments = Array.isArray(exportData) ? [] : exportData.shipments || [];
  const targets = Array.isArray(exportData) ? [] : exportData.targets || [];
  const filterStatus = Array.isArray(exportData) ? undefined : exportData.filterStatus;
  const startDate = Array.isArray(exportData) ? undefined : exportData.startDate;
  const endDate = Array.isArray(exportData) ? undefined : exportData.endDate;

  const allRows: any[] = [];

  const includeSalesNotes = !filterStatus || filterStatus === "ALL" || filterStatus === "SALES_NOTE";
  const includeInvoices = !filterStatus || filterStatus === "ALL" || filterStatus === "INVOICE";

  // 1. Process Sales Note Events (Creation of order)
  if (includeSalesNotes) {
    for (const sale of sales) {
      if (sale.status === "CANCELLED" || sale.deletedAt) continue;
      const saleDateObj = parseValidDate(sale.saleDate);
      if (!saleDateObj) continue;

      // Extract UTC date string matching Postgres EXTRACT
      const sDay = saleDateObj.getUTCDate().toString().padStart(2, "0");
      const sMonth = (saleDateObj.getUTCMonth() + 1).toString().padStart(2, "0");
      const sYear = saleDateObj.getUTCFullYear().toString();
      const saleDateStr = `${sYear}-${sMonth}-${sDay}`;

      if (startDate && saleDateStr < startDate) continue;
      if (endDate && saleDateStr > endDate) continue;

      allRows.push(...createSaleEventRows(sale, "Sales Note", saleDateObj));
    }
  }

  // 2. Process Invoice Events (Realization of delivery)
  if (includeInvoices) {
    // 2.1 Process Shipments with delivered / in-transit / completed status
    for (const sh of shipments) {
      if (sh.status === "CANCELLED" || sh.status === "PENDING") continue;
      const invDateObj = resolveShipmentReportingDate(sh, sh.sale);
      if (!invDateObj) continue;

      const iDay = invDateObj.getUTCDate().toString().padStart(2, "0");
      const iMonth = (invDateObj.getUTCMonth() + 1).toString().padStart(2, "0");
      const iYear = invDateObj.getUTCFullYear().toString();
      const invDateStr = `${iYear}-${iMonth}-${iDay}`;

      if (startDate && invDateStr < startDate) continue;
      if (endDate && invDateStr > endDate) continue;

      allRows.push(...createShipmentEventRows(sh, invDateObj));
    }

    // 2.2 Process Legacy Sales with No Shipment
    const legacySales = sales.filter((s) => {
      const hasNoShipments = !s.shipments || s.shipments.length === 0;
      const isInvoiceStatus = ["PAID", "DELIVERY_COMPLETED", "COMPLETED"].includes(s.status);
      return hasNoShipments && isInvoiceStatus && !s.deletedAt;
    });

    for (const sale of legacySales) {
      const invDateObj = resolveLegacyInvoiceReportingDate(sale);
      if (!invDateObj) continue;

      const iDay = invDateObj.getUTCDate().toString().padStart(2, "0");
      const iMonth = (invDateObj.getUTCMonth() + 1).toString().padStart(2, "0");
      const iYear = invDateObj.getUTCFullYear().toString();
      const invDateStr = `${iYear}-${iMonth}-${iDay}`;

      if (startDate && invDateStr < startDate) continue;
      if (endDate && invDateStr > endDate) continue;

      allRows.push(...createSaleEventRows(sale, "Invoice", invDateObj));
    }
  }

  // Sort rows by event date descending
  allRows.sort((a, b) => (b._sortDate || 0) - (a._sortDate || 0));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Admin Data");

  worksheet.columns = [
    { header: "ปี", key: "year", width: 10 },
    { header: "ข้อมูล", key: "dataTypeLabel", width: 15 },
    { header: "เดือน", key: "month", width: 10 },
    { header: "กรุ๊ป", key: "abcGroup", width: 15 },
    { header: "กลุ่มสาร", key: "productGroupStr", width: 20 },
    { header: "ชื่อสามัญ", key: "commonNameStr", width: 20 },
    { header: "รหัสสินค้า", key: "productCode", width: 15 },
    { header: "ชื่อการค้า", key: "tradeNameStr", width: 20 },
    { header: "ขนาด", key: "packageSizeStr", width: 18 },
    { header: "ลิตร/กก.", key: "totalPerBox", width: 20 },

    { header: "พนักงานขาย", key: "employeeNickname", width: 15 },
    { header: "ภูมิภาค", key: "regionStr", width: 15 },
    { header: "ร้านค้า", key: "customerName", width: 25 },
    { header: "จังหวัด", key: "province", width: 15 },
    { header: "SALES BY Q (Carton)", key: "quantityNum", width: 10 },
    { header: "ผลรวมลิตร/กก.", key: "totalBoxSold", width: 30 },
    { header: "SALES BY VALUE (฿)", key: "totalItemPrice", width: 18 },
    { header: "Remark / Price", key: "paymentDateStr", width: 15 },
    { header: "SN", key: "salesOrderNo", width: 20 },
    { header: "Inv", key: "deliveryDateStr", width: 15 },
    { header: "REMARK", key: "notes", width: 25 },

    { header: "วันที่สร้างออเดอร์", key: "formattedDate", width: 15 },
    { header: "ราคาที่ขาย", key: "unitPrice", width: 18 },
    { header: "สถานะ", key: "statusThai", width: 18 },
    { header: "ชื่อสินค้า", key: "itemName", width: 25 },
    { header: "หน่วยนับ", key: "unit", width: 10 },
    { header: "ยอดรวมสินค้า", key: "subtotalAmount", width: 18 },
    { header: "ค่าจัดส่ง", key: "shippingCost", width: 14 },
    { header: "ส่วนลดหน้าบิล", key: "otherCosts", width: 18 },
    { header: "ยอดรวมสุทธิ", key: "totalAmount", width: 18 },
    { header: "หมายเหตุของผู้จัดการ", key: "managerNotes", width: 25 },
    { header: "ชื่อ-สกุล พนักงานขาย", key: "employeeName", width: 20 },
  ];

  for (const row of allRows) {
    worksheet.addRow(row);
  }

  // 2. Process SalesTarget (Forecast) records
  for (const target of targets) {
    const saleYear = target.year ? target.year.toString() : "";
    const saleMonth = target.month
      ? format(new Date(target.year, target.month - 1, 1), "MMM")
      : "";
    const dataTypeLabel = "Forecast-Month";
    const statusThai = "เป้าหมายการขาย";
    const employeeName = target.employee?.name || "";
    const employeeNickname = target.employee?.nickname || "";

    if (target.stores && target.stores.length > 0) {
      for (const store of target.stores) {
        const regionStr =
          target.region ||
          (store.customer?.province
            ? getRegionFromProvince(store.customer.province)
            : "") ||
          "";
        const province = store.customer?.province || "";
        const customerName = formatCustomerName(store.customer?.name);

        if (store.items && store.items.length > 0) {
          for (const item of store.items) {
            const product = item.product;
            const abcGroup =
              product?.productABCType?.name ||
              product?.productABCType?.code ||
              "";

            const categoryRaw =
              product?.category?.description || product?.category?.code || "";
            const productGroupStr = categoryRaw
              ? categoryRaw.split(":")[0].trim()
              : "";

            const commonNameStr = product?.commonName || "";
            const tradeNameStr =
              product?.tradeNameGroup?.description || product?.name || "";

            const pkgSizeRaw = product?.packageSize;
            const pkgUnitRaw = product?.packageSizeUnit ?? "";
            const packageSizeStr =
              pkgSizeRaw != null
                ? `${Number(pkgSizeRaw)} ${pkgUnitRaw}`.trim()
                : "";

            const { litersOrKgPerUnit, totalLitersOrKg } = calculateLitersOrKg({
              quantity: item.qtyPerBox,
              product: product,
            });

            const quantityNum = item.qtyPerBox || 0;
            const pricePerBox = Number(item.pricePerBox) || 0;
            const targetAmount = Number(item.targetAmount) || 0;

            worksheet.addRow({
              year: saleYear,
              dataTypeLabel: dataTypeLabel,
              month: saleMonth,
              abcGroup: abcGroup,
              productGroupStr: productGroupStr,
              commonNameStr: commonNameStr,
              productCode: product?.productCode || "",
              tradeNameStr: tradeNameStr,
              packageSizeStr: packageSizeStr,
              totalPerBox: litersOrKgPerUnit,

              employeeNickname: employeeNickname,
              regionStr: regionStr,
              customerName: customerName,
              province: province,
              quantityNum: quantityNum,
              totalBoxSold: totalLitersOrKg,
              totalItemPrice: targetAmount,
              paymentDateStr: pricePerBox,
              salesOrderNo: "-",
              deliveryDateStr: "-",
              notes: "เป้าหมายการขาย",

              formattedDate: "-",
              unitPrice: pricePerBox,
              statusThai: statusThai,
              itemName: product?.name || "",
              unit: product?.unit || "",
              subtotalAmount: targetAmount,
              shippingCost: 0,
              otherCosts: 0,
              totalAmount: targetAmount,
              managerNotes: "-",
              employeeName: employeeName,
            });
          }
        } else {
          worksheet.addRow({
            year: saleYear,
            dataTypeLabel: dataTypeLabel,
            month: saleMonth,
            abcGroup: "-",
            productGroupStr: "-",
            commonNameStr: "-",
            productCode: "-",
            tradeNameStr: "-",
            packageSizeStr: "-",
            totalPerBox: "-",

            employeeNickname: employeeNickname,
            regionStr: regionStr,
            customerName: customerName,
            province: province,
            quantityNum: 0,
            totalBoxSold: "-",
            totalItemPrice: 0,
            paymentDateStr: 0,
            salesOrderNo: "-",
            deliveryDateStr: "-",
            notes: "เป้าหมายการขาย",

            formattedDate: "-",
            unitPrice: 0,
            statusThai: statusThai,
            itemName: "-",
            unit: "-",
            subtotalAmount: 0,
            shippingCost: 0,
            otherCosts: 0,
            totalAmount: 0,
            managerNotes: "-",
            employeeName: employeeName,
          });
        }
      }
    }
  }

  // Set Angsana New font for all rows and cells, format numbers & alignments
  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = {
        name: "Angsana New",
        size: 14,
        bold: rowNumber === 1,
      };
      cell.alignment = {
        vertical: "middle",
        horizontal:
          rowNumber === 1
            ? "center"
            : [1, 2, 3, 4, 7, 11, 12, 14, 18, 19, 20, 22, 24, 26].includes(
                colNumber,
              )
              ? "center"
              : [10, 15, 16, 17, 23, 27, 28, 29, 30].includes(colNumber)
                ? "right"
                : "left",
      };

      // Number formatting for numeric columns when row > 1
      if (rowNumber > 1 && typeof cell.value === "number") {
        if (colNumber === 10 || colNumber === 16) {
          // ลิตร/กก. and ผลรวมลิตร/กก. (ถ้าเป็นจำนวนเต็มไม่แสดงจุดทศนิยม เช่น 6, ถ้ามีทศนิยมแสดงตามจริง เช่น 1.2)
          cell.numFmt = Number.isInteger(cell.value) ? "#,##0" : "#,##0.####";
        } else if (colNumber === 15) {
          // SALES BY Q (Carton)
          cell.numFmt = "#,##0";
        } else if (
          [17, 23, 27, 28, 29, 30].includes(colNumber)
        ) {
          // Money fields
          cell.numFmt = "#,##0.00";
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

