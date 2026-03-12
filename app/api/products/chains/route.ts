import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/lib/db";

// GET - List all product ABC types (ประเภทสินค้า ABC)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "20");
    const q = searchParams.get("q") || "";

    const where: Prisma.ProductABCTypesWhereInput = {
      deletedAt: null,
      ...(q && {
        OR: [
          { code: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [abcTypes, total] = await Promise.all([
      db.productABCTypes.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      db.productABCTypes.count({ where }),
    ]);

    return NextResponse.json({ abcTypes, total });
  } catch (error) {
    console.error("Error fetching product ABC types:", error);
    return NextResponse.json(
      { error: "Failed to fetch product ABC types" },
      { status: 500 },
    );
  }
}

// POST - Create new product ABC type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description } = body;

    if (!code?.trim()) {
      return NextResponse.json(
        { error: "กรุณาระบุรหัสประเภทสินค้า" },
        { status: 400 },
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อประเภทสินค้า" },
        { status: 400 },
      );
    }

    // Check duplicate code or name
    const existing = await db.productABCTypes.findFirst({
      where: {
        OR: [
          { code: { equals: code, mode: "insensitive" } },
          { name: { equals: name, mode: "insensitive" } },
        ],
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "รหัสหรือชื่อประเภทสินค้านี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const abcType = await db.productABCTypes.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ abcType }, { status: 201 });
  } catch (error) {
    console.error("Error creating product ABC type:", error);
    return NextResponse.json(
      { error: "Failed to create product ABC type" },
      { status: 500 },
    );
  }
}
