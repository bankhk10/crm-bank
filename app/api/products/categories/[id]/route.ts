import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single product category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const category = await db.productCategory.findUnique({
      where: { id, deletedAt: null },
      include: {
        productGroups: {
          where: { deletedAt: null },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "ไม่พบหมวดสินค้า" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 },
    );
  }
}

// PUT - Update product category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, description } = body;

    if (!code || !description) {
      return NextResponse.json(
        { error: "รหัสและคำอธิบายจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check if category exists
    const existing = await db.productCategory.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบหมวดสินค้า" }, { status: 404 });
    }

    // Check duplicate code (excluding current)
    const duplicate = await db.productCategory.findFirst({
      where: { code, id: { not: id }, deletedAt: null },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "รหัสหมวดสินค้านี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const category = await db.productCategory.update({
      where: { id },
      data: { code, description },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete product category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await db.productCategory.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบหมวดสินค้า" }, { status: 404 });
    }

    await db.productCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
