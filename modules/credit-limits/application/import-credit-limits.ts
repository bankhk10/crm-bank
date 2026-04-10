import { db, Prisma } from "@/lib/db";
import * as XLSX from "xlsx";
import { upsertPromotionalBudget } from "../infrastructure/credit-limit.repository";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ImportCreditLimitResult = {
  success: boolean;
  message?: string;
  totalRows?: number;
  importedRows?: number;
  skippedRows?: number;
  errors?: string[];
  preview?: ImportPreviewRow[];
};

export interface ImportPreviewRow {
  row: number;
  customerCode: string;
  customerName: string;
  limitAmount: number;
  promoAmount: number;
  temporaryCreditAmount: number;
  temporaryCreditExpiryDate: string;
  notes: string;
  status: "valid" | "error";
  errorMessage?: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  "รหัสลูกค้า",
];

const OPTIONAL_COLUMNS = [
  "วงเงินเครดิต",
  "วงเงินส่งเสริมการขาย",
  "วงเงินเครดิตชั่วคราว",
  "วันหมดอายุวงเงินชั่วคราว",
  "หมายเหตุ",
];

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

export function generateCreditLimitTemplate(): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  // Header row
  const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

  // Example data rows
  const today = new Date();
  const futureStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() + 543 + 1}`;
  
  const exampleRows = [
    ["CUST001", 500000, 100000, 0, "", "ลูกค้าจ่ายดี ปรับวงเงินเพิ่ม"],
    ["CUST002", 200000, 50000, 50000, futureStr, "อนุมัติวงเงินชั่วคราว"],
  ];

  const data = [headers, ...exampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = [
    { wch: 15 },  // รหัสลูกค้า
    { wch: 20 },  // วงเงินเครดิต
    { wch: 25 },  // วงเงินส่งเสริมการขาย
    { wch: 25 },  // วงเงินเครดิตชั่วคราว
    { wch: 25 },  // วันหมดอายุวงเงินชั่วคราว
    { wch: 30 },  // หมายเหตุ
  ];

  XLSX.utils.book_append_sheet(wb, ws, "วงเงินลูกค้า");

  const instrData = [
    ["คำแนะนำการกรอกข้อมูลนำเข้าวงเงินเครดิตลูกค้า"],
    [""],
    ["คอลัมน์", "คำอธิบาย", "ตัวอย่าง", "จำเป็น"],
    ["รหัสลูกค้า", "รหัสลูกค้า/ร้านค้าในระบบ (Customer Code)", "CUST001", "✓"],
    ["วงเงินเครดิต", "จำนวนวงเงินเครดิตหลัก (บาท)", "500000", ""],
    ["วงเงินส่งเสริมการขาย", "วงเงินโปรโมชั่น (บาท)", "100000", ""],
    ["วงเงินเครดิตชั่วคราว", "จำนวนวงเงินชั่วคราวที่ให้เพิ่ม (บาท)", "50000", ""],
    ["วันหมดอายุวงเงินชั่วคราว", "วันที่หมดอายุ (DD/MM/YYYY หรือ DD/MM/พ.ศ.)", futureStr, ""],
    ["หมายเหตุ", "หมายเหตุการปรับวงเงิน", "", ""],
    [""],
    ["หมายเหตุสำคัญ:"],
    ["1. หากไม่ต้องการอัพเดทคอลัมน์ไหน สามารถเว้นว่างไว้ได้"],
    ["2. วงเงินส่งเสริมการขายจะถูกนำมาสร้างหรือแทนที่ของปีงบประมาณปัจจุบัน"],
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
// Preview (Validate Only)
// ─────────────────────────────────────────────

export async function previewCreditLimitImport(
  fileBuffer: ArrayBuffer,
): Promise<ImportCreditLimitResult> {
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

    const customers = await db.customer.findMany({
      select: { id: true, name: true, customerCode: true },
    });
    const customerMap = new Map(customers.map((c) => [c.customerCode, c]));

    let rowIdx = 1;
    for (const row of rows) {
      rowIdx++;
      const rowErrors: string[] = [];

      const customerCode = row["รหัสลูกค้า"]?.toString().trim();
      const limitRaw = row["วงเงินเครดิต"];
      const promoRaw = row["วงเงินส่งเสริมการขาย"];
      const tempAmountRaw = row["วงเงินเครดิตชั่วคราว"];
      const tempExpiryRaw = row["วันหมดอายุวงเงินชั่วคราว"];
      const notes = row["หมายเหตุ"]?.toString() || "";

      if (!customerCode) {
        rowErrors.push("ไม่มีรหัสลูกค้า");
      }

      const customer = customerCode ? customerMap.get(customerCode) : null;
      if (customerCode && !customer) {
        rowErrors.push(`ไม่พบร้านค้า: ${customerCode}`);
      }

      const limitAmount = limitRaw !== undefined ? parseFloat(limitRaw?.toString().replace(/,/g, "")) : undefined;
      const promoAmount = promoRaw !== undefined ? parseFloat(promoRaw?.toString().replace(/,/g, "")) : undefined;
      const tempAmount = tempAmountRaw !== undefined ? parseFloat(tempAmountRaw?.toString().replace(/,/g, "")) : undefined;
      const tempExpiry = tempExpiryRaw ? parseDate(tempExpiryRaw) : null;

      if (limitAmount !== undefined && isNaN(limitAmount)) rowErrors.push("วงเงินเครดิตไม่ใช่ตัวเลข");
      if (limitAmount !== undefined && limitAmount < 0) rowErrors.push("วงเงินต้องไม่ติดลบ");

      if (promoAmount !== undefined && isNaN(promoAmount)) rowErrors.push("วงเงินส่งเสริมการขายไม่ใช่ตัวเลข");
      if (promoAmount !== undefined && promoAmount < 0) rowErrors.push("วงเงินส่งเสริมการขายต้องไม่ติดลบ");

      if (tempAmount !== undefined && isNaN(tempAmount)) rowErrors.push("วงเงินเครดิตชั่วคราวไม่ใช่ตัวเลข");
      if (tempAmount !== undefined && tempAmount < 0) rowErrors.push("วงเงินชั่วคราวต้องไม่ติดลบ");

      if (tempExpiryRaw && !tempExpiry) {
        rowErrors.push(`วันหมดอายุไม่ถูกต้อง: ${tempExpiryRaw}`);
      }

      if (rowErrors.length > 0) {
        errors.push(`แถวที่ ${rowIdx}: ${rowErrors.join(", ")}`);
      }

      preview.push({
        row: rowIdx,
        customerCode: customer?.customerCode || customerCode || "-",
        customerName: customer?.name || "-",
        limitAmount: limitAmount ?? 0,
        promoAmount: promoAmount ?? 0,
        temporaryCreditAmount: tempAmount ?? 0,
        temporaryCreditExpiryDate: tempExpiry ? tempExpiry.toLocaleDateString("th-TH") : "-",
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
// Process Import (DB Writes)
// ─────────────────────────────────────────────

export async function processCreditLimitImport(
  fileBuffer: ArrayBuffer,
  userId: string,
): Promise<ImportCreditLimitResult> {
  const errors: string[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

    if (rows.length === 0) {
      return { success: false, message: "ไฟล์ว่างเปล่า ไม่มีข้อมูล" };
    }

    const customers = await db.customer.findMany({
      select: { id: true, name: true, customerCode: true },
    });
    const customerMap = new Map(customers.map((c) => [c.customerCode, c]));

    const existingLimits = await db.creditLimit.findMany({
      where: { deletedAt: null },
      include: { customer: true }
    });
    const limitMap = new Map(existingLimits.map((l) => [l.customer.customerCode, l]));

    let rowIdx = 1;
    let successCount = 0;

    for (const row of rows) {
      rowIdx++;
      const customerCode = row["รหัสลูกค้า"]?.toString().trim();
      if (!customerCode) continue;

      const customer = customerMap.get(customerCode);
      if (!customer) {
        errors.push(`แถวที่ ${rowIdx}: ไม่พบร้านค้ารหัส ${customerCode}`);
        continue;
      }

      const limitRaw = row["วงเงินเครดิต"];
      const promoRaw = row["วงเงินส่งเสริมการขาย"];
      const tempAmountRaw = row["วงเงินเครดิตชั่วคราว"];
      const tempExpiryRaw = row["วันหมดอายุวงเงินชั่วคราว"];
      const notes = row["หมายเหตุ"]?.toString() || "";

      let limitAmount = limitRaw !== undefined ? parseFloat(limitRaw?.toString().replace(/,/g, "")) : undefined;
      let promoAmount = promoRaw !== undefined ? parseFloat(promoRaw?.toString().replace(/,/g, "")) : undefined;
      let tempAmount = tempAmountRaw !== undefined ? parseFloat(tempAmountRaw?.toString().replace(/,/g, "")) : undefined;
      let tempExpiry = tempExpiryRaw ? parseDate(tempExpiryRaw) : undefined;

      if (limitAmount !== undefined && isNaN(limitAmount)) limitAmount = undefined;
      if (promoAmount !== undefined && isNaN(promoAmount)) promoAmount = undefined;
      if (tempAmount !== undefined && isNaN(tempAmount)) tempAmount = undefined;

      const existingLimit = limitMap.get(customerCode);
      const today = new Date();

      if (existingLimit) {
        // Update existing
        const updateData: any = {};
        
        let newLimit = Number(existingLimit.limitAmount);
        let newUsed = Number(existingLimit.usedAmount);

        if (limitAmount !== undefined) {
          updateData.limitAmount = limitAmount;
          newLimit = limitAmount;
        }

        if (promoAmount !== undefined) {
          updateData.promoAmount = promoAmount;
        }

        if (tempAmount !== undefined) {
          updateData.temporaryCreditAmount = tempAmount;
        }

        if (tempExpiry !== undefined) {
          updateData.temporaryCreditExpiryDate = tempExpiry;
        }

        if (notes) {
          updateData.notes = notes;
        }

        // recalculate available
        if (limitAmount !== undefined) {
          updateData.availableAmount = newLimit - newUsed;
        }

        updateData.updatedAt = new Date();

        await db.$transaction(async (tx) => {
          await tx.creditLimit.update({
            where: { id: existingLimit.id },
            data: updateData,
          });

          if (promoAmount !== undefined) {
            const year = (existingLimit.effectiveDate ? existingLimit.effectiveDate : today).getFullYear();
            
            const pb = await tx.promotionalBudget.findFirst({
              where: { customerId: customer.id, year, deletedAt: null },
            });

            if (!pb) {
              await tx.promotionalBudget.create({
                data: {
                  customerId: customer.id,
                  year,
                  salesPromotionLimit: promoAmount,
                  details: {
                    create: {
                      type: "SALES_PROMOTION",
                      receivedAmount: promoAmount,
                      description: `ตั้งวงเงินงบส่งเสริมปี ${year} (นำเข้า)`,
                    },
                  },
                },
              });
            } else {
              const delta = promoAmount - Number(pb.salesPromotionLimit);
              if (delta !== 0) {
                await tx.promotionalBudget.update({
                  where: { id: pb.id },
                  data: {
                    salesPromotionLimit: promoAmount,
                    details: {
                      create: {
                        type: "SALES_PROMOTION",
                        receivedAmount: delta > 0 ? delta : null,
                        usedAmount: delta < 0 ? Math.abs(delta) : null,
                        description: delta > 0 
                          ? `เพิ่มวงเงินงบส่งเสริม ${delta.toLocaleString()} บาท (นำเข้า)` 
                          : `ลดวงเงินงบส่งเสริม ${Math.abs(delta).toLocaleString()} บาท (นำเข้า)`,
                      },
                    },
                  },
                });
              }
            }
          }
        });
      } else {
        // Create new
        const safeLimit = limitAmount ?? 0;
        const safePromo = promoAmount ?? 0;
        const safeTempAmount = tempAmount ?? 0;

        await db.$transaction(async (tx) => {
          await tx.creditLimit.create({
            data: {
              customerId: customer.id,
              limitAmount: safeLimit,
              promoAmount: safePromo,
              availableAmount: safeLimit,
              usedAmount: 0,
              effectiveDate: today,
              temporaryCreditAmount: safeTempAmount,
              temporaryCreditExpiryDate: tempExpiryRaw && tempExpiry ? tempExpiry : null,
              notes: notes || null,
              createdById: userId,
            },
          });

          if (safePromo > 0) {
            await tx.promotionalBudget.create({
              data: {
                customerId: customer.id,
                year: today.getFullYear(),
                salesPromotionLimit: safePromo,
                details: {
                  create: {
                    type: "SALES_PROMOTION",
                    receivedAmount: safePromo,
                    description: `ตั้งวงเงินงบส่งเสริมเริ่มต้น (นำเข้า)`,
                  },
                },
              },
            });
          }
        });
      }
      successCount++;
    }

    return {
      success: true,
      totalRows: rows.length,
      importedRows: successCount,
      skippedRows: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `นำเข้าข้อมูลสำเร็จ ${successCount} รายการ`,
    };
  } catch (err: any) {
    console.error("Import error:", err);
    return {
      success: false,
      message: `เกิดข้อผิดพลาด: ${err.message}`,
    };
  }
}
