import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  listDepartmentsUseCase,
  createDepartmentUseCase,
  departmentSchema,
} from "@/modules/rbac/application";

export async function GET() {
  // Allow users with employee.manage to read departments for employee form
  const guardResult = await guardPermission("employee.view");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const departments = await listDepartmentsUseCase();
  return NextResponse.json(departments);
}

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = departmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createDepartmentUseCase(parsed.data);
  return NextResponse.json(result.department, { status: 201 });
}
