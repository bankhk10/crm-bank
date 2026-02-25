import {
  findTemporaryCreditLimits,
  findTemporaryCreditLimitById,
  softDeleteTemporaryCreditLimit,
  countTemporaryCreditLimits,
  FindTemporaryCreditLimitsArgs,
} from "../infrastructure/temporary-credit-limit.repository";
import { Prisma } from "@/lib/db";

export * from "./validations";
export * from "./create-temporary-credit-limit";
export * from "./update-temporary-credit-limit";
export * from "./approve-temporary-credit-limit";
export * from "./expire-temporary-credit-limit";

export async function findTemporaryCreditLimitsUseCase(
  args: FindTemporaryCreditLimitsArgs,
) {
  return findTemporaryCreditLimits(args);
}

export async function countTemporaryCreditLimitsUseCase(
  where?: Prisma.TemporaryCreditLimitWhereInput,
) {
  return countTemporaryCreditLimits(where);
}

export async function getTemporaryCreditLimitByIdUseCase(id: string) {
  const record = await findTemporaryCreditLimitById(id);
  if (!record) {
    throw new Error("Temporary Credit Limit not found");
  }
  return record;
}

export async function deleteTemporaryCreditLimitUseCase(id: string) {
  const existing = await findTemporaryCreditLimitById(id);
  if (!existing) {
    throw new Error("Temporary Credit Limit not found");
  }

  if (existing.status === "APPROVED") {
    throw new Error("Cannot delete approved temporary credit limit");
  }

  return softDeleteTemporaryCreditLimit(id);
}
