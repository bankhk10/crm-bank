import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAsRead } from "@/src/core/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await markAsRead(id);
  return NextResponse.json({ success: true });
}
