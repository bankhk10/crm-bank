import { db, Prisma } from "@/lib/db";
import * as XLSX from "xlsx";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ImportSalesNoteResult = {
  success: boolean;
  message?: string;
  totalRows?: number;
  importedOrders?: number;
  skippedRows?: number;
  errors?: string[];
  preview?: ImportPreviewRow[];
};

export interface ImportPreviewRow {
  row: number;
  saleDate: string;
  employeeName: string;
  customerName: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentTerm: string;
  notes: string;
  status: "valid" | "error";
  errorMessage?: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  "วันที่ขาย",
  "รหัสพนักงาน",
  "รหัสร้านค้า",
  "รหัสสินค้า",
  "จำนวน",
  "ราคาต่อหน่วย",
  "ยอดรวม",
];

const OPTIONAL_COLUMNS = [
  "เงื่อนไขการชำระเงิน",
  "หมายเหตุ",
];

const PAYMENT_TERM_MAP: Record<string, string> = {
  "เครดิต 90 วัน": "CREDIT_90",
  "CREDIT_90": "CREDIT_90",
  "เงินสด 7 วัน": "CASH_7",
  "CASH_7": "CASH_7",
  "ชำระเงินก่อน": "PREPAID",
  "PREPAID": "PREPAID",
  "เครดิตมากกว่า 90 วัน": "CREDIT_OVER_90",
  "CREDIT_OVER_90": "CREDIT_OVER_90",
};

const PAYMENT_TERM_LABELS: Record<string, string> = {
  "CREDIT_90": "เครดิต 90 วัน",
  "CASH_7": "เงินสด 7 วัน",
  "PREPAID": "ชำระเงินก่อน",
  "CREDIT_OVER_90": "เครดิตมากกว่า 90 วัน",
};

function parsePaymentTerm(value: string | undefined | null): string {
  if (!value) return "CREDIT_90"; // default
  const trimmed = value.toString().trim();
  return PAYMENT_TERM_MAP[trimmed] || "CREDIT_90";
}

function parseDate(value: any): Date | null {
  if (!value) return null;

  // If it's already a Date
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  // XLSX may return serial date numbers
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d);
    }
    return null;
  }

  const str = value.toString().trim();

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    // Handle Thai Buddhist year
    if (year > 2500) year -= 543;
    // Handle 2-digit year
    if (year < 100) year += 2000;
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) return date;
  }

  // Try YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (ymdMatch) {
    let year = parseInt(ymdMatch[1], 10);
    if (year > 2500) year -= 543;
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) return date;
  }

  // Fallback: try native Date parsing
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// ─────────────────────────────────────────────
// Template Generator
// ─────────────────────────────────────────────

