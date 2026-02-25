import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { SaleStatus, PaymentTerm, Prisma } from "@/lib/db";
import type { SalesFilterParams, SaleFormData } from "@/types/sales";
import { createApiContext, createApiLogger, logCreate } from "@/lib/logger";
import { sendNotificationUseCase } from "@/modules/notifications/application";
import { applyDataScope } from "@/lib/data-scope";

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
      const statusParam = searchParams.get("status");
      if (statusParam && statusParam.includes(",")) {
        where.status = { in: statusParam.split(",") as SaleStatus[] };
      } else {
        where.status = filters.status;
      }
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
        const dateTo = new Date(filters.dateTo);
        dateTo.setDate(dateTo.getDate() + 1);
        where.saleDate.lt = dateTo;
      }
    }

    // Permission-based data scope filtering
    await applyDataScope(where, session, "sale");

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
          shippingCompany: {
            select: {
              id: true,
              name: true,
              address: true,
              addressLine: true,
              subdistrict: true,
              district: true,
              province: true,
              postalCode: true,
            },
          },
          pickupCompany: {
            select: {
              id: true,
              name: true,
              addressLine: true,
              subdistrict: true,
              district: true,
              province: true,
              postalCode: true,
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
      { status: 500 },
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

    // Verify user still exists in DB (handle stale sessions after DB reset)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Session expired or invalid. Please sign in again." },
        { status: 401 },
      );
    }

    const body: SaleFormData = await request.json();

    // Validate required fields
    if (!body.customerId || !body.employeeId || !body.items?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // Fetch all products involved in the sale for calculations and stock checks
    const productIds = body.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        stockLots: {
          where: { isUsed: false },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate totals with package size multiplier (matching frontend logic)
    const subtotal = body.items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      const packSize = parseFloat(product?.packageSizePerBox || "1");
      const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;

      return sum + item.quantity * item.unitPrice * multiplier;
    }, 0);

    const total = subtotal - body.shippingCost - body.otherCosts;

    // Check credit limit for CREDIT payment term
    if (body.paymentTerm !== "PREPAID") {
      const creditLimit = customer.creditLimits[0];
      if (!creditLimit) {
        return NextResponse.json(
          { error: "Customer does not have an active credit limit" },
          { status: 400 },
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
          { status: 400 },
        );
      }
    }

    // Check stock availability (warnings only, allow save)
    const stockWarnings = [];
    for (const item of body.items) {
      const product = productMap.get(item.productId);

      if (product) {
        const totalStock = product.stockLots.reduce(
          (sum, lot) => sum + lot.quantity,
          0,
        );
        // Note: Stock quantity is usually in base units (e.g. bottles)
        // Item quantity is in Cartons.
        const packSize = parseFloat(product.packageSizePerBox || "1");
        const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
        const requestedUnits = item.quantity * multiplier;

        if (totalStock < requestedUnits) {
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
        status: "PENDING_APPROVAL",
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
        pickupCompanyId: body.pickupCompanyId,
        shippingCompanyId: body.shippingCompanyId,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
        // Store flag indicating user specified custom shipping address
        useCustomShipping: body.useCustomShipping ?? false,
        subtotalAmount: new Prisma.Decimal(subtotal),
        shippingCost: new Prisma.Decimal(body.shippingCost),
        otherCosts: new Prisma.Decimal(body.otherCosts),
        otherCostsDescription: body.otherCostsDescription,
        totalAmount: new Prisma.Decimal(total),
        notes: body.notes,
        createdById: session.user.id,
        items: {
          create: body.items.map((item) => {
            const product = productMap.get(item.productId);
            const packSize = parseFloat(product?.packageSizePerBox || "1");
            const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
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
        statusHistory: {
          create: {
            status: "PENDING_APPROVAL",
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

    // Create notification for approvers (Manager)
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: body.employeeId },
        include: { manager: true },
      });

      if (employee?.manager?.userId) {
        await sendNotificationUseCase({
          userId: employee.manager.userId,
          title: "รออนุมัติ",
          message: `รายการ ${saleNumber} จาก ${employee.name} ต้องการอนุมัติ`,
          type: "INFO",
          link: `/sales/${sale.id}`,
        });
      }
    } catch (notifError) {
      console.error("Failed to send notification to manager:", notifError);
    }

    // Log audit event (CREATE)
    const context = createApiContext(request, session.user);
    const reqLogger = createApiLogger(context);
    await logCreate(
      "Sale",
      sale.id,
      {
        saleNumber: sale.saleNumber,
        customerId: sale.customerId,
        customerName: sale.customer?.name,
        employeeId: sale.employeeId,
        employeeName: sale.employee?.name,
        status: sale.status,
        paymentTerm: sale.paymentTerm,
        totalAmount: sale.totalAmount.toString(),
        itemCount: sale.items.length,
      },
      context,
      {
        entityName: sale.saleNumber,
        module: "sales",
      },
    );

    reqLogger.info("Sale created successfully", {
      module: "sales",
      metadata: { saleId: sale.id, saleNumber: sale.saleNumber },
    });

    return NextResponse.json({
      sale,
      stockWarnings,
    });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 },
    );
  }
}

function generateSaleNumber(lastNumber?: string | null): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const prefix = `SO${year}${month}`;

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const lastSeq = parseInt(lastNumber.slice(-4));
  const newSeq = String(lastSeq + 1).padStart(4, "0");
  return `${prefix}${newSeq}`;
}
