"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import {
  processSalesTargetImport,
  previewSalesTargetImport,
  generateSalesTargetTemplate,
} from "../application/import-sales-targets";

export async function importSalesTargetsAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "กรุณาเข้าสู่ระบบ", errors: [] };
    }

    const isAdmin = session.user.roles?.includes("administrator");
    const hasPermission = session.user.permissionKeys?.includes(
      "sales_target.create",
    );

    if (!isAdmin && !hasPermission) {
      return { success: false, message: "คุณไม่มีสิทธิ์นำเข้าข้อมูล", errors: [] };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, message: "ไม่พบไฟล์ที่อัปโหลด", errors: [] };
    }

    const fileBuffer = await file.arrayBuffer();
    const result = await processSalesTargetImport(fileBuffer, session.user.id);

    if (result.success) {
      revalidatePath("/sales-targets");
    }

    return result;
  } catch (err: any) {
    console.error("Import Action Error:", err);
    return {
      success: false,
      message: "ข้อผิดพลาดระบบ: " + err.message,
      errors: [],
    };
  }
}

export async function previewSalesTargetsAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "กรุณาเข้าสู่ระบบ", errors: [] };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, message: "ไม่พบไฟล์ที่อัปโหลด", errors: [] };
    }

    const fileBuffer = await file.arrayBuffer();
    return await previewSalesTargetImport(fileBuffer);
  } catch (err: any) {
    console.error("Preview Action Error:", err);
    return {
      success: false,
      message: "ข้อผิดพลาดระบบ: " + err.message,
      errors: [],
    };
  }
}

export async function downloadSalesTargetTemplateAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "กรุณาเข้าสู่ระบบ" };
    }

    const buffer = generateSalesTargetTemplate();
    // Convert ArrayBuffer to base64 for transfer
    const base64 = Buffer.from(buffer).toString("base64");

    return { success: true, data: base64 };
  } catch (err: any) {
    console.error("Template Error:", err);
    return { success: false, message: "ข้อผิดพลาดระบบ: " + err.message };
  }
}
