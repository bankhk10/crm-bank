import {
  getExistingCreditLimitForUpdate,
  updateCreditLimit as updateRepoCreditLimit,
  upsertPromotionalBudget as upsertRepoPromotionalBudget,
} from "../infrastructure/credit-limit.repository";
import { creditLimitUpdateSchema } from "./validations";
// Since logging requires request context in API route, we return data for the caller to log if needed, or we omit the log for Server Actions
// Wait, we can use the logger if we have context. For simplicity, we just do the update.

export async function updateCreditLimitUseCase(id: string, payload: unknown) {
  const parsed = creditLimitUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await getExistingCreditLimitForUpdate(id);

  if (!existing) {
    return { success: false, error: "Not found" };
  }

  const updateData: any = { ...parsed.data };

  if (parsed.data.effectiveDate) {
    updateData.effectiveDate =
      typeof parsed.data.effectiveDate === "string"
        ? new Date(parsed.data.effectiveDate)
        : parsed.data.effectiveDate;
  }

  if (parsed.data.expiryDate) {
    updateData.expiryDate =
      typeof parsed.data.expiryDate === "string"
        ? new Date(parsed.data.expiryDate)
        : parsed.data.expiryDate;
  }

  if (
    parsed.data.limitAmount !== undefined ||
    parsed.data.usedAmount !== undefined
  ) {
    const newLimit = parsed.data.limitAmount ?? Number(existing.limitAmount);
    const newUsed = parsed.data.usedAmount ?? Number(existing.usedAmount);
    updateData.availableAmount = newLimit - newUsed;
  }

  // Handle temporary credit fields (saved directly, no approval needed)
  if (parsed.data.temporaryCreditAmount !== undefined) {
    updateData.temporaryCreditAmount = parsed.data.temporaryCreditAmount;
  }
  if (parsed.data.temporaryCreditExpiryDate !== undefined) {
    if (parsed.data.temporaryCreditExpiryDate === null) {
      updateData.temporaryCreditExpiryDate = null;
    } else {
      updateData.temporaryCreditExpiryDate =
        typeof parsed.data.temporaryCreditExpiryDate === "string"
          ? new Date(parsed.data.temporaryCreditExpiryDate)
          : parsed.data.temporaryCreditExpiryDate;
    }
  }

  const creditLimit = await updateRepoCreditLimit(id, updateData);

  // When updating promoAmount from the limit management form,
  // we now save it to the new PromotionalBudget table as well.
  if (parsed.data.promoAmount !== undefined && existing.customerId) {
    const currentYear = new Date().getFullYear();
    await upsertRepoPromotionalBudget(
      existing.customerId,
      currentYear,
      parsed.data.promoAmount
    );
  }

  return { success: true, creditLimit, existing };
}
