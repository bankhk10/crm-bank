import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";

interface GuardSuccess<TSession> {
  session: TSession;
}

interface GuardFailure {
  response: NextResponse;
}

export async function guardPermission(
  required: string | string[],
): Promise<GuardSuccess<any> | GuardFailure> {
  // `auth` exported from NextAuth is a handler; call it as-is at runtime but avoid depending on its compile-time type.
  // Use `any` here to avoid tight coupling with NextAuth handler types.
  const session: any = await (auth as unknown as any)();
  const requirements = Array.isArray(required) ? required : [required];

  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const permissionKeys: string[] = session.user.permissionKeys ?? [];
  const allowed = requirements.every((key) => permissionKeys.includes(key));

  if (!allowed) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}
