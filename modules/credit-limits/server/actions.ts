"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import { createCreditLimitUseCase } from "../application/create-credit-limit";
import { updateCreditLimitUseCase } from "../application/update-credit-limit";
import {
  deleteCreditLimit as deleteRepoCreditLimit,
  findCreditLimitById,
} from "../infrastructure/credit-limit.repository";
import {
  generateCreditLimitTemplate,
  previewCreditLimitImport,
  processCreditLimitImport,
} from "../application/import-credit-limits";

const resourcePath = "/api/credit-limits"; // using same permission key mechanism

export async function createCreditLimitAction(payload: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  const result = await createCreditLimitUseCase(payload, session.user.id);

  if (result.success) {
    revalidatePath("/credit-limits");
  }

  return JSON.parse(JSON.stringify(result));
}

export async function updateCreditLimitAction(id: string, payload: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  if (!(session.user.permissionKeys ?? []).includes("creditlimit.edit")) {
    return { success: false, error: "Forbidden - missing creditlimit.edit" };
  }

  const result = await updateCreditLimitUseCase(id, payload);

  if (result.success) {
    revalidatePath("/credit-limits");
    revalidatePath(`/credit-limits/${id}/edit`);
  }

  return JSON.parse(JSON.stringify(result));
}

export async function deleteCreditLimitAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  await deleteRepoCreditLimit(id);
  revalidatePath("/credit-limits");
  return { success: true };
}
export async function getCreditLimitAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const cl = await findCreditLimitById(id);
    if (!cl) return { success: false, error: "Not found" };

    return {
      success: true,
      creditLimit: JSON.parse(JSON.stringify(cl)),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch credit limit" };
  }
}

export async function downloadCreditLimitTemplateAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  
  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const buffer = generateCreditLimitTemplate();
    const base64 = Buffer.from(buffer).toString("base64");
    return { success: true, data: base64 };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function previewCreditLimitsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No file provided" };
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await previewCreditLimitImport(arrayBuffer);
    return result;
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function importCreditLimitsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }
  
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No file provided" };
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await processCreditLimitImport(arrayBuffer, session.user.id);
    if (result.success) {
      revalidatePath("/credit-limits");
    }
    return result;
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

