import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  updateRoleUseCase,
  deleteRoleUseCase,
  roleUpdateSchema,
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
  const parsed = roleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const roleId = params?.roleId as string | undefined;

  if (!roleId) {
    return NextResponse.json({ error: "Missing role id" }, { status: 400 });
  }

  const result = await updateRoleUseCase(roleId, parsed.data);
  return NextResponse.json(result.role);
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

  const roleId = params?.roleId as string | undefined;

  if (!roleId) {
    return NextResponse.json({ error: "Missing role id" }, { status: 400 });
  }

  const result = await deleteRoleUseCase(roleId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
