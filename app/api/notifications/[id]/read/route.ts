import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAsReadUseCase } from "@/modules/notifications/application";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await markAsReadUseCase(id);
  return NextResponse.json({ success: true });
}
