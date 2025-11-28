import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { SaleFormData } from "@/types/sales";

// GET /api/sales/[id] - Get sale detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerCode: true,
            phone: true,
            email: true,
          },
          include: {
            creditLimits: {
              where: {
                status: "ACTIVE",
                OR: [
                  { expiryDate: null },
                  { expiryDate: { gte: new Date() } },
                ],
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                unit: true,
                price: true,
              },
              include: {
                stockLots: {
                  where: { isUsed: false },
                },
              },
            },
          },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Calculate stock and price warnings
    const stockWarnings = [];
    const priceWarnings = [];

    for (const item of sale.items) {
      const totalStock = item.product.stockLots.reduce(
        (sum: number, lot: any) => sum + lot.quantity,
        0
      );

      if (totalStock < item.quantity) {
        stockWarnings.push({
          productId: item.product.id,
          productName: item.product.name,
          requested: item.quantity,
          available: totalStock,
          reserved: 0, // TODO: Calculate reserved stock
        });
      }

      if (item.priceModified) {
        const originalPrice = Number(item.originalPrice);
        const modifiedPrice = Number(item.unitPrice);
        const difference = modifiedPrice - originalPrice;
        const percentageDiff = (difference / originalPrice) * 100;

        priceWarnings.push({
          productId: item.product.id,
          productName: item.product.name,
          originalPrice,
          modifiedPrice,
          difference,
          percentageDiff,
        });
      }
    }

    // Calculate credit info
    const creditLimit = (sale.customer as any).creditLimits[0];
    const creditInfo = creditLimit
      ? {
          creditLimit: Number(creditLimit.limitAmount),
          usedCredit: Number(creditLimit.usedAmount),
          availableCredit: Number(creditLimit.availableAmount),
          promotionalCredit: creditLimit.promoAmount
            ? Number(creditLimit.promoAmount)
            : undefined,
          promotionalCreditUsed: sale.promotionalCreditUsed
            ? Number(sale.promotionalCreditUsed)
            : undefined,
          promotionalCreditAvailable: creditLimit.promoAmount
            ? Number(creditLimit.promoAmount) - Number(sale.promotionalCreditUsed || 0)
            : undefined,
          currentSaleAmount: Number(sale.totalAmount),
          willExceedLimit:
            Number(sale.totalAmount) > Number(creditLimit.availableAmount),
        }
      : {
          creditLimit: 0,
          usedCredit: 0,
          availableCredit: 0,
          currentSaleAmount: Number(sale.totalAmount),
          willExceedLimit: false,
        };

    return NextResponse.json({
      sale,
      stockWarnings,
      priceWarnings,
      creditInfo,
    });
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

// PUT /api/sales/[id] - Update sale
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SaleFormData = await request.json();

    // Check if sale exists and can be edited
    const existingSale = await prisma.sale.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // If sale is approved, reset to PENDING for re-approval
    const needsReapproval = existingSale.status === "APPROVED";

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const total = subtotal + body.shippingCost + body.otherCosts;

    // Update sale
    const sale = await prisma.sale.update({
      where: { id: params.id },
      data: {
        customerId: body.customerId,
        employeeId: body.employeeId,
        paymentTerm: body.paymentTerm,
        creditDays: body.creditDays,
        creditDueDate: body.creditDueDate ? new Date(body.creditDueDate) : null,
        usePromotionalCredit: body.usePromotionalCredit,
        promotionalCreditUsed: body.promotionalCreditUsed
          ? new Prisma.Decimal(body.promotionalCreditUsed)
          : null,
        saleDate: new Date(body.saleDate),
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
        subtotalAmount: new Prisma.Decimal(subtotal),
        shippingCost: new Prisma.Decimal(body.shippingCost),
        otherCosts: new Prisma.Decimal(body.otherCosts),
        otherCostsDescription: body.otherCostsDescription,
        totalAmount: new Prisma.Decimal(total),
        notes: body.notes,
        status: needsReapproval ? "PENDING" : existingSale.status,
        items: {
          deleteMany: {},
          create: body.items.map((item) => {
            const totalPrice = item.quantity * item.unitPrice;
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              originalPrice: new Prisma.Decimal(item.originalPrice),
              priceModified: item.priceModified,
              totalPrice: new Prisma.Decimal(totalPrice),
            };
          }),
        },
        statusHistory: needsReapproval
          ? {
              create: {
                status: "PENDING",
                notes: "Sale updated - requires re-approval",
                changedById: session.user.id,
              },
            }
          : undefined,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerCode: true,
            phone: true,
            email: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                unit: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - Delete sale (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        items: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.sale.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        statusHistory: {
          create: {
            status: "CANCELLED",
            notes: "Sale deleted",
            changedById: session.user.id,
          },
        },
      },
    });

    // TODO: Return stock if sale was approved

    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
