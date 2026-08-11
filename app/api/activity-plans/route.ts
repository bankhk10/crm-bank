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
  if (!isAuthorized(resourcePath, permissions) && !permissions.includes("activity.view") && !permissions.includes("activity.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "10", 10)));
  const q = (url.searchParams.get("q") || "").trim();
  const statusFilter = url.searchParams.get("status");

  const where: Prisma.ActivityPlanWhereInput = { deletedAt: null };

  if (statusFilter && Object.values(ActivityStatus).includes(statusFilter as any)) {
    where.status = statusFilter as ActivityStatus;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { objective: { contains: q, mode: "insensitive" } },
      { employee: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  // Apply permission-based data scopes
  await applyDataScope(where, session, "activity_plan");

  const [total, activityPlans] = await Promise.all([
    db.activityPlan.count({ where }),
    db.activityPlan.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, positionTitle: true, departmentName: true },
        },
        currentApprover: {
          select: { id: true, name: true, positionTitle: true },
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
  if (!permissions.includes("activity.create") && !permissions.includes("activity.manage")) {
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
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการสร้างแผนกิจกรรม" }, { status: 500 });
  }
}
