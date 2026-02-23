import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  updatePositionUseCase,
  deletePositionUseCase,
  positionUpdateSchema,
} from "@/modules/rbac/application";

export async function PATCH(request: Request, context: any) {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context.params;
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = positionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const positionId = params?.positionId as string | undefined;

  if (!positionId) {
    return NextResponse.json({ error: "Missing position id" }, { status: 400 });
  }

  const result = await updatePositionUseCase(positionId, parsed.data as any);
  return NextResponse.json(result.position);
}

export async function DELETE(_: Request, context: any) {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context.params;
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const positionId = params?.positionId as string | undefined;

  if (!positionId) {
    return NextResponse.json({ error: "Missing position id" }, { status: 400 });
  }

  await deletePositionUseCase(positionId);
  return NextResponse.json({ ok: true });
}
