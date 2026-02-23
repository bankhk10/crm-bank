import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  listRolesUseCase,
  createRoleUseCase,
  roleSchema,
} from "@/modules/rbac/application";

export async function GET() {
  // Allow users with employee.manage to read roles for employee form
  const guardResult = await guardPermission("employee.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const roles = await listRolesUseCase();
  return NextResponse.json(roles);
}

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createRoleUseCase(parsed.data);
  return NextResponse.json(result.role, { status: 201 });
}
