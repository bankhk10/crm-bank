import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { canAccessRecord } from "@/lib/data-scope";
import {
  getActivityPlanAction,
  updateActivityPlanAction,
  deleteActivityPlanAction,
} from "@/modules/activity/server/planned.actions";

// Context params type in Next.js App Router
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const result = await getActivityPlanAction(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    const plan = result.plan;

    // Check permission-based data scope ownership (includes Creator, Manager/Team, and Approved Helpers)
    const hasAccess = await canAccessRecord(session, "activity_plan", {
      resourceOwnerId: plan.createdById,
      resourceEmployeeId: plan.employeeId,
      resourceDepartmentId: (plan as any).employee?.departmentId,
      resourceHelpers: (plan as any).helpers,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // A DRAFT plan is strictly private to the creator/owner until submitted
    const isOwner =
      plan.createdById === session.user.id ||
      (session.user.employeeId && plan.employeeId === session.user.employeeId);

    if (plan.status === "DRAFT" && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: แผนงานอยู่ในสถานะร่าง เฉพาะผู้จัดทำแผนเท่านั้นที่สามารถเข้าถึงได้" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการดึงรายละเอียด Trip Plan" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
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
    !permissions.includes("activity.edit") &&
    !permissions.includes("activity.manage")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await updateActivityPlanAction(id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, plan: result.plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการแก้ไข Trip Plan" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
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
    !permissions.includes("activity.delete") &&
    !permissions.includes("activity.manage")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await deleteActivityPlanAction(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการลบ Trip Plan" }, { status: 500 });
  }
}
