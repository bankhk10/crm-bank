import { db } from "@/lib/db";
import * as XLSX from "xlsx";

type ImportResult = {
  success: boolean;
  message?: string;
  totalRows?: number;
  importedRows?: number;
  errors?: string[];
};

const MONTH_MAP: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4, พฤษภาคม: 5, มิถุนายน: 6,
  กรกฎาคม: 7, สิงหาคม: 8, กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
};

function getMonthNumber(monthStr: string | number): number {
  if (typeof monthStr === "number") return monthStr;
  const cleaned = monthStr.toString().trim().slice(0, 3); // matching short english months easily if they have trailing spaces
  // exact match
  if (MONTH_MAP[monthStr.trim()]) return MONTH_MAP[monthStr.trim()];
  // short match
  const matched = Object.keys(MONTH_MAP).find(k => k.toLowerCase().startsWith(cleaned.toLowerCase()));
  return matched ? MONTH_MAP[matched] : 1;
}

export async function processLegacySalesFile(
  fileBuffer: ArrayBuffer,
  userId: string,
): Promise<ImportResult> {
  const errors: string[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read exactly the 8 columns
    // "ปี", "เดือน", "รหัสสินค้า", "พนักงานขาย", "ร้านค้า", "จำนวนที่ขายรวม", "ขนาดบรรจุรวมที่ขายได้", "ราคาขายรวม"
    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

    if (rows.length === 0) {
      return { success: false, message: "ไฟล์ว่างเปล่าไม่มีข้อมูล" };
    }

    // Prepare lookups
    const products = await db.product.findMany({
      select: {
        id: true,
        productCode: true,
        name: true,
        commonName: true,
        unit: true,
        brand: true,
        packageSize: true,
        packageSizeUnit: true,
        packageSizePerBox: true,
        totalPackageSizePerBox: true,
        price: true,
        cartonPrice: true,
        promotionBudget: true,
        pointPerUnit: true,
        productGroup: { select: { name: true } },
        tradeNameGroup: { select: { description: true } },
      },
    });
    const employees = await db.employee.findMany({ select: { id: true, name: true, employeeCode: true } });
    const customers = await db.customer.findMany({ select: { id: true, customerCode: true, name: true } });

    const productMap = new Map(products.map(p => [p.productCode, p]));
    const employeeMap = new Map(employees.map(e => [e.employeeCode, e.id]));
    const employeeNameMap = new Map(employees.map(e => [e.name, e.id]));
    const customerMap = new Map(customers.map(c => [c.customerCode, c.id]));
    const customerNameMap = new Map(customers.map(c => [c.name, c.id]));

    const salesDataToCreate: any[] = [];
    let currentRowIdx = 1;

    for (const row of rows) {
      currentRowIdx++;
      const yearRaw = row["ปี"];
      const monthRaw = row["เดือน"];
      const productRaw = row["รหัสสินค้า"];
      const employeeRaw = row["พนักงานขาย"];
      const customerRaw = row["ร้านค้า"];
      const qtyRaw = row["จำนวนที่ขายรวม"];
      const totalAmountRaw = row["ราคาขายรวม"];

      if (!yearRaw || !monthRaw || !productRaw || !employeeRaw || !customerRaw) {
        errors.push(`แถวที่ ${currentRowIdx}: ข้อมูลไม่ครบถ้วน (ปี, เดือน, สินค้า, พนักงาน, หรือ ร้านค้า)`);
        continue;
      }

      const year = parseInt(yearRaw.toString(), 10);
      const monthStr = monthRaw.toString();
      const month = getMonthNumber(monthStr);

      // Create a date on the 1st of the month, using Gregorian Year (Assume incoming is CE, e.g. 2025)
      // If the year is > 2500, it might be Thai Buddhist year
      const normalizedYear = year > 2500 ? year - 543 : year;
      const saleDate = new Date(normalizedYear, month - 1, 1); // 1st day of the month

      const productCode = productRaw.toString().trim();
      const employeeRef = employeeRaw.toString().trim();
      const customerRef = customerRaw.toString().trim();

      const product = productMap.get(productCode);
      if (!product) {
        errors.push(`แถวที่ ${currentRowIdx}: ไม่พบรหัสสินค้า ${productCode} ในระบบ`);
        continue;
      }

      // try code first, then name
      const employeeId = employeeMap.get(employeeRef) || employeeNameMap.get(employeeRef);
      if (!employeeId) {
        errors.push(`แถวที่ ${currentRowIdx}: ไม่พบพนักงานขาย ${employeeRef} ในระบบ`);
        continue;
      }

      const customerId = customerMap.get(customerRef) || customerNameMap.get(customerRef);
      if (!customerId) {
        errors.push(`แถวที่ ${currentRowIdx}: ไม่พบร้านค้า/ลูกค้า ${customerRef} ในระบบ`);
        continue;
      }

      const quantity = parseInt(qtyRaw?.toString().replace(/,/g, "") || "0", 10);
      const totalAmount = parseFloat(totalAmountRaw?.toString().replace(/,/g, "") || "0");

      if (quantity <= 0 || totalAmount <= 0) {
        errors.push(`แถวที่ ${currentRowIdx}: จำนวนขายหรือยอดขายมีค่าน้อยกว่าหรือเท่ากับ 0`);
        continue;
      }

      const unitPrice = totalAmount / quantity;

      // Group by Customer + Employee + Year + Month so we create ONE invoice per dealer branch per month
      // making it a "Monthly Summary Invoice"
      const groupKey = `${customerId}_${employeeId}_${normalizedYear}_${month}`;

      salesDataToCreate.push({
        groupKey,
        customerId,
        employeeId,
        saleDate,
        productId: product.id,
        // Product Snapshot data
        productCode: product.productCode,
        name: product.name,
        commonName: product.commonName,
        unit: product.unit,
        brand: product.brand,
        packageSize: product.packageSize,
        packageSizeUnit: product.packageSizeUnit,
        packageSizePerBox: product.packageSizePerBox,
        totalPackageSizePerBox: product.totalPackageSizePerBox,
        cartonPrice: product.cartonPrice,
        promotionBudget: product.promotionBudget,
        pointPerUnit: product.pointPerUnit,
        productGroup: product.productGroup?.name || product.tradeNameGroup?.description || null,
        
        quantity,
        totalPrice: totalAmount, // for individual product
        unitPrice,
        originalPrice: product.price || 0,
      });
    }

    if (salesDataToCreate.length === 0) {
      return { success: false, errors, message: "ไม่มีข้อมูลที่ถูกต้องให้บันทึก" };
    }

    // Group items into "Monthly Sale Orders"
    const ordersMap = new Map<string, any>();

    for (const item of salesDataToCreate) {
      if (!ordersMap.has(item.groupKey)) {
        // Generate a random ID/Number
        const saleNumber = `LEGACY-${item.groupKey.split("_").slice(2).join("")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        ordersMap.set(item.groupKey, {
          saleNumber,
          customerId: item.customerId,
          employeeId: item.employeeId,
          saleDate: item.saleDate,
          status: "COMPLETED",
          paymentTerm: "CREDIT_90", // Assumed default for legacy
          subtotalAmount: 0,
          totalAmount: 0,
          createdById: userId,
          items: [],
        });
      }

      const order = ordersMap.get(item.groupKey);
      order.totalAmount += item.totalPrice;
      order.subtotalAmount += item.totalPrice;
      order.items.push({
        productId: item.productId,
        productCode: item.productCode,
        name: item.name,
        commonName: item.commonName,
        unit: item.unit,
        brand: item.brand,
        packageSize: item.packageSize,
        packageSizeUnit: item.packageSizeUnit,
        packageSizePerBox: item.packageSizePerBox,
        totalPackageSizePerBox: item.totalPackageSizePerBox,
        cartonPrice: item.cartonPrice,
        promotionBudget: item.promotionBudget,
        pointPerUnit: item.pointPerUnit,
        productGroup: item.productGroup,

        quantity: item.quantity,
        unitPrice: item.unitPrice,
        originalPrice: item.originalPrice,
        totalPrice: item.totalPrice,
      });
    }

    // Insert to DB inside transaction array
    const transactions = [];

    for (const order of ordersMap.values()) {
      transactions.push(
        db.sale.create({
          data: {
            saleNumber: order.saleNumber,
            customerId: order.customerId,
            employeeId: order.employeeId,
            saleDate: order.saleDate,
            status: order.status,
            paymentTerm: order.paymentTerm,
            subtotalAmount: order.subtotalAmount,
            totalAmount: order.totalAmount,
            createdById: order.createdById,
            items: {
              create: order.items,
            },
          },
        })
      );
    }

    await db.$transaction(transactions);

    return {
      success: true,
      totalRows: rows.length,
      importedRows: transactions.length, // Number of Orders Created
      errors: errors.length > 0 ? errors : undefined,
    };

  } catch (err: any) {
    console.error("Import error:", err);
    return { success: false, message: `เกิดข้อผิดพลาด: ${err.message}` };
  }
}
