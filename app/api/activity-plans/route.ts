import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import { applyDataScope } from "@/lib/data-scope";
import { db } from "@/lib/db";
import { Prisma, ActivityStatus } from "@prisma/client";
import { createActivityPlanAction } from "@/modules/activity/server/planned.actions";
import { getWorkTypeCode } from "@/modules/activity/constants";
import { getSubordinateEmployeeIds } from "@/modules/activity/application/approval-queue";
import {
  isUserAdmin,
  isUserSalesDirector,
  isUserSalesAdminManager,
  isUserMarketingManager,
  type ApproverUserContext,
} from "@/modules/activity/domain/approval";

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
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "20", 10)));
  const q = (url.searchParams.get("q") || "").trim();
  const viewScope = (url.searchParams.get("viewScope") || "ALL").toUpperCase();

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
      workTypeOrConditions.push({ type12Targets: { some: {} } });
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

  const currentUserId = session.user.id;
  const currentEmployeeId = session.user.employeeId;

  // Resolve user department & position for fine-grained approver evaluation
  let userDeptCode = "";
  let userPosTitle = "";
  if (currentEmployeeId) {
    const emp = await db.employee.findUnique({
      where: { id: currentEmployeeId },
      include: { department: true, position: true },
    });
    userDeptCode = (emp?.department?.code || "").toUpperCase();
    userPosTitle = (emp?.position?.name || emp?.positionTitle || "").toLowerCase();
  }

  const approverContext: ApproverUserContext = {
    id: currentUserId,
    name: session.user.name,
    email: session.user.email,
    employeeId: currentEmployeeId,
    roles,
    role: (session.user as any)?.role,
    permissions,
    departmentCode: userDeptCode,
    positionTitle: userPosTitle,
  };

  const isGlobalApprover =
    isAdmin ||
    permissions.includes("activity.manage") ||
    permissions.includes("activity.view_all") ||
    isUserAdmin(approverContext) ||
    isUserSalesDirector(approverContext) ||
    isUserSalesAdminManager(approverContext) ||
    isUserMarketingManager(approverContext);

  const subordinateEmployeeIds =
    !isGlobalApprover && currentEmployeeId
      ? await getSubordinateEmployeeIds(currentEmployeeId)
      : [];

  const ownCondition: Prisma.ActivityPlanWhereInput = currentEmployeeId
    ? {
        OR: [
          { employeeId: currentEmployeeId },
          ...(currentUserId ? [{ createdById: currentUserId }] : []),
        ],
      }
    : currentUserId
      ? { createdById: currentUserId }
      : { id: "__NONE__" };

  const helperCondition: Prisma.ActivityPlanWhereInput = currentEmployeeId
    ? {
        NOT: ownCondition,
        helpers: {
          some: {
            employeeId: currentEmployeeId,
            deletedAt: null,
          },
        },
      }
    : { id: "__NONE__" };

  // Team Scope: Aligns with Approval Queue logic
  // - Global approvers: all plans except own and helper
  // - Line managers / Supervisors: direct and indirect subordinates, current approver, or acted in approval logs
  // - Staff without subordinates: empty
  let teamCondition: Prisma.ActivityPlanWhereInput;
  if (isGlobalApprover) {
    teamCondition = {
      NOT: {
        OR: [
          ownCondition,
          ...(currentEmployeeId
            ? [
                {
                  helpers: {
                    some: {
                      employeeId: currentEmployeeId,
                      deletedAt: null,
                    },
                  },
                },
              ]
            : []),
        ],
      },
    };
  } else {
    const teamConditions: Prisma.ActivityPlanWhereInput[] = [];

    if (subordinateEmployeeIds.length > 0) {
      teamConditions.push({ employeeId: { in: subordinateEmployeeIds } });
    }
    if (currentEmployeeId) {
      teamConditions.push({ currentApproverEmployeeId: currentEmployeeId });
    }
    if (currentUserId) {
      teamConditions.push({ approvalLogs: { some: { userId: currentUserId } } });
    }

    if (teamConditions.length > 0) {
      teamCondition = {
        AND: [
          { OR: teamConditions },
          { NOT: ownCondition },
          ...(currentEmployeeId
            ? [
                {
                  NOT: {
                    helpers: {
                      some: {
                        employeeId: currentEmployeeId,
                        deletedAt: null,
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      };
    } else {
      teamCondition = { id: "__NONE__" };
    }
  }

  // Hide other people's DRAFT plans:
  // A plan in DRAFT status must ONLY be visible to its creator/owner.
  // Supervisors, managers, and team members will only see it after it has been submitted (status != DRAFT).
  const draftVisibilityCondition: Prisma.ActivityPlanWhereInput = {
    OR: [{ status: { not: ActivityStatus.DRAFT } }, ownCondition],
  };

  const filterWhere: Prisma.ActivityPlanWhereInput = {
    deletedAt: null,
    ...(andConditions.length > 0 ? { AND: andConditions } : {}),
  };

  // 1. OWN scope
  const ownWhere: Prisma.ActivityPlanWhereInput = {
    AND: [filterWhere, ownCondition],
  };

  // 2. HELPER scope
  const helperWhere: Prisma.ActivityPlanWhereInput = {
    AND: [filterWhere, helperCondition, draftVisibilityCondition],
  };

  // 3. TEAM scope (Subordinates & Approval scope, all statuses except DRAFT)
  const teamWhere: Prisma.ActivityPlanWhereInput = {
    AND: [filterWhere, teamCondition, draftVisibilityCondition],
  };

  // 4. ALL scope (Permission-based data scope)
  const allWhere: Prisma.ActivityPlanWhereInput = {
    deletedAt: null,
    ...(andConditions.length > 0 ? { AND: andConditions } : {}),
  };
  await applyDataScope(allWhere, session, "activity_plan");
  if (Array.isArray(allWhere.AND)) {
    allWhere.AND.push(draftVisibilityCondition);
  } else if (allWhere.AND) {
    allWhere.AND = [allWhere.AND, draftVisibilityCondition];
  } else {
    allWhere.AND = [draftVisibilityCondition];
  }

  let scopedWhere = allWhere;
  if (viewScope === "OWN") {
    scopedWhere = ownWhere;
  } else if (viewScope === "TEAM") {
    scopedWhere = teamWhere;
  } else if (viewScope === "HELPER") {
    scopedWhere = helperWhere;
  }

  const [
    total,
    activityPlans,
    ownCount,
    teamCount,
    helperCount,
    allCount,
  ] = await Promise.all([
    db.activityPlan.count({ where: scopedWhere }),
    db.activityPlan.findMany({
      where: scopedWhere,
      include: {
        activityType: true,
        workTypes: {
          include: {
            activityType: true,
          },
        },
        type12Targets: true,
        result: true,
        employee: {
          select: {
            id: true,
            name: true,
            managerId: true,
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
            approvedById: true,
            respondedAt: true,
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
    db.activityPlan.count({ where: ownWhere }),
    db.activityPlan.count({ where: teamWhere }),
    db.activityPlan.count({ where: helperWhere }),
    db.activityPlan.count({ where: allWhere }),
  ]);

  return NextResponse.json({
    activityPlans,
    total,
    page,
    perPage,
    counts: {
      own: ownCount,
      team: teamCount,
      helper: helperCount,
      all: allCount,
    },
  });
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
    const result = await createActivityPlanAction(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, plan: result.plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการสร้าง Trip Plan" }, { status: 500 });
  }
}
