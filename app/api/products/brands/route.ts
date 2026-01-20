import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/src/infrastructure/database";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/src/core/rbac";

const resourcePath = "/api/products";

// GET - List all brands
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

    const where: Prisma.BrandWhereInput = {
      deletedAt: null,
      ...(q && {
        OR: [
          { code: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [brands, total] = await Promise.all([
      db.brand.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { code: "asc" },
      }),
      db.brand.count({ where }),
    ]);

    return NextResponse.json({ brands, total });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 },
    );
  }
}

// POST - Create new brand
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
    const { code, description } = body;

    if (!code || !description) {
      return NextResponse.json(
        { error: "รหัสและคำอธิบายจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check duplicate code
    const existing = await db.brand.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "รหัสแบรนด์นี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const brand = await db.brand.create({
      data: { code, description },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 },
    );
  }
}
