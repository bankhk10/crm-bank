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
          totalPerBox: totalPerBox,

          employeeNickname: sale.employee?.nickname || "",
          regionStr: regionStr,
          customerName: sale.customer?.name || "",
          province: sale.customer?.province || "",
          quantityNum: quantityNum,
          totalBoxSold: totalBoxSold,
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
        totalPerBox: 0,

        employeeNickname: sale.employee?.nickname || "",
        regionStr: regionStr,
        customerName: sale.customer?.name || "",
        province: sale.customer?.province || "",
        quantityNum: 0,
        totalBoxSold: 0,
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
        const customerName = store.customer?.name || "";

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

            const totalPerBox = Number(
              product?.totalPackageSizePerBox ??
                product?.packageSizePerBox ??
                0,
            );

            const quantityNum = item.qtyPerBox || 0;
            const totalBoxSold = quantityNum * totalPerBox;
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
              totalPerBox: totalPerBox,

              employeeNickname: employeeNickname,
              regionStr: regionStr,
              customerName: customerName,
              province: province,
              quantityNum: quantityNum,
              totalBoxSold: totalBoxSold,
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
            totalPerBox: 0,

            employeeNickname: employeeNickname,
            regionStr: regionStr,
            customerName: customerName,
            province: province,
            quantityNum: 0,
            totalBoxSold: 0,
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
