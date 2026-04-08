import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import {
  recordSalesTargetHistory,
  buildSnapshot,
} from "../infrastructure/sales-target-history.repository";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ImportSalesTargetResult = {
  success: boolean;
  message?: string;
  totalRows?: number;
  importedTargets?: number;
  updatedTargets?: number;
  skippedRows?: number;
  errors?: string[];
  preview?: ImportPreviewRow[];
};

export interface ImportPreviewRow {
  row: number;
  year: number;
  month: number;
  employeeName: string;
  customerName: string;
  productCode: string;
  productName: string;
  qtyPerBox: number;
  pricePerBox: number;
  targetAmount: number;
  status: "valid" | "error";
  errorMessage?: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  "ปี",
  "เดือน",
  "รหัสพนักงาน",
  "รหัสร้านค้า",
  "รหัสสินค้า",
  "จำนวน (ลัง)",
  "ราคา/ลัง",
  "เป้าหมาย (บาท)",
];

const MONTH_MAP: Record<string, number> = {
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4,
  พฤษภาคม: 5, มิถุนายน: 6, กรกฎาคม: 7, สิงหาคม: 8,
  กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function parseMonth(monthStr: string | number): number | null {
  if (typeof monthStr === "number") {
    return monthStr >= 1 && monthStr <= 12 ? monthStr : null;
  }
  const trimmed = monthStr.toString().trim();
  // Try direct number
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num;
  // Try name
  if (MONTH_MAP[trimmed]) return MONTH_MAP[trimmed];
  // Try partial match
  const matched = Object.keys(MONTH_MAP).find((k) =>
    k.toLowerCase().startsWith(trimmed.toLowerCase()),
  );
  return matched ? MONTH_MAP[matched] : null;
}

function normalizeYear(year: number): number {
  // If > 2500, assume Thai Buddhist year
  return year > 2500 ? year - 543 : year;
}

// ─────────────────────────────────────────────
// Template Generator
// ─────────────────────────────────────────────

export function generateSalesTargetTemplate(): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  // Header row
  const headers = REQUIRED_COLUMNS;

  // Example data rows
  const exampleRows = [
    [2569, 5, "EMP001", "CUST001", "PRD001", 10, 1500, 15000],
    [2569, 5, "EMP001", "CUST001", "PRD002", 5, 2000, 10000],
    [2569, 5, "EMP001", "CUST002", "PRD001", 8, 1500, 12000],
    [2569, 6, "EMP002", "CUST003", "PRD003", 20, 800, 16000],
  ];

  const data = [headers, ...exampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for readability
  ws["!cols"] = [
    { wch: 8 },   // ปี
    { wch: 10 },  // เดือน
    { wch: 15 },  // รหัสพนักงาน
    { wch: 15 },  // รหัสร้านค้า
    { wch: 15 },  // รหัสสินค้า
    { wch: 14 },  // จำนวน (ลัง)
    { wch: 14 },  // ราคา/ลัง
    { wch: 16 },  // เป้าหมาย (บาท)
  ];

  XLSX.utils.book_append_sheet(wb, ws, "เป้าหมายการขาย");

  // Add instruction sheet
  const instrData = [
    ["คำแนะนำการกรอกข้อมูล"],
    [""],
    ["คอลัมน์", "คำอธิบาย", "ตัวอย่าง"],
    ["ปี", "ปี พ.ศ. หรือ ค.ศ. (ระบบรองรับทั้งสองแบบ)", "2569 หรือ 2026"],
    ["เดือน", "เดือน 1-12 หรือชื่อเดือนภาษาไทย", "5 หรือ พฤษภาคม"],
    ["รหัสพนักงาน", "รหัสพนักงานขายในระบบ (Employee Code)", "EMP001"],
    ["รหัสร้านค้า", "รหัสลูกค้า/ร้านค้าในระบบ (Customer Code)", "CUST001"],
    ["รหัสสินค้า", "รหัสสินค้าในระบบ (Product Code)", "PRD001"],
    ["จำนวน (ลัง)", "จำนวนสินค้าเป้าหมาย (จำนวนเต็ม)", "10"],
    ["ราคา/ลัง", "ราคาต่อลัง (บาท)", "1500"],
    ["เป้าหมาย (บาท)", "ยอดเป้าหมายการขาย (บาท) = จำนวน × ราคา/ลัง", "15000"],
    [""],
    ["หมายเหตุ:"],
    ["1. หากมีเป้าหมายของพนักงาน+เดือน+ปี ซ้ำกัน ระบบจะอัปเดตข้อมูลเดิม (Upsert)"],
    ["2. แต่ละแถวคือ 1 สินค้า ภายใต้ 1 ร้านค้า ของ 1 พนักงาน"],
    ["3. พนักงาน 1 คน สามารถมีหลายร้านค้า แต่ละร้านค้ามีหลายสินค้าได้"],
    ["4. ปี พ.ศ. จะถูกแปลงเป็น ค.ศ. โดยอัตโนมัติ"],
  ];
  const instrWs = XLSX.utils.aoa_to_sheet(instrData);
  instrWs["!cols"] = [
    { wch: 20 },
    { wch: 50 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, instrWs, "คำแนะนำ");

  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

// ─────────────────────────────────────────────
// Preview (Validate Only, No DB Writes)
// ─────────────────────────────────────────────

export async function previewSalesTargetImport(
  fileBuffer: ArrayBuffer,
): Promise<ImportSalesTargetResult> {
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

      const yearRaw = row["ปี"];
      const monthRaw = row["เดือน"];
      const employeeCode = row["รหัสพนักงาน"]?.toString().trim();
      const customerCode = row["รหัสร้านค้า"]?.toString().trim();
      const productCode = row["รหัสสินค้า"]?.toString().trim();
      const qtyRaw = row["จำนวน (ลัง)"];
      const priceRaw = row["ราคา/ลัง"];
      const targetRaw = row["เป้าหมาย (บาท)"];

      // Validate required fields
      if (!yearRaw) rowErrors.push("ไม่มีปี");
      if (!monthRaw && monthRaw !== 0) rowErrors.push("ไม่มีเดือน");
      if (!employeeCode) rowErrors.push("ไม่มีรหัสพนักงาน");
      if (!customerCode) rowErrors.push("ไม่มีรหัสร้านค้า");
      if (!productCode) rowErrors.push("ไม่มีรหัสสินค้า");

      const year = yearRaw ? normalizeYear(parseInt(yearRaw.toString(), 10)) : 0;
      const month = monthRaw !== undefined ? parseMonth(monthRaw) : null;

      if (yearRaw && (isNaN(year) || year < 2020 || year > 2100)) {
        rowErrors.push(`ปีไม่ถูกต้อง: ${yearRaw}`);
      }
      if (monthRaw !== undefined && month === null) {
        rowErrors.push(`เดือนไม่ถูกต้อง: ${monthRaw}`);
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
      const target = parseFloat(targetRaw?.toString().replace(/,/g, "") || "0");

      if (qty <= 0) rowErrors.push("จำนวนต้องมากกว่า 0");
      if (price < 0) rowErrors.push("ราคาต้องไม่ติดลบ");
      if (target < 0) rowErrors.push("เป้าหมายต้องไม่ติดลบ");

      if (rowErrors.length > 0) {
        errors.push(`แถวที่ ${rowIdx}: ${rowErrors.join(", ")}`);
      }

      preview.push({
        row: rowIdx,
        year: year || 0,
        month: month || 0,
        employeeName: employee?.name || employeeCode || "-",
        customerName: customer?.name || customerCode || "-",
        productCode: product?.productCode || productCode || "-",
        productName: product?.name || "-",
        qtyPerBox: qty,
        pricePerBox: price,
        targetAmount: target,
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

export async function processSalesTargetImport(
  fileBuffer: ArrayBuffer,
  userId: string,
): Promise<ImportSalesTargetResult> {
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
          unit: true,
          cartonPrice: true,
        },
      }),
    ]);

    const employeeMap = new Map(employees.map((e) => [e.employeeCode, e]));
    const customerMap = new Map(customers.map((c) => [c.customerCode, c]));
    const productMap = new Map(products.map((p) => [p.productCode, p]));

    // Group data: employeeId -> year -> month -> customerId -> items[]
    type ItemEntry = {
      productId: string;
      qtyPerBox: number;
      pricePerBox: number;
      targetAmount: number;
    };
    type StoreEntry = {
      customerId: string;
      items: ItemEntry[];
    };
    type TargetGroup = {
      year: number;
      month: number;
      employeeId: string;
      stores: Map<string, StoreEntry>;
    };

    const targetGroupMap = new Map<string, TargetGroup>();

    let rowIdx = 1;
    let validRows = 0;

    for (const row of rows) {
      rowIdx++;

      const yearRaw = row["ปี"];
      const monthRaw = row["เดือน"];
      const employeeCode = row["รหัสพนักงาน"]?.toString().trim();
      const customerCode = row["รหัสร้านค้า"]?.toString().trim();
      const productCode = row["รหัสสินค้า"]?.toString().trim();
      const qtyRaw = row["จำนวน (ลัง)"];
      const priceRaw = row["ราคา/ลัง"];
      const targetRaw = row["เป้าหมาย (บาท)"];

      // Validate
      if (!yearRaw || (!monthRaw && monthRaw !== 0) || !employeeCode || !customerCode || !productCode) {
        errors.push(`แถวที่ ${rowIdx}: ข้อมูลไม่ครบถ้วน`);
        continue;
      }

      const year = normalizeYear(parseInt(yearRaw.toString(), 10));
      const month = parseMonth(monthRaw);

      if (isNaN(year) || year < 2020 || year > 2100) {
        errors.push(`แถวที่ ${rowIdx}: ปีไม่ถูกต้อง (${yearRaw})`);
        continue;
      }
      if (month === null) {
        errors.push(`แถวที่ ${rowIdx}: เดือนไม่ถูกต้อง (${monthRaw})`);
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

      const qty = parseInt(qtyRaw?.toString().replace(/,/g, "") || "0", 10);
      const price = parseFloat(priceRaw?.toString().replace(/,/g, "") || "0");
      const target = parseFloat(targetRaw?.toString().replace(/,/g, "") || "0");

      if (qty <= 0) {
        errors.push(`แถวที่ ${rowIdx}: จำนวนต้องมากกว่า 0`);
        continue;
      }

      // Group key: year_month_employeeId
      const groupKey = `${year}_${month}_${employee.id}`;

      if (!targetGroupMap.has(groupKey)) {
        targetGroupMap.set(groupKey, {
          year,
          month,
          employeeId: employee.id,
          stores: new Map(),
        });
      }

      const group = targetGroupMap.get(groupKey)!;
      if (!group.stores.has(customer.id)) {
        group.stores.set(customer.id, {
          customerId: customer.id,
          items: [],
        });
      }

      group.stores.get(customer.id)!.items.push({
        productId: product.id,
        qtyPerBox: qty,
        pricePerBox: price,
        targetAmount: target,
      });

      validRows++;
    }

    if (targetGroupMap.size === 0) {
      return {
        success: false,
        errors,
        message: "ไม่มีข้อมูลที่ถูกต้องให้บันทึก",
      };
    }

    // Upsert each target group
    let importedCount = 0;
    let updatedCount = 0;

    for (const group of targetGroupMap.values()) {
      const storesData = Array.from(group.stores.values()).map((store) => ({
        customerId: store.customerId,
        items: store.items,
      }));

      // Check if existing target exists
      const existing = await db.salesTarget.findUnique({
        where: {
          year_month_employeeId: {
            year: group.year,
            month: group.month,
            employeeId: group.employeeId,
          },
        },
        include: {
          employee: { select: { id: true, name: true, employeeCode: true } },
          stores: {
            include: {
              customer: { select: { id: true, name: true, customerCode: true } },
              items: {
                include: {
                  product: {
                    select: { id: true, name: true, productCode: true, unit: true, cartonPrice: true },
                  },
                },
              },
            },
          },
        },
      });

      if (existing) {
        // Take snapshot before update
        const snapshotBefore = buildSnapshot(existing);

        // Delete existing stores (cascade items)
        await db.salesTargetStore.deleteMany({
          where: { salesTargetId: existing.id },
        });

        // Update with new data
        const updated = await db.salesTarget.update({
          where: { id: existing.id },
          data: {
            stores: {
              create: storesData.map((store) => ({
                customerId: store.customerId,
                items: {
                  create: store.items.map((item) => ({
                    productId: item.productId,
                    pricePerBox: item.pricePerBox,
                    qtyPerBox: item.qtyPerBox,
                    targetAmount: item.targetAmount,
                  })),
                },
              })),
            },
          },
          include: {
            employee: { select: { id: true, name: true, employeeCode: true } },
            stores: {
              include: {
                customer: { select: { id: true, name: true, customerCode: true } },
                items: {
                  include: {
                    product: {
                      select: { id: true, name: true, productCode: true, unit: true, cartonPrice: true },
                    },
                  },
                },
              },
            },
          },
        });

        const snapshotAfter = buildSnapshot(updated);

        await recordSalesTargetHistory({
          salesTargetId: existing.id,
          changeType: "UPDATED",
          changedById: userId,
          snapshotBefore,
          snapshotAfter,
          changeSummary: `นำเข้าข้อมูลจาก Excel (อัปเดต) ${storesData.length} ร้านค้า`,
        });

        updatedCount++;
      } else {
        // Create new target
        const created = await db.salesTarget.create({
          data: {
            year: group.year,
            month: group.month,
            employeeId: group.employeeId,
            createdById: userId,
            stores: {
              create: storesData.map((store) => ({
                customerId: store.customerId,
                items: {
                  create: store.items.map((item) => ({
                    productId: item.productId,
                    pricePerBox: item.pricePerBox,
                    qtyPerBox: item.qtyPerBox,
                    targetAmount: item.targetAmount,
                  })),
                },
              })),
            },
          },
          include: {
            employee: { select: { id: true, name: true, employeeCode: true } },
            stores: {
              include: {
                customer: { select: { id: true, name: true, customerCode: true } },
                items: {
                  include: {
                    product: {
                      select: { id: true, name: true, productCode: true, unit: true, cartonPrice: true },
                    },
                  },
                },
              },
            },
          },
        });

        const snapshotAfter = buildSnapshot(created);

        await recordSalesTargetHistory({
          salesTargetId: created.id,
          changeType: "CREATED",
          changedById: userId,
          snapshotBefore: null,
          snapshotAfter,
          changeSummary: `นำเข้าข้อมูลจาก Excel (สร้างใหม่) ${storesData.length} ร้านค้า`,
        });

        importedCount++;
      }
    }

    return {
      success: true,
      totalRows: rows.length,
      importedTargets: importedCount,
      updatedTargets: updatedCount,
      skippedRows: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `นำเข้าข้อมูลสำเร็จ: สร้างใหม่ ${importedCount} รายการ, อัปเดต ${updatedCount} รายการ`,
    };
  } catch (err: any) {
    console.error("Import error:", err);
    return {
      success: false,
      message: `เกิดข้อผิดพลาด: ${err.message}`,
    };
  }
}
