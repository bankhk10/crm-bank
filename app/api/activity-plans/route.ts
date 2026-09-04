import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import { applyDataScope } from "@/lib/data-scope";
import { db } from "@/lib/db";
import { Prisma, ActivityStatus } from "@prisma/client";
import { createActivityPlanUseCase } from "@/modules/activity-plans/application";

const resourcePath = "/api/activity-plans";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RBAC permission check
  const permissions = session.user.permissionKeys ?? [];
  const roles = session.user.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session.user as any)?.role === "administrator" ||
    (session.user as any)?.role === "ADMIN";

  if (
    !isAdmin &&
    !isAuthorized(resourcePath, permissions) &&
    !permissions.includes("activity.view") &&
    !permissions.includes("activity.manage")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "10", 10)));
  const q = (url.searchParams.get("q") || "").trim();
  const statusFilter = url.searchParams.get("status");

  const where: Prisma.ActivityPlanWhereInput = { deletedAt: null };

  if (statusFilter) {
    if (["COMPLETED", "PARTIAL", "POSTPONED"].includes(statusFilter)) {
      where.result = { resultStatus: statusFilter as any };
    } else if (statusFilter === "CANCELLED") {
      where.OR = [
        { status: "CANCELLED" },
        { result: { resultStatus: "CANCELLED" } },
      ];
    } else if (Object.values(ActivityStatus).includes(statusFilter as any)) {
      where.status = statusFilter as ActivityStatus;
    }
  }

  if (q) {
    const searchFilter: Prisma.ActivityPlanWhereInput = {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { objective: { contains: q, mode: "insensitive" } },
        { employee: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
    if (where.OR) {
      where.AND = [searchFilter];
    } else {
      where.OR = searchFilter.OR;
    }
  }

  // Apply permission-based data scopes
  await applyDataScope(where, session, "activity_plan");

  const [total, activityPlans] = await Promise.all([
    db.activityPlan.count({ where }),
    db.activityPlan.findMany({
      where,
      include: {
        activityType: true,
        result: true,
        employee: {
          select: { id: true, name: true, positionTitle: true, departmentName: true },
        },
        currentApprover: {
          select: { id: true, name: true, positionTitle: true },
        },
        helpers: {
          where: { deletedAt: null },
          select: {
            status: true,
            employee: {
              select: {
                department: { select: { code: true } },
                departmentName: true,
                positionTitle: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return NextResponse.json({ activityPlans, total, page, perPage });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = session.user.permissionKeys ?? [];
  const roles = session.user.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session.user as any)?.role === "administrator" ||
    (session.user as any)?.role === "ADMIN";

  if (
    !isAdmin &&
    !permissions.includes("activity.create") &&
    !permissions.includes("activity.manage")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await createActivityPlanUseCase(session.user.id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, plan: result.plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการสร้าง Trip Plan" }, { status: 500 });
  }
}
