import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/src/infrastructure/database";

type RouteContext = { params: Promise<{ id: string }> };

// GET - Get single product chain
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const chain = await db.productChain.findFirst({
      where: { id, deletedAt: null },
    });

    if (!chain) {
      return NextResponse.json({ error: "ไม่พบกรุ๊ปสินค้า" }, { status: 404 });
    }

    return NextResponse.json({ chain });
  } catch (error) {
    console.error("Error fetching product chain:", error);
    return NextResponse.json(
      { error: "Failed to fetch product chain" },
      { status: 500 },
    );
  }
}

// PUT - Update product chain
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อกรุ๊ปสินค้า" },
        { status: 400 },
      );
    }

    // Check if exists
    const existing = await db.productChain.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบกรุ๊ปสินค้า" }, { status: 404 });
    }

    // Check duplicate name (excluding current)
    const duplicate = await db.productChain.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        id: { not: id },
        deletedAt: null,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "ชื่อกรุ๊ปสินค้านี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const chain = await db.productChain.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ chain });
  } catch (error) {
    console.error("Error updating product chain:", error);
    return NextResponse.json(
      { error: "Failed to update product chain" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete product chain
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await db.productChain.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบกรุ๊ปสินค้า" }, { status: 404 });
    }

    await db.productChain.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product chain:", error);
    return NextResponse.json(
      { error: "Failed to delete product chain" },
      { status: 500 },
    );
  }
}
