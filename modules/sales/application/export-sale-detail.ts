import ExcelJS from "exceljs";
import type { SaleWithRelations } from "@/modules/sales/types";

/**
 * Build an Excel workbook for sale detail with columns:
 * 1. เลขที่ออเดอร์ (orderNumber)
 * 2. ชื่อลูกค้า (customerName)
 * 3. รหัสสินค้า (productCode)
 * 4. ชื่อสินค้า (productName)
 * 5. จำนวน (quantity)
 * 6. หน่วยนับ (unit)
 * 7. ราคา/หน่วย (unitPrice)
 * 8. ราคา/ลัง (cartonPrice)
 * 9. ราคารวม (totalPrice)
 */
export async function buildSaleDetailExportWorkbook(
  sale: SaleWithRelations
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("ข้อมูลการขาย");

  worksheet.columns = [
    { header: "เลขที่ออเดอร์", key: "orderNumber", width: 22 },
    { header: "ชื่อลูกค้า", key: "customerName", width: 32 },
    { header: "รหัสสินค้า", key: "productCode", width: 18 },
    { header: "ชื่อสินค้า", key: "productName", width: 35 },
    { header: "จำนวน", key: "quantity", width: 14 },
    { header: "หน่วยนับ", key: "unit", width: 14 },
    { header: "ราคา/หน่วย", key: "unitPrice", width: 18 },
    { header: "ราคา/ลัง", key: "cartonPrice", width: 18 },
    { header: "ราคารวม", key: "totalPrice", width: 20 },
  ];

  const orderNumber = sale.saleNumber || "-";
  const customerName = sale.customer?.name || "-";

  sale.items.forEach((item: any) => {
    const unitPrice = Number(item.unitPrice ?? 0);
    const quantity = Number(item.quantity ?? 0);
    const totalPrice = Number(item.totalPrice ?? unitPrice * quantity);

    const packSize = parseFloat(
      item.product?.packageSizePerBox?.toString() ||
        item.packageSizePerBox?.toString() ||
        "1"
    );
    const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
    const cartonPrice =
      item.cartonPrice != null
        ? Number(item.cartonPrice)
        : unitPrice * multiplier;

    worksheet.addRow({
      orderNumber,
      customerName,
      productCode: item.product?.productCode || item.productCode || "-",
      productName: item.product?.name || item.name || "-",
      quantity,
      unit: item.product?.unit || item.unit || "-",
      unitPrice,
      cartonPrice,
      totalPrice,
    });
  });

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
        horizontal: rowNumber === 1 ? "center" : undefined,
      };

      // Number formatting for numeric columns when row > 1
      if (rowNumber > 1) {
        if (colNumber === 5) {
          // จำนวน
          cell.numFmt = "#,##0";
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber === 6) {
          // หน่วยนับ
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber === 7 || colNumber === 8 || colNumber === 9) {
          // ราคา/หน่วย, ราคา/ลัง, ราคารวม
          cell.numFmt = "#,##0.00";
          cell.alignment = { vertical: "middle", horizontal: "right" };
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
