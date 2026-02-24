import { shippingCompanyUpdateSchema } from "./validations";
import { updateShippingCompany } from "../infrastructure/shipping-company.repository";

/**
 * Use case: Update an existing Shipping Company.
 * Validates input, then delegates persistence to the repository.
 */
export async function updateShippingCompanyUseCase(
  id: string,
  rawData: unknown,
) {
  const parsed = shippingCompanyUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const shippingCompany = await updateShippingCompany(id, parsed.data);

    return { success: true as const, shippingCompany };
  } catch (err) {
    throw err;
  }
}
