import ExcelJS from "exceljs";
import { format } from "date-fns";
import { getRegionFromProvince } from "@/modules/reports/application/utils";
import { getInvoiceDate } from "../infrastructure/export.repository";

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
}): { litersOrKgPerUnit: number | string; totalLitersOrKg: number | string } {
  const pkgSize = Number(item.packageSize ?? item.product?.packageSize);
  const perBox = Number(
    item.packageSizePerBox ?? item.product?.packageSizePerBox ?? 1,
  );

  let baseTotalPerBox = Number(
    item.totalPackageSizePerBox ?? item.product?.totalPackageSizePerBox,
  );

  if (!baseTotalPerBox || isNaN(baseTotalPerBox)) {
    if (!isNaN(pkgSize) && pkgSize > 0) {
      baseTotalPerBox = pkgSize * (!isNaN(perBox) && perBox > 0 ? perBox : 1);
    } else {
      baseTotalPerBox = 0;
    }
  }

  const rawUnit = (
    item.packageSizeUnit ??
    item.product?.packageSizeUnit ??
    item.unit ??
    item.product?.unit ??
    ""
  )
    .trim()
    .toUpperCase();

  if (baseTotalPerBox === 0 && (isNaN(pkgSize) || pkgSize === 0)) {
    return {
      litersOrKgPerUnit: "-",
      totalLitersOrKg: "-",
    };
  }

  let convertedPerUnit = baseTotalPerBox;

  if (
    [
      "ML",
      "CC",
      "G",
      "GM",
      "GR",
      "มล.",
      "มล",
      "ซีซี",
      "กรัม",
      "ML.",
      "G.",
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
  const quantity = item.quantity || 0;
  const totalLitersOrKg = roundNumber(quantity * roundedPerUnit, 4);

  return {
    litersOrKgPerUnit: roundedPerUnit,
    totalLitersOrKg: totalLitersOrKg,
  };
}

export async function buildSalesAdminExportWorkbook(
  exportData: any[] | { sales?: any[]; targets?: any[] },
): Promise<string> {
  const sales = Array.isArray(exportData) ? exportData : exportData.sales || [];
  const targets = Array.isArray(exportData) ? [] : exportData.targets || [];

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

  // 1. Process actual Sales records
  for (const sale of sales) {
    const saleDateObj = parseValidDate(sale.saleDate);
    const saleYear = saleDateObj ? format(saleDateObj, "yyyy") : "";
    const formattedDate = saleDateObj ? format(saleDateObj, "dd/MM/yyyy") : "";

    const paymentDateRaw =
      sale.paymentDate ||
      (sale.shipments && sale.shipments.length > 0
        ? sale.shipments.find((s: any) => s.paymentDate)?.paymentDate
        : null);
    const paymentDateObj = parseValidDate(paymentDateRaw);
    const paymentDateStr = paymentDateObj
      ? format(paymentDateObj, "dd/MM/yyyy")
      : "";

    const deliveryDateObj = getInvoiceDate(sale);
    const deliveryDateStr = deliveryDateObj
      ? format(deliveryDateObj, "dd/MM/yyyy")
      : "";

    const statusThai = SALE_STATUS_MAP[sale.status] || sale.status;
    const dataTypeLabel = getDataTypeLabel(sale.status);
    const isInvoice = dataTypeLabel === "Invoice";

    // หากเป็น Invoice และมีวันที่ Inv ให้คอลัมน์ "เดือน" ยึดจาก Inv
    // หากไม่ใช่ Invoice หรือยังไม่มี Inv ให้คง Logic เดิม (ยึดจาก saleDate)
    let monthDateObj = saleDateObj;
    if (isInvoice && deliveryDateObj) {
      monthDateObj = deliveryDateObj;
    }
    const saleMonth = monthDateObj ? format(monthDateObj, "MMM") : "";
    const regionStr =
      sale.region ||
      (sale.customer?.province
        ? getRegionFromProvince(sale.customer.province)
        : "") ||
      "";
    const salesOrderNo = getSalesOrderNumber(sale);
    const customerName = formatCustomerName(sale.customer?.name);

    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        const abcGroup =
          item.productABCTypeName ||
          item.product?.productABCType?.name ||
          item.product?.productABCType?.code ||
          "";

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

        const { litersOrKgPerUnit, totalLitersOrKg } = calculateLitersOrKg(item);
        const quantityNum = item.quantity || 0;

        worksheet.addRow({
          year: saleYear,
          dataTypeLabel: dataTypeLabel,
          month: saleMonth,
          abcGroup: abcGroup,
          productGroupStr: productGroupStr,
          commonNameStr: commonNameStr,
          productCode: item.productCode || "",
          tradeNameStr: tradeNameStr,
          packageSizeStr: packageSizeStr,
          totalPerBox: litersOrKgPerUnit,

          employeeNickname: sale.employee?.nickname || "",
          regionStr: regionStr,
          customerName: customerName,
          province: sale.customer?.province || "",
          quantityNum: quantityNum,
          totalBoxSold: totalLitersOrKg,
          totalItemPrice: Number(item.totalPrice) || 0,
          paymentDateStr: paymentDateStr,
          salesOrderNo: salesOrderNo,
          deliveryDateStr: deliveryDateStr,
          notes: sale.notes || "",

          formattedDate: formattedDate,
          unitPrice: Number(item.unitPrice) || 0,
          statusThai: statusThai,
          itemName: item.name || "",
          unit: item.unit || item.product?.unit || "",
          subtotalAmount: Number(sale.subtotalAmount) || 0,
          shippingCost: Number(sale.shippingCost) || 0,
          otherCosts: Number(sale.otherCosts) || 0,
          totalAmount: Number(sale.totalAmount) || 0,
          managerNotes: sale.managerNotes || "",
          employeeName: sale.employee?.name || "",
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

        employeeNickname: sale.employee?.nickname || "",
        regionStr: regionStr,
        customerName: customerName,
        province: sale.customer?.province || "",
        quantityNum: 0,
        totalBoxSold: "-",
        totalItemPrice: 0,
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
        totalAmount: Number(sale.totalAmount) || 0,
        managerNotes: sale.managerNotes || "",
        employeeName: sale.employee?.name || "",
      });
    }
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

