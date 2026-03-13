"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import {
  createCompanyUseCase,
  updateCompanyUseCase,
  getCompanyDetailUseCase,
  listAllActiveCompaniesUseCase,
  listCompaniesUseCase,
} from "../application";
import { softDeleteCompany, type GetCompaniesParams } from "../infrastructure/company.repository";

const resourcePath = "/api/companies";

export async function createCompanyAction(rawData: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  if (!(session.user.permissionKeys ?? []).includes("company.create")) {
    return { success: false, error: "Forbidden - missing company.create" };
  }

  try {
    const result = await createCompanyUseCase(rawData);
    if (result.success) {
      revalidatePath("/companies");
    }
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function updateCompanyAction(id: string, rawData: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  if (!(session.user.permissionKeys ?? []).includes("company.edit")) {
    return { success: false, error: "Forbidden - missing company.edit" };
  }

  try {
    const result = await updateCompanyUseCase(id, rawData);
    if (result.success) {
      revalidatePath("/companies");
      revalidatePath(`/companies/${id}`);
      revalidatePath(`/companies/${id}/edit`);
    }
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function deleteCompanyAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  if (!(session.user.permissionKeys ?? []).includes("company.delete")) {
    return { success: false, error: "Forbidden - missing company.delete" };
  }

  try {
    await softDeleteCompany(id);
    revalidatePath("/companies");
    return { success: true };
  } catch (_err) {
    return { success: false, error: "Failed to delete company." };
  }
}

export async function getCompanyAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const result = await getCompanyDetailUseCase(id);
    if (result.success && result.company) {
      return {
        ...result,
        company: {
          ...result.company,
          createdAt: (result.company as any).createdAt?.toISOString(),
          updatedAt: (result.company as any).updatedAt?.toISOString(),
          deletedAt: (result.company as any).deletedAt?.toISOString(),
        },
      };
    }
    return result;
  } catch (_err) {
    return { success: false, error: "Failed to fetch company." };
  }
}

export async function getCompaniesAction() {
  const session = await auth();

  if (!session?.user) {
    return { success: false, companies: [] };
  }

  try {
    const result = await listAllActiveCompaniesUseCase();
    return result;
  } catch (_err) {
    return { success: false, companies: [] };
  }
}

export async function findCompaniesAction(params: GetCompaniesParams) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized", companies: [], total: 0 };
  }

  try {
    const result = await listCompaniesUseCase(params);
    return {
      success: true,
      ...result,
      companies: result.companies.map((c: any) => ({
        ...c,
        createdAt: c.createdAt?.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
        deletedAt: c.deletedAt?.toISOString(),
      })),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
      companies: [],
      total: 0,
    };
  }
}
