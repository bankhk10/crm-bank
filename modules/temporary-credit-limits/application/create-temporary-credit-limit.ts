import {
  createTemporaryCreditLimitSchema,
  CreateTemporaryCreditLimitInput,
} from "./validations";
import { createTemporaryCreditLimit } from "../infrastructure/temporary-credit-limit.repository";

export async function createTemporaryCreditLimitUseCase(
  input: CreateTemporaryCreditLimitInput,
  userId: string,
) {
  const parsed = createTemporaryCreditLimitSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      `Validation Error: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }

  const expiryDate =
    typeof parsed.data.expiryDate === "string"
      ? new Date(parsed.data.expiryDate)
      : parsed.data.expiryDate;

  return createTemporaryCreditLimit({
    customerId: parsed.data.customerId,
    requestedAmount: parsed.data.requestedAmount,
    expiryDate,
    notes: parsed.data.notes || null,
    status: "PENDING",
    requestedById: userId || null,
  });
}
