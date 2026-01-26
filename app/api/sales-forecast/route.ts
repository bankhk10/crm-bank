import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/src/infrastructure/database";

const buildEmployeeName = (employee: {
  name: string;
  firstName: string | null;
  lastName: string | null;
  prefix: string | null;
}) => {
  const nameParts = [employee.prefix, employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return nameParts || employee.name;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString(),
      10,
    );
    const monthParam = searchParams.get("month");
    const month = monthParam ? Number(monthParam) : null;

    // Get sales targets with all related data
    const targets = await prisma.salesTarget.findMany({
      where: {
        year,
        ...(month ? { month } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            prefix: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                name: true,
                productGroup: true,
              },
            },
          },
        },
      },
      orderBy: [{ month: "asc" }, { createdAt: "desc" }],
    });

    // Get actual sales summary in parallel
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    const validStatuses = ["APPROVED", "PAID", "DELIVERED"];

    const salesPromise = prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: validStatuses,
        },
      },
      select: {
        saleDate: true,
        totalAmount: true,
      },
    });

    // Get product groups in parallel
    const groupsPromise = prisma.productGroupMaster.findMany({
      where: { deletedAt: null },
      select: { code: true, description: true },
      orderBy: { code: "asc" },
    });

    const [sales, groups] = await Promise.all([salesPromise, groupsPromise]);

    // Process sales summary
    const monthlyData: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = 0;
    }
    sales.forEach((sale) => {
      const month = new Date(sale.saleDate).getMonth() + 1;
      monthlyData[month] += Number(sale.totalAmount) || 0;
    });
    const actualSales = Object.entries(monthlyData).map(
      ([month, totalAmount]) => ({
        month: parseInt(month),
        totalAmount,
      }),
    );

    // Process forecast data (existing logic)
    const personalMap = new Map<string, any>();
    const groupMap = new Map<string, any>();
    const productMap = new Map<string, any>();

    targets.forEach((target) => {
      const employeeName = buildEmployeeName(target.employee);
      const personalKey = `${target.employeeId}-${target.month}`;

      if (!personalMap.has(personalKey)) {
        personalMap.set(personalKey, {
          employeeId: target.employeeId,
          employeeName,
          month: target.month,
          totalAmount: 0,
          totalQuantity: 0,
        });
      }

      target.items.forEach((item) => {
        const amount = Number(item.amount || 0);
        const quantity = item.quantity || 0;

        const personalEntry = personalMap.get(personalKey);
        if (personalEntry) {
          personalEntry.totalAmount += amount;
          personalEntry.totalQuantity += quantity;
        }

        const groupKey = `${item.product.productGroup || "unassigned"}-${target.month}`;
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            productGroup: item.product.productGroup || "unassigned",
            month: target.month,
            totalAmount: 0,
            totalQuantity: 0,
          });
        }

        const groupEntry = groupMap.get(groupKey);
        if (groupEntry) {
          groupEntry.totalAmount += amount;
          groupEntry.totalQuantity += quantity;
        }

        const productKey = `${item.productId}-${target.month}`;
        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            productId: item.productId,
            productCode: item.product.productCode,
            productName: item.product.name,
            productGroup: item.product.productGroup,
            month: target.month,
            totalAmount: 0,
            totalQuantity: 0,
          });
        }

        const productEntry = productMap.get(productKey);
        if (productEntry) {
          productEntry.totalAmount += amount;
          productEntry.totalQuantity += quantity;
        }
      });
    });

    const personal = Array.from(personalMap.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName),
    );
    const group = Array.from(groupMap.values()).sort((a, b) =>
      a.productGroup.localeCompare(b.productGroup),
    );
    const product = Array.from(productMap.values()).sort((a, b) =>
      a.productName.localeCompare(b.productName),
    );

    // Create group labels map
    const groupLabels = groups.reduce<Record<string, string>>((acc, group) => {
      acc[group.code] = group.description;
      return acc;
    }, {});

    return NextResponse.json({
      personal,
      group,
      product,
      actualSales,
      groupLabels,
    });
  } catch (error) {
    console.error("Error fetching sales forecast:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales forecast" },
      { status: 500 },
    );
  }
}
