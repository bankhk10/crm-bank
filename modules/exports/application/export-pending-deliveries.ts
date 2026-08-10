import ExcelJS from "exceljs";

export async function buildPendingDeliveriesExportWorkbook(
  records: any[]
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("สินค้าค้างส่ง");

  worksheet.columns = [
    { header: "เลขที่ออเดอร์", key: "orderNumber", width: 22 },
    { header: "ชื่อลูกค้า", key: "customerName", width: 32 },
    { header: "รหัสสินค้า", key: "productCode", width: 18 },
    { header: "ชื่อสินค้า", key: "productName", width: 35 },
    { header: "จำนวนที่ค้างส่ง", key: "pendingQuantity", width: 18 },
    { header: "หน่วยนับ", key: "unit", width: 14 },
    { header: "ราคาขาย", key: "unitPrice", width: 18 },
    { header: "ราคารวม", key: "totalPrice", width: 20 },
  ];

  records.forEach((item) => {
    worksheet.addRow({
      orderNumber: item.orderNumber,
      customerName: item.customerName,
      productCode: item.productCode,
      productName: item.productName,
      pendingQuantity: item.pendingQuantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
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
          cell.numFmt = "#,##0";
        } else if (colNumber === 7 || colNumber === 8) {
          cell.numFmt = "#,##0.00";
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
