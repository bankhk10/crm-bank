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

    const products = await db.product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      include: {
        stockLots: {
          where: { isUsed: false }
        }
      },
      orderBy: { productCode: "asc" }
    });

    const data: any[] = [];
    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    products.forEach((p) => {
      if (p.stockLots && p.stockLots.length > 0) {
        p.stockLots.forEach((lot) => {
          data.push({
            "รหัสสินค้า (Product Code) *": p.productCode,
            "ชื่อสินค้า (Product Name)": p.name,
            "เลขที่ล็อต (Lot Number) *": lot.lotNumber,
            "รับเข้า (Import Quantity) *": lot.initialQuantity,
            "จำนวนคงเหลือ (Remaining Quantity)": lot.quantity,
            "วันที่นำเข้า (Import Date)": formatDate(lot.importDate),
            "วันหมดอายุ (Expiry Date)": lot.expiryDate ? formatDate(lot.expiryDate) : "",
            "สถานที่จัดเก็บ (Storage)": lot.storageLocation || "",
            "หมายเหตุ (Notes)": lot.notes || "",
          });
        });
      } else {
        data.push({
          "รหัสสินค้า (Product Code) *": p.productCode,
          "ชื่อสินค้า (Product Name)": p.name,
          "เลขที่ล็อต (Lot Number) *": "",
          "รับเข้า (Import Quantity) *": "",
          "จำนวนคงเหลือ (Remaining Quantity)": "",
          "วันที่นำเข้า (Import Date)": "",
          "วันหมดอายุ (Expiry Date)": "",
          "สถานที่จัดเก็บ (Storage)": "",
          "หมายเหตุ (Notes)": "",
        });
      }
    });

    if (data.length === 0) {
      data.push({
        "รหัสสินค้า (Product Code) *": "P-001",
        "ชื่อสินค้า (Product Name)": "ตัวอย่างสินค้า 1",
        "เลขที่ล็อต (Lot Number) *": "L-2026-001",
        "จำนวนนำเข้า (Import Quantity) *": 100,
        "จำนวนคงเหลือ (Remaining Quantity)": 100,
        "วันที่นำเข้า (Import Date)": "2026-04-17",
        "วันหมดอายุ (Expiry Date)": "2027-04-17",
        "สถานที่จัดเก็บ (Storage)": "คลังบางเลน",
        "หมายเหตุ (Notes)": "First bulk lot",
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [
      { wch: 25 }, // รหัสสินค้า
      { wch: 35 }, // ชื่อสินค้า
      { wch: 25 }, // ล็อต
      { wch: 25 }, // จำนวนนำเข้า
      { wch: 25 }, // จำนวนคงเหลือ
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
export async function importBulkStockAction(formData: FormData, isPreview: boolean = false) {
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

    // Helper to find a value by possible keys, ignoring spaces
    const getVal = (row: any, keys: string[]) => {
        const rowKeys = Object.keys(row);
        for (const k of rowKeys) {
            if (keys.includes(k.trim())) {
                return row[k];
            }
        }
        return undefined;
    };

    // Pre-fetch all products to avoid N+1 queries during validation
    const productCodesSet = new Set(rawData.map((r: any) => 
      String(getVal(r, ["รหัสสินค้า (Product Code) *", "Product Code", "รหัสสินค้า"]) || "").trim()
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
        
        const productCode = String(getVal(row, ["รหัสสินค้า (Product Code) *", "Product Code", "รหัสสินค้า"]) || "").trim();
        const lotNumber = String(getVal(row, ["เลขที่ล็อต (Lot Number) *", "Lot Number", "Lot", "เลขที่ล็อต", "เลขที่LOT"]) || "").trim();
        const importQuantityRaw = getVal(row, ["รับเข้า (Import Quantity) *", "รับเข้า", "จำนวนนำเข้า (Import Quantity) *", "จำนวนนำเข้า (Quantity) *", "Quantity", "จำนวนนำเข้า"]);
        const remainingQuantityRaw = getVal(row, ["จำนวนคงเหลือ (Remaining Quantity)", "จำนวนคงเหลือ", "จำนวน"]);
        
        const importDateRaw = getVal(row, ["วันที่นำเข้า (Import Date)", "Import Date", "วันที่นำเข้า", "วันที่รับเข้า"]);
        const expiryDateRaw = getVal(row, ["วันหมดอายุ (Expiry Date)", "Expiry Date", "วันหมดอายุ"]);
        
        const storageLocation = getVal(row, ["สถานที่จัดเก็บ (Storage)", "Storage", "สถานที่จัดเก็บ", "พื้นที่จัดเก็บ", "คลัง"]);
        const notes = getVal(row, ["หมายเหตุ (Notes)", "Notes", "หมายเหตุ"]);

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

        const importDateStr = excelDateToJSDate(importDateRaw);
        if (!importDateStr) {
             errors.push(`แถวที่ ${i + 2}: ขาดวันที่นำเข้า สำหรับรหัสสินค้า [${productCode}]`);
             continue;
        }

        const expiryDateStr = excelDateToJSDate(expiryDateRaw) || undefined;

        validRows.push({
            productId,
            productCode,
            lotNumber,
            importQuantityRaw,
            remainingQuantityRaw,
            importDate: new Date(importDateStr),
            expiryDateRaw,
            expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
            storageLocationRaw: storageLocation,
            storageLocation: storageLocation 
                ? (String(storageLocation).trim() === "BL" ? "คลังบางเลน" : String(storageLocation).trim()) 
                : "คลังบางเลน",
            notesRaw: notes,
            notes: notes ? String(notes).trim() : "",
            rowNum: i + 2
        });
    }

    if (validRows.length === 0) {
        return { success: false, message: "ไม่พบข้อมูลที่ถูกต้องในไฟล์", errors };
    }

    if (isPreview) {
        const previewItems = [];
        let pCreatedCount = 0;
        let pUpdatedCount = 0;
        
        for (const row of validRows) {
             const existingLot = await db.productStockLot.findFirst({
                 where: {
                   productId: row.productId,
                   lotNumber: row.lotNumber,
                 }
             });

             const action = existingLot ? "UPDATE" : "CREATE";
             if (existingLot) pUpdatedCount++; else pCreatedCount++;

             let remainingQty = row.remainingQuantityRaw !== undefined && row.remainingQuantityRaw !== "" 
                ? Number(row.remainingQuantityRaw) 
                : (existingLot ? existingLot.quantity : Number(row.importQuantityRaw));
                
             let importQty = existingLot 
                ? (row.importQuantityRaw !== undefined && row.importQuantityRaw !== "" ? Number(row.importQuantityRaw) : existingLot.initialQuantity)
                : (row.importQuantityRaw !== undefined && row.importQuantityRaw !== "" 
                    ? Number(row.importQuantityRaw) 
                    : Number(row.remainingQuantityRaw));

             previewItems.push({
                 rowNum: row.rowNum,
                 productCode: row.productCode,
                 lotNumber: row.lotNumber,
                 action,
                 importQuantity: importQty,
                 remainingQuantity: remainingQty,
                 importDate: row.importDate.toISOString().split("T")[0],
                 expiryDate: row.expiryDate ? row.expiryDate.toISOString().split("T")[0] : (existingLot?.expiryDate ? existingLot.expiryDate.toISOString().split("T")[0] : ""),
                 storageLocation: (row.storageLocationRaw !== undefined && row.storageLocationRaw !== "") ? row.storageLocation : (existingLot?.storageLocation || "คลังบางเลน"),
                 notes: row.notesRaw !== undefined ? row.notes : (existingLot?.notes || ""),
             });
        }
        
        return { 
           success: true, 
           isPreview: true,
           previewItems,
           createdCount: pCreatedCount,
           updatedCount: pUpdatedCount,
           totalRows: validRows.length,
           errors 
        };
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
                 }
             });

             if (existingLot) {
                 // Update
                 const dataToUpdate: any = {
                     importDate: row.importDate,
                 };
                 
                 if (row.remainingQuantityRaw !== undefined && row.remainingQuantityRaw !== "") {
                     const qty = Number(row.remainingQuantityRaw);
                     if (!isNaN(qty) && qty >= 0) dataToUpdate.quantity = qty;
                 }
                 
                 if (row.importQuantityRaw !== undefined && row.importQuantityRaw !== "") {
                     const qty = Number(row.importQuantityRaw);
                     if (!isNaN(qty) && qty >= 0) dataToUpdate.initialQuantity = qty;
                 }
                 
                 if (row.expiryDateRaw !== undefined) {
                     dataToUpdate.expiryDate = row.expiryDate;
                 }
                 
                 if (row.storageLocationRaw !== undefined && row.storageLocationRaw !== "") {
                     dataToUpdate.storageLocation = row.storageLocation;
                 }
                 
                 if (row.notesRaw !== undefined) {
                     dataToUpdate.notes = row.notes;
                 }

                 await tx.productStockLot.update({
                     where: { id: existingLot.id },
                     data: dataToUpdate
                 });
                 updatedCount++;
             } else {
                 // Create
                 let importQty = row.importQuantityRaw !== undefined && row.importQuantityRaw !== "" 
                     ? Number(row.importQuantityRaw) 
                     : Number(row.remainingQuantityRaw);
                     
                 let remainingQty = row.remainingQuantityRaw !== undefined && row.remainingQuantityRaw !== "" 
                     ? Number(row.remainingQuantityRaw) 
                     : Number(row.importQuantityRaw);
                 
                 if (isNaN(importQty) || importQty < 0) {
                     throw new Error(`การสร้างล็อตใหม่ จำนวนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป`);
                 }
                 
                 if (isNaN(remainingQty)) {
                     remainingQty = importQty;
                 }
                 
                 await tx.productStockLot.create({
                     data: {
                         productId: row.productId,
                         lotNumber: row.lotNumber,
                         quantity: remainingQty,
                         initialQuantity: importQty,
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

