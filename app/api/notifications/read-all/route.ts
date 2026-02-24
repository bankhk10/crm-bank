import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAllAsReadUseCase } from "@/modules/notifications/application";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllAsReadUseCase(session.user.id);
  return NextResponse.json({ success: true });
}
