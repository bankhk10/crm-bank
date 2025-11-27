import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/sales-forecasts/[id]/summary - ดึงสรุปข้อมูล Sales Forecast
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forecast = await db.salesForecast.findUnique({
      where: { id: params.id },
      include: {
        monthlyDetails: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                name: true,
              },
            },
            customer: {
              select: {
                id: true,
                customerCode: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!forecast) {
      return NextResponse.json(
        { error: "Sales forecast not found" },
        { status: 404 }
      );
    }

    // สรุปยอดรวมแต่ละเดือน
    const monthlySummary = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const items = forecast.monthlyDetails.filter((d) => d.month === month);
      return {
        month,
        totalAmount: items.reduce((sum, item) => sum + Number(item.totalAmount), 0),
        itemCount: items.length,
      };
    });

    // สรุปตามสินค้า
    const productMap = new Map<string, { productId: string; productName: string; totalQuantity: number; totalAmount: number }>();
    forecast.monthlyDetails.forEach((detail) => {
      const key = detail.productId;
      const existing = productMap.get(key) || {
        productId: detail.productId,
        productName: detail.product.name,
        totalQuantity: 0,
        totalAmount: 0,
      };
      existing.totalQuantity += detail.quantity;
      existing.totalAmount += Number(detail.totalAmount);
      productMap.set(key, existing);
    });

    // สรุปตามลูกค้า
    const customerMap = new Map<string, { customerId: string; customerName: string; totalAmount: number; itemCount: number }>();
    forecast.monthlyDetails.forEach((detail) => {
      const key = detail.customerId;
      const existing = customerMap.get(key) || {
        customerId: detail.customerId,
        customerName: detail.customer.name,
        totalAmount: 0,
        itemCount: 0,
      };
      existing.totalAmount += Number(detail.totalAmount);
      existing.itemCount += 1;
      customerMap.set(key, existing);
    });

    return NextResponse.json({
      forecast: {
        id: forecast.id,
        year: forecast.year,
        status: forecast.status,
        totalAmount: Number(forecast.totalAmount),
      },
      monthlySummary,
      productSummary: Array.from(productMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
      customerSummary: Array.from(customerMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
    });
  } catch (error) {
    console.error("Error fetching sales forecast summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales forecast summary" },
      { status: 500 }
    );
  }
}
