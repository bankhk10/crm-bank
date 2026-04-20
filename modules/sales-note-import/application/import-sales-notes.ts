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
  abcCode: string;
  paymentDate: string;
  cartonPrice: number | null;
  orderNumber: string;
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
  "ประเภท (ABC Code)",
  "วันที่ชำระเงิน",
  "ราคาลัง",
  "เลขที่ออเดอร์",
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
  const paymentDateStr = dateStr;
  const exampleRows = [
    [dateStr, "EMP001", "CUST001", "PRD001", 10, 1500, 15000, "เครดิต 90 วัน", "", "A", paymentDateStr, 18000, "ORD-001"],
    [dateStr, "EMP001", "CUST001", "PRD002", 5, 2000, 10000, "เครดิต 90 วัน", "", "B", "", 24000, "ORD-001"],
    [dateStr, "EMP001", "CUST002", "PRD001", 8, 1500, 12000, "เงินสด 7 วัน", "ส่งด่วน", "A", paymentDateStr, 18000, "ORD-002"],
    [dateStr, "EMP002", "CUST003", "PRD003", 20, 800, 16000, "ชำระเงินก่อน", "", "C", "", "", ""],
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
    { wch: 18 },  // ประเภท (ABC Code)
    { wch: 16 },  // วันที่ชำระเงิน
    { wch: 14 },  // ราคาลัง
    { wch: 16 },  // เลขที่ออเดอร์
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
    ["ประเภท (ABC Code)", "รหัสประเภทสินค้า (เช่น A, B, C) ตรงกับรหัสในระบบ", "A", ""],
    ["วันที่ชำระเงิน", "วันที่ชำระเงินจริง (DD/MM/YYYY หรือ DD/MM/พ.ศ.)", `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543}`, ""],
    ["ราคาลัง", "ราคาขายต่อลัง/กล่อง (บาท) — ถ้าไม่กรอกจะใช้ราคาลังจากข้อมูลสินค้า", "18000", ""],
    ["เลขที่ออเดอร์", "เลขที่อ้างอิงออเดอร์ — แถวที่มีเลขเดียวกันจะรวมเป็นใบขายเดียวกัน", "ORD-001", ""],
    [""],
    ["หลักการจัดกลุ่ม:"],
    ["1. แต่ละแถวคือ 1 รายการสินค้า (SaleItem)"],
    ["2. ถ้าระบุเลขที่ออเดอร์ แถวที่มีเลขที่ออเดอร์เดียวกันจะถูกรวมเป็น 1 ใบบันทึกการขาย (Sale)"],
    ["3. ถ้าไม่ระบุเลขที่ออเดอร์ ระบบจะจัดกลุ่มจาก วันที่ + พนักงาน + ร้านค้า + เงื่อนไขชำระเงิน"],
    ["4. สินค้าหลายรายการในใบเดียวกัน ให้กรอกข้อมูลแยกแถว"],
    ["5. เลขบันทึกการขายจะถูกสร้างอัตโนมัติ"],
    ["6. บันทึกจะถูกตั้งสถานะเป็น 'เสร็จสิ้น' (COMPLETED) อัตโนมัติ"],
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
    const [employees, customers, products, abcTypes] = await Promise.all([
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
      db.productABCTypes.findMany({
        select: { id: true, code: true, name: true },
      }),
    ]);

    const employeeMap = new Map(employees.map((e) => [e.employeeCode, e]));
    const customerMap = new Map(customers.map((c) => [c.customerCode, c]));
    const productMap = new Map(products.map((p) => [p.productCode, p]));
    const abcTypeMap = new Map(abcTypes.map((a) => [a.code.toUpperCase(), a]));

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
      const abcCodeRaw = row["ประเภท (ABC Code)"]?.toString().trim() || "";
      const paymentDateRaw = row["วันที่ชำระเงิน"];
      const cartonPriceRaw = row["ราคาลัง"];
      const orderNumberRaw = row["เลขที่ออเดอร์"]?.toString().trim() || "";

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

      // Validate ABC Code (optional)
      let abcTypeName = "";
      if (abcCodeRaw) {
        const abcType = abcTypeMap.get(abcCodeRaw.toUpperCase());
        if (!abcType) {
          rowErrors.push(`ไม่พบประเภท (ABC Code): ${abcCodeRaw}`);
        } else {
          abcTypeName = abcType.name || abcType.code;
        }
      }

      // Parse payment date (optional)
      const paymentDate = paymentDateRaw ? parseDate(paymentDateRaw) : null;
      if (paymentDateRaw && !paymentDate) {
        rowErrors.push(`วันที่ชำระเงินไม่ถูกต้อง: ${paymentDateRaw}`);
      }

      // Parse carton price (optional)
      const cartonPrice = cartonPriceRaw
        ? parseFloat(cartonPriceRaw.toString().replace(/,/g, ""))
        : null;
      if (cartonPriceRaw && cartonPrice !== null && (isNaN(cartonPrice) || cartonPrice < 0)) {
        rowErrors.push(`ราคาลังไม่ถูกต้อง: ${cartonPriceRaw}`);
      }

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
        abcCode: abcTypeName || abcCodeRaw || "-",
        paymentDate: paymentDate ? paymentDate.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-",
        cartonPrice: cartonPrice !== null && !isNaN(cartonPrice) ? cartonPrice : null,
        orderNumber: orderNumberRaw || "-",
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
    const [employees, customers, products, abcTypes] = await Promise.all([
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
          productABCType: { select: { id: true, name: true } },
        },
      }),
      db.productABCTypes.findMany({
        select: { id: true, code: true, name: true },
      }),
    ]);

    const employeeMap = new Map(employees.map((e) => [e.employeeCode, e]));
    const customerMap = new Map(customers.map((c) => [c.customerCode, c]));
    const productMap = new Map(products.map((p) => [p.productCode, p]));
    const abcTypeMap = new Map(abcTypes.map((a) => [a.code.toUpperCase(), a]));

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
      productABCTypeId: string | null;
    };

    type OrderGroup = {
      customerId: string;
      employeeId: string;
      saleDate: Date;
      paymentTerm: string;
      notes: string;
      paymentDate: Date | null;
      orderNumber: string;
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
      const abcCodeRaw = row["ประเภท (ABC Code)"]?.toString().trim() || "";
      const paymentDateRaw = row["วันที่ชำระเงิน"];
      const cartonPriceRaw = row["ราคาลัง"];
      const orderNumberRaw = row["เลขที่ออเดอร์"]?.toString().trim() || "";

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

      // Parse optional fields
      const paymentDate = paymentDateRaw ? parseDate(paymentDateRaw) : null;
      if (paymentDateRaw && !paymentDate) {
        errors.push(`แถวที่ ${rowIdx}: วันที่ชำระเงินไม่ถูกต้อง (${paymentDateRaw})`);
        continue;
      }

      const cartonPriceOverride = cartonPriceRaw
        ? parseFloat(cartonPriceRaw.toString().replace(/,/g, ""))
        : null;

      // Resolve ABC Code
      let resolvedAbcTypeId: string | null = null;
      let resolvedAbcTypeName: string | null = null;
      if (abcCodeRaw) {
        const abcType = abcTypeMap.get(abcCodeRaw.toUpperCase());
        if (!abcType) {
          errors.push(`แถวที่ ${rowIdx}: ไม่พบประเภท (ABC Code): ${abcCodeRaw}`);
          continue;
        }
        resolvedAbcTypeId = abcType.id;
        resolvedAbcTypeName = abcType.name;
      } else {
        // Fallback to product's ABC type
        resolvedAbcTypeId = product.productABCType?.id || null;
        resolvedAbcTypeName = product.productABCType?.name || null;
      }

      // Group key: if order number is provided, use it; otherwise use date+customer+employee+paymentTerm
      let groupKey: string;
      if (orderNumberRaw) {
        groupKey = `order_${orderNumberRaw}`;
      } else {
        const dateKey = saleDate.toISOString().split("T")[0];
        groupKey = `${dateKey}_${customer.id}_${employee.id}_${paymentTerm}`;
      }

      if (!ordersMap.has(groupKey)) {
        ordersMap.set(groupKey, {
          customerId: customer.id,
          employeeId: employee.id,
          saleDate,
          paymentTerm,
          notes,
          paymentDate,
          orderNumber: orderNumberRaw,
          items: [],
        });
      }

      // Append notes if different
      const order = ordersMap.get(groupKey)!;
      if (notes && !order.notes.includes(notes)) {
        order.notes = order.notes ? `${order.notes}, ${notes}` : notes;
      }
      // Use the first non-null payment date in the group
      if (paymentDate && !order.paymentDate) {
        order.paymentDate = paymentDate;
      }

      // Determine cartonPrice: use override if provided, else fall back to product default
      const finalCartonPrice = cartonPriceOverride != null && !isNaN(cartonPriceOverride)
        ? cartonPriceOverride
        : (product.cartonPrice ? Number(product.cartonPrice) : null);

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
        cartonPrice: finalCartonPrice,
        promotionBudget: product.promotionBudget ? Number(product.promotionBudget) : null,
        pointPerUnit: product.pointPerUnit ?? 0,
        productGroup: product.productGroup?.name || product.tradeNameGroup?.description || null,
        productChain: resolvedAbcTypeName,
        productABCTypeId: resolvedAbcTypeId || null,
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
            paymentDate: order.paymentDate || null,
            saleOrderRef: order.orderNumber || null,
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
                productABCTypeId: item.productABCTypeId,
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
