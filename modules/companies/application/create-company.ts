import { Prisma } from "@/src/infrastructure/database";
import { companySchema } from "./validations";
import { createCompany } from "../infrastructure/company.repository";

export async function createCompanyUseCase(rawData: unknown) {
  const parsed = companySchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const data: Prisma.CompanyCreateInput = {
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
    };

    const company = await createCompany(data);
    return { success: true as const, company };
  } catch (err: any) {
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
        success: false as const,
        error: `Unique constraint failed on the fields: (${fields})`,
        target: Array.isArray(target) ? target : [String(target)],
      };
    }

    throw err;
  }
}
