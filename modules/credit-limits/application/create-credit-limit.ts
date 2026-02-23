import { Prisma } from "@/src/infrastructure/database";
import { createCreditLimit as createRepoCreditLimit } from "../infrastructure/credit-limit.repository";
import { creditLimitSchema } from "./validations";

export async function createCreditLimitUseCase(
  payload: unknown,
  userId: string,
) {
  const parsed = creditLimitSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const effectiveDate =
    typeof parsed.data.effectiveDate === "string"
      ? new Date(parsed.data.effectiveDate)
      : parsed.data.effectiveDate;

  const expiryDate = parsed.data.expiryDate
    ? typeof parsed.data.expiryDate === "string"
      ? new Date(parsed.data.expiryDate)
      : parsed.data.expiryDate
    : undefined;

  const limitAmount = parsed.data.limitAmount;
  const promoAmount = parsed.data.promoAmount;

  try {
    const creditLimit = await createRepoCreditLimit({
      customerId: parsed.data.customerId,
      limitAmount,
      promoAmount: promoAmount ?? null,
      usedAmount: 0,
      availableAmount: limitAmount,
      effectiveDate,
      expiryDate,
      notes: parsed.data.notes,
      status: "ACTIVE",
      createdById: userId,
    });

    return { success: true, creditLimit };
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      return { success: false, error: "Customer not found" };
    }
    throw err;
  }
}
