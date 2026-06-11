import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db as prisma } from "@/lib/db";
import { Prisma } from "@/lib/db";
import type { SaleFormData } from "@/modules/sales/types";
import { releaseStockUseCase as releaseStock } from "@/modules/products/application";
import {
  logger,
  auditLogger,
  generateRequestId,
  extractClientIp,
  extractUserAgent,
} from "@/lib/logger";
import type { RequestContext } from "@/lib/logger/types";

// GET /api/sales/[id] - Get sale detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: {
          include: {
            creditLimits: {
              where: {
                status: "ACTIVE",
                OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        employee: true,
        createdBy: true,
        approvedBy: true,
        saleAddress: true,

        items: {
          include: {
            product: {
              include: {
                stockLots: {
                  where: { isUsed: false },
                },
                stock: true, // Include ProductStock for accurate available quantity
              },
            },
            lotAllocations: {
              include: {
                lot: true,
              },
            },
          },
        },
        statusHistory: {
          include: {
            changedBy: true,
          },
          orderBy: { changedAt: "desc" },
        },
        shipments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Check if this sale has been approved (stock already allocated)
    const isApprovedOrder = [
      "APPROVED",
      "AWAITING_PAYMENT",
      "PAID",
      "AWAITING_DELIVERY",
      "DELIVERED",
      "DELIVERY_COMPLETED",
      "COMPLETED",
    ].includes(sale.status);

    // Calculate stock and price warnings
    const stockWarnings = [];
    const priceWarnings = [];

    // Group items by product for accurate stock warning calculation
    const groupedProducts = new Map();
    for (const item of sale.items) {
      if (!groupedProducts.has(item.product.id)) {
        groupedProducts.set(item.product.id, {
          product: item.product,
          totalRequested: 0,
        });
      }
      groupedProducts.get(item.product.id).totalRequested += item.quantity;

      // Price warnings remain per-item
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

    for (const { product, totalRequested } of groupedProducts.values()) {
      // Use ProductStock if available, otherwise sum from stockLots
      const productStock = product.stock;

      // Get the current available quantity from ProductStock
      let availableStock: number;
      let physicalStock: number = 0;

      if (productStock) {
        // availableQuantity from ProductStock (already reflects all deductions)
        availableStock = productStock.availableQuantity;
        physicalStock = productStock.physicalBalance || 0;
      } else {
        // Fallback: sum from stockLots
        availableStock = product.stockLots.reduce(
          (sum: number, lot: { quantity: number }) => sum + lot.quantity,
          0,
        );
      }

      let insufficientStock = false;
      let displayAvailable = availableStock;

      if (isApprovedOrder) {
        insufficientStock = physicalStock < totalRequested;
        displayAvailable = physicalStock;
      } else {
        insufficientStock = availableStock < totalRequested;
        displayAvailable = availableStock;
      }

      if (insufficientStock) {
        stockWarnings.push({
          productId: product.id,
          productName: product.name,
          productCode: product.productCode,
          requested: totalRequested,
          available: Math.max(0, displayAvailable), // Don't show negative
          reserved: totalRequested,
          physical: productStock?.physicalBalance || displayAvailable,
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
          ? Number(creditLimit.promoAmount) -
          Number(sale.promotionalCreditUsed || 0)
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
      { status: 500 },
    );
  }
}

// PUT /api/sales/[id] - Update sale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body: SaleFormData = await request.json();

    // Create request context for logging
    const headersObj = Object.fromEntries(request.headers.entries());
    const context: RequestContext = {
      requestId: generateRequestId(),
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      userName: session.user.name ?? undefined,
      ipAddress: extractClientIp(headersObj),
      userAgent: extractUserAgent(headersObj),
      endpoint: `/api/sales/${id}`,
      method: "PUT",
    };
    const reqLogger = logger.child(context);

    // Check if sale exists and can be edited
    const existingSale = await prisma.sale.findUnique({
      where: { id, deletedAt: null },
      include: { customer: true },
    });

    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    reqLogger.info("Updating sale", {
      module: "sales",
      metadata: {
        saleId: id,
        saleNumber: existingSale.saleNumber,
        currentStatus: existingSale.status,
      },
    });

    // Check if user has permission to edit this sale
    // For REJECTED or WAITING_FOR_CORRECTION sales, only creator or admin can edit
    // if (
    //   existingSale.status === "REJECTED" ||
    //   existingSale.status === "WAITING_FOR_CORRECTION"
    // ) {
    //   const isCreator = session.user.id === existingSale.createdById;
    //   if (!isCreator) {
    //     return NextResponse.json(
    //       {
    //         error:
    //           "Only the creator or admin can edit rejected or waiting for correction sales",
    //       },
    //       { status: 403 },
    //     );
    //   }
    // }

    // Check delivery date updates
    let newDeliveryUpdateCount = existingSale.deliveryUpdateCount;
    // Check if deliveryDate was actually changed (and present provided)
    if (
      body.deliveryDate &&
      (!existingSale.deliveryDate ||
        new Date(body.deliveryDate).getTime() !==
        existingSale.deliveryDate.getTime())
    ) {
      if (existingSale.deliveryUpdateCount >= 3) {
        return NextResponse.json(
          {
            error:
              "Maximum number of delivery date updates exceeded (3 times).",
          },
          { status: 400 },
        );
      }
      newDeliveryUpdateCount++;
    }

    // Fetch products for calculation (to get packageSizePerBox)
    const productIds = body.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, packageSizePerBox: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // If sale is approved or rejected, reset to PENDING for re-approval
    const needsReapproval =
      existingSale.status === "APPROVED" ||
      existingSale.status === "AWAITING_PAYMENT" ||
      existingSale.status === "AWAITING_DELIVERY" ||
      existingSale.status === "REJECTED" ||
      existingSale.status === "WAITING_FOR_CORRECTION";

    const sale = await prisma.$transaction(async (tx) => {
      // Return credit limit if sale was approved and used credit
      if (needsReapproval && existingSale.paymentTerm !== "PREPAID") {
        const creditLimit = await tx.creditLimit.findFirst({
          where: {
            customerId: existingSale.customerId,
            status: "ACTIVE",
            deletedAt: null,
          },
        });

        if (creditLimit) {
          // Return the credit: decrease used, increase available
          await tx.creditLimit.update({
            where: { id: creditLimit.id },
            data: {
              usedAmount: {
                decrement: existingSale.totalAmount,
              },
              availableAmount: {
                increment: existingSale.totalAmount,
              },
            },
          });
        }
      }

      // If reverting to PENDING, release stock
      if (needsReapproval) {
        await releaseStock(id, tx);
      }

      // Calculate totals
      const subtotal = body.items.reduce((sum, item) => {
        const product = productMap.get(item.productId);
        const packSize = parseFloat(product?.packageSizePerBox?.toString() || "1");
        const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
        return sum + item.quantity * item.unitPrice * multiplier;
      }, 0);
      const total = subtotal - body.shippingCost - body.otherCosts;

      // Update sale
      return await tx.sale.update({
        where: { id },
        data: {
          customerId: body.customerId,
          employeeId: body.employeeId,
          paymentTerm: body.paymentTerm,
          creditDays: body.creditDays,
          creditDueDate: body.creditDueDate
            ? new Date(body.creditDueDate)
            : null,
          usePromotionalCredit: body.usePromotionalCredit,
          promotionalCreditUsed: body.promotionalCreditUsed
            ? new Prisma.Decimal(body.promotionalCreditUsed)
            : null,
          deliveryMethod: body.deliveryMethod,

          // requestedDeliveryDate: body.requestedDeliveryDate
          //   ? new Date(body.requestedDeliveryDate)
          //   : null, // Keep existing if not provided or add to form
          saleDate: new Date(body.saleDate),
          requestedDeliveryDate: body.requestedDeliveryDate
            ? new Date(body.requestedDeliveryDate)
            : null,
          deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
          deliveryUpdateCount: newDeliveryUpdateCount,

          // Store flag indicating user specified custom shipping address
          useCustomShipping: body.useCustomShipping ?? false,
          selectedAddressId: body.selectedAddressId || null,
          subtotalAmount: new Prisma.Decimal(subtotal),
          shippingCost: new Prisma.Decimal(body.shippingCost),
          otherCosts: new Prisma.Decimal(body.otherCosts),
          otherCostsDescription: body.otherCostsDescription,
          totalAmount: new Prisma.Decimal(total),
          notes: body.notes,
          status: needsReapproval ? "PENDING_APPROVAL" : existingSale.status,
          items: {
            deleteMany: {},
            create: body.items.map((item) => {
              const product = productMap.get(item.productId);
              const packSize = parseFloat(product?.packageSizePerBox?.toString() || "1");
              const multiplier =
                isNaN(packSize) || packSize <= 0 ? 1 : packSize;
              const totalPrice = item.quantity * item.unitPrice * multiplier;

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
                status: "PENDING_APPROVAL",
                notes: "Sale updated - requires re-approval",
                changedById: session.user.id,
              },
            }
            : undefined,
        },
        include: {
          customer: true,
          employee: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    // Log audit event (UPDATE)
    const duration = Date.now() - startTime;
    await auditLogger.logUpdate(
      "Sale",
      id,
      {
        saleNumber: existingSale.saleNumber,
        status: existingSale.status,
        customerId: existingSale.customerId,
        customerName: existingSale.customer?.name,
        totalAmount: existingSale.totalAmount.toString(),
        paymentTerm: existingSale.paymentTerm,
      },
      {
        saleNumber: sale.saleNumber,
        status: sale.status,
        customerId: sale.customerId,
        customerName: sale.customer?.name,
        totalAmount: sale.totalAmount.toString(),
        paymentTerm: sale.paymentTerm,
      },
      context,
      {
        entityName: sale.saleNumber,
        module: "sales",
        duration,
      },
    );

    reqLogger.info("Sale updated successfully", {
      module: "sales",
      duration,
      metadata: {
        saleId: id,
        saleNumber: sale.saleNumber,
        newStatus: sale.status,
      },
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 },
    );
  }
}

// DELETE /api/sales/[id] - Delete sale (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Return credit limit if sale was approved and used credit
      if (
        sale.paymentTerm !== "PREPAID" &&
        (sale.status === "APPROVED" ||
          sale.status === "AWAITING_PAYMENT" ||
          sale.status === "AWAITING_DELIVERY" ||
          sale.status === "DELIVERED" ||
          sale.status === "COMPLETED")
      ) {
        const creditLimit = await tx.creditLimit.findFirst({
          where: {
            customerId: sale.customerId,
            status: "ACTIVE",
            deletedAt: null,
          },
        });

        if (creditLimit) {
          // Return the credit: decrease used, increase available
          await tx.creditLimit.update({
            where: { id: creditLimit.id },
            data: {
              usedAmount: {
                decrement: sale.totalAmount,
              },
              availableAmount: {
                increment: sale.totalAmount,
              },
            },
          });
        }
      }

      // Return stock if sale was approved/allocated
      if (
        sale.status === "APPROVED" ||
        sale.status === "AWAITING_PAYMENT" ||
        sale.status === "AWAITING_DELIVERY"
      ) {
        await releaseStock(id, tx);
      }

      // Soft delete
      await tx.sale.update({
        where: { id },
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
    });

    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 },
    );
  }
}
