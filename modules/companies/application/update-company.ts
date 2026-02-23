import { companyUpdateSchema } from "./validations";
import { updateCompany } from "../infrastructure/company.repository";

export async function updateCompanyUseCase(id: string, rawData: unknown) {
  const parsed = companyUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

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

  try {
    const company = await updateCompany(id, dataToUpdate);
    return { success: true as const, company };
  } catch (err) {
    throw err;
  }
}
