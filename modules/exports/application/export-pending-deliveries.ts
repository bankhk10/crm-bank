import ExcelJS from "exceljs";

export async function buildPendingDeliveriesExportWorkbook(
  records: any[]
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("สินค้าค้างส่ง");

  worksheet.columns = [
    { header: "เลขที่ออเดอร์", key: "orderNumber", width: 22 },
    { header: "ชื่อลูกค้า", key: "customerName", width: 32 },
    { header: "รหัส-ชื่อสินค้า", key: "productCodeAndName", width: 45 },
    { header: "จำนวนที่ค้างส่ง", key: "pendingQuantity", width: 18 },
  ];

  records.forEach((item) => {
    worksheet.addRow({
      orderNumber: item.orderNumber,
      customerName: item.customerName,
      productCodeAndName: item.productCodeAndName,
      pendingQuantity: item.pendingQuantity,
    });
  });

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
