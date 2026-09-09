/**
 * Application Business Logic: Approval Authority & Scope Predicates
 *
 * Single Source of Truth for Aggregated Approval authority evaluation.
 * Used by both approval-queue.ts (server) and UI components (client).
 *
 * NOTE: This file MUST NOT import database clients or server-only packages
 * to maintain strict Next.js client/server boundary compatibility.
 */

export interface ApproverUserContext {
  id?: string;
  name?: string | null;
  email?: string | null;
  employeeId?: string | null;
  roles?: string[];
  role?: string | null;
  permissions?: string[];
  permissionKeys?: string[];
  positionTitle?: string | null;
  departmentCode?: string | null;
}

export interface ActionScopeBadge {
  id: string;
  label: string;
  variant:
    | "line"
    | "sp_budget"
    | "mkt_budget"
    | "total_budget"
    | "sales_helper"
    | "mkt_helper"
    | "helper";
}

// ────────────────────────────────────────────────────────
// User Role & Position Predicates
// ────────────────────────────────────────────────────────

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

// Helper predicates for helper employees
function isSalesHelperEmployee(helper: any): boolean {
  const dept = (helper.employee?.department?.code || "").toUpperCase();
  const pos = (
    helper.employee?.positionTitle ||
    helper.employee?.position?.name ||
    ""
  ).toLowerCase();
  return (
    dept === "SA" ||
    dept === "SS" ||
    pos.includes("เซลส์") ||
    pos.includes("ส่งเสริม") ||
    pos.includes("ขาย")
  );
}

function isMarketingHelperEmployee(helper: any): boolean {
  const dept = (helper.employee?.department?.code || "").toUpperCase();
  const pos = (
    helper.employee?.positionTitle ||
    helper.employee?.position?.name ||
    ""
  ).toLowerCase();
  return dept === "MKT" || pos.includes("การตลาด");
}

