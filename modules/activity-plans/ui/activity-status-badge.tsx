import React from "react";
import { cn } from "@/lib/utils";
import type { ActivityStatus } from "../types";

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  DRAFT: {
    label: "ร่าง",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  PENDING_LINE_APPROVAL: {
    label: "รออนุมัติตามสายงาน",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
  },
  PENDING_BUDGET_APPROVAL: {
    label: "รออนุมัติงบประมาณ",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  PENDING_HELPER_APPROVAL: {
    label: "รออนุมัติคนช่วยงาน",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  APPROVED: {
    label: "อนุมัติสำเร็จ",
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  REJECTED: {
    label: "ปฏิเสธ",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  WAITING_FOR_CORRECTION: {
    label: "รอแก้ไข/ข้อมูลเพิ่ม",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "ยกเลิก",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  // Actual Result statuses
  COMPLETED: {
    label: "สำเร็จ",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  PARTIAL: {
    label: "สำเร็จบางส่วน",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  POSTPONED: {
    label: "เลื่อน",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  FAILED: {
    label: "ไม่สำเร็จ",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

export function ActivityStatusBadge({
  status,
  resultStatus,
  className,
}: {
  status?: ActivityStatus | string;
  resultStatus?: string;
  className?: string;
}) {
  const effectiveKey = (resultStatus || status) as string | undefined;
  const info = effectiveKey ? STATUS_STYLES[effectiveKey] : null;

  if (!info) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        ไม่ระบุ
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-2xs transition-colors whitespace-nowrap",
        info.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", info.dot)} />
      {info.label}
    </span>
  );
}

export interface CurrentOperatorInfo {
  roleName: string;
  roleTitleTh: string;
  displayRole: string;
  employeeName?: string | null;
  stepDescription?: string;
}

export function formatApproverRole(positionTitleOrRole?: string | null): string {
  if (!positionTitleOrRole) return "ไม่ระบุ";
  const title = positionTitleOrRole.trim();

  if (
    title.includes("ผู้จัดการฝ่ายขาย") ||
    title === "sales_director" ||
    title === "Sales Director"
  ) {
    return "Sales Director";
  }
  if (
    title.includes("ผู้จัดการแผนกการตลาด") ||
    title.includes("ฝ่ายการตลาด") ||
    title === "marketing_manager" ||
    title === "Marketing Manager"
  ) {
    return "Marketing Manager";
  }
  if (
    title.includes("ผู้จัดการแผนกบริหารงานขาย") ||
    title === "sales_admin_manager" ||
    title === "Sales Admin Manager"
  ) {
    return "Sales Admin Manager";
  }
  if (
    title.includes("ผู้จัดการภาค") ||
    title === "area_manager" ||
    title === "Area Manager"
  ) {
    return "Area Manager";
  }
  if (
    title.includes("ผู้จัดการเขต") ||
    title === "district_manager" ||
    title === "District Manager"
  ) {
    return "District Manager";
  }
  if (
    title.includes("พนักงานขาย") ||
    title === "sales_employee" ||
    title === "Sales"
  ) {
    return "Sales (พนักงานขาย)";
  }
  if (
    title.includes("พนักงานส่งเสริมการขาย") ||
    title === "sales_promotion"
  ) {
    return "Sales Promotion";
  }
  if (
    title.includes("พนักงานการตลาด") ||
    title === "employee_mk"
  ) {
    return "Marketing Staff";
  }

  return title;
}

export function resolveCurrentOperator(plan?: {
  status?: string;
  currentApproverEmployeeId?: string | null;
  currentApprover?: {
    id?: string;
    name?: string | null;
    positionTitle?: string | null;
    position?: { name?: string | null } | null;
  } | null;
  salesPromotionBudgetRequested?: any;
  marketingBudgetRequested?: any;
  salesPromotionApproved?: boolean | null;
  marketingApproved?: boolean | null;
  salesManagerApproved?: boolean | null;
  helpers?: Array<{
    status?: string;
    employee?: {
      name?: string | null;
      department?: { code?: string | null; name?: string | null } | null;
      departmentName?: string | null;
      positionTitle?: string | null;
    } | null;
  }> | null;
} | null): CurrentOperatorInfo | null {
  if (!plan || !plan.status) return null;

  // 1. Terminal / Non-pending statuses -> No current operator
  if (
    plan.status === "APPROVED" ||
    plan.status === "REJECTED" ||
    plan.status === "CANCELLED" ||
    plan.status === "DRAFT"
  ) {
    return null;
  }

  // 2. Waiting for correction -> Creator
  if (plan.status === "WAITING_FOR_CORRECTION") {
    return {
      roleName: "Creator",
      roleTitleTh: "ผู้สร้างแผนงาน",
      displayRole: "ผู้จัดทำแผน (รอแก้ไข)",
      stepDescription: "รอผู้จัดทำแผนแก้ไขและส่งใหม่",
    };
  }

  // 3. Step 2: Line Approval
  if (plan.status === "PENDING_LINE_APPROVAL") {
    const rawPos =
      plan.currentApprover?.positionTitle ||
      plan.currentApprover?.position?.name;

    const formattedRole = formatApproverRole(rawPos);
    const empName = plan.currentApprover?.name || null;

    return {
      roleName: formattedRole,
      roleTitleTh: rawPos || formattedRole,
      displayRole: formattedRole,
      employeeName: empName,
      stepDescription: "อนุมัติตามสายงาน",
    };
  }

  // 4. Step 3: Budget Approval
  if (plan.status === "PENDING_BUDGET_APPROVAL") {
    const hasSalesPromotion =
      Number(plan.salesPromotionBudgetRequested || 0) > 0;
    const hasMarketing =
      Number(plan.marketingBudgetRequested || 0) > 0;

    const spPending = hasSalesPromotion && plan.salesPromotionApproved !== true;
    const mktPending = hasMarketing && plan.marketingApproved !== true;

    const requiredSalesPromotionOk =
      !hasSalesPromotion || plan.salesPromotionApproved === true;
    const requiredMarketingOk =
      !hasMarketing || plan.marketingApproved === true;

    const directorPending =
      requiredSalesPromotionOk &&
      requiredMarketingOk &&
      plan.salesManagerApproved !== true;

    if (directorPending) {
      return {
        roleName: "Sales Director",
        roleTitleTh: "ผู้จัดการฝ่ายขาย (อนุมัติงบรวม)",
        displayRole: "Sales Director",
        stepDescription: "อนุมัติงบประมาณภาพรวมทั้งหมด",
      };
    }

    if (mktPending && !spPending) {
      return {
        roleName: "Marketing Manager",
        roleTitleTh: "ผู้จัดการแผนกการตลาด",
        displayRole: "Marketing Manager",
        stepDescription: "อนุมัติงบการตลาด",
      };
    }

    if (spPending && !mktPending) {
      return {
        roleName: "Sales Admin Manager",
        roleTitleTh: "ผู้จัดการแผนกบริหารงานขาย",
        displayRole: "Sales Admin Manager",
        stepDescription: "อนุมัติงบส่งเสริมการขาย",
      };
    }

    if (spPending && mktPending) {
      return {
        roleName: "Sales Admin & Marketing Manager",
        roleTitleTh: "ผจก.แผนกบริหารงานขาย และ ผจก.แผนกการตลาด",
        displayRole: "Sales Admin Manager, Marketing Manager",
        stepDescription: "อนุมัติงบส่งเสริมการขายและการตลาดคู่ขนาน",
      };
    }

    return {
      roleName: "Sales Director",
      roleTitleTh: "ผู้จัดการฝ่ายขาย",
      displayRole: "Sales Director",
      stepDescription: "อนุมัติงบประมาณ",
    };
  }

  // 5. Step 4: Helper Approval
  if (plan.status === "PENDING_HELPER_APPROVAL") {
    if (plan.helpers && plan.helpers.length > 0) {
      const pendingHelpers = plan.helpers.filter(
        (h) => h.status === "PENDING",
      );

      let hasSales = false;
      let hasMkt = false;

      for (const h of pendingHelpers) {
        const deptCode = h.employee?.department?.code || "";
        const pos = h.employee?.positionTitle || "";
        if (
          deptCode === "SA" ||
          deptCode === "SS" ||
          pos.includes("เซลส์") ||
          pos.includes("ส่งเสริม")
        ) {
          hasSales = true;
        } else if (deptCode === "MKT" || pos.includes("การตลาด")) {
          hasMkt = true;
        }
      }

      if (hasSales && !hasMkt) {
        return {
          roleName: "Sales Admin Manager",
          roleTitleTh: "ผู้จัดการแผนกบริหารงานขาย",
          displayRole: "Sales Admin Manager",
          stepDescription: "อนุมัติพนักงานช่วยงานฝ่ายขาย",
        };
      }
      if (hasMkt && !hasSales) {
        return {
          roleName: "Marketing Manager",
          roleTitleTh: "ผู้จัดการแผนกการตลาด",
          displayRole: "Marketing Manager",
          stepDescription: "อนุมัติพนักงานช่วยงานฝ่ายการตลาด",
        };
      }
      if (hasSales && hasMkt) {
        return {
          roleName: "Sales Admin & Marketing Manager",
          roleTitleTh: "ผจก.แผนกบริหารงานขาย และ ผจก.แผนกการตลาด",
          displayRole: "Sales Admin Manager, Marketing Manager",
          stepDescription: "อนุมัติพนักงานช่วยงานทั้งฝ่ายขายและการตลาด",
        };
      }
    }

    return {
      roleName: "Department Manager",
      roleTitleTh: "ผู้จัดการต้นสังกัดของผู้ช่วยงาน",
      displayRole: "ผู้จัดการต้นสังกัดของผู้ช่วย",
      stepDescription: "อนุมัติพนักงานช่วยงาน",
    };
  }

  return null;
}

export function ActivityStatusWithOperator({
  plan,
  resultStatus,
  className,
  badgeClassName,
}: {
  plan?: any;
  resultStatus?: string;
  className?: string;
  badgeClassName?: string;
}) {
  if (!plan) return null;
  const operator = resolveCurrentOperator(plan);

  return (
    <div className={cn("flex flex-col items-start gap-0.5 py-0.5 min-w-[120px]", className)}>
      <ActivityStatusBadge
        status={plan.status}
        resultStatus={resultStatus}
        className={badgeClassName}
      />
      {operator && (
        <div className="text-[11px] text-slate-500 leading-tight flex flex-wrap items-center gap-1 font-normal mt-0.5">
          <span>ผู้ดำเนินการ:</span>
          <span className="font-semibold text-slate-700">
            {operator.displayRole}
          </span>
        </div>
      )}
    </div>
  );
}


