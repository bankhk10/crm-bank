import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/src/infrastructure/database";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single plant
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const plant = await db.plant.findUnique({
      where: { id, deletedAt: null },
    });

    if (!plant) {
      return NextResponse.json({ error: "ไม่พบข้อมูลพืช" }, { status: 404 });
    }

    return NextResponse.json({ plant });
  } catch (error) {
    console.error("Error fetching plant:", error);
    return NextResponse.json(
      { error: "Failed to fetch plant" },
      { status: 500 },
    );
  }
}

// PUT - Update plant
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(session.user.permissionKeys ?? []).includes("product.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
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

    // Check if plant exists
    const existing = await db.plant.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบข้อมูลพืช" }, { status: 404 });
    }

    // Check duplicate code (excluding current)
    const duplicate = await db.plant.findFirst({
      where: { code, id: { not: id }, deletedAt: null },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "รหัสพืชนี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const plant = await db.plant.update({
      where: { id },
      data: {
        code,
        name,
        abbreviation,
        group,
        recommendedMedicines,
        description,
      },
    });

    return NextResponse.json({ plant });
  } catch (error) {
    console.error("Error updating plant:", error);
    return NextResponse.json(
      { error: "Failed to update plant" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete plant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(session.user.permissionKeys ?? []).includes("product.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const existing = await db.plant.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบข้อมูลพืช" }, { status: 404 });
    }

    await db.plant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plant:", error);
    return NextResponse.json(
      { error: "Failed to delete plant" },
      { status: 500 },
    );
  }
}
