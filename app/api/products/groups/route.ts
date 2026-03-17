import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/lib/db";

// GET - List all product groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "20");
    const q = searchParams.get("q") || "";

    const where: Prisma.ProductGroupWhereInput = {
      deletedAt: null,
      ...(q && {
        OR: [
          { code: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [groups, total] = await Promise.all([
      db.productGroup.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      db.productGroup.count({ where }),
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
    const { code, name, abbreviation, description } = body;

    // description and abbreviation are optional based on schema update, but name is now required (with default "" handled in schema, but we should enforce it here)
    if (!code || !name) {
      return NextResponse.json(
        { error: "รหัสและชื่อกลุ่มสินค้าจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check duplicate code
    const existing = await db.productGroup.findUnique({
      where: { code },
    });
    let group;
    if (existing) {
      if (!existing.deletedAt) {
        return NextResponse.json(
          { error: "รหัสกลุ่มสินค้านี้มีอยู่แล้ว" },
          { status: 400 },
        );
      }

      // Update and restore the soft-deleted record
      group = await db.productGroup.update({
        where: { id: existing.id },
        data: {
          name,
          abbreviation: abbreviation || "",
          description: description || "",
          deletedAt: null,
        },
      });
    } else {
      group = await db.productGroup.create({
        data: {
          code,
          name,
          abbreviation: abbreviation || "",
          description: description || "",
        },
      });
    }
    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Error creating product group:", error);
    return NextResponse.json(
      { error: "Failed to create product group" },
      { status: 500 },
    );
  }
}
