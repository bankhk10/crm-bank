import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/src/infrastructure/database";
import { isAuthorized } from "@/src/core/rbac";

const resourcePath = "/api/customers";

function formatCode(n: number) {
  return `C${String(n).padStart(5, "0")}`;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch recent codes that start with C and look for numeric suffixes
    const codes = await db.customer.findMany({
      where: { customerCode: { startsWith: "C" } },
      select: { customerCode: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    let max = 0;
    for (const c of codes) {
      const m = c.customerCode.match(/^C0*(\d+)$/);
      if (m) {
        const num = Number(m[1]);
        if (!Number.isNaN(num) && num > max) max = num;
      }
    }

    const next = max + 1;
    const nextCode = formatCode(next);

    return NextResponse.json({ nextCode });
  } catch (err) {
    console.error("[api/customers/next-code] error", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
