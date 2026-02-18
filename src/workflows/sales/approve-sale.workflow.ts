import { allocateStock } from "@/src/core/stock";
import { calculateOrderExpiryDate } from "@/src/core/sales";
import { db as prisma } from "@/src/infrastructure/database";

interface ApproveSaleInput {
  saleId: string;
  approvedById: string;
  notes?: string;
}

export async function approveSaleWorkflow({
  saleId,
  approvedById,
  notes,
}: ApproveSaleInput) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId, deletedAt: null },
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  if (sale.status !== "PENDING" && sale.status !== "PENDING_APPROVAL") {
    throw new Error("Sale is not pending approval");
  }

  const nextStatus =
    sale.paymentTerm === "PREPAID" ? "AWAITING_PAYMENT" : "AWAITING_DELIVERY";

  const updatedSale = await prisma.$transaction(async (tx) => {
    if (sale.paymentTerm !== "PREPAID") {
      const creditLimit = await tx.creditLimit.findFirst({
        where: {
          customerId: sale.customerId,
          status: "ACTIVE",
          deletedAt: null,
        },
      });

      if (!creditLimit) {
        throw new Error("Customer does not have an active credit limit");
      }

      const availableCredit = Number(creditLimit.availableAmount);
      const saleTotal = Number(sale.totalAmount);

      if (availableCredit < saleTotal) {
        throw new Error(
          `Insufficient credit limit. Available: ฿${availableCredit.toLocaleString()}, Required: ฿${saleTotal.toLocaleString()}`,
        );
      }

      await tx.creditLimit.update({
        where: { id: creditLimit.id },
        data: {
          usedAmount: {
            increment: sale.totalAmount,
          },
          availableAmount: {
            decrement: sale.totalAmount,
          },
        },
      });
    }

    const stockResult = await allocateStock(saleId, tx);
    const approvedAt = new Date();
    const orderExpiryDate = calculateOrderExpiryDate(approvedAt);

    const updatedSaleData = await tx.sale.update({
      where: { id: saleId },
      data: {
        status: nextStatus,
        approvedById,
        approvedAt,
        orderExpiryDate,
        statusHistory: {
          create: {
            status: nextStatus,
            notes: notes || "Sale approved",
            changedById: approvedById,
          },
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerCode: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            sales: false,
          },
        },
        createdBy: {
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

    return { sale: updatedSaleData, stockResult };
  });

  return { previousSale: sale, updatedSale };
}