export function generateSalesNoteTemplate(): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  // Header row
  const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

  // Example data rows
  const today = new Date();
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543}`;
  const exampleRows = [
    [dateStr, "EMP001", "CUST001", "PRD001", 10, 1500, 15000, "เครดิต 90 วัน", ""],
    [dateStr, "EMP001", "CUST001", "PRD002", 5, 2000, 10000, "เครดิต 90 วัน", ""],
    [dateStr, "EMP001", "CUST002", "PRD001", 8, 1500, 12000, "เงินสด 7 วัน", "ส่งด่วน"],
    [dateStr, "EMP002", "CUST003", "PRD003", 20, 800, 16000, "ชำระเงินก่อน", ""],
  ];

  const data = [headers, ...exampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for readability
  ws["!cols"] = [
    { wch: 14 },  // วันที่ขาย
    { wch: 15 },  // รหัสพนักงาน
    { wch: 15 },  // รหัสร้านค้า
    { wch: 15 },  // รหัสสินค้า
    { wch: 10 },  // จำนวน
    { wch: 14 },  // ราคาต่อหน่วย
    { wch: 14 },  // ยอดรวม
    { wch: 24 },  // เงื่อนไขการชำระเงิน
    { wch: 30 },  // หมายเหตุ
  ];

  XLSX.utils.book_append_sheet(wb, ws, "บันทึกการขาย");

  // Add instruction sheet
  const instrData = [
    ["คำแนะนำการกรอกข้อมูลนำเข้าบันทึกการขาย"],
    [""],
    ["คอลัมน์", "คำอธิบาย", "ตัวอย่าง", "จำเป็น"],
    ["วันที่ขาย", "วันที่ทำรายการขาย (DD/MM/YYYY หรือ DD/MM/พ.ศ.)", `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543}`, "✓"],
    ["รหัสพนักงาน", "รหัสพนักงานขายในระบบ (Employee Code)", "EMP001", "✓"],
    ["รหัสร้านค้า", "รหัสลูกค้า/ร้านค้าในระบบ (Customer Code)", "CUST001", "✓"],
    ["รหัสสินค้า", "รหัสสินค้าในระบบ (Product Code)", "PRD001", "✓"],
    ["จำนวน", "จำนวนสินค้าที่ขาย (จำนวนเต็ม)", "10", "✓"],
    ["ราคาต่อหน่วย", "ราคาขายต่อหน่วย (บาท)", "1500", "✓"],
    ["ยอดรวม", "ยอดราคารวมของสินค้ารายการนี้ (บาท) = จำนวน × ราคาต่อหน่วย", "15000", "✓"],
    ["เงื่อนไขการชำระเงิน", "เครดิต 90 วัน / เงินสด 7 วัน / ชำระเงินก่อน / เครดิตมากกว่า 90 วัน", "เครดิต 90 วัน", ""],
    ["หมายเหตุ", "หมายเหตุเพิ่มเติม (ถ้ามี)", "ส่งด่วน", ""],
    [""],
    ["หลักการจัดกลุ่ม:"],
    ["1. แต่ละแถวคือ 1 รายการสินค้า (SaleItem)"],
    ["2. ระบบจะจัดกลุ่มสินค้าที่มี วันที่ + พนักงาน + ร้านค้า + เงื่อนไขชำระเงิน ตรงกัน เป็น 1 ใบบันทึกการขาย (Sale)"],
    ["3. สินค้าหลายรายการในใบเดียวกัน ให้กรอกข้อมูลแยกแถว โดยใส่วันที่, รหัสพนักงาน, รหัสร้านค้า, เงื่อนไขเดียวกัน"],
    ["4. เลขบันทึกการขายจะถูกสร้างอัตโนมัติ"],
    ["5. บันทึกจะถูกตั้งสถานะเป็น 'เสร็จสิ้น' (COMPLETED) อัตโนมัติ"],
    [""],
    ["รูปแบบวันที่ที่รองรับ:"],
    ["• DD/MM/YYYY  เช่น 10/04/2026"],
    ["• DD/MM/พ.ศ.  เช่น 10/04/2569"],
    ["• YYYY-MM-DD  เช่น 2026-04-10"],
    ["• Excel Date  (ตัวเลข Serial)"],
  ];
  const instrWs = XLSX.utils.aoa_to_sheet(instrData);
  instrWs["!cols"] = [
    { wch: 25 },
    { wch: 55 },
    { wch: 25 },
    { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, instrWs, "คำแนะนำ");

  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

// ─────────────────────────────────────────────
// Preview (Validate Only, No DB Writes)
// ─────────────────────────────────────────────

export async function previewSalesNoteImport(
  fileBuffer: ArrayBuffer,
): Promise<ImportSalesNoteResult> {
  const errors: string[] = [];
  const preview: ImportPreviewRow[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

    if (rows.length === 0) {
      return { success: false, message: "ไฟล์ว่างเปล่า ไม่มีข้อมูล" };
    }

    // Validate column headers
    const firstRowKeys = Object.keys(rows[0]);
    const missingCols = REQUIRED_COLUMNS.filter(
      (col) => !firstRowKeys.includes(col),
    );
    if (missingCols.length > 0) {
      return {
        success: false,
        message: `ไม่พบคอลัมน์ที่จำเป็น: ${missingCols.join(", ")}`,
      };
    }

    // Build lookup maps
    const [employees, customers, products] = await Promise.all([
      db.employee.findMany({
        select: { id: true, name: true, employeeCode: true },
      }),
      db.customer.findMany({
        select: { id: true, name: true, customerCode: true },
      }),
      db.product.findMany({
        select: {
          id: true,
          productCode: true,
          name: true,
          unit: true,
          price: true,
          cartonPrice: true,
        },
      }),
    ]);

    const employeeMap = new Map(employees.map((e) => [e.employeeCode, e]));
    const customerMap = new Map(customers.map((c) => [c.customerCode, c]));
    const productMap = new Map(products.map((p) => [p.productCode, p]));

    let rowIdx = 1;
    for (const row of rows) {
      rowIdx++;
      const rowErrors: string[] = [];

      const saleDateRaw = row["วันที่ขาย"];
      const employeeCode = row["รหัสพนักงาน"]?.toString().trim();
      const customerCode = row["รหัสร้านค้า"]?.toString().trim();
      const productCode = row["รหัสสินค้า"]?.toString().trim();
      const qtyRaw = row["จำนวน"];
      const priceRaw = row["ราคาต่อหน่วย"];
      const totalRaw = row["ยอดรวม"];
      const paymentTermRaw = row["เงื่อนไขการชำระเงิน"];
      const notes = row["หมายเหตุ"]?.toString() || "";

      // Validate required fields
      if (!saleDateRaw) rowErrors.push("ไม่มีวันที่ขาย");
      if (!employeeCode) rowErrors.push("ไม่มีรหัสพนักงาน");
      if (!customerCode) rowErrors.push("ไม่มีรหัสร้านค้า");
      if (!productCode) rowErrors.push("ไม่มีรหัสสินค้า");

      const saleDate = parseDate(saleDateRaw);
      if (saleDateRaw && !saleDate) {
        rowErrors.push(`วันที่ขายไม่ถูกต้อง: ${saleDateRaw}`);
      }

      const employee = employeeCode ? employeeMap.get(employeeCode) : null;
      if (employeeCode && !employee) {
        rowErrors.push(`ไม่พบพนักงาน: ${employeeCode}`);
      }

      const customer = customerCode ? customerMap.get(customerCode) : null;
      if (customerCode && !customer) {
        rowErrors.push(`ไม่พบร้านค้า: ${customerCode}`);
      }

      const product = productCode ? productMap.get(productCode) : null;
      if (productCode && !product) {
        rowErrors.push(`ไม่พบสินค้า: ${productCode}`);
      }

      const qty = parseInt(qtyRaw?.toString().replace(/,/g, "") || "0", 10);
      const price = parseFloat(priceRaw?.toString().replace(/,/g, "") || "0");
      const total = parseFloat(totalRaw?.toString().replace(/,/g, "") || "0");

      if (qty <= 0) rowErrors.push("จำนวนต้องมากกว่า 0");
      if (price < 0) rowErrors.push("ราคาต้องไม่ติดลบ");
      if (total < 0) rowErrors.push("ยอดรวมต้องไม่ติดลบ");

      const paymentTerm = parsePaymentTerm(paymentTermRaw);

      if (rowErrors.length > 0) {
        errors.push(`แถวที่ ${rowIdx}: ${rowErrors.join(", ")}`);
      }

      preview.push({
        row: rowIdx,
        saleDate: saleDate ? saleDate.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-",
        employeeName: employee?.name || employeeCode || "-",
        customerName: customer?.name || customerCode || "-",
        productCode: product?.productCode || productCode || "-",
        productName: product?.name || "-",
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
        paymentTerm: PAYMENT_TERM_LABELS[paymentTerm] || paymentTerm,
        notes,
        status: rowErrors.length > 0 ? "error" : "valid",
        errorMessage: rowErrors.length > 0 ? rowErrors.join(", ") : undefined,
      });
    }

    return {
      success: true,
      totalRows: rows.length,
      skippedRows: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      preview,
    };
  } catch (err: any) {
    console.error("Preview error:", err);
    return { success: false, message: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message}` };
  }
}

