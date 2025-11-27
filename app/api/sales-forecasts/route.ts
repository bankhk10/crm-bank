import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/sales-forecasts - ดึงรายการ Sales Forecast
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: Prisma.SalesForecastWhereInput = {
      deletedAt: null,
    };

    if (year) {
      where.year = parseInt(year);
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status as any;
    }

    const [forecasts, total] = await Promise.all([
      db.salesForecast.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeCode: true,
            },
          },
          monthlyDetails: {
            include: {
              product: {
                select: {
                  id: true,
                  productCode: true,
                  name: true,
                  unit: true,
                },
              },
              customer: {
                select: {
                  id: true,
                  customerCode: true,
                  name: true,
                  customerType: true,
                },
              },
            },
            orderBy: {
              month: "asc",
            },
          },
        },
        orderBy: [{ year: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      db.salesForecast.count({ where }),
    ]);

    return NextResponse.json({
      data: forecasts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sales forecasts:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales forecasts" },
      { status: 500 }
    );
  }
}

// POST /api/sales-forecasts - สร้าง Sales Forecast ใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { year, employeeId, notes, monthlyDetails } = body;

    // Validate required fields
    if (!year || !employeeId) {
      return NextResponse.json(
        { error: "Year and Employee ID are required" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีการสร้าง Forecast สำหรับปีและพนักงานนี้แล้วหรือไม่
    const existing = await db.salesForecast.findUnique({
      where: {
        year_employeeId: {
          year: parseInt(year),
          employeeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Sales forecast for this year and employee already exists" },
        { status: 400 }
      );
    }

    // คำนวณยอดรวม
    let totalAmount = 0;
    const details = (monthlyDetails || []).map((detail: any) => {
      const amount = detail.quantity * detail.unitPrice;
      totalAmount += amount;
      return {
        month: detail.month,
        productId: detail.productId,
        customerId: detail.customerId,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        totalAmount: amount,
        notes: detail.notes,
      };
    });

    // สร้าง Sales Forecast พร้อม Monthly Details
    const forecast = await db.salesForecast.create({
      data: {
        year: parseInt(year),
        employeeId,
        notes,
        totalAmount,
        status: "DRAFT",
        monthlyDetails: {
          create: details,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true,
          },
        },
        monthlyDetails: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                name: true,
                unit: true,
              },
            },
            customer: {
              select: {
                id: true,
                customerCode: true,
                name: true,
                customerType: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(forecast, { status: 201 });
  } catch (error) {
    console.error("Error creating sales forecast:", error);
    return NextResponse.json(
      { error: "Failed to create sales forecast" },
      { status: 500 }
    );
  }
}
