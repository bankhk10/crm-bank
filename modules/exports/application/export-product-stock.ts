import ExcelJS from "exceljs";

export interface ProductStockExportItem {
  productCode: string;
  productName: string;
  unit: string;
  price: number;
  cartonPrice: number;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
}

export async function buildProductStockExportWorkbook(
  records: ProductStockExportItem[],
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("สต็อกสินค้า");

  worksheet.columns = [
    { header: "รหัสสินค้า", key: "productCode", width: 22 },
    { header: "ชื่อสินค้า", key: "productName", width: 38 },
    { header: "หน่วยนับ", key: "unit", width: 14 },
    { header: "ราคาหน่วย", key: "price", width: 16 },
    { header: "ราคาลัง", key: "cartonPrice", width: 16 },
    { header: "สต็อกทั้งหมด", key: "physicalStock", width: 16 },
    { header: "สต็อกจอง", key: "reservedStock", width: 16 },
    { header: "สต็อกคงเหลือ", key: "availableStock", width: 16 },
  ];

  records.forEach((item) => {
    worksheet.addRow({
      productCode: item.productCode,
      productName: item.productName,
      unit: item.unit,
      price: item.price,
      cartonPrice: item.cartonPrice,
      physicalStock: item.physicalStock,
      reservedStock: item.reservedStock,
      availableStock: item.availableStock,
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
        horizontal:
          rowNumber === 1
            ? "center"
            : colNumber === 1 || colNumber === 3
              ? "center"
              : colNumber >= 4
                ? "right"
                : "left",
      };

      // Number formatting for numeric columns when row > 1
      if (rowNumber > 1) {
        if (colNumber === 4 || colNumber === 5) {
          cell.numFmt = "#,##0.00";
        } else if (colNumber >= 6 && colNumber <= 8) {
          cell.numFmt = "#,##0;-#,##0;0";
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
