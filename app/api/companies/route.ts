import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/companies";

const companySchema = z.object({
  name: z.string().min(2),
  industry: z.string().optional(),
  status: z.enum(["PROSPECT", "ACTIVE", "INACTIVE"]).optional()
});

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(session.user.role, resourcePath)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companies = await db.company.findMany({
    include: {
      employees: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ companies });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(session.user.role, resourcePath)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = companySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const company = await db.company.create({
    data: {
      ...parsed.data,
      status: parsed.data.status ?? "PROSPECT"
    }
  });

  return NextResponse.json({ company }, { status: 201 });
}
