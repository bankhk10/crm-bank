import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/temporary-credit-limits";

export async function GET(request: Request, context: any) {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const temporaryCreditLimit = await db.temporaryCreditLimit.findFirst({
    where: { id: params.temporaryCreditLimitId, deletedAt: null },
    include: {
      customer: true,
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!temporaryCreditLimit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ temporaryCreditLimit });
}

