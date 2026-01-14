import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAllAsRead } from "@/src/core/notifications";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllAsRead(session.user.id);
  return NextResponse.json({ success: true });
}
