import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserNotifications } from "@/src/core/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getUserNotifications(session.user.id);
  return NextResponse.json({ notifications });
}
