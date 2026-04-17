"use server";

import * as XLSX from "xlsx";
import { auth } from "@/modules/auth/infrastructure/next-auth";

import { db } from "@/lib/db";

/**
 * Download Stock Lot Excel Template
 */
export async function downloadStockLotTemplateAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const wb = XLSX.utils.book_new();

    // Data rows
    const data = [
      {
        "เลขที่ล็อต (Lot Number) *": "L-2026-001",
        "จำนวนนำเข้า (Quantity) *": 100,
        "วันที่นำเข้า (Import Date)": "2026-04-17",
        "วันหมดอายุ (Expiry Date)": "2027-04-17",
        "สถานที่จัดเก็บ (Storage)": "คลังบางเลน",
        "หมายเหตุ (Notes)": "First lot",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);

    // Style adjustments (column widths)
    ws["!cols"] = [
      { wch: 25 }, // ล็อต
      { wch: 15 }, // จำนวน
      { wch: 18 }, // นำเข้า
      { wch: 18 }, // หมดอายุ
      { wch: 20 }, // จัดเก็บ
      { wch: 30 }, // หมายเหตุ
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Template");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const base64Str = Buffer.from(excelBuffer).toString("base64");

    return { success: true, data: base64Str };
  } catch (error: any) {
    console.error("Template error:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการสร้าง Template" };
  }
}

/**
 * Parse uploaded Stock Lot Excel file
 */
export async function parseStockLotsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, message: "No file found" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const wb = XLSX.read(data, { type: "array", cellDates: true });

    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];

    // Read raw json
    // raw: false -> formats dates to strings based on Excel format, but cellDates:true gets Date objects.
    const rawData = XLSX.utils.sheet_to_json(ws);

    if (!rawData || rawData.length === 0) {
      return { success: false, message: "ไฟล์ว่างเปล่า" };
    }

    const parsedLots = [];
    const errors = [];

    const excelDateToJSDate = (dateVal: any): string => {
      if (!dateVal) return "";
      let d: Date;
      if (dateVal instanceof Date) {
        d = dateVal;
      } else if (typeof dateVal === "number") {
        d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
      } else {
        d = new Date(dateVal);
      }

      if (isNaN(d.getTime())) return "";

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    for (let i = 0; i < rawData.length; i++) {
        const row: any = rawData[i];
        
        const lotNumber = row["เลขที่ล็อต (Lot Number) *"] || row["Lot Number"] || row["Lot"] || row["เลขที่ล็อต"];
        const quantityRaw = row["จำนวนนำเข้า (Quantity) *"] || row["Quantity"] || row["จำนวนนำเข้า"] || row["จำนวน"];
        const importDateRaw = row["วันที่นำเข้า (Import Date)"] || row["Import Date"] || row["วันที่นำเข้า"];
        const expiryDateRaw = row["วันหมดอายุ (Expiry Date)"] || row["Expiry Date"] || row["วันหมดอายุ"];
        const storageLocation = row["สถานที่จัดเก็บ (Storage)"] || row["Storage"] || row["สถานที่จัดเก็บ"];
        const notes = row["หมายเหตุ (Notes)"] || row["Notes"] || row["หมายเหตุ"] || "";

        if (!lotNumber) {
            errors.push(`แถวที่ ${i + 2}: ขาดเลขที่ล็อต`);
            continue;
        }

        const quantity = Number(quantityRaw);
        if (isNaN(quantity) || quantity <= 0) {
            errors.push(`แถวที่ ${i + 2}: จำนวนนำเข้าต้องเป็นตัวเลขมากกว่า 0`);
            continue;
        }

        const importDateStr = excelDateToJSDate(importDateRaw) || new Date().toISOString().split("T")[0];
        const expiryDateStr = excelDateToJSDate(expiryDateRaw) || undefined;

        parsedLots.push({
            lotNumber: String(lotNumber),
            quantity,
            initialQuantity: quantity,
            importDate: importDateStr,
            expiryDate: expiryDateStr,
            storageLocation: storageLocation ? String(storageLocation) : "",
            notes: String(notes),
        });
    }

    if (parsedLots.length === 0) {
        return { success: false, message: "ไม่พบข้อมูลที่ถูกต้องในไฟล์", errors };
    }

    return { success: true, data: parsedLots, errors };

  } catch (error: any) {
    console.error("Parse error:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการอ่านไฟล์" };
  }
}

