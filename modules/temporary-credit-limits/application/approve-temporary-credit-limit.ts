import {
  processTemporaryCreditApprovalTransaction,
  findTemporaryCreditLimitById,
  updateTemporaryCreditLimit,
} from "../infrastructure/temporary-credit-limit.repository";
import {
  approveTemporaryCreditLimitSchema,
  ApproveTemporaryCreditLimitInput,
} from "./validations";

export async function approveTemporaryCreditLimitUseCase(
  id: string,
  input: ApproveTemporaryCreditLimitInput,
  approvedById: string,
) {
  const parsed = approveTemporaryCreditLimitSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      `Validation Error: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }

  const existing = await findTemporaryCreditLimitById(id);

  if (!existing) {
    throw new Error("Not found");
  }

  if (existing.status !== "PENDING") {
    throw new Error("Only pending requests can be processed");
  }

  if (!parsed.data.approve && !parsed.data.rejectionReason) {
    throw new Error("Rejection reason is required when rejecting");
  }

  if (parsed.data.approve) {
    return processTemporaryCreditApprovalTransaction(
      existing.id,
      existing.customerId,
      existing.requestedAmount as any,
      existing.expiryDate,
      approvedById,
      existing.notes,
    );
  } else {
    // Reject
    return updateTemporaryCreditLimit(existing.id, {
      status: "REJECTED",
      rejectionReason: parsed.data.rejectionReason,
      approvedById,
      approvedAt: new Date(),
    });
  }
}
