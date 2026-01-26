"use server";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/app/actions/dashboard";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin =
    session.user.roles?.includes("administrator") ||
    session.user.roles?.includes("admin");

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getDashboardData();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
