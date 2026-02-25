import {
  updateTemporaryCreditLimitSchema,
  UpdateTemporaryCreditLimitInput,
} from "./validations";
import {
  findTemporaryCreditLimitById,
  updateTemporaryCreditLimit,
} from "../infrastructure/temporary-credit-limit.repository";
import { Prisma } from "@/lib/db";

export async function updateTemporaryCreditLimitUseCase(
  id: string,
  input: UpdateTemporaryCreditLimitInput,
) {
  const parsed = updateTemporaryCreditLimitSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      `Validation Error: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }

  const existing = await findTemporaryCreditLimitById(id);

  if (!existing) {
    throw new Error("Not found");
  }

  if (existing.status === "APPROVED") {
    throw new Error("Cannot edit approved temporary credit limit");
  }

  const updateData: Prisma.TemporaryCreditLimitUncheckedUpdateInput = {
    ...parsed.data,
  };

  if (parsed.data.expiryDate) {
    updateData.expiryDate =
      typeof parsed.data.expiryDate === "string"
        ? new Date(parsed.data.expiryDate)
        : parsed.data.expiryDate;
  }

  // If this record was previously rejected, sending an edit should return it to pending
  if (existing.status === "REJECTED") {
    updateData.status = "PENDING";
    updateData.rejectionReason = null;
    updateData.approvedById = null;
    updateData.approvedAt = null;
  }

  return updateTemporaryCreditLimit(id, updateData);
}
