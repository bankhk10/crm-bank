import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

// GET - Get single product ABC type
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const abcType = await db.productABCTypes.findFirst({
      where: { id, deletedAt: null },
    });

    if (!abcType) {
      return NextResponse.json({ error: "ไม่พบประเภทสินค้า" }, { status: 404 });
    }

    return NextResponse.json({ abcType });
  } catch (error) {
    console.error("Error fetching product ABC type:", error);
    return NextResponse.json(
      { error: "Failed to fetch product ABC type" },
      { status: 500 },
    );
  }
}

// PUT - Update product ABC type
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Check if exists
    const existing = await db.productABCTypes.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบประเภทสินค้า" }, { status: 404 });
    }

    // Check duplicate code or name (excluding current)
    const duplicate = await db.productABCTypes.findFirst({
      where: {
        OR: [
          { code: { equals: code, mode: "insensitive" } },
          { name: { equals: name, mode: "insensitive" } },
        ],
        id: { not: id },
        deletedAt: null,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "รหัสหรือชื่อประเภทสินค้านี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const abcType = await db.productABCTypes.update({
      where: { id },
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ abcType });
  } catch (error) {
    console.error("Error updating product ABC type:", error);
    return NextResponse.json(
      { error: "Failed to update product ABC type" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete product ABC type
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await db.productABCTypes.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบประเภทสินค้า" }, { status: 404 });
    }

    await db.productABCTypes.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product ABC type:", error);
    return NextResponse.json(
      { error: "Failed to delete product ABC type" },
      { status: 500 },
    );
  }
}
