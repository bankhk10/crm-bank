import ExcelJS from "exceljs";
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

export async function buildSalesMarketingExportWorkbook(
  exportData: any[] | { sales?: any[]; targets?: any[] }
): Promise<string> {
  const sales = Array.isArray(exportData) ? exportData : exportData.sales || [];
  const targets = Array.isArray(exportData) ? [] : exportData.targets || [];

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Marketing Sales Data");

  worksheet.columns = [
    { header: "ปี", key: "year", width: 10 },
    { header: "เดือน", key: "month", width: 10 },
    { header: "เลขที่เอกสารการขาย", key: "saleNumber", width: 18 },
    { header: "เลขที่คำสั่งขาย", key: "salesOrderNo", width: 20 },
    { header: "วันที่เอกสาร", key: "formattedDate", width: 12 },
    { header: "ประเภทข้อมูล", key: "dataTypeLabel", width: 15 },
    { header: "สถานะ", key: "statusThai", width: 18 },
    { header: "ภูมิภาค", key: "regionStr", width: 15 },
    { header: "จังหวัด", key: "province", width: 15 },
    { header: "ชื่อลูกค้า", key: "customerName", width: 25 },
    { header: "ประเภทลูกค้า", key: "customerType", width: 15 },
    { header: "พนักงานขาย", key: "employeeName", width: 20 },
    { header: "กรุ๊ป ABC", key: "abcGroup", width: 15 },
    { header: "กลุ่มสาร", key: "productGroupStr", width: 20 },
    { header: "ชื่อสามัญ", key: "commonNameStr", width: 20 },
    { header: "ชื่อการค้า", key: "tradeNameStr", width: 20 },
    { header: "รหัสสินค้า", key: "productCode", width: 15 },
    { header: "ชื่อสินค้า", key: "itemName", width: 25 },
    { header: "หมวดหมู่สินค้า", key: "categoryName", width: 20 },
    { header: "แบรนด์", key: "brand", width: 15 },
    { header: "พืชที่ใช้", key: "plantStr", width: 20 },
    { header: "ขนาดบรรจุ", key: "packageSizeStr", width: 18 },
    { header: "ขนาดบรรจุรวมต่อลัง", key: "totalPerBox", width: 20 },
    { header: "จำนวนที่ขาย", key: "quantityNum", width: 12 },
    { header: "หน่วยนับ", key: "unit", width: 10 },
    { header: "ผลรวม ขนาดบรรจุรวมต่อลัง ที่ขาย", key: "totalBoxSold", width: 30 },
    { header: "ราคาปกติต่อหน่วย (บาท)", key: "originalPrice", width: 20 },
    { header: "ราคาขายต่อหน่วย (บาท)", key: "unitPrice", width: 20 },
    { header: "ราคารวมยอดขาย (บาท)", key: "totalPrice", width: 20 },
    { header: "งบโปรโมชั่นที่ใช้ (บาท)", key: "promotionBudget", width: 20 },
  ];

  // 1. Process actual Sales records
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

        worksheet.addRow({
          year: saleYear,
          month: saleMonth,
          saleNumber: sale.saleNumber,
          salesOrderNo: salesOrderNo,
          formattedDate: formattedDate,
          dataTypeLabel: dataTypeLabel,
          statusThai: statusThai,
          regionStr: regionStr,
          province: sale.customer?.province || "",
          customerName: sale.customer?.name || "",
          customerType: sale.customer?.customerType || "",
          employeeName: sale.employee?.name || "",
          abcGroup: abcGroup,
          productGroupStr: productGroupStr,
          commonNameStr: commonNameStr,
          tradeNameStr: tradeNameStr,
          productCode: item.productCode || "",
          itemName: item.name || "",
          categoryName: item.categoryName || "",
          brand: item.brand || "",
          plantStr: plantStr,
          packageSizeStr: packageSizeStr,
          totalPerBox: totalPerBox,
          quantityNum: quantityNum,
          unit: item.unit || item.product?.unit || "",
          totalBoxSold: totalBoxSold,
          originalPrice: Number(item.originalPrice) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0,
          promotionBudget: Number(item.promotionBudget) || 0,
        });
      }
    } else {
      worksheet.addRow({
        year: saleYear,
        month: saleMonth,
        saleNumber: sale.saleNumber,
        salesOrderNo: salesOrderNo,
        formattedDate: formattedDate,
        dataTypeLabel: dataTypeLabel,
        statusThai: statusThai,
        regionStr: regionStr,
        province: sale.customer?.province || "",
        customerName: sale.customer?.name || "",
        customerType: sale.customer?.customerType || "",
        employeeName: sale.employee?.name || "",
        abcGroup: "-",
        productGroupStr: "-",
        commonNameStr: "-",
        tradeNameStr: "-",
        productCode: "-",
        itemName: "-",
        categoryName: "-",
        brand: "-",
        plantStr: "-",
        packageSizeStr: "-",
        totalPerBox: 0,
        quantityNum: 0,
        unit: "-",
        totalBoxSold: 0,
        originalPrice: 0,
        unitPrice: 0,
        totalPrice: 0,
        promotionBudget: 0,
      });
    }
  }

  // 2. Process SalesTarget (Forecast) records
  for (const target of targets) {
    const saleYear = target.year ? target.year.toString() : "";
    const saleMonth = target.month ? target.month.toString().padStart(2, "0") : "";
    const dataTypeLabel = "Forecast";
    const statusThai = "เป้าหมายการขาย";
    const employeeName = target.employee?.name || "";

    if (target.stores && target.stores.length > 0) {
      for (const store of target.stores) {
        const regionStr =
          target.region ||
          (store.customer?.province ? getRegionFromProvince(store.customer.province) : "") ||
          "";
        const province = store.customer?.province || "";
        const customerName = store.customer?.name || "";
        const customerType = store.customer?.customerType || "";

        if (store.items && store.items.length > 0) {
          for (const item of store.items) {
            const product = item.product;
            const abcGroup =
              product?.productABCType?.name ||
              product?.productABCType?.code ||
              "";

            const categoryRaw =
              product?.category?.description ||
              product?.category?.code ||
              "";
            const productGroupStr = categoryRaw ? categoryRaw.split(":")[0].trim() : "";

            const commonNameStr = product?.commonName || "";
            const tradeNameStr =
              product?.tradeNameGroup?.description ||
              product?.name ||
              "";

            const pkgSizeRaw = product?.packageSize;
            const pkgUnitRaw = product?.packageSizeUnit ?? "";
            const packageSizeStr =
              pkgSizeRaw != null ? `${Number(pkgSizeRaw)} ${pkgUnitRaw}`.trim() : "";

            const totalPerBox = Number(
              product?.totalPackageSizePerBox ??
                product?.packageSizePerBox ??
                0
            );

            const quantityNum = item.qtyPerBox || 0;
            const totalBoxSold = quantityNum * totalPerBox;
            const pricePerBox = Number(item.pricePerBox) || 0;
            const targetAmount = Number(item.targetAmount) || 0;

            worksheet.addRow({
              year: saleYear,
              month: saleMonth,
              saleNumber: "-",
              salesOrderNo: "-",
              formattedDate: "-",
              dataTypeLabel: dataTypeLabel,
              statusThai: statusThai,
              regionStr: regionStr,
              province: province,
              customerName: customerName,
              customerType: customerType,
              employeeName: employeeName,
              abcGroup: abcGroup,
              productGroupStr: productGroupStr,
              commonNameStr: commonNameStr,
              tradeNameStr: tradeNameStr,
              productCode: product?.productCode || "",
              itemName: product?.name || "",
              categoryName: product?.category?.description || "",
              brand: product?.brand || "",
              plantStr: "-",
              packageSizeStr: packageSizeStr,
              totalPerBox: totalPerBox,
              quantityNum: quantityNum,
              unit: product?.unit || "",
              totalBoxSold: totalBoxSold,
              originalPrice: pricePerBox,
              unitPrice: pricePerBox,
              totalPrice: targetAmount,
              promotionBudget: 0,
            });
          }
        } else {
          worksheet.addRow({
            year: saleYear,
            month: saleMonth,
            saleNumber: "-",
            salesOrderNo: "-",
            formattedDate: "-",
            dataTypeLabel: dataTypeLabel,
            statusThai: statusThai,
            regionStr: regionStr,
            province: province,
            customerName: customerName,
            customerType: customerType,
            employeeName: employeeName,
            abcGroup: "-",
            productGroupStr: "-",
            commonNameStr: "-",
            tradeNameStr: "-",
            productCode: "-",
            itemName: "-",
            categoryName: "-",
            brand: "-",
            plantStr: "-",
            packageSizeStr: "-",
            totalPerBox: 0,
            quantityNum: 0,
            unit: "-",
            totalBoxSold: 0,
            originalPrice: 0,
            unitPrice: 0,
            totalPrice: 0,
            promotionBudget: 0,
          });
        }
      }
    }
  }

  // Set Angsana New font for all rows and cells
  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = {
        name: "Angsana New",
        size: 14,
        bold: rowNumber === 1,
      };
      cell.alignment = {
        vertical: "middle",
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