// ─────────────────────────────────────────────
// Actual Import (DB Writes)
// ─────────────────────────────────────────────

export async function processSalesNoteImport(
  fileBuffer: ArrayBuffer,
  userId: string,
): Promise<ImportSalesNoteResult> {
  const errors: string[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

    if (rows.length === 0) {
      return { success: false, message: "ไฟล์ว่างเปล่า ไม่มีข้อมูล" };
    }

    // Validate column headers
    const firstRowKeys = Object.keys(rows[0]);
    const missingCols = REQUIRED_COLUMNS.filter(
      (col) => !firstRowKeys.includes(col),
    );
    if (missingCols.length > 0) {
      return {
        success: false,
        message: `ไม่พบคอลัมน์ที่จำเป็น: ${missingCols.join(", ")}`,
      };
    }

    // Build lookup maps
    const [employees, customers, products] = await Promise.all([
      db.employee.findMany({
        select: { id: true, name: true, employeeCode: true },
      }),
      db.customer.findMany({
        select: { id: true, name: true, customerCode: true },
      }),
      db.product.findMany({
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
          productABCType: { select: { name: true } },
        },
      }),
    ]);

    const employeeMap = new Map(employees.map((e) => [e.employeeCode, e]));
    const customerMap = new Map(customers.map((c) => [c.customerCode, c]));
    const productMap = new Map(products.map((p) => [p.productCode, p]));

    // Collect valid items
    type ItemEntry = {
      productId: string;
      productCode: string;
      name: string | null;
      commonName: string | null;
      unit: string | null;
      brand: string | null;
      packageSize: any;
      packageSizeUnit: string | null;
      packageSizePerBox: any;
      totalPackageSizePerBox: any;
      price: number | null;
      cartonPrice: number | null;
      promotionBudget: number | null;
      pointPerUnit: number;
      productGroup: string | null;
      productChain: string | null;
      quantity: number;
      unitPrice: number;
      originalPrice: number;
      totalPrice: number;
    };

    type OrderGroup = {
      customerId: string;
      employeeId: string;
      saleDate: Date;
      paymentTerm: string;
      notes: string;
      items: ItemEntry[];
    };

    const ordersMap = new Map<string, OrderGroup>();

    let rowIdx = 1;
    let validRows = 0;

    for (const row of rows) {
      rowIdx++;

      const saleDateRaw = row["วันที่ขาย"];
      const employeeCode = row["รหัสพนักงาน"]?.toString().trim();
      const customerCode = row["รหัสร้านค้า"]?.toString().trim();
      const productCode = row["รหัสสินค้า"]?.toString().trim();
      const qtyRaw = row["จำนวน"];
      const priceRaw = row["ราคาต่อหน่วย"];
      const totalRaw = row["ยอดรวม"];
      const paymentTermRaw = row["เงื่อนไขการชำระเงิน"];
      const notes = row["หมายเหตุ"]?.toString() || "";

      // Validate required fields
      if (!saleDateRaw || !employeeCode || !customerCode || !productCode) {
        errors.push(`แถวที่ ${rowIdx}: ข้อมูลไม่ครบถ้วน`);
        continue;
      }

      const saleDate = parseDate(saleDateRaw);
      if (!saleDate) {
        errors.push(`แถวที่ ${rowIdx}: วันที่ขายไม่ถูกต้อง (${saleDateRaw})`);
        continue;
      }

      const employee = employeeMap.get(employeeCode);
      if (!employee) {
        errors.push(`แถวที่ ${rowIdx}: ไม่พบรหัสพนักงาน ${employeeCode} ในระบบ`);
        continue;
      }

      const customer = customerMap.get(customerCode);
      if (!customer) {
        errors.push(`แถวที่ ${rowIdx}: ไม่พบรหัสร้านค้า ${customerCode} ในระบบ`);
        continue;
      }

      const product = productMap.get(productCode);
      if (!product) {
        errors.push(`แถวที่ ${rowIdx}: ไม่พบรหัสสินค้า ${productCode} ในระบบ`);
        continue;
      }

      const quantity = parseInt(qtyRaw?.toString().replace(/,/g, "") || "0", 10);
      const unitPrice = parseFloat(priceRaw?.toString().replace(/,/g, "") || "0");
      const totalPrice = parseFloat(totalRaw?.toString().replace(/,/g, "") || "0");

      if (quantity <= 0) {
        errors.push(`แถวที่ ${rowIdx}: จำนวนต้องมากกว่า 0`);
        continue;
      }

      const paymentTerm = parsePaymentTerm(paymentTermRaw);

      // Group key: date_customerId_employeeId_paymentTerm
      const dateKey = saleDate.toISOString().split("T")[0];
      const groupKey = `${dateKey}_${customer.id}_${employee.id}_${paymentTerm}`;

      if (!ordersMap.has(groupKey)) {
        ordersMap.set(groupKey, {
          customerId: customer.id,
          employeeId: employee.id,
          saleDate,
          paymentTerm,
          notes,
          items: [],
        });
      }

      // Append notes if different
      const order = ordersMap.get(groupKey)!;
      if (notes && !order.notes.includes(notes)) {
        order.notes = order.notes ? `${order.notes}, ${notes}` : notes;
      }

      order.items.push({
        productId: product.id,
        productCode: product.productCode,
        name: product.name,
        commonName: product.commonName,
        unit: product.unit,
        brand: product.brand,
        packageSize: product.packageSize,
        packageSizeUnit: product.packageSizeUnit,
        packageSizePerBox: product.packageSizePerBox,
        totalPackageSizePerBox: product.totalPackageSizePerBox,
        price: product.price ? Number(product.price) : null,
        cartonPrice: product.cartonPrice ? Number(product.cartonPrice) : null,
        promotionBudget: product.promotionBudget ? Number(product.promotionBudget) : null,
        pointPerUnit: product.pointPerUnit ?? 0,
        productGroup: product.productGroup?.name || product.tradeNameGroup?.description || null,
        productChain: (product as any).productABCType?.name || null,
        quantity,
        unitPrice,
        originalPrice: product.price ? Number(product.price) : unitPrice,
        totalPrice,
      });

      validRows++;
    }

    if (ordersMap.size === 0) {
      return {
        success: false,
        errors,
        message: "ไม่มีข้อมูลที่ถูกต้องให้บันทึก",
      };
    }

    // Generate sale numbers: find the highest saleNumber for the current month prefix
    const today = new Date();
    const saleNumberPrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;

    const lastSale = await db.sale.findFirst({
      where: { saleNumber: { startsWith: saleNumberPrefix } },
      orderBy: { saleNumber: "desc" },
      select: { saleNumber: true },
    });

    let lastSaleNumber = lastSale?.saleNumber ?? null;

    function generateNextSaleNumber(): string {
      if (!lastSaleNumber || !lastSaleNumber.startsWith(saleNumberPrefix)) {
        lastSaleNumber = `${saleNumberPrefix}0001`;
        return lastSaleNumber;
      }

      const lastSeq = parseInt(lastSaleNumber.slice(-4));
      const newSeq = String(lastSeq + 1).padStart(4, "0");
      lastSaleNumber = `${saleNumberPrefix}${newSeq}`;
      return lastSaleNumber;
    }

    // Create all orders in a transaction
    const transactions = [];

    for (const order of ordersMap.values()) {
      const saleNumber = generateNextSaleNumber();

      const subtotalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalAmount = subtotalAmount; // ไม่มี shipping/other costs จาก import

      transactions.push(
        db.sale.create({
          data: {
            saleNumber,
            customerId: order.customerId,
            employeeId: order.employeeId,
            saleDate: order.saleDate,
            status: "COMPLETED",
            paymentTerm: order.paymentTerm as any,
            subtotalAmount: new Prisma.Decimal(subtotalAmount),
            shippingCost: new Prisma.Decimal(0),
            otherCosts: new Prisma.Decimal(0),
            totalAmount: new Prisma.Decimal(totalAmount),
            notes: order.notes || null,
            createdById: userId,
            items: {
              create: order.items.map((item) => ({
                productId: item.productId,
                productCode: item.productCode,
                name: item.name,
                commonName: item.commonName,
                unit: item.unit,
                productGroup: item.productGroup,
                brand: item.brand,
                packageSize: item.packageSize,
                packageSizeUnit: item.packageSizeUnit,
                packageSizePerBox: item.packageSizePerBox,
                totalPackageSizePerBox: item.totalPackageSizePerBox,
                price: item.price != null ? new Prisma.Decimal(item.price) : null,
                cartonPrice: item.cartonPrice != null ? new Prisma.Decimal(item.cartonPrice) : null,
                promotionBudget: item.promotionBudget != null ? new Prisma.Decimal(item.promotionBudget) : null,
                pointPerUnit: item.pointPerUnit,
                productChain: item.productChain,
                quantity: item.quantity,
                unitPrice: new Prisma.Decimal(item.unitPrice),
                originalPrice: new Prisma.Decimal(item.originalPrice),
                priceModified: false,
                totalPrice: new Prisma.Decimal(item.totalPrice),
              })),
            },
            statusHistory: {
              create: {
                status: "COMPLETED",
                notes: "นำเข้าจากไฟล์ Excel",
                changedById: userId,
              },
            },
          },
        }),
      );
    }

    await db.$transaction(transactions);

    return {
      success: true,
      totalRows: rows.length,
      importedOrders: transactions.length,
      skippedRows: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `นำเข้าข้อมูลสำเร็จ: สร้างบันทึกการขาย ${transactions.length} รายการ (จาก ${validRows} แถวข้อมูล)`,
    };
  } catch (err: any) {
    console.error("Import error:", err);
    return {
      success: false,
      message: `เกิดข้อผิดพลาด: ${err.message}`,
    };
  }
}
