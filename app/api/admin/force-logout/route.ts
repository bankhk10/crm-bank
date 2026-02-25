/**
 * API Route for Force Logout
 * สำหรับบังคับให้ผู้ใช้ทั้งหมด logout จากภายนอก
 */

import { NextRequest, NextResponse } from "next/server";
import { invalidateAllSessions } from "@/modules/auth/application/force-logout.service";
import { auth } from "@/modules/auth/infrastructure/next-auth";
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ authorization (ถ้าต้องการ)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ในที่นี้สามารถเพิ่มการตรวจสอบ token หรือ API key ได้
    // const token = authHeader.substring(7);
    // if (!isValidAdminToken(token)) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    await invalidateAllSessions();

    return NextResponse.json({
      success: true,
      message:
        "All sessions have been invalidated. Users will need to login again.",
    });
  } catch (error) {
    console.error("Error in force logout API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Force logout API. Use POST to invalidate all sessions.",
    usage: "POST /api/admin/force-logout",
  });
}
