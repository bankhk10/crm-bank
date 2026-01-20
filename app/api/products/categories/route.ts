import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/src/infrastructure/database";

// GET - List all product categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "20");
    const q = searchParams.get("q") || "";

    const where: Prisma.ProductCategoryWhereInput = {
      deletedAt: null,
      ...(q && {
        OR: [
          { code: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [categories, total] = await Promise.all([
      db.productCategory.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { code: "asc" },
      }),
      db.productCategory.count({ where }),
    ]);

    return NextResponse.json({ categories, total });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

// POST - Create new product category
export async function POST(request: NextRequest) {
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
    const existing = await db.productCategory.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "รหัสหมวดสินค้านี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const category = await db.productCategory.create({
      data: { code, description },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
