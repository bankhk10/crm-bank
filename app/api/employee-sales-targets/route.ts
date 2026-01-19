import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/src/infrastructure/database";
import { getRegionByProvince } from "@/lib/province-region-mapping";

// GET: Fetch employee sales targets (for employee or admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString(),
    );
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!)
      : null;
    const employeeId = searchParams.get("employeeId");

    // Check if user is admin
    const isAdmin = session.user.roles?.includes("administrator");

    // Build where clause

    const whereClause: any = {
      year,
      deletedAt: null,
    };

    if (month) {
      whereClause.month = month;
    }

    // If employeeId is specified and user is admin, filter by employeeId
    // If not admin, only show their own targets
    if (employeeId && isAdmin) {
      whereClause.employeeId = employeeId;
    } else if (!isAdmin) {
      // Get employee ID from user
      const employee = await prisma.employee.findFirst({
        where: { userId: session.user.id, deletedAt: null },
      });
      if (!employee) {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 },
        );
      }
      whereClause.employeeId = employee.id;
    }

    const targets = await prisma.employeeSalesTarget.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            name: true,
            province: true,
            region: true,
          },
        },
        product: {
          select: {
            id: true,
            productCode: true,
            name: true,
            productGroup: true,
            price: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
          },
        },
      },
      orderBy: [{ month: "asc" }, { createdAt: "asc" }],
    });

    // Get summary by employee if admin is viewing all
    let summary = null;
    if (isAdmin && !employeeId) {
      // Get all employees with their targets
      const employees = await prisma.employee.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          employeeCode: true,
        },
      });

      const employeeTargets = await prisma.employeeSalesTarget.groupBy({
        by: ["employeeId", "month"],
        where: {
          year,
          deletedAt: null,
        },
        _sum: {
          totalAmount: true,
          quantity: true,
        },
      });

      summary = employees.map((emp) => ({
        employee: emp,
        monthlyTargets: employeeTargets
          .filter((t) => t.employeeId === emp.id)
          .map((t) => ({
            month: t.month,
            totalAmount: t._sum.totalAmount,
            quantity: t._sum.quantity,
          })),
        yearlyTotal: employeeTargets
          .filter((t) => t.employeeId === emp.id)
          .reduce((sum, t) => sum + Number(t._sum.totalAmount || 0), 0),
      }));
    }

    return NextResponse.json({
      targets,
      summary,
    });
  } catch (error) {
    console.error("Error fetching employee sales targets:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee sales targets" },
      { status: 500 },
    );
  }
}

// POST: Create or update employee sales targets
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, year, month, items } = body;

    // Validate required fields
    if (!employeeId || !year || !month || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required fields: employeeId, year, month, items" },
        { status: 400 },
      );
    }

    // Get employee to validate
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Check access - only admin or the employee themselves can set targets
    const isAdmin = session.user.roles?.includes("administrator");
    const isOwnTarget = employee.userId === session.user.id;

    if (!isAdmin && !isOwnTarget) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results = [];

    for (const item of items) {
      const { customerId, productId, quantity, notes } = item;

      if (!customerId || !productId || quantity === undefined || quantity < 0) {
        continue; // Skip invalid items
      }

      // Get customer to get region
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { province: true, region: true },
      });

      if (!customer) continue;

      const customerRegion =
        customer.region || getRegionByProvince(customer.province);

      // Get product to get price and group
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { price: true, productGroup: true },
      });

      if (!product || !product.price) continue;

      const unitPrice = Number(product.price);
      const totalAmount = quantity * unitPrice;
      const productGroup = product.productGroup;

      // Check if target already exists
      const existing = await prisma.employeeSalesTarget.findFirst({
        where: {
          employeeId,
          year,
          month,
          customerId,
          productId,
          deletedAt: null,
        },
      });

      if (existing) {
        // Update existing
        const updated = await prisma.employeeSalesTarget.update({
          where: { id: existing.id },
          data: {
            quantity,
            unitPrice,
            totalAmount,
            customerRegion,
            productGroup,
            notes,
          },
        });
        results.push(updated);
      } else {
        // Create new
        const created = await prisma.employeeSalesTarget.create({
          data: {
            employeeId,
            year,
            month,
            customerId,
            customerRegion,
            productId,
            productGroup,
            quantity,
            unitPrice,
            totalAmount,
            notes,
            createdById: session.user.id,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error saving employee sales targets:", error);
    return NextResponse.json(
      { error: "Failed to save employee sales targets" },
      { status: 500 },
    );
  }
}

// DELETE: Remove a specific target item
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("id");

    if (!targetId) {
      return NextResponse.json(
        { error: "Target ID is required" },
        { status: 400 },
      );
    }

    // Get the target to check access
    const target = await prisma.employeeSalesTarget.findUnique({
      where: { id: targetId },
      include: {
        employee: { select: { userId: true } },
      },
    });

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    // Check access
    const isAdmin = session.user.roles?.includes("administrator");
    const isOwnTarget = target.employee.userId === session.user.id;

    if (!isAdmin && !isOwnTarget) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    await prisma.employeeSalesTarget.update({
      where: { id: targetId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee sales target:", error);
    return NextResponse.json(
      { error: "Failed to delete employee sales target" },
      { status: 500 },
    );
  }
}
