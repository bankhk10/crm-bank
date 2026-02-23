import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  updateRolePermissionsUseCase,
  rolePermissionsPayloadSchema,
} from "@/modules/rbac/application";

export async function PUT(request: Request, context: any) {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context.params;
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = rolePermissionsPayloadSchema.safeParse(body);
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

  const result = await updateRolePermissionsUseCase(
    roleId,
    parsed.data.permissions as any,
  );

  return NextResponse.json(result);
}
