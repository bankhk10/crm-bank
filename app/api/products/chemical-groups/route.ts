import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/src/infrastructure/database";

// GET - List all chemical groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "20");
    const q = searchParams.get("q") || "";

    const where: Prisma.ChemicalGroupWhereInput = {
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
      db.chemicalGroup.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { code: "asc" },
      }),
      db.chemicalGroup.count({ where }),
    ]);

    return NextResponse.json({ groups, total });
  } catch (error) {
    console.error("Error fetching chemical groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch chemical groups" },
      { status: 500 },
    );
  }
}

// POST - Create new chemical group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, abbreviation, description } = body;

    // description and abbreviation are optional based on schema update, but name is now required (with default "" handled in schema, but we should enforce it here)
    if (!code || !name) {
      return NextResponse.json(
        { error: "รหัสและชื่อกลุ่มสารจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check duplicate code
    const existing = await db.chemicalGroup.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสารนี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const group = await db.chemicalGroup.create({
      data: {
        code,
        name,
        abbreviation: abbreviation || null,
        description: description || null,
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Error creating chemical group:", error);
    return NextResponse.json(
      { error: "Failed to create chemical group" },
      { status: 500 },
    );
  }
}
