import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/src/infrastructure/database";

// GET: Fetch all sales targets for a specific year
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("id");
    const fallbackYear = new Date().getFullYear();
    const parsedYear = parseInt(
      searchParams.get("year") || fallbackYear.toString(),
    );
    const year = Number.isNaN(parsedYear) ? fallbackYear : parsedYear;
    const monthParam = searchParams.get("month");
    const employeeId = searchParams.get("employeeId") || undefined;
    const shopId =
      searchParams.get("shopId") || searchParams.get("customerId") || undefined;
    const parsedMonth =
      monthParam && monthParam !== "all" ? Number(monthParam) : undefined;

    if (targetId) {
      const detailedTarget = await prisma.salesTarget.findUnique({
        where: { id: targetId },
        include: {
          employee: true,
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!detailedTarget) {
        return NextResponse.json(
          { error: "Sales target not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ detailedTarget });
    }

    // Fetch monthly targets (legacy/global)
    const monthlyTargets = await prisma.monthlySalesTarget.findMany({
      where: {
        year,
        deletedAt: null,
      },
      orderBy: { month: "asc" },
    });

    // Fetch product group targets
    const productGroupTargets = await prisma.productGroupSalesTarget.findMany({
      where: {
        year,
        deletedAt: null,
      },
      orderBy: [{ productGroup: "asc" }, { month: "asc" }],
    });

    // Fetch region targets
    const regionTargets = await prisma.regionSalesTarget.findMany({
      where: {
        year,
        deletedAt: null,
      },
      orderBy: [{ region: "asc" }, { month: "asc" }],
    });

    // Fetch product targets
    const productTargets = await prisma.productSalesTarget.findMany({
      where: {
        year,
        deletedAt: null,
      },
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
      orderBy: [{ productId: "asc" }, { month: "asc" }],
    });

    // Fetch Detailed Sales Targets
    const detailedTargets = await prisma.salesTarget.findMany({
      where: {
        year,
        ...(parsedMonth ? { month: parsedMonth } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(shopId ? { customerId: shopId } : {}),
      },
      include: {
        employee: true,
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: [{ month: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      monthlyTargets,
      productGroupTargets,
      regionTargets,
      productTargets,
      detailedTargets,
    });
  } catch (error) {
    console.error("Error fetching sales targets:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales targets" },
      { status: 500 },
    );
  }
}

// POST: Create or update sales targets
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role or dashboard.manage permission
    const isAdmin = session.user.roles?.includes("administrator");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, targets } = body;

    if (!type || !targets || !Array.isArray(targets)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const results = [];

    // Transaction? Maybe too heavy for loop.
    // We'll do it sequentially or promise.all

    if (type === "detailed") {
      // Handle Detailed Sales Targets
      for (const target of targets) {
        const {
          id, // If ID is present, we update
          year,
          month,
          employeeId,
          customerId,
          items, // Array of { productId, quantity, amount }
        } = target;

        if (id) {
          // Update existing
          // First delete existing items? Or update them? Easier to delete and recreate items.
          await prisma.salesTargetItem.deleteMany({
            where: { salesTargetId: id },
          });

          const updated = await prisma.salesTarget.update({
            where: { id },
            data: {
              year,
              month,
              employeeId,
              customerId,
              items: {
                create: items.map((item: any) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  amount: item.amount,
                })),
              },
            },
            include: { items: true },
          });
          results.push(updated);
        } else {
          // Create new
          const created = await prisma.salesTarget.create({
            data: {
              year,
              month,
              employeeId,
              customerId,
              createdById: session.user.id,
              items: {
                create: items.map((item: any) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  amount: item.amount,
                })),
              },
            },
            include: { items: true },
          });
          results.push(created);
        }
      }
    } else {
      // Handle Legacy Types
      for (const target of targets) {
        const {
          year,
          month,
          targetAmount,
          productGroup,
          region,
          productId,
          notes,
        } = target;

        if (type === "monthly") {
          // Upsert monthly target
          const existing = await prisma.monthlySalesTarget.findFirst({
            where: { year, month, deletedAt: null },
          });

          if (existing) {
            const updated = await prisma.monthlySalesTarget.update({
              where: { id: existing.id },
              data: { targetAmount, notes },
            });
            results.push(updated);
          } else {
            const created = await prisma.monthlySalesTarget.create({
              data: {
                year,
                month,
                targetAmount,
                notes,
                createdById: session.user.id,
              },
            });
            results.push(created);
          }
        } else if (type === "productGroup") {
          // Upsert product group target
          const existing = await prisma.productGroupSalesTarget.findFirst({
            where: { productGroup, year, month, deletedAt: null },
          });

          if (existing) {
            const updated = await prisma.productGroupSalesTarget.update({
              where: { id: existing.id },
              data: { targetAmount, notes },
            });
            results.push(updated);
          } else {
            const created = await prisma.productGroupSalesTarget.create({
              data: {
                productGroup,
                year,
                month,
                targetAmount,
                notes,
                createdById: session.user.id,
              },
            });
            results.push(created);
          }
        } else if (type === "region") {
          // Upsert region target
          const existing = await prisma.regionSalesTarget.findFirst({
            where: { region, year, month, deletedAt: null },
          });

          if (existing) {
            const updated = await prisma.regionSalesTarget.update({
              where: { id: existing.id },
              data: { targetAmount, notes },
            });
            results.push(updated);
          } else {
            const created = await prisma.regionSalesTarget.create({
              data: {
                region,
                year,
                month,
                targetAmount,
                notes,
                createdById: session.user.id,
              },
            });
            results.push(created);
          }
        } else if (type === "product") {
          // Upsert product target
          const existing = await prisma.productSalesTarget.findFirst({
            where: { productId, year, month, deletedAt: null },
          });

          if (existing) {
            const updated = await prisma.productSalesTarget.update({
              where: { id: existing.id },
              data: { targetAmount, notes },
            });
            results.push(updated);
          } else {
            const created = await prisma.productSalesTarget.create({
              data: {
                productId,
                year,
                month,
                targetAmount,
                notes,
                createdById: session.user.id,
              },
            });
            results.push(created);
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error saving sales targets:", error);
    return NextResponse.json(
      { error: "Failed to save sales targets" },
      { status: 500 },
    );
  }
}
// DELETE: Delete a sales target
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.salesTarget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sales target:", error);
    return NextResponse.json(
      { error: "Failed to delete sales target" },
      { status: 500 },
    );
  }
}
