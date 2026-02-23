import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  updatePermissionUseCase,
  deletePermissionUseCase,
  permissionUpdateSchema,
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
  const parsed = permissionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const permissionId = params?.permissionId as string | undefined;

  if (!permissionId) {
    return NextResponse.json(
      { error: "Missing permission id" },
      { status: 400 },
    );
  }

  const result = await updatePermissionUseCase(
    permissionId,
    parsed.data as any,
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json(result.permission);
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

  const permissionId = params?.permissionId as string | undefined;

  if (!permissionId) {
    return NextResponse.json(
      { error: "Missing permission id" },
      { status: 400 },
    );
  }

  await deletePermissionUseCase(permissionId);
  return NextResponse.json({ ok: true });
}
