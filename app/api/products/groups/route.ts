import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/lib/db";

// GET - List all product groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "20");
    const q = searchParams.get("q") || "";

    const where: Prisma.ProductGroupMasterWhereInput = {
      deletedAt: null,
      ...(q && {
        OR: [
          { code: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [groups, total] = await Promise.all([
      db.productGroupMaster.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { code: "asc" },
        include: {
          category: {
            select: { id: true, code: true, description: true },
          },
        },
      }),
      db.productGroupMaster.count({ where }),
    ]);

    return NextResponse.json({ groups, total });
  } catch (error) {
    console.error("Error fetching product groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch product groups" },
      { status: 500 },
    );
  }
}

// POST - Create new product group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, description, categoryId } = body;

    if (!code || !description) {
      return NextResponse.json(
        { error: "รหัสและชื่อจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check duplicate code
    const existing = await db.productGroupMaster.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้านี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    // Verify category exists if provided
    if (categoryId) {
      const category = await db.productCategory.findUnique({
        where: { id: categoryId, deletedAt: null },
      });
      if (!category) {
        return NextResponse.json(
          { error: "ไม่พบหมวดสินค้าที่ระบุ" },
          { status: 400 },
        );
      }
    }

    const group = await db.productGroupMaster.create({
      data: { code, description, categoryId },
      include: {
        category: {
          select: { id: true, code: true, description: true },
        },
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Error creating product group:", error);
    return NextResponse.json(
      { error: "Failed to create product group" },
      { status: 500 },
    );
  }
}