/**
 * Download Bulk Stock Excel Template
 */
export async function downloadBulkStockTemplateAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const wb = XLSX.utils.book_new();

    // Data rows
    const data = [
      {
        "รหัสสินค้า (Product Code) *": "P-001",
        "ชื่อสินค้า (Product Name)": "ตัวอย่างสินค้า 1",
        "เลขที่ล็อต (Lot Number) *": "L-2026-001",
        "จำนวนนำเข้า (Quantity) *": 100,
        "วันที่นำเข้า (Import Date)": "2026-04-17",
        "วันหมดอายุ (Expiry Date)": "2027-04-17",
        "สถานที่จัดเก็บ (Storage)": "คลังบางเลน",
        "หมายเหตุ (Notes)": "First bulk lot",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [
      { wch: 25 }, // รหัสสินค้า
      { wch: 35 }, // ชื่อสินค้า
      { wch: 25 }, // ล็อต
      { wch: 15 }, // จำนวน
      { wch: 18 }, // นำเข้า
      { wch: 18 }, // หมดอายุ
      { wch: 20 }, // จัดเก็บ
      { wch: 30 }, // หมายเหตุ
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Template");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const base64Str = Buffer.from(excelBuffer).toString("base64");

    return { success: true, data: base64Str };
  } catch (error: any) {
    console.error("Template error:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการสร้าง Template" };
  }
}

/**
 * Parse and Process uploaded Bulk Stock Excel file
 */
export async function importBulkStockAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, message: "No file found" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const wb = XLSX.read(data, { type: "array", cellDates: true });

    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];

    const rawData = XLSX.utils.sheet_to_json(ws);

    if (!rawData || rawData.length === 0) {
      return { success: false, message: "ไฟล์ว่างเปล่า" };
    }

    const errors: string[] = [];
    let updatedCount = 0;
    let createdCount = 0;

    const excelDateToJSDate = (dateVal: any): string => {
      if (!dateVal) return "";
      let d: Date;
      if (dateVal instanceof Date) {
        d = dateVal;
      } else if (typeof dateVal === "number") {
        d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
      } else {
        d = new Date(dateVal);
      }
      if (isNaN(d.getTime())) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    // Pre-fetch all products to avoid N+1 queries during validation
    const productCodesSet = new Set(rawData.map((r: any) => 
      String(r["รหัสสินค้า (Product Code) *"] || r["Product Code"] || r["รหัสสินค้า"] || "")
    ).filter(Boolean));

    const productsMap = new Map();
    if (productCodesSet.size > 0) {
      const existingProducts = await db.product.findMany({
        where: { productCode: { in: Array.from(productCodesSet) }, deletedAt: null },
        select: { id: true, productCode: true }
      });
      existingProducts.forEach(p => productsMap.set(p.productCode, p.id));
    }

    const validRows = [];

    for (let i = 0; i < rawData.length; i++) {
        const row: any = rawData[i];
        
        const productCode = String(row["รหัสสินค้า (Product Code) *"] || row["Product Code"] || row["รหัสสินค้า"] || "").trim();
        const lotNumber = String(row["เลขที่ล็อต (Lot Number) *"] || row["Lot Number"] || row["Lot"] || row["เลขที่ล็อต"] || "").trim();
        const quantityRaw = row["จำนวนนำเข้า (Quantity) *"] || row["Quantity"] || row["จำนวนนำเข้า"] || row["จำนวน"];
        
        const importDateRaw = row["วันที่นำเข้า (Import Date)"] || row["Import Date"] || row["วันที่นำเข้า"];
        const expiryDateRaw = row["วันหมดอายุ (Expiry Date)"] || row["Expiry Date"] || row["วันหมดอายุ"];
        
        const storageLocation = String(row["สถานที่จัดเก็บ (Storage)"] || row["Storage"] || row["สถานที่จัดเก็บ"] || "").trim();
        const notes = String(row["หมายเหตุ (Notes)"] || row["Notes"] || row["หมายเหตุ"] || "").trim();

        if (!productCode) {
            errors.push(`แถวที่ ${i + 2}: ขาดรหัสสินค้า`);
            continue;
        }

        const productId = productsMap.get(productCode);
        if (!productId) {
            errors.push(`แถวที่ ${i + 2}: ไม่พบรหัสสินค้า [${productCode}]ในระบบ`);
            continue;
        }

        if (!lotNumber) {
            errors.push(`แถวที่ ${i + 2}: ขาดเลขที่ล็อต สำหรับรหัสสินค้า [${productCode}]`);
            continue;
        }

        const quantity = Number(quantityRaw);
        if (isNaN(quantity) || quantity <= 0) {
            errors.push(`แถวที่ ${i + 2}: จำนวนนำเข้าต้องเป็นตัวเลขมากกว่า 0 (สินค้า ${productCode})`);
            continue;
        }

        const importDateStr = excelDateToJSDate(importDateRaw) || new Date().toISOString().split("T")[0];
        const expiryDateStr = excelDateToJSDate(expiryDateRaw) || undefined;

        validRows.push({
            productId,
            productCode,
            lotNumber,
            quantity,
            importDate: new Date(importDateStr),
            expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
            storageLocation,
            notes,
            rowNum: i + 2
        });
    }

    if (validRows.length === 0) {
        return { success: false, message: "ไม่พบข้อมูลที่ถูกต้องในไฟล์", errors };
    }

    // Process valid rows
    for (const row of validRows) {
       try {
          await db.$transaction(async (tx) => {
             // 1. Check if lot exists
             const existingLot = await tx.productStockLot.findFirst({
                 where: {
                   productId: row.productId,
                   lotNumber: row.lotNumber,
                   isUsed: false // allow update only if not used, or we just update quantity
                 }
             });

             if (existingLot) {
                 // Update
                 await tx.productStockLot.update({
                     where: { id: existingLot.id },
                     data: {
                         quantity: row.quantity,
                         // Option: if they really mean "add to stock", maybe it should be quantity + row.quantity. 
                         // But usually template implies "setting" the quantity to this new value or resetting.
                         // For safety, let's treat it as setting/updating.
                         initialQuantity: row.quantity,
                         importDate: row.importDate,
                         expiryDate: row.expiryDate,
                         storageLocation: row.storageLocation,
                         notes: row.notes,
                     }
                 });
                 updatedCount++;
             } else {
                 // Create
                 await tx.productStockLot.create({
                     data: {
                         productId: row.productId,
                         lotNumber: row.lotNumber,
                         quantity: row.quantity,
                         initialQuantity: row.quantity,
                         importDate: row.importDate,
                         expiryDate: row.expiryDate,
                         storageLocation: row.storageLocation,
                         notes: row.notes,
                         isUsed: false,
                     }
                 });
                 createdCount++;
             }

             // 2. Sync physical Balance for the ProductStock
             // Recalculate balance for this product
             const allLots = await tx.productStockLot.findMany({
                 where: { productId: row.productId, isUsed: false }
             });

             const physicalBalance = allLots.reduce((sum, lot) => sum + lot.quantity, 0);

             const currentStock = await tx.productStock.findUnique({
                 where: { productId: row.productId }
             });

             const currentReserved = currentStock?.reservedQuantity || 0;
             const availableQuantity = physicalBalance - currentReserved;

             await tx.productStock.upsert({
                 where: { productId: row.productId },
                 create: {
                     productId: row.productId,
                     availableQuantity: physicalBalance,
                     reservedQuantity: 0,
                     physicalBalance: physicalBalance,
                 },
                 update: {
                     availableQuantity: availableQuantity,
                     physicalBalance: physicalBalance,
                 }
             });
          });
       } catch (err: any) {
           errors.push(`แถวที่ ${row.rowNum}: เกิดข้อผิดพลาดในการบันทึก [${row.productCode}] - ${err.message}`);
       }
    }

    return { 
       success: true, 
       message: `นำเข้าสำเร็จทั้งหมด ${createdCount + updatedCount} รายการ`, 
       totalRows: validRows.length,
       createdCount,
       updatedCount,
       errors 
    };

  } catch (error: any) {
    console.error("Import error:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการนำเข้าไฟล์" };
  }
}

