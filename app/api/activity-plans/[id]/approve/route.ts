import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { ActivityApprovalAction } from "@prisma/client";
import {
  activityApprovalSchema,
  approveActivityPlanUseCase,
  rejectActivityPlanUseCase,
  requestCorrectionPlanUseCase,
} from "@/modules/activity-plans/application";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = session.user.permissionKeys ?? [];
  const roles = session.user.roles ?? [];
  const isSuper =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo");

  if (
    !isSuper &&
    !permissions.includes("activity.approve") &&
    !permissions.includes("activity.manage")
  ) {
    return NextResponse.json(
      { error: "Forbidden: คุณไม่มีสิทธิ์อนุมัติแผนงาน (activity.approve)" },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = activityApprovalSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { action, comment } = parsed.data;
    const commentStr = comment || undefined;

    let result;
    if (action === ActivityApprovalAction.APPROVE) {
      result = await approveActivityPlanUseCase(id, session.user.id, commentStr);
    } else if (action === ActivityApprovalAction.REJECT) {
      result = await rejectActivityPlanUseCase(id, session.user.id, commentStr);
    } else if (action === ActivityApprovalAction.REQUEST_CORRECTION) {
      result = await requestCorrectionPlanUseCase(id, session.user.id, commentStr || "กรุณาตรวจสอบและแก้ไขรายละเอียด");
    } else {
      return NextResponse.json({ error: "การดำเนินการไม่ถูกต้อง" }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการทำรายการอนุมัติ" }, { status: 500 });
  }
}
