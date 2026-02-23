import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  listPositionsUseCase,
  createPositionUseCase,
  positionSchema,
} from "@/modules/rbac/application";

export async function GET() {
  // Allow users with employee.manage to read positions for employee form
  const guardResult = await guardPermission("employee.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const positions = await listPositionsUseCase();
  return NextResponse.json(positions);
}

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = positionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createPositionUseCase(parsed.data as any);
  return NextResponse.json(result.position, { status: 201 });
}
