"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ActivityStatus } from "../types";
import { getApproverDirectoryAction } from "../server/actions";

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

/**
 * Clean up test or internal role annotations from Employee.name
 * e.g., "สมคิด บริหารงานขาย (ผจก.แผนก SA)" -> "สมคิด บริหารงานขาย"
 * e.g., "วรัญญา การตลาด" -> "วรัญญา การตลาด"
 */
export function formatEmployeeName(name?: string | null): string {
  if (!name) return "";
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export interface ApproverDirectory {
  salesAdminEmployees: string[];
  marketingEmployees: string[];
  salesDirectorEmployees: string[];
}

export interface CurrentOperatorInfo {
  roleName: string;
  roleTitleTh: string;
  displayRole: string;
  operatorName?: string | null;
  employeeName?: string | null;
  stepDescription?: string;
}

let cachedDirectory: ApproverDirectory | null = null;
let directoryPromise: Promise<ApproverDirectory> | null = null;

export function useApproverDirectory(): ApproverDirectory | null {
  const [directory, setDirectory] = useState<ApproverDirectory | null>(cachedDirectory);

  useEffect(() => {
    if (cachedDirectory) return;

    if (!directoryPromise) {
      directoryPromise = getApproverDirectoryAction()
        .then((res) => {
          cachedDirectory = res;
          return res;
        })
        .catch((err) => {
          console.error("Failed to load approver directory:", err);
          return {
            salesAdminEmployees: [],
            marketingEmployees: [],
            salesDirectorEmployees: [],
          };
        });
    }

    let isMounted = true;
    directoryPromise.then((data) => {
      if (isMounted) setDirectory(data);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return directory;
}

export function formatApproverRole(positionTitleOrRole?: string | null): string {
  if (!positionTitleOrRole) return "ไม่ระบุ";
  const title = positionTitleOrRole.trim();

  if (
    title.includes("ผู้จัดการฝ่ายขาย") ||
    title.includes("ผจก.ฝ่ายขาย") ||
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

export function resolveCurrentOperator(
  plan?: {
    status?: string;
    currentOperatorName?: string | null;
    currentApproverEmployeeId?: string | null;
    currentApprover?: {
      id?: string;
      name?: string | null;
      positionTitle?: string | null;
      position?: { name?: string | null } | null;
    } | null;
    employee?: {
      name?: string | null;
    } | null;
    createdBy?: {
      name?: string | null;
    } | null;
    salesPromotionBudgetRequested?: any;
    marketingBudgetRequested?: any;
    salesPromotionApproved?: boolean | null;
    marketingApproved?: boolean | null;
    salesManagerApproved?: boolean | null;
    helpers?: Array<{
      status?: string;
      respondedAt?: Date | string | null;
      employee?: {
        name?: string | null;
        department?: { code?: string | null; name?: string | null } | null;
        departmentName?: string | null;
        positionTitle?: string | null;
      } | null;
    }> | null;
  } | null,
  approverDirectory?: ApproverDirectory | null,
): CurrentOperatorInfo | null {
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

  // Precomputed operator name on plan takes highest priority if passed
  const precomputedOperatorName = (plan as any).currentOperatorName || null;

  // 2. Waiting for correction -> Creator
  if (plan.status === "WAITING_FOR_CORRECTION") {
    const creatorName = formatEmployeeName(
      (plan as any).employee?.name || (plan as any).createdBy?.name
    );
    return {
      roleName: "Creator",
      roleTitleTh: "ผู้สร้างแผนงาน",
      displayRole: "ผู้จัดทำแผน (รอแก้ไข)",
      operatorName: precomputedOperatorName || creatorName || "ผู้สร้างแผนงาน",
      employeeName: creatorName || null,
      stepDescription: "รอผู้จัดทำแผนแก้ไขและส่งใหม่",
    };
  }

  // 3. Step 2: Line Approval
  if (plan.status === "PENDING_LINE_APPROVAL") {
    const rawPos =
      plan.currentApprover?.positionTitle ||
      plan.currentApprover?.position?.name;

    const formattedRole = formatApproverRole(rawPos);
    const empRawName = plan.currentApprover?.name || null;
    const empCleanName = formatEmployeeName(empRawName);

    return {
      roleName: formattedRole,
      roleTitleTh: rawPos || formattedRole,
      displayRole: formattedRole,
      operatorName: precomputedOperatorName || empCleanName || formattedRole,
      employeeName: empCleanName || empRawName,
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
      const dirNames = approverDirectory?.salesDirectorEmployees || [];
      const opName = dirNames.length > 0 ? dirNames.join(", ") : null;
      return {
        roleName: "Sales Director",
        roleTitleTh: "ผู้จัดการฝ่ายขาย (อนุมัติงบรวม)",
        displayRole: "Sales Director",
        operatorName: precomputedOperatorName || opName || "Sales Director",
        stepDescription: "อนุมัติงบประมาณภาพรวมทั้งหมด",
      };
    }

    if (mktPending && !spPending) {
      const mktNames = approverDirectory?.marketingEmployees || [];
      const opName = mktNames.length > 0 ? mktNames.join(", ") : null;
      return {
        roleName: "Marketing Manager",
        roleTitleTh: "ผู้จัดการแผนกการตลาด",
        displayRole: "Marketing Manager",
        operatorName: precomputedOperatorName || opName || "Marketing Manager",
        stepDescription: "อนุมัติงบการตลาด",
      };
    }

    if (spPending && !mktPending) {
      const spNames = approverDirectory?.salesAdminEmployees || [];
      const opName = spNames.length > 0 ? spNames.join(", ") : null;
      return {
        roleName: "Sales Admin Manager",
        roleTitleTh: "ผู้จัดการแผนกบริหารงานขาย",
        displayRole: "Sales Admin Manager",
        operatorName: precomputedOperatorName || opName || "Sales Admin Manager",
        stepDescription: "อนุมัติงบส่งเสริมการขาย",
      };
    }

    if (spPending && mktPending) {
      const spNames = approverDirectory?.salesAdminEmployees || [];
      const mktNames = approverDirectory?.marketingEmployees || [];
      const combined = [...spNames, ...mktNames].filter(Boolean);
      const opName = combined.length > 0 ? combined.join(", ") : null;
      return {
        roleName: "Sales Admin & Marketing Manager",
        roleTitleTh: "ผจก.แผนกบริหารงานขาย และ ผจก.แผนกการตลาด",
        displayRole: "Sales Admin Manager, Marketing Manager",
        operatorName: precomputedOperatorName || opName || "Sales Admin Manager, Marketing Manager",
        stepDescription: "อนุมัติงบส่งเสริมการขายและการตลาดคู่ขนาน",
      };
    }

    const dirNames = approverDirectory?.salesDirectorEmployees || [];
    const opName = dirNames.length > 0 ? dirNames.join(", ") : null;
    return {
      roleName: "Sales Director",
      roleTitleTh: "ผู้จัดการฝ่ายขาย",
      displayRole: "Sales Director",
      operatorName: precomputedOperatorName || opName || "Sales Director",
      stepDescription: "อนุมัติงบประมาณ",
    };
  }

  // 5. Step 4: Helper Approval
  if (plan.status === "PENDING_HELPER_APPROVAL") {
    if (plan.helpers && plan.helpers.length > 0) {
      // Only consider helpers that have not been responded to yet
      const pendingHelpers = plan.helpers.filter(
        (h) => h.status === "PENDING" && !h.respondedAt,
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
        const spNames = approverDirectory?.salesAdminEmployees || [];
        const opName = spNames.length > 0 ? spNames.join(", ") : null;
        return {
          roleName: "Sales Admin Manager",
          roleTitleTh: "ผู้จัดการแผนกบริหารงานขาย",
          displayRole: "Sales Admin Manager",
          operatorName: precomputedOperatorName || opName || "Sales Admin Manager",
          stepDescription: "อนุมัติพนักงานช่วยงานฝ่ายขาย",
        };
      }
      if (hasMkt && !hasSales) {
        const mktNames = approverDirectory?.marketingEmployees || [];
        const opName = mktNames.length > 0 ? mktNames.join(", ") : null;
        return {
          roleName: "Marketing Manager",
          roleTitleTh: "ผู้จัดการแผนกการตลาด",
          displayRole: "Marketing Manager",
          operatorName: precomputedOperatorName || opName || "Marketing Manager",
          stepDescription: "อนุมัติพนักงานช่วยงานฝ่ายการตลาด",
        };
      }
      if (hasSales && hasMkt) {
        const spNames = approverDirectory?.salesAdminEmployees || [];
        const mktNames = approverDirectory?.marketingEmployees || [];
        const combined = [...spNames, ...mktNames].filter(Boolean);
        const opName = combined.length > 0 ? combined.join(", ") : null;
        return {
          roleName: "Sales Admin & Marketing Manager",
          roleTitleTh: "ผจก.แผนกบริหารงานขาย และ ผจก.แผนกการตลาด",
          displayRole: "Sales Admin Manager, Marketing Manager",
          operatorName: precomputedOperatorName || opName || "Sales Admin Manager, Marketing Manager",
          stepDescription: "อนุมัติพนักงานช่วยงานทั้งฝ่ายขายและการตลาด",
        };
      }
    }

    const fallbackEmp = formatEmployeeName(plan.currentApprover?.name);
    return {
      roleName: "Department Manager",
      roleTitleTh: "ผู้จัดการต้นสังกัดของผู้ช่วยงาน",
      displayRole: "ผู้จัดการต้นสังกัดของผู้ช่วย",
      operatorName: precomputedOperatorName || fallbackEmp || "ผู้จัดการต้นสังกัดของผู้ช่วย",
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
  const approverDirectory = useApproverDirectory();
  if (!plan) return null;
  const operator = resolveCurrentOperator(plan, approverDirectory);

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
            {operator.operatorName || operator.displayRole}
          </span>
        </div>
      )}
    </div>
  );
}

export interface ApproverUserContext {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  employeeId?: string | null;
  roles?: string[];
  role?: string | null;
  permissions?: string[];
  permissionKeys?: string[];
  positionTitle?: string | null;
  departmentCode?: string | null;
}

export function isUserAdmin(user?: ApproverUserContext | null): boolean {
  if (!user) return false;
  const roles = user.roles || (user.role ? [user.role] : []);
  const permissions = user.permissions || user.permissionKeys || [];
  return (
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    user.role === "administrator" ||
    user.role === "ADMIN" ||
    permissions.includes("activity.manage")
  );
}

export function isUserSalesAdminManager(user?: ApproverUserContext | null): boolean {
  if (!user) return false;
  const pos = (user.positionTitle || "").toLowerCase();
  const dept = (user.departmentCode || "").toUpperCase();

  return (
    pos.includes("ผู้จัดการแผนกบริหารงานขาย") ||
    pos.includes("ผจก.แผนกบริหารงานขาย") ||
    (dept === "SA" && (pos.includes("บริหารงานขาย") || pos.includes("sales admin manager")))
  );
}

export function isUserMarketingManager(user?: ApproverUserContext | null): boolean {
  if (!user) return false;
  const pos = (user.positionTitle || "").toLowerCase();
  const dept = (user.departmentCode || "").toUpperCase();
  const roles = user.roles || (user.role ? [user.role] : []);

  return (
    roles.includes("marketing_manager") ||
    pos.includes("ผู้จัดการแผนกการตลาด") ||
    pos.includes("ผจก.แผนกการตลาด") ||
    (dept === "MKT" && (pos.includes("แผนกการตลาด") || pos.includes("marketing manager")))
  );
}

export function isUserSalesDirector(user?: ApproverUserContext | null): boolean {
  if (!user) return false;
  const pos = (user.positionTitle || "").toLowerCase();

  return (
    pos.includes("ผู้จัดการฝ่ายขาย") ||
    pos.includes("ผจก.ฝ่ายขาย") ||
    pos.includes("sales director")
  );
}

export function canUserPerformApproval(
  plan?: {
    status?: string;
    currentApproverEmployeeId?: string | null;
    salesPromotionBudgetRequested?: any;
    marketingBudgetRequested?: any;
    salesPromotionApproved?: boolean | null;
    marketingApproved?: boolean | null;
    salesManagerApproved?: boolean | null;
    helpers?: Array<{
      status?: string;
      approvedById?: string | null;
      respondedAt?: Date | string | null;
      employee?: {
        name?: string | null;
        department?: { code?: string | null } | null;
        positionTitle?: string | null;
      } | null;
    }> | null;
  } | null,
  user?: ApproverUserContext | null,
): boolean {
  if (!plan || !plan.status || !user) return false;

  // 1. Admin has universal approval authority
  if (isUserAdmin(user)) return true;

  // 2. Terminal / Non-pending statuses -> No actions allowed
  if (
    plan.status === "APPROVED" ||
    plan.status === "REJECTED" ||
    plan.status === "CANCELLED" ||
    plan.status === "DRAFT" ||
    plan.status === "WAITING_FOR_CORRECTION"
  ) {
    return false;
  }

  // 3. Step 2: Line Approval
  if (plan.status === "PENDING_LINE_APPROVAL") {
    const userEmpId = user.employeeId;
    return Boolean(
      userEmpId &&
      plan.currentApproverEmployeeId &&
      plan.currentApproverEmployeeId === userEmpId
    );
  }

  // 4. Step 3: Budget Approval
  if (plan.status === "PENDING_BUDGET_APPROVAL") {
    const hasSalesPromotion = Number(plan.salesPromotionBudgetRequested || 0) > 0;
    const hasMarketing = Number(plan.marketingBudgetRequested || 0) > 0;

    const spPending = hasSalesPromotion && plan.salesPromotionApproved !== true;
    const mktPending = hasMarketing && plan.marketingApproved !== true;

    const requiredSalesPromotionOk = !hasSalesPromotion || plan.salesPromotionApproved === true;
    const requiredMarketingOk = !hasMarketing || plan.marketingApproved === true;
    const directorPending = requiredSalesPromotionOk && requiredMarketingOk && plan.salesManagerApproved !== true;

    // Stage 2: Final Budget Approval (Sales Director)
    if (directorPending) {
      return isUserSalesDirector(user);
    }

    // Stage 1: Parallel Budget Approvals
    if (spPending && mktPending) {
      return isUserSalesAdminManager(user) || isUserMarketingManager(user);
    }

    // Stage 1: Marketing Budget Approval only
    if (mktPending && !spPending) {
      return isUserMarketingManager(user);
    }

    // Stage 1: Sales Promotion Budget Approval only
    if (spPending && !mktPending) {
      return isUserSalesAdminManager(user);
    }

    return isUserSalesDirector(user);
  }

  // 5. Step 4: Helper Approval
  if (plan.status === "PENDING_HELPER_APPROVAL") {
    const pendingHelpers = (plan.helpers || []).filter(
      (h) => h.status === "PENDING" && !h.respondedAt,
    );
    if (pendingHelpers.length === 0) return false;

    let hasPendingSalesHelper = false;
    let hasPendingMktHelper = false;

    for (const h of pendingHelpers) {
      const deptCode = h.employee?.department?.code || "";
      const pos = h.employee?.positionTitle || "";
      if (deptCode === "SA" || deptCode === "SS" || pos.includes("เซลส์") || pos.includes("ส่งเสริม")) {
        hasPendingSalesHelper = true;
      } else if (deptCode === "MKT" || pos.includes("การตลาด")) {
        hasPendingMktHelper = true;
      }
    }

    if (hasPendingSalesHelper && hasPendingMktHelper) {
      return isUserSalesAdminManager(user) || isUserMarketingManager(user);
    }
    if (hasPendingSalesHelper) {
      return isUserSalesAdminManager(user);
    }
    if (hasPendingMktHelper) {
      return isUserMarketingManager(user);
    }

    return pendingHelpers.some((h) => h.approvedById === user.employeeId);
  }

  return false;
}



