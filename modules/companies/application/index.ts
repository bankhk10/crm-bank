import {
  findCompanyById,
  findCompanies,
  findAllActiveCompanies,
  type GetCompaniesParams,
} from "../infrastructure/company.repository";

// ─────────────────────────────────────────────
// Use Cases (inline – thin wrappers)
// ─────────────────────────────────────────────

export async function getCompanyDetailUseCase(id: string) {
  const company = await findCompanyById(id);
  if (!company) {
    return { success: false as const, error: "Company not found" };
  }
  return { success: true as const, company };
}

export async function listCompaniesUseCase(params: GetCompaniesParams) {
  return findCompanies(params);
}

export async function listAllActiveCompaniesUseCase() {
  const companies = await findAllActiveCompanies();
  return { success: true as const, companies };
}

// ─────────────────────────────────────────────
// Use Cases (separate files)
// ─────────────────────────────────────────────

export { createCompanyUseCase } from "./create-company";
export { updateCompanyUseCase } from "./update-company";

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  companySchema,
  companyUpdateSchema,
  type CompanyFormValues,
  type CompanyUpdateFormValues,
} from "./validations";
