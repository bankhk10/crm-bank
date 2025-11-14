import { NextResponse } from "next/server";
import { auth } from "./auth";

interface GuardSuccess<TSession> {
  session: TSession;
}

interface GuardFailure {
  response: NextResponse;
}

export async function guardPermission(
  required: string | string[]
): Promise<GuardSuccess<Awaited<ReturnType<typeof auth>>> | GuardFailure> {
  const session = await auth();
  const requirements = Array.isArray(required) ? required : [required];

  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  const permissions = session.user.permissions ?? {};
  const allowed = requirements.every((key) => permissions[key]?.allow);

  if (!allowed) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    };
  }

  return { session };
}
