import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single product group
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const group = await db.productGroup.findUnique({
      where: { id, deletedAt: null },
    });

    if (!group) {
      return NextResponse.json({ error: "ไม่พบกลุ่มสินค้า" }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error fetching product group:", error);
    return NextResponse.json(
      { error: "Failed to fetch product group" },
      { status: 500 },
    );
  }
}

// PUT - Update product group
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, abbreviation, description } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "รหัสและชื่อกลุ่มสินค้าจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check if group exists
    const existing = await db.productGroup.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบกลุ่มสินค้า" }, { status: 404 });
    }

    // Check duplicate code (excluding current)
    const duplicate = await db.productGroup.findFirst({
      where: { code, id: { not: id }, deletedAt: null },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้านี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const group = await db.productGroup.update({
      where: { id },
      data: {
        code,
        name,
        abbreviation: abbreviation || null,
        description: description || null,
      },
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error updating product group:", error);
    return NextResponse.json(
      { error: "Failed to update product group" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete product group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await db.productGroup.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบกลุ่มสินค้า" }, { status: 404 });
    }

    await db.productGroup.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product group:", error);
    return NextResponse.json(
      { error: "Failed to delete product group" },
      { status: 500 },
    );
  }
}