// ────────────────────────────────────────────────────────
// Single Source of Truth: canUserPerformApproval
// ────────────────────────────────────────────────────────

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
        position?: { name?: string | null } | null;
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
        plan.currentApproverEmployeeId === userEmpId,
    );
  }

  // 4. Step 3: Budget Approval (Aggregated with Parallel Helper Review)
  if (plan.status === "PENDING_BUDGET_APPROVAL") {
    const hasSalesPromotion = Number(plan.salesPromotionBudgetRequested || 0) > 0;
    const hasMarketing = Number(plan.marketingBudgetRequested || 0) > 0;

    // Unreviewed pending helpers
    const unreviewedHelpers = (plan.helpers || []).filter(
      (h) => h.status === "PENDING" && !h.respondedAt,
    );
    const hasPendingSalesHelpers = unreviewedHelpers.some(isSalesHelperEmployee);
    const hasPendingMktHelpers = unreviewedHelpers.some(isMarketingHelperEmployee);

    const spPending =
      (hasSalesPromotion && plan.salesPromotionApproved !== true) ||
      hasPendingSalesHelpers;
    const mktPending =
      (hasMarketing && plan.marketingApproved !== true) ||
      hasPendingMktHelpers;

    const requiredSalesPromotionOk =
      !hasSalesPromotion || plan.salesPromotionApproved === true;
    const requiredMarketingOk =
      !hasMarketing || plan.marketingApproved === true;

    // Director only acts when Stage 1 (SP + MKT budgets) is complete
    const directorPending =
      requiredSalesPromotionOk &&
      requiredMarketingOk &&
      plan.salesManagerApproved !== true;

    // Stage 2: Final Budget Approval (Sales Director)
    if (directorPending) {
      return isUserSalesDirector(user);
    }

    // Stage 1: Parallel Approvals
    if (spPending && mktPending) {
      return isUserSalesAdminManager(user) || isUserMarketingManager(user);
    }

    // Stage 1: Marketing only
    if (mktPending && !spPending) {
      return isUserMarketingManager(user);
    }

    // Stage 1: Sales Promotion only
    if (spPending && !mktPending) {
      return isUserSalesAdminManager(user);
    }

    return isUserSalesDirector(user);
  }

  // 5. Step 4: Helper Approval (When plan had no budget requested)
  if (plan.status === "PENDING_HELPER_APPROVAL") {
    const pendingHelpers = (plan.helpers || []).filter(
      (h) => h.status === "PENDING" && !h.respondedAt,
    );
    if (pendingHelpers.length === 0) return false;

    const hasPendingSalesHelper = pendingHelpers.some(isSalesHelperEmployee);
    const hasPendingMktHelper = pendingHelpers.some(isMarketingHelperEmployee);

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

// ────────────────────────────────────────────────────────
// Action Scope Badges: "สิ่งที่ผู้อนุมัติต้องดำเนินการในรอบนี้"
// ────────────────────────────────────────────────────────

export function getPlanActionScopes(
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
        position?: { name?: string | null } | null;
      } | null;
    }> | null;
  } | null,
  user?: ApproverUserContext | null,
): ActionScopeBadge[] {
  if (!plan || !plan.status) return [];

  const badges: ActionScopeBadge[] = [];
  const isAdmin = isUserAdmin(user);
  const isSalesAdmin = isUserSalesAdminManager(user);
  const isMkt = isUserMarketingManager(user);
  const isDirector = isUserSalesDirector(user);

  // 1. Line Approval
  if (plan.status === "PENDING_LINE_APPROVAL") {
    badges.push({
      id: "line",
      label: "อนุมัติตามสายงาน",
      variant: "line",
    });
    return badges;
  }

  // 2. Budget Approval
  if (plan.status === "PENDING_BUDGET_APPROVAL") {
    const sp = Number(plan.salesPromotionBudgetRequested || 0);
    const mkt = Number(plan.marketingBudgetRequested || 0);
    const total = sp + mkt;

    const unreviewedHelpers = (plan.helpers || []).filter(
      (h) => h.status === "PENDING" && !h.respondedAt,
    );
    const salesHelpers = unreviewedHelpers.filter(isSalesHelperEmployee);
    const mktHelpers = unreviewedHelpers.filter(isMarketingHelperEmployee);


    const stage1Complete =
      (sp === 0 || plan.salesPromotionApproved === true) &&
      (mkt === 0 || plan.marketingApproved === true);

    const directorTurn = stage1Complete && plan.salesManagerApproved !== true;

    // Specific user scopes
    if (!isAdmin && user) {
      if (isDirector && directorTurn) {
        badges.push({
          id: "total_budget",
          label: `งบประมาณรวม ${total.toLocaleString()} บาท`,
          variant: "total_budget",
        });
        return badges;
      }

      if (isSalesAdmin) {
        if (sp > 0 && plan.salesPromotionApproved !== true) {
          badges.push({
            id: "sp_budget",
            label: `งบส่งเสริมการขาย ${sp.toLocaleString()} บาท`,
            variant: "sp_budget",
          });
        }
        if (salesHelpers.length > 0) {
          badges.push({
            id: "sales_helper",
            label: `ผู้ช่วยฝ่ายขาย ${salesHelpers.length} คน`,
            variant: "sales_helper",
          });
        }
        return badges;
      }

      if (isMkt) {
        if (mkt > 0 && plan.marketingApproved !== true) {
          badges.push({
            id: "mkt_budget",
            label: `งบการตลาด ${mkt.toLocaleString()} บาท`,
            variant: "mkt_budget",
          });
        }
        if (mktHelpers.length > 0) {
          badges.push({
            id: "mkt_helper",
            label: `ผู้ช่วยฝ่ายการตลาด ${mktHelpers.length} คน`,
            variant: "mkt_helper",
          });
        }
        return badges;
      }
    }

    // Default / Admin / General view (e.g. In All Pending tab)
    if (directorTurn) {
      badges.push({
        id: "total_budget",
        label: `งบประมาณรวม ${total.toLocaleString()} บาท`,
        variant: "total_budget",
      });
    } else {
      if (sp > 0 && plan.salesPromotionApproved !== true) {
        badges.push({
          id: "sp_budget",
          label: `งบส่งเสริมการขาย ${sp.toLocaleString()} บาท`,
          variant: "sp_budget",
        });
      }
      if (salesHelpers.length > 0) {
        badges.push({
          id: "sales_helper",
          label: `ผู้ช่วยฝ่ายขาย ${salesHelpers.length} คน`,
          variant: "sales_helper",
        });
      }
      if (mkt > 0 && plan.marketingApproved !== true) {
        badges.push({
          id: "mkt_budget",
          label: `งบการตลาด ${mkt.toLocaleString()} บาท`,
          variant: "mkt_budget",
        });
      }
      if (mktHelpers.length > 0) {
        badges.push({
          id: "mkt_helper",
          label: `ผู้ช่วยฝ่ายการตลาด ${mktHelpers.length} คน`,
          variant: "mkt_helper",
        });
      }
    }

    return badges;
  }

  // 3. Helper Approval
  if (plan.status === "PENDING_HELPER_APPROVAL") {
    const unreviewedHelpers = (plan.helpers || []).filter(
      (h) => h.status === "PENDING" && !h.respondedAt,
    );
    const salesHelpers = unreviewedHelpers.filter(isSalesHelperEmployee);
    const mktHelpers = unreviewedHelpers.filter(isMarketingHelperEmployee);
    const otherHelpers = unreviewedHelpers.filter(
      (h) => !isSalesHelperEmployee(h) && !isMarketingHelperEmployee(h),
    );

    if (!isAdmin && user) {
      if (isSalesAdmin && salesHelpers.length > 0) {
        badges.push({
          id: "sales_helper",
          label: `ผู้ช่วยฝ่ายขาย ${salesHelpers.length} คน`,
          variant: "sales_helper",
        });
        return badges;
      }
      if (isMkt && mktHelpers.length > 0) {
        badges.push({
          id: "mkt_helper",
          label: `ผู้ช่วยฝ่ายการตลาด ${mktHelpers.length} คน`,
          variant: "mkt_helper",
        });
        return badges;
      }
    }

    if (salesHelpers.length > 0) {
      badges.push({
        id: "sales_helper",
        label: `ผู้ช่วยฝ่ายขาย ${salesHelpers.length} คน`,
        variant: "sales_helper",
      });
    }
    if (mktHelpers.length > 0) {
      badges.push({
        id: "mkt_helper",
        label: `ผู้ช่วยฝ่ายการตลาด ${mktHelpers.length} คน`,
        variant: "mkt_helper",
      });
    }
    if (otherHelpers.length > 0) {
      badges.push({
        id: "helper",
        label: `ผู้ช่วยงาน ${otherHelpers.length} คน`,
        variant: "helper",
      });
    }

    return badges;
  }

  return badges;
}
