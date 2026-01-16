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
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );

    // Fetch monthly targets
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

    return NextResponse.json({
      monthlyTargets,
      productGroupTargets,
      regionTargets,
      productTargets,
    });
  } catch (error) {
    console.error("Error fetching sales targets:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales targets" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const results = [];

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

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error saving sales targets:", error);
    return NextResponse.json(
      { error: "Failed to save sales targets" },
      { status: 500 }
    );
  }
}
