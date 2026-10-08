import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import { applyDataScope } from "@/lib/data-scope";
import { db } from "@/lib/db";
import { Prisma, ActivityStatus } from "@prisma/client";
import { createActivityPlanUseCase } from "@/modules/activity-plans/application";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";

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

  // Multi-value filters: support both comma-separated and multiple query params
  const statusFilters = (
    url.searchParams.getAll("status").concat(url.searchParams.getAll("statuses"))
  )
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean);

  const workTypeFilters = (
    url.searchParams.getAll("workTypes").concat(url.searchParams.getAll("workType"))
  )
    .flatMap((w) => w.split(","))
    .map((w) => w.trim())
    .filter(Boolean);

  const employeeFilters = (
    url.searchParams.getAll("employeeIds")
      .concat(url.searchParams.getAll("employeeId"))
      .concat(url.searchParams.getAll("persons"))
      .concat(url.searchParams.getAll("person"))
  )
    .flatMap((p) => p.split(","))
    .map((p) => p.trim())
    .filter(Boolean);

  const andConditions: Prisma.ActivityPlanWhereInput[] = [];

  // 1. Status Filter (Multi-select OR within, AND between)
  if (statusFilters.length > 0) {
    const statusOrConditions: Prisma.ActivityPlanWhereInput[] = [];
    for (const sf of statusFilters) {
      if (["COMPLETED", "PARTIAL", "POSTPONED", "FAILED"].includes(sf)) {
        statusOrConditions.push({ result: { resultStatus: sf as any } });
      } else if (sf === "CANCELLED") {
        statusOrConditions.push({ status: "CANCELLED" });
        statusOrConditions.push({ result: { resultStatus: "CANCELLED" } });
      } else if (Object.values(ActivityStatus).includes(sf as any)) {
        statusOrConditions.push({ status: sf as ActivityStatus });
      }
    }
    if (statusOrConditions.length > 0) {
      andConditions.push({ OR: statusOrConditions });
    }
  }

  // 2. Work Types Filter (Multi-select OR within, AND between)
  if (workTypeFilters.length > 0) {
    const normalizedCodes = Array.from(
      new Set(
        workTypeFilters.map((wt) => getWorkTypeCode(wt) || wt.toUpperCase()),
      ),
    );

    const matchedActivityTypes = await db.activityType.findMany({
      where: {
        OR: [
          { code: { in: normalizedCodes } },
          { id: { in: workTypeFilters } },
          { name: { in: workTypeFilters } },
        ],
      },
      select: { id: true, code: true },
    });

    const matchedIds = Array.from(
      new Set(matchedActivityTypes.map((t) => t.id).concat(workTypeFilters)),
    );
    const matchedCodes = Array.from(
      new Set(matchedActivityTypes.map((t) => t.code).concat(normalizedCodes)),
    );

    const workTypeOrConditions: Prisma.ActivityPlanWhereInput[] = [
      {
        workTypes: {
          some: {
            OR: [
              { activityTypeId: { in: matchedIds } },
              { activityType: { code: { in: matchedCodes } } },
            ],
          },
        },
      },
      { activityTypeId: { in: matchedIds } },
      { activityType: { code: { in: matchedCodes } } },
    ];

    if (matchedCodes.includes("TYPE_12") || workTypeFilters.includes("ทัวร์")) {
      workTypeOrConditions.push({ tour: { isNot: null } });
    }

    andConditions.push({ OR: workTypeOrConditions });
  }

  // 3. Person / Employee Filter (Multi-select OR within, AND between)
  if (employeeFilters.length > 0) {
    andConditions.push({
      OR: [
        { employeeId: { in: employeeFilters } },
        {
          helpers: {
            some: {
              employeeId: { in: employeeFilters },
              deletedAt: null,
            },
          },
        },
      ],
    });
  }

  // 4. Keyword Search Filter
  if (q) {
    andConditions.push({
      OR: [
        { code: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { objective: { contains: q, mode: "insensitive" } },
        { employee: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.ActivityPlanWhereInput = {
    deletedAt: null,
    ...(andConditions.length > 0 ? { AND: andConditions } : {}),
  };

  // Apply permission-based data scopes
  await applyDataScope(where, session, "activity_plan");

  const [total, activityPlans] = await Promise.all([
    db.activityPlan.count({ where }),
    db.activityPlan.findMany({
      where,
      include: {
        activityType: true,
        workTypes: {
          include: {
            activityType: true,
          },
        },
        tour: true,
        result: true,
        employee: {
          select: {
            id: true,
            name: true,
            positionTitle: true,
            departmentName: true,
            position: { select: { id: true, name: true } },
          },
        },
        currentApprover: {
          select: {
            id: true,
            name: true,
            positionTitle: true,
            position: { select: { id: true, name: true } },
          },
        },
        helpers: {
          where: { deletedAt: null },
          select: {
            status: true,
            employee: {
              select: {
                id: true,
                name: true,
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
