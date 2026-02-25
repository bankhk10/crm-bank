import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { getUserNotificationsUseCase } from "@/modules/notifications/application";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getUserNotificationsUseCase(session.user.id);
  return NextResponse.json({ notifications });
}

