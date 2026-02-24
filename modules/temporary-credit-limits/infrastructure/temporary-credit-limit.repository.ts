import { Prisma, db } from "@/src/infrastructure/database";

export interface FindTemporaryCreditLimitsArgs {
  where?: Prisma.TemporaryCreditLimitWhereInput;
  skip?: number;
  take?: number;
  orderBy?: Prisma.TemporaryCreditLimitOrderByWithRelationInput;
}

export async function findTemporaryCreditLimits(
  args: FindTemporaryCreditLimitsArgs,
) {
  return db.temporaryCreditLimit.findMany({
    ...args,
    include: {
      customer: true,
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function countTemporaryCreditLimits(
  where?: Prisma.TemporaryCreditLimitWhereInput,
) {
  return db.temporaryCreditLimit.count({ where });
}

export async function findTemporaryCreditLimitById(id: string) {
  return db.temporaryCreditLimit.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: true,
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createTemporaryCreditLimit(
  data: Prisma.TemporaryCreditLimitUncheckedCreateInput,
) {
  return db.temporaryCreditLimit.create({
    data,
    include: {
      customer: true,
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateTemporaryCreditLimit(
  id: string,
  data: Prisma.TemporaryCreditLimitUncheckedUpdateInput,
) {
  return db.temporaryCreditLimit.update({
    where: { id },
    data,
    include: {
      customer: true,
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function softDeleteTemporaryCreditLimit(id: string) {
  return db.temporaryCreditLimit.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function processTemporaryCreditApprovalTransaction(
  tempLimitId: string,
  customerId: string,
  requestedAmount: number | Prisma.Decimal,
  expiryDate: Date | null,
  approvedById: string,
  notes?: string | null,
) {
  return db.$transaction(async (tx) => {
    const now = new Date();

    const existingCredit = await tx.creditLimit.findFirst({
      where: {
        customerId,
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    let creditLimit;

    if (existingCredit && (existingCredit.availableAmount as any).gt?.(0)) {
      const newLimitAmount = (existingCredit.limitAmount as any).add
        ? (existingCredit.limitAmount as any).add(requestedAmount as any)
        : new Prisma.Decimal(String(existingCredit.limitAmount)).add(
            new Prisma.Decimal(String(requestedAmount)),
          );

      const newAvailableAmount = (existingCredit.availableAmount as any).add
        ? (existingCredit.availableAmount as any).add(requestedAmount as any)
        : new Prisma.Decimal(String(existingCredit.availableAmount)).add(
            new Prisma.Decimal(String(requestedAmount)),
          );

      const newExpiryDate =
        expiryDate && existingCredit.expiryDate
          ? expiryDate > existingCredit.expiryDate
            ? expiryDate
            : existingCredit.expiryDate
          : (expiryDate ?? existingCredit.expiryDate);

      creditLimit = await tx.creditLimit.update({
        where: { id: existingCredit.id },
        data: {
          limitAmount: newLimitAmount,
          availableAmount: newAvailableAmount,
          expiryDate: newExpiryDate,
          temporaryCreditAmount: requestedAmount,
          temporaryCreditExpiryDate: expiryDate,
        },
      });
    } else {
      creditLimit = await tx.creditLimit.create({
        data: {
          customerId,
          limitAmount: requestedAmount,
          usedAmount: 0,
          availableAmount: requestedAmount,
          effectiveDate: now,
          expiryDate: expiryDate,
          temporaryCreditAmount: requestedAmount,
          temporaryCreditExpiryDate: expiryDate,
          notes: `Temporary credit limit approved. Original notes: ${notes || "N/A"}`,
          status: "ACTIVE",
          approvedBy: approvedById,
          approvedAt: now,
          createdById: approvedById,
        },
      });
    }

    const updatedTemp = await tx.temporaryCreditLimit.update({
      where: { id: tempLimitId },
      data: {
        status: "APPROVED",
        approvedById,
        approvedAt: now,
        appliedToCreditLimitId: creditLimit.id,
      },
      include: {
        customer: true,
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return { temporaryCreditLimit: updatedTemp, creditLimit };
  });
}

export async function findExpiredTemporaryCredits() {
  const now = new Date();
  return db.temporaryCreditLimit.findMany({
    where: {
      status: "APPROVED",
      isReverted: false,
      expiryDate: {
        lt: now,
      },
      appliedToCreditLimitId: {
        not: null,
      },
      deletedAt: null,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          customerCode: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      expiryDate: "asc",
    },
  });
}
