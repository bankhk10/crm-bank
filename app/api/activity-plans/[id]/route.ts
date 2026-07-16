import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { canAccessRecord } from "@/lib/data-scope";
import {
  getActivityPlanDetailUseCase,
  updateActivityPlanUseCase,
  deleteActivityPlanUseCase,
} from "@/modules/activity-plans/application";

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
    const result = await getActivityPlanDetailUseCase(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    const plan = result.plan;
    
    // Check permission-based data scope ownership
    const hasAccess = await canAccessRecord(session, "activity_plan", {
      resourceOwnerId: plan.createdById,
      resourceEmployeeId: plan.employeeId,
      resourceDepartmentId: plan.employee.departmentId,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการดึงรายละเอียดกิจกรรม" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const permissions = session.user.permissionKeys ?? [];
  if (!permissions.includes("activity.edit") && !permissions.includes("activity.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await updateActivityPlanUseCase(id, session.user.id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, plan: result.plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการแก้ไขแผนกิจกรรม" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const permissions = session.user.permissionKeys ?? [];
  if (!permissions.includes("activity.delete") && !permissions.includes("activity.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await deleteActivityPlanUseCase(id, session.user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการลบแผนกิจกรรม" }, { status: 500 });
  }
}
