import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/src/infrastructure/database";

// GET: Get current user info including employeeId
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get employee info - try by userId first, then by email
    let employee = await prisma.employee.findFirst({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        email: true,
      },
    });

    // If not found by userId, try by email
    if (!employee && session.user.email) {
      employee = await prisma.employee.findFirst({
        where: {
          email: session.user.email,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
        },
      });
    }

    return NextResponse.json({
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      roles: session.user.roles,
      employeeId: employee?.id || null,
      employeeCode: employee?.employeeCode || null,
      employeeName: employee?.name || null,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: 500 },
    );
  }
}
