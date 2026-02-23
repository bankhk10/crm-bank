import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  updateDepartmentUseCase,
  deleteDepartmentUseCase,
  departmentUpdateSchema,
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
  const parsed = departmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const departmentId = params?.departmentId as string | undefined;

  if (!departmentId) {
    return NextResponse.json(
      { error: "Missing department id" },
      { status: 400 },
    );
  }

  const result = await updateDepartmentUseCase(departmentId, parsed.data);
  return NextResponse.json(result.department);
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

  const departmentId = params?.departmentId as string | undefined;

  if (!departmentId) {
    return NextResponse.json(
      { error: "Missing department id" },
      { status: 400 },
    );
  }

  await deleteDepartmentUseCase(departmentId);
  return NextResponse.json({ ok: true });
}
