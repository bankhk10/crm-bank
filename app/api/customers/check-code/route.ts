import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/infrastructure/database";

/**
 * GET /api/customers/check-code?code=C00001&excludeId=xxx
 * Check if a customer code already exists
 * Returns { exists: boolean, customer?: { id, name } }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const excludeId = searchParams.get("excludeId"); // Exclude current customer when editing

    if (!code) {
      return NextResponse.json(
        { error: "กรุณาระบุรหัสลูกค้า" },
        { status: 400 }
      );
    }

    const existingCustomer = await db.customer.findFirst({
      where: {
        customerCode: code,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (existingCustomer) {
      return NextResponse.json({
        exists: true,
        customer: existingCustomer,
        message: `รหัสลูกค้า "${code}" ถูกใช้แล้วโดย "${existingCustomer.name}"`,
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (error) {
    console.error("Error checking customer code:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสลูกค้า" },
      { status: 500 }
    );
  }
}
