import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/src/infrastructure/database";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single brand
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const brand = await db.brand.findUnique({
      where: { id, deletedAt: null },
    });

    if (!brand) {
      return NextResponse.json({ error: "ไม่พบแบรนด์" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand" },
      { status: 500 },
    );
  }
}

// PUT - Update brand
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.permissions?.["product.update"]?.allow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

    // Check if brand exists
    const existing = await db.brand.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบแบรนด์" }, { status: 404 });
    }

    // Check duplicate code (excluding current)
    const duplicate = await db.brand.findFirst({
      where: { code, id: { not: id }, deletedAt: null },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "รหัสแบรนด์นี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const brand = await db.brand.update({
      where: { id },
      data: { code, description },
    });

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete brand
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.permissions?.["product.delete"]?.allow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const existing = await db.brand.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบแบรนด์" }, { status: 404 });
    }

    await db.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 },
    );
  }
}
