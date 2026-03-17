import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single trade name group
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const group = await db.tradeNameGroup.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: {
          select: { id: true, code: true, description: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "ไม่พบกลุ่มชื่อการค้า" },
        { status: 404 },
      );
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error fetching trade name group:", error);
    return NextResponse.json(
      { error: "Failed to fetch trade name group" },
      { status: 500 },
    );
  }
}

// PUT - Update trade name group
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, description, categoryId } = body;

    if (!code || !description) {
      return NextResponse.json(
        { error: "รหัสและคำอธิบายจำเป็นต้องระบุ" },
        { status: 400 },
      );
    }

    // Check if group exists
    const existing = await db.tradeNameGroup.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "ไม่พบกลุ่มชื่อการค้า" },
        { status: 404 },
      );
    }

    // Check duplicate code (excluding current)
    const duplicate = await db.tradeNameGroup.findFirst({
      where: { code, id: { not: id }, deletedAt: null },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "รหัสกลุ่มชื่อการค้านี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    // Verify category exists if provided
    if (categoryId) {
      const category = await db.productCategory.findUnique({
        where: { id: categoryId, deletedAt: null },
      });
      if (!category) {
        return NextResponse.json(
          { error: "ไม่พบหมวดสินค้าที่ระบุ" },
          { status: 400 },
        );
      }
    }

    const group = await db.tradeNameGroup.update({
      where: { id },
      data: { code, description, categoryId },
      include: {
        category: {
          select: { id: true, code: true, description: true },
        },
      },
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error updating trade name group:", error);
    return NextResponse.json(
      { error: "Failed to update trade name group" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete trade name group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await db.tradeNameGroup.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "ไม่พบกลุ่มชื่อการค้า" },
        { status: 404 },
      );
    }

    await db.tradeNameGroup.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trade name group:", error);
    return NextResponse.json(
      { error: "Failed to delete trade name group" },
      { status: 500 },
    );
  }
}
