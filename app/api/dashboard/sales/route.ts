"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { getSalesDashboardDataUseCase } from "@/modules/dashboard/application/get-sales-dashboard-data";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employeeId = session.user.employeeId;

  if (!employeeId) {
    return NextResponse.json(
      { error: "No employee profile linked" },
      { status: 403 },
    );
  }

  // Ensure the requested employeeId matches the logged-in user's employeeId
  const searchParams = request.nextUrl.searchParams;
  const requestedEmployeeId = searchParams.get("employeeId");

  if (requestedEmployeeId && requestedEmployeeId !== employeeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getSalesDashboardDataUseCase(employeeId);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
