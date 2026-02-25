import { findExpiredTemporaryCredits } from "../infrastructure/temporary-credit-limit.repository";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/db";

export async function expireTemporaryCreditLimitsUseCase() {
  const expiredTemporaryCredits = await findExpiredTemporaryCredits();

  if (expiredTemporaryCredits.length === 0) {
    return {
      message: "No expired temporary credits found",
      processed: 0,
      success: 0,
      failed: 0,
      results: [],
    };
  }

  const now = new Date();
  const results = await Promise.all(
    expiredTemporaryCredits.map(async (tempCredit) => {
      try {
        const result = await db.$transaction(async (tx) => {
          const creditLimit = await tx.creditLimit.findUnique({
            where: { id: tempCredit.appliedToCreditLimitId! },
          });

          if (!creditLimit) {
            return {
              success: false,
              temporaryCreditId: tempCredit.id,
              customerId: tempCredit.customerId,
              customerName: tempCredit.customer.name,
              error: "Credit limit not found",
            };
          }

          const newLimitAmount = (creditLimit.limitAmount as any).sub
            ? (creditLimit.limitAmount as any).sub(
                tempCredit.requestedAmount as any,
              )
            : new Prisma.Decimal(String(creditLimit.limitAmount)).sub(
                new Prisma.Decimal(String(tempCredit.requestedAmount)),
              );

          const newAvailableAmount = (creditLimit.availableAmount as any).sub
            ? (creditLimit.availableAmount as any).sub(
                tempCredit.requestedAmount as any,
              )
            : new Prisma.Decimal(String(creditLimit.availableAmount)).sub(
                new Prisma.Decimal(String(tempCredit.requestedAmount)),
              );

          if (newAvailableAmount.lessThan(0)) {
            return {
              success: false,
              temporaryCreditId: tempCredit.id,
              customerId: tempCredit.customerId,
              customerName: tempCredit.customer.name,
              error: "Cannot revert: would result in negative available amount",
              currentAvailable: String(creditLimit.availableAmount),
              requestedAmount: String(tempCredit.requestedAmount),
            };
          }

          // Update CreditLimit
          await tx.creditLimit.update({
            where: { id: creditLimit.id },
            data: {
              limitAmount: newLimitAmount,
              availableAmount: newAvailableAmount,
              temporaryCreditAmount: 0,
              temporaryCreditExpiryDate: null,
            },
          });

          // Update TemporaryCreditLimit
          await tx.temporaryCreditLimit.update({
            where: { id: tempCredit.id },
            data: {
              status: "EXPIRED",
              isReverted: true,
              revertedAt: now,
            },
          });

          return {
            success: true,
            temporaryCreditId: tempCredit.id,
            customerId: tempCredit.customerId,
            customerName: tempCredit.customer.name,
            customerCode: tempCredit.customer.customerCode,
            revertedAmount: String(tempCredit.requestedAmount),
            expiryDate: tempCredit.expiryDate,
            creditLimitId: creditLimit.id,
            newLimitAmount: String(newLimitAmount),
            newAvailableAmount: String(newAvailableAmount),
          };
        });

        return result;
      } catch (error) {
        return {
          success: false,
          temporaryCreditId: tempCredit.id,
          customerId: tempCredit.customerId,
          customerName: tempCredit.customer.name,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
  );

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return {
    message: `Processed ${expiredTemporaryCredits.length} expired temporary credits`,
    processed: expiredTemporaryCredits.length,
    success: successCount,
    failed: failureCount,
    results,
  };
}
