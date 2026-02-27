import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/lib/db";

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
        orderBy: { createdAt: "desc" },
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
        { error: "รหัสและชื่อหมวดสินค้าจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    const existing = await db.productCategory.findFirst({
      where: { code },
    });

    let category;
    if (existing) {
      if (!existing.deletedAt) {
        return NextResponse.json(
          { error: "รหัสหมวดหมู่ชื่อการค้ามีอยู่แล้ว" },
          { status: 400 },
        );
      }

      // Update and restore the soft-deleted record
      category = await db.productCategory.update({
        where: { id: existing.id },
        data: {
          description,
          deletedAt: null, // restore
        },
      });
    } else {
      // Create new
      category = await db.productCategory.create({
        data: { code, description },
      });
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
