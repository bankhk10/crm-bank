import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/lib/db";

// GET - List all product chains (กรุ๊ปสินค้า)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "20");
    const q = searchParams.get("q") || "";

    const where: Prisma.ProductChainWhereInput = {
      deletedAt: null,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [chains, total] = await Promise.all([
      db.productChain.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      db.productChain.count({ where }),
    ]);

    return NextResponse.json({ chains, total });
  } catch (error) {
    console.error("Error fetching product chains:", error);
    return NextResponse.json(
      { error: "Failed to fetch product chains" },
      { status: 500 },
    );
  }
}

// POST - Create new product chain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อกรุ๊ปสินค้า" },
        { status: 400 },
      );
    }

    // Check duplicate name
    const existing = await db.productChain.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "ชื่อกรุ๊ปสินค้านี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const chain = await db.productChain.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ chain }, { status: 201 });
  } catch (error) {
    console.error("Error creating product chain:", error);
    return NextResponse.json(
      { error: "Failed to create product chain" },
      { status: 500 },
    );
  }
}
