import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  listPermissionsUseCase,
  createPermissionUseCase,
  permissionSchema,
} from "@/modules/rbac/application";

export async function GET() {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const permissions = await listPermissionsUseCase();
  return NextResponse.json(permissions);
}

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = permissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createPermissionUseCase(parsed.data as any);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json(result.permission, { status: 201 });
}
