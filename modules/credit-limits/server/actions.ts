"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/lib/rbac";
import { createCreditLimitUseCase } from "../application/create-credit-limit";
import { updateCreditLimitUseCase } from "../application/update-credit-limit";
import { deleteCreditLimit as deleteRepoCreditLimit } from "../infrastructure/credit-limit.repository";

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

  return result;
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

  return result;
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
