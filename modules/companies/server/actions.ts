"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Prisma } from "@/src/infrastructure/database";
import { db } from "@/src/infrastructure/database";
import { isAuthorized } from "@/src/core/rbac";
import { companySchema, companyUpdateSchema } from "./validations";

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

  // Parse and validate data
  const parsed = companySchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const company = await db.company.create({
      data: {
        name: parsed.data.name,
        companyCode: parsed.data.companyCode || null,
        shortName: parsed.data.shortName || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        taxId: parsed.data.taxId || null,
        addressLine: parsed.data.addressLine || null,
        province: parsed.data.province || null,
        district: parsed.data.district || null,
        subdistrict: parsed.data.subdistrict || null,
        postalCode: parsed.data.postalCode || null,
        status: parsed.data.status ?? "ACTIVE",
      },
    });

    revalidatePath("/companies");
    return { success: true, company };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      let target = err.meta && (err.meta as any).target;

      if (
        (!target || (Array.isArray(target) && target.length === 0)) &&
        err.message
      ) {
        const match = err.message.match(/fields:\s*\(([^)]+)\)/i);
        if (match && match[1]) {
          target = match[1]
            .split(",")
            .map((s: string) => s.trim().replace(/['"`]/g, ""));
        }
      }

      target = target || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return {
        success: false,
        error: `Unique constraint failed on the fields: (${fields})`,
        target: Array.isArray(target) ? target : [String(target)],
      };
    }

    return { success: false, error: "An unexpected error occurred." };
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

  const parsed = companyUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const dataToUpdate = { ...parsed.data };
    // Convert empty strings to null for optional unique fields
    const fieldsToNullify = [
      "companyCode",
      "shortName",
      "email",
      "phone",
      "taxId",
      "addressLine",
      "province",
      "district",
      "subdistrict",
      "postalCode",
    ];
    for (const field of fieldsToNullify) {
      if ((dataToUpdate as any)[field] === "") {
        (dataToUpdate as any)[field] = null;
      }
    }

    const company = await db.company.update({
      where: { id },
      data: dataToUpdate,
    });
    revalidatePath("/companies");
    revalidatePath(`/companies/${id}`);
    revalidatePath(`/companies/${id}/edit`);
    return { success: true, company };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred." };
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
    await db.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/companies");
    return { success: true };
  } catch (err) {
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
    const company = await db.company.findFirst({
      where: { id, deletedAt: null },
    });
    if (!company) {
      return { success: false, error: "Company not found" };
    }
    return { success: true, company };
  } catch (err) {
    return { success: false, error: "Failed to fetch company." };
  }
}
