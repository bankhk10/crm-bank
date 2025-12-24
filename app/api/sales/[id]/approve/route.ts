import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { allocateStock } from "@/lib/stock-service";

// POST /api/sales/[id]/approve - Approve sale
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user has approval permission

    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    const sale = await prisma.sale.findUnique({
      where: { id, deletedAt: null },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (sale.status !== "PENDING") {
      return NextResponse.json(
        { error: "Sale is not pending approval" },
        { status: 400 }
      );
    }

    // Determine next status based on payment term
    let nextStatus: "AWAITING_PAYMENT" | "AWAITING_DELIVERY";
    if (sale.paymentTerm === "PREPAID") {
      nextStatus = "AWAITING_PAYMENT";
    } else {
      nextStatus = "AWAITING_DELIVERY";
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      // Check if customer has credit limit for credit sales
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

        // Check if customer has enough credit available
        const availableCredit = Number(creditLimit.availableAmount);
        const saleTotal = Number(sale.totalAmount);

        if (availableCredit < saleTotal) {
          throw new Error(
            `Insufficient credit limit. Available: ฿${availableCredit.toLocaleString()}, Required: ฿${saleTotal.toLocaleString()}`
          );
        }

        // Update credit limit: deduct from available, add to used
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

      // Allocate stock (Cut stock simulator)
      await allocateStock(id, tx);

      // Approve sale
      return await tx.sale.update({
        where: { id },
        data: {
          status: nextStatus,
          approvedById: session.user.id,
          approvedAt: new Date(),
          statusHistory: {
            create: {
              status: nextStatus,
              notes: notes || "Sale approved",
              changedById: session.user.id,
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
              sales: false, // Prevent circular reference if any
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
    });

    // TODO: Send notification to sale creator

    return NextResponse.json({ sale: updatedSale });
  } catch (error: any) {
    console.error("Error approving sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve sale" },
      { status: 500 }
    );
  }
}
