import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// GET /api/sales-forecasts/[id] - ดึงข้อมูล Sales Forecast ตาม ID
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
    });

    if (!forecast) {
      return NextResponse.json(
        { error: "Sales forecast not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Error fetching sales forecast:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales forecast" },
      { status: 500 }
    );
  }
}

// PATCH /api/sales-forecasts/[id] - อัพเดต Sales Forecast
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { year, notes, status, monthlyDetails } = body;

    const existing = await db.salesForecast.findUnique({
      where: { id: params.id },
      include: { monthlyDetails: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Sales forecast not found" },
        { status: 404 }
      );
    }

    // คำนวณยอดรวมใหม่ถ้ามีการอัพเดต monthlyDetails
    let totalAmount = existing.totalAmount;
    if (monthlyDetails && Array.isArray(monthlyDetails)) {
      let sum = 0;
      for (const detail of monthlyDetails) {
        sum += detail.quantity * detail.unitPrice;
      }
      totalAmount = new Decimal(sum);
    }

    // เตรียมข้อมูลสำหรับอัพเดต
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (year !== undefined) updateData.year = parseInt(year);
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "SUBMITTED") {
        updateData.submittedAt = new Date();
      } else if (status === "APPROVED") {
        updateData.approvedBy = session.user.id;
        updateData.approvedAt = new Date();
      }
    }
    if (monthlyDetails !== undefined) {
      updateData.totalAmount = totalAmount;
    }

    // อัพเดต Sales Forecast
    const forecast = await db.salesForecast.update({
      where: { id: params.id },
      data: updateData,
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
    });

    // อัพเดต monthly details ถ้ามี
    if (monthlyDetails && Array.isArray(monthlyDetails)) {
      // ลบ details เดิมทั้งหมด
      await db.salesForecastMonthlyDetail.deleteMany({
        where: { forecastId: params.id },
      });

      // สร้าง details ใหม่
      const details = monthlyDetails.map((detail: any) => ({
        forecastId: params.id,
        month: detail.month,
        productId: detail.productId,
        customerId: detail.customerId,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        totalAmount: detail.quantity * detail.unitPrice,
        notes: detail.notes,
      }));

      await db.salesForecastMonthlyDetail.createMany({
        data: details,
      });
    }

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Error updating sales forecast:", error);
    return NextResponse.json(
      { error: "Failed to update sales forecast" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales-forecasts/[id] - ลบ Sales Forecast (Soft Delete)
export async function DELETE(
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
    });

    if (!forecast) {
      return NextResponse.json(
        { error: "Sales forecast not found" },
        { status: 404 }
      );
    }

    // Soft delete
    await db.salesForecast.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Sales forecast deleted successfully" });
  } catch (error) {
    console.error("Error deleting sales forecast:", error);
    return NextResponse.json(
      { error: "Failed to delete sales forecast" },
      { status: 500 }
    );
  }
}
