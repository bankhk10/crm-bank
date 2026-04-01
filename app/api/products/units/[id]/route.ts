import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single unit
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const unit = await db.unit.findUnique({
      where: { id, deletedAt: null },
    });

    if (!unit) {
      return NextResponse.json({ error: "ไม่พบหน่วยนับ" }, { status: 404 });
    }

    return NextResponse.json({ unit });
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit" },
      { status: 500 },
    );
  }
}

// PUT - Update unit
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, description: bodyDescription, name } = body;
    const description = bodyDescription || name;

    if (!code || !description) {
      return NextResponse.json(
        { error: "รหัสและคำอธิบายจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check if unit exists
    const existing = await db.unit.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบหน่วยนับ" }, { status: 404 });
    }

    // Check duplicate code (excluding current)
    const duplicate = await db.unit.findFirst({
      where: { code, id: { not: id }, deletedAt: null },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "รหัสหน่วยนับนี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const unit = await db.unit.update({
      where: { id },
      data: { code, description },
    });

    return NextResponse.json({ unit });
  } catch (error) {
    console.error("Error updating unit:", error);
    return NextResponse.json(
      { error: "Failed to update unit" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete unit
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await db.unit.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบหน่วยนับ" }, { status: 404 });
    }

    await db.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json(
      { error: "Failed to delete unit" },
      { status: 500 },
    );
  }
}
