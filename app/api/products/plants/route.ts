import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/src/infrastructure/database";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/src/core/rbac";

const resourcePath = "/api/products";

// GET - List all plants
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "100");
    const q = searchParams.get("q") || "";

    const where: Prisma.PlantWhereInput = {
      deletedAt: null,
      ...(q && {
        OR: [
          { code: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { abbreviation: { contains: q, mode: "insensitive" as const } },
          { group: { contains: q, mode: "insensitive" as const } },
          {
            recommendedMedicines: { contains: q, mode: "insensitive" as const },
          },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [plants, total] = await Promise.all([
      db.plant.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { code: "asc" },
      }),
      db.plant.count({ where }),
    ]);

    return NextResponse.json({ plants, total });
  } catch (error) {
    console.error("Error fetching plants:", error);
    return NextResponse.json(
      { error: "Failed to fetch plants" },
      { status: 500 },
    );
  }
}

// POST - Create new plant
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.permissions?.["product.create"]?.allow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      code,
      name,
      abbreviation,
      group,
      recommendedMedicines,
      description,
    } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "รหัสและชื่อพืชจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check duplicate code
    const existing = await db.plant.findUnique({
      where: { code },
    });

    if (existing && !existing.deletedAt) {
      return NextResponse.json(
        { error: "รหัสพืชนี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const plant = await db.plant.create({
      data: {
        code,
        name,
        abbreviation,
        group,
        recommendedMedicines,
        description,
      },
    });

    return NextResponse.json({ plant }, { status: 201 });
  } catch (error) {
    console.error("Error creating plant:", error);
    return NextResponse.json(
      { error: "Failed to create plant" },
      { status: 500 },
    );
  }
}
