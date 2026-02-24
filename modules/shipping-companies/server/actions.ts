"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/src/core/rbac";
import {
  createShippingCompanyUseCase,
  updateShippingCompanyUseCase,
  getShippingCompanyDetailUseCase,
  listShippingCompaniesUseCase,
} from "../application";
import { softDeleteShippingCompany } from "../infrastructure/shipping-company.repository";
import type { ListShippingCompaniesParams } from "../infrastructure/shipping-company.repository";

const resourcePath = "/api/shipping-companies";

export async function createShippingCompanyAction(rawData: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    if (
      !(session.user.permissionKeys ?? []).includes("shipping-company.create")
    ) {
      return { success: false, error: "Forbidden" };
    }
  }

  try {
    const result = await createShippingCompanyUseCase(rawData);
    if (result.success) {
      revalidatePath("/shipping-companies");
    }
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function updateShippingCompanyAction(
  id: string,
  rawData: unknown,
) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    if (
      !(session.user.permissionKeys ?? []).includes(
        "shipping-company.manage",
      ) &&
      !(session.user.permissionKeys ?? []).includes("shipping-company.edit")
    ) {
      return { success: false, error: "Forbidden" };
    }
  }

  try {
    const result = await updateShippingCompanyUseCase(id, rawData);
    if (result.success) {
      revalidatePath("/shipping-companies");
      revalidatePath(`/shipping-companies/${id}`);
      revalidatePath(`/shipping-companies/${id}/edit`);
    }
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function deleteShippingCompanyAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    if (
      !(session.user.permissionKeys ?? []).includes("shipping-company.delete")
    ) {
      return { success: false, error: "Forbidden" };
    }
  }

  try {
    await softDeleteShippingCompany(id);
    revalidatePath("/shipping-companies");
    return { success: true };
  } catch (_err) {
    return { success: false, error: "Failed to delete shipping company." };
  }
}

export async function getShippingCompanyAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const result = await getShippingCompanyDetailUseCase(id);
    return result;
  } catch (_err) {
    return { success: false, error: "Failed to fetch" };
  }
}

export async function getShippingCompaniesAction(
  params?: ListShippingCompaniesParams,
) {
  const session = await auth();
  if (!session?.user)
    return { success: false, total: 0, shippingCompanies: [] };

  try {
    const result = await listShippingCompaniesUseCase(params ?? {});
    return { success: true, ...result };
  } catch (_err) {
    return { success: false, total: 0, shippingCompanies: [] };
  }
}
