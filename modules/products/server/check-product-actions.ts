"use server";

import * as XLSX from "xlsx";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";

export async function downloadProductCheckTemplateAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const wb = XLSX.utils.book_new();

    const products = await db.product.findMany({
      where: { deletedAt: null },
      include: {
        productGroup: true,
        tradeNameGroup: true,
        productABCType: true,
      },
      orderBy: { productCode: "asc" }
    });

    let data: any[] = [];
    if (products.length > 0) {
      data = products.map((p) => ({
        "รหัสสินค้า (Product Code) *": p.productCode || "",
        "ชื่อการค้า (Trade Name)": p.name || "",
        "ชื่อสามัญ (Common Name)": p.commonName || "",
        "กลุ่มสินค้า (Product Group)": p.productGroup?.name || p.productGroup?.code || "",
        "กลุ่มชื่อการค้า (Trade Name Group)": p.tradeNameGroup?.description || p.tradeNameGroup?.code || "",
        "ประเภท (ABC Code)": p.productABCType?.code || p.productABCType?.name || "",
        "ขนาดบรรจุ": p.packageSize ? Number(p.packageSize) : "",
        "หน่วยขนาดบรรจุ": p.packageSizeUnit || "",
        "จำนวนบรรจุต่อลัง (ชิ้น)": p.packageSizePerBox ? Number(p.packageSizePerBox) : "",
      }));
    } else {
      data = [
        {
          "รหัสสินค้า (Product Code) *": "P-001",
          "ชื่อการค้า (Trade Name)": "ตัวอย่างสินค้า 1",
          "ชื่อสามัญ (Common Name)": "สารสามัญ 1",
          "กลุ่มสินค้า (Product Group)": "เคมีเกษตร",
          "กลุ่มชื่อการค้า (Trade Name Group)": "กลุ่มตัวอย่าง",
          "ประเภท (ABC Code)": "A",
          "ขนาดบรรจุ": 500,
          "หน่วยขนาดบรรจุ": "CC",
          "จำนวนบรรจุต่อลัง (ชิ้น)": 24,
        },
      ];
    }

    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [
      { wch: 25 }, // รหัสสินค้า
      { wch: 35 }, // ชื่อการค้า
      { wch: 30 }, // ชื่อสามัญ
      { wch: 25 }, // กลุ่มสินค้า
      { wch: 30 }, // กลุ่มชื่อการค้า
      { wch: 15 }, // ประเภท
      { wch: 15 }, // ขนาดบรรจุ
      { wch: 15 }, // หน่วยขนาดบรรจุ
      { wch: 20 }, // จำนวนบรรจุต่อลัง
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

export async function checkProductDataAction(formData: FormData) {
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
    const wb = XLSX.read(data, { type: "array" });

    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];

    const rawData = XLSX.utils.sheet_to_json(ws);

    if (!rawData || rawData.length === 0) {
      return { success: false, message: "ไฟล์ว่างเปล่า" };
    }

    const productCodesSet = new Set<string>();
    
    // We also might want to check by Trade Name if Code is missing, but let's stick to Product Code primarily, 
    // and optionally Name if Product Code is not provided. The prompt says "เช็คว่า สินค้าไหนไม่มีในระบบ". 
    // We will use Product Code as primary key for check.
    
    const excelProducts: any[] = [];

    for (let i = 0; i < rawData.length; i++) {
        const row: any = rawData[i];
        
        const productCode = String(row["รหัสสินค้า (Product Code) *"] || row["Product Code"] || row["รหัสสินค้า"] || "").trim();
        const tradeName = String(row["ชื่อการค้า (Trade Name)"] || row["ชื่อการค้า"] || "").trim();
        const commonName = String(row["ชื่อสามัญ (Common Name)"] || row["ชื่อสามัญ"] || "").trim();
        const productGroup = String(row["กลุ่มสินค้า (Product Group)"] || row["กลุ่มสินค้า"] || "").trim();
        const tradeNameGroup = String(row["กลุ่มชื่อการค้า (Trade Name Group)"] || row["กลุ่มชื่อการค้า"] || "").trim();
        const abcCode = String(row["ประเภท (ABC Code)"] || row["ประเภท"] || "").trim();
        
        const packageSizeRaw = row["ขนาดบรรจุ"];
        const packageSizeUnit = String(row["หน่วยขนาดบรรจุ"] || "").trim();
        const packageSizePerBoxRaw = row["จำนวนบรรจุต่อลัง (ชิ้น)"] || row["จำนวนบรรจุต่อลัง"];

        const packageSize = packageSizeRaw != null ? Number(packageSizeRaw) : null;
        const packageSizePerBox = packageSizePerBoxRaw != null ? Number(packageSizePerBoxRaw) : null;

        if (productCode) {
            productCodesSet.add(productCode);
        }

        excelProducts.push({
            rowNum: i + 2,
            productCode,
            tradeName,
            commonName,
            productGroup,
            tradeNameGroup,
            abcCode,
            packageSize: isNaN(packageSize as number) ? null : packageSize,
            packageSizeUnit,
            packageSizePerBox: isNaN(packageSizePerBox as number) ? null : packageSizePerBox,
            originalRow: row
        });
    }

    // Fetch existing products
    const existingProducts = await db.product.findMany({
        where: { 
            deletedAt: null,
            // If they provided codes, we query them. If not, we query all to check by name? 
            // Querying all might be heavy if DB is huge. Let's just query by the provided codes or names.
            OR: [
               { productCode: { in: Array.from(productCodesSet) } },
               { name: { in: excelProducts.map(p => p.tradeName).filter(Boolean) } }
            ]
        },
        include: {
            productGroup: true,
            tradeNameGroup: true,
            productABCType: true
        }
    });

    const productsByCode = new Map(existingProducts.map(p => [p.productCode, p]));
    const productsByName = new Map(existingProducts.map(p => [p.name, p]));

    const missingProducts: any[] = [];
    const mismatchedProducts: any[] = [];
    const matchedProducts: any[] = [];

    for (const ep of excelProducts) {
        if (!ep.productCode && !ep.tradeName) {
            continue; // Skip empty rows
        }

        // Try to find by code first, then by name
        let dbProduct = productsByCode.get(ep.productCode);
        if (!dbProduct && ep.tradeName) {
            dbProduct = productsByName.get(ep.tradeName);
        }

        if (!dbProduct) {
            missingProducts.push({
                rowNum: ep.rowNum,
                productCode: ep.productCode,
                tradeName: ep.tradeName,
                reason: "ไม่พบสินค้านี้ในระบบ"
            });
            continue;
        }

        // Compare fields
        const discrepancies: any[] = [];

        // 1. Trade Name
        if (ep.tradeName && dbProduct.name !== ep.tradeName) {
            discrepancies.push({ field: "ชื่อการค้า", excelValue: ep.tradeName, dbValue: dbProduct.name });
        }
        
        // 2. Common Name
        if (ep.commonName && (dbProduct.commonName || "") !== ep.commonName) {
            discrepancies.push({ field: "ชื่อสามัญ", excelValue: ep.commonName, dbValue: dbProduct.commonName || "-" });
        }

        // 3. Product Group
        if (ep.productGroup) {
            const dbGroup = dbProduct.productGroup?.name || dbProduct.productGroup?.code || "";
            if (dbGroup !== ep.productGroup) {
                discrepancies.push({ field: "กลุ่มสินค้า", excelValue: ep.productGroup, dbValue: dbGroup || "-" });
            }
        }

        // 4. Trade Name Group
        if (ep.tradeNameGroup) {
            const dbTradeGroup = dbProduct.tradeNameGroup?.description || dbProduct.tradeNameGroup?.code || "";
            if (dbTradeGroup !== ep.tradeNameGroup) {
                discrepancies.push({ field: "กลุ่มชื่อการค้า", excelValue: ep.tradeNameGroup, dbValue: dbTradeGroup || "-" });
            }
        }

        // 5. ABC Code
        if (ep.abcCode) {
            const dbAbc = dbProduct.productABCType?.code || dbProduct.productABCType?.name || "";
            if (dbAbc !== ep.abcCode) {
                discrepancies.push({ field: "ประเภท (ABC Code)", excelValue: ep.abcCode, dbValue: dbAbc || "-" });
            }
        }

        // 6. Package Size
        if (ep.packageSize !== null) {
            const dbPkgSize = dbProduct.packageSize ? Number(dbProduct.packageSize) : null;
            if (dbPkgSize !== ep.packageSize) {
                discrepancies.push({ field: "ขนาดบรรจุ", excelValue: ep.packageSize, dbValue: dbPkgSize ?? "-" });
            }
        }

        // 7. Package Size Unit
        if (ep.packageSizeUnit && (dbProduct.packageSizeUnit || "") !== ep.packageSizeUnit) {
             discrepancies.push({ field: "หน่วยขนาดบรรจุ", excelValue: ep.packageSizeUnit, dbValue: dbProduct.packageSizeUnit || "-" });
        }

        // 8. Qty Per Box
        if (ep.packageSizePerBox !== null) {
            const dbQtyBox = dbProduct.packageSizePerBox ? Number(dbProduct.packageSizePerBox) : null;
            if (dbQtyBox !== ep.packageSizePerBox) {
                discrepancies.push({ field: "จำนวนบรรจุต่อลัง", excelValue: ep.packageSizePerBox, dbValue: dbQtyBox ?? "-" });
            }
        }

        if (discrepancies.length > 0) {
            mismatchedProducts.push({
                rowNum: ep.rowNum,
                productCode: dbProduct.productCode,
                tradeName: dbProduct.name,
                discrepancies
            });
        } else {
            matchedProducts.push({
                rowNum: ep.rowNum,
                productCode: dbProduct.productCode,
                tradeName: dbProduct.name,
            });
        }
    }

    return { 
       success: true, 
       missingProducts,
       mismatchedProducts,
       matchedProducts,
       totalChecked: excelProducts.length
    };

  } catch (error: any) {
    console.error("Check Product error:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการตรวจสอบไฟล์" };
  }
}
