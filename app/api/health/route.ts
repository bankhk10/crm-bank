import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Health Check Endpoint
 * ใช้สำหรับ Docker health check และ monitoring
 */
export async function GET() {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: "unknown",
    },
  };

  try {
    // ตรวจสอบการเชื่อมต่อ Database
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.checks.database = "connected";
  } catch {
    healthCheck.checks.database = "disconnected";
    healthCheck.status = "unhealthy";

    return NextResponse.json(healthCheck, { status: 503 });
  }

  return NextResponse.json(healthCheck, { status: 200 });
}
