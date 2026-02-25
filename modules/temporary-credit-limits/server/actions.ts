"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import {
  createTemporaryCreditLimitUseCase,
  updateTemporaryCreditLimitUseCase,
  deleteTemporaryCreditLimitUseCase,
  approveTemporaryCreditLimitUseCase,
  expireTemporaryCreditLimitsUseCase,
  CreateTemporaryCreditLimitInput,
  UpdateTemporaryCreditLimitInput,
  ApproveTemporaryCreditLimitInput,
} from "../application";

const resourcePath = "/api/temporary-credit-limits";

async function verifyAuth(permission: string | null = null) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    throw new Error("Forbidden");
  }

  if (permission && !(session.user.permissionKeys ?? []).includes(permission)) {
    throw new Error(`Forbidden - missing ${permission}`);
  }

  return session.user;
}

export async function createTemporaryCreditLimitAction(
  input: CreateTemporaryCreditLimitInput,
) {
  try {
    const user = await verifyAuth("temporary_creditlimit.create");
    const result = await createTemporaryCreditLimitUseCase(input, user.id!);

    revalidatePath("/temporary-credit-limits");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างคำขอ",
    };
  }
}

export async function updateTemporaryCreditLimitAction(
  id: string,
  input: UpdateTemporaryCreditLimitInput,
) {
  try {
    await verifyAuth("temporary_creditlimit.edit");
    const result = await updateTemporaryCreditLimitUseCase(id, input);

    revalidatePath("/temporary-credit-limits");
    revalidatePath(`/temporary-credit-limits/${id}`);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขคำขอ",
    };
  }
}

export async function deleteTemporaryCreditLimitAction(id: string) {
  try {
    await verifyAuth("temporary_creditlimit.delete");
    await deleteTemporaryCreditLimitUseCase(id);

    revalidatePath("/temporary-credit-limits");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบคำขอ",
    };
  }
}

export async function approveTemporaryCreditLimitAction(
  id: string,
  input: ApproveTemporaryCreditLimitInput,
) {
  try {
    const user = await verifyAuth("temporary_creditlimit.approve");
    const result = await approveTemporaryCreditLimitUseCase(
      id,
      input,
      user.id!,
    );

    revalidatePath("/temporary-credit-limits");
    revalidatePath(`/temporary-credit-limits/${id}`);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการตรวจสอบคำขอ",
    };
  }
}

export async function expireTemporaryCreditLimitAction() {
  try {
    // Only verify basic auth - background job trigger might need specific permissions
    // or we can require approve permission as per API
    await verifyAuth("temporary_creditlimit.approve");
    const result = await expireTemporaryCreditLimitsUseCase();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการเรียกใช้การหมดอายุวงเงิน",
    };
  }
}

