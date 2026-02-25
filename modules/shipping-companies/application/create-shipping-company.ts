import { Prisma } from "@/lib/db";
import { shippingCompanySchema } from "./validations";
import { createShippingCompany } from "../infrastructure/shipping-company.repository";

/**
 * Use case: Create a new Shipping Company.
 * Validates input, then delegates persistence to the repository.
 */
export async function createShippingCompanyUseCase(rawData: unknown) {
  const parsed = shippingCompanySchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const shippingCompany = await createShippingCompany(parsed.data);

    return { success: true as const, shippingCompany };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = (err.meta && (err.meta as any).target) || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return {
        success: false as const,
        error: `Unique constraint failed on the fields: (${fields})`,
      };
    }
    throw err;
  }
}
