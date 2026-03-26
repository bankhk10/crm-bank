import { NextResponse, type NextRequest } from "next/server";
import { db, Prisma } from "@/lib/db";

// GET - List all units
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "20");
    const q = searchParams.get("q") || "";

    const where: Prisma.UnitWhereInput = {
      deletedAt: null,
      ...(q && {
        OR: [
          { code: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [units, total] = await Promise.all([
      db.unit.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      db.unit.count({ where }),
    ]);

    return NextResponse.json({ units, total });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 },
    );
  }
}

// POST - Create new unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name } = body;
    const description = name;

    if (!code || !description) {
      return NextResponse.json(
        { error: "รหัสและชื่อหน่วยนับจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check duplicate code
    const existing = await db.unit.findUnique({
      where: { code },
    });

    let unit;
    if (existing) {
      if (!existing.deletedAt) {
        return NextResponse.json(
          { error: "รหัสหน่วยนับนี้มีอยู่แล้ว" },
          { status: 400 },
        );
      }

      // Update and restore the soft-deleted record
      unit = await db.unit.update({
        where: { id: existing.id },
        data: {
          code,
          description,
          deletedAt: null, // restore
        },
      });
    } else {
      // Create new
      unit = await db.unit.create({
        data: { code, description },
      });
    }

    return NextResponse.json({ unit }, { status: 201 });
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 },
    );
  }
}
