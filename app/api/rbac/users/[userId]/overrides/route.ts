import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import {
  updateUserOverridesUseCase,
  userOverridesPayloadSchema,
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
  const parsed = userOverridesPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const userId = params?.userId as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const overrides = await updateUserOverridesUseCase(
    userId,
    parsed.data.overrides as any,
  );
  return NextResponse.json(overrides);
}
