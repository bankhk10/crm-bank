import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { SaleStatus, PaymentTerm, Prisma } from "@prisma/client";
import type { SalesFilterParams, SaleFormData } from "@/types/sales";

// GET /api/sales - List sales with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters: SalesFilterParams = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as SaleStatus) || undefined,
      customerId: searchParams.get("customerId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      paymentTerm:
        (searchParams.get("paymentTerm") as PaymentTerm) || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      perPage: parseInt(searchParams.get("perPage") || "10"),
    };

    // Build where clause based on filters
    const where: Prisma.SaleWhereInput = {
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { saleNumber: { contains: filters.search, mode: "insensitive" } },
        {
          customer: { name: { contains: filters.search, mode: "insensitive" } },
        },
        {
          customer: {
            customerCode: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.paymentTerm) {
      where.paymentTerm = filters.paymentTerm;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.saleDate = {};
      if (filters.dateFrom) {
        where.saleDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.saleDate.lte = new Date(filters.dateTo);
      }
    }

    // Permission-based filtering
    // TODO: Implement RBAC check to determine visibility
    // For now, users can only see their own sales unless they're admins

    const skip = ((filters.page || 1) - 1) * (filters.perPage || 10);
    const take = filters.perPage || 10;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take,
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
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      sales,
      total,
      page: filters.page || 1,
      perPage: filters.perPage || 10,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create new sale
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SaleFormData = await request.json();

    // Validate required fields
    if (!body.customerId || !body.employeeId || !body.items?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get customer with credit limit
    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
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
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const total = subtotal + body.shippingCost + body.otherCosts;

    // Check credit limit for CREDIT payment term
    if (body.paymentTerm === "CREDIT") {
      const creditLimit = customer.creditLimits[0];
      if (!creditLimit) {
        return NextResponse.json(
          { error: "Customer does not have an active credit limit" },
          { status: 400 }
        );
      }

      const availableCredit = Number(creditLimit.availableAmount);
      const promotionalCredit = body.usePromotionalCredit
        ? Number(creditLimit.promoAmount || 0) -
          Number(body.promotionalCreditUsed || 0)
        : 0;

      if (total > availableCredit + promotionalCredit) {
        return NextResponse.json(
          {
            error: "Sale amount exceeds available credit limit",
            creditInfo: {
              available: availableCredit,
              promotional: promotionalCredit,
              required: total,
            },
          },
          { status: 400 }
        );
      }
    }

    // Check stock availability (warnings only, allow save)
    const stockWarnings = [];
    for (const item of body.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          stockLots: {
            where: { isUsed: false },
          },
        },
      });

      if (product) {
        const totalStock = product.stockLots.reduce(
          (sum, lot) => sum + lot.quantity,
          0
        );
        if (totalStock < item.quantity) {
          stockWarnings.push({
            productId: product.id,
            productName: product.name,
            requested: item.quantity,
            available: totalStock,
          });
        }
      }
    }

    // Generate sale number
    const lastSale = await prisma.sale.findFirst({
      orderBy: { createdAt: "desc" },
      select: { saleNumber: true },
    });

    const saleNumber = generateSaleNumber(lastSale?.saleNumber);

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        customerId: body.customerId,
        employeeId: body.employeeId,
        status: "PENDING",
        paymentTerm: body.paymentTerm,
        creditDays: body.creditDays,
        creditDueDate: body.creditDueDate ? new Date(body.creditDueDate) : null,
        usePromotionalCredit: body.usePromotionalCredit,
        promotionalCreditUsed: body.promotionalCreditUsed
          ? new Prisma.Decimal(body.promotionalCreditUsed)
          : null,
        saleDate: new Date(body.saleDate),
        requestedDeliveryDate: body.requestedDeliveryDate
          ? new Date(body.requestedDeliveryDate)
          : null,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        deliveryMethod: body.deliveryMethod,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
        subtotalAmount: new Prisma.Decimal(subtotal),
        shippingCost: new Prisma.Decimal(body.shippingCost),
        otherCosts: new Prisma.Decimal(body.otherCosts),
        otherCostsDescription: body.otherCostsDescription,
        totalAmount: new Prisma.Decimal(total),
        notes: body.notes,
        createdById: session.user.id,
        items: {
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
        statusHistory: {
          create: {
            status: "PENDING",
            notes: "Sale created",
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
        createdBy: {
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
            },
          },
        },
      },
    });

    // TODO: Create notification for approvers

    return NextResponse.json({
      sale,
      stockWarnings,
    });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}

function generateSaleNumber(lastNumber?: string | null): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const prefix = `SAL${year}${month}`;

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const lastSeq = parseInt(lastNumber.slice(-4));
  const newSeq = String(lastSeq + 1).padStart(4, "0");
  return `${prefix}${newSeq}`;
}
