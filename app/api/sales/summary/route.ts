import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db as prisma, SaleStatus } from "@/lib/db";

/**
 * GET /api/sales/summary
 * Get sales summary grouped by month, product, or product group
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const groupBy = searchParams.get("groupBy") || "month"; // month, product, productGroup

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Only count approved/completed sales
    const validStatuses: SaleStatus[] = ["APPROVED", "PAID", "DELIVERED"];

    if (groupBy === "month") {
      // Group by month
      const sales = await prisma.sale.findMany({
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

      // Aggregate by month
      const monthlyData: Record<number, number> = {};
      for (let i = 1; i <= 12; i++) {
        monthlyData[i] = 0;
      }

      sales.forEach((sale) => {
        const month = new Date(sale.saleDate).getMonth() + 1;
        monthlyData[month] += Number(sale.totalAmount) || 0;
      });

      const data = Object.entries(monthlyData).map(([month, totalAmount]) => ({
        month: parseInt(month),
        totalAmount,
      }));

      return NextResponse.json({ data });
    }

    if (groupBy === "productGroup") {
      // Group by product group
      const saleItems = await prisma.saleItem.findMany({
        where: {
          sale: {
            saleDate: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: validStatuses,
            },
          },
        },
        include: {
          product: {
            select: {
              productGroup: true,
            },
          },
        },
      });

      const groupData: Record<string, number> = {};

      saleItems.forEach((item) => {
        const productGroup = item.product?.productGroup;
        const group = (productGroup as any)?.name || "UNKNOWN";
        if (!groupData[group]) {
          groupData[group] = 0;
        }
        groupData[group] += Number(item.totalPrice) || 0;
      });

      const data = Object.entries(groupData).map(
        ([productGroup, totalAmount]) => ({
          productGroup,
          totalAmount,
        })
      );

      return NextResponse.json({ data });
    }

    // Default: return all sales for the year
    const sales = await prisma.sale.findMany({
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
        id: true,
        saleNumber: true,
        saleDate: true,
        totalAmount: true,
        status: true,
      },
      orderBy: {
        saleDate: "desc",
      },
    });

    return NextResponse.json({ data: sales });
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales summary" },
      { status: 500 }
    );
  }
}

