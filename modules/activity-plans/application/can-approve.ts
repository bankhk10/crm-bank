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
    roles.includes("activity_marketing_manager") ||
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

// ────────────────────────────────────────────────────────
// Granular Activity Approval Permission Helpers
// ────────────────────────────────────────────────────────

export function hasPermission(
  user?: ApproverUserContext | null,
  key?: string,
): boolean {
  if (!user || !key) return false;
  if (isUserAdmin(user)) return true;
  const permissions = user.permissions || user.permissionKeys || [];
  return permissions.includes(key);
}

export function canUserApproveSPBudget(user?: ApproverUserContext | null): boolean {
  return hasPermission(user, "activity.approve.sp_budget");
}

export function canUserApproveMKTBudget(user?: ApproverUserContext | null): boolean {
  return hasPermission(user, "activity.approve.mkt_budget");
}

export function canUserApproveTotalBudget(user?: ApproverUserContext | null): boolean {
  return hasPermission(user, "activity.approve.total_budget");
}

export function canUserApproveProductWithdrawal(user?: ApproverUserContext | null): boolean {
  return hasPermission(user, "activity.approve.product_withdrawal");
}

export function canUserApproveSalesHelper(user?: ApproverUserContext | null): boolean {
  return hasPermission(user, "activity.approve.sales_helper");
}

export function canUserApproveMKTHelper(user?: ApproverUserContext | null): boolean {
  return hasPermission(user, "activity.approve.mkt_helper");
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
    planType?: string;
    status?: string;
    currentApproverEmployeeId?: string | null;
    employeeId?: string | null;
    createdById?: string | null;
    cancellationRequestedById?: string | null;
    employee?: {
      id?: string;
      managerId?: string | null;
    } | null;
    creator?: {
      employeeId?: string | null;
      employee?: {
        id?: string;
        managerId?: string | null;
      } | null;
    } | null;
    salesPromotionBudgetRequested?: any;
    marketingBudgetRequested?: any;
    salesPromotionApproved?: boolean | null;
    marketingApproved?: boolean | null;
    salesManagerApproved?: boolean | null;
    lineCancellationApproved?: boolean | null;
    mktCancellationApproved?: boolean | null;
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
  step?: string,
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
    plan.status === "WAITING_FOR_CORRECTION" ||
    plan.status === "REVIEWED" ||
    plan.status === "RETURNED"
  ) {
    return false;
  }

  // 2.5 Unplanned Activity Review (Post-Activity Review)
  if (plan.status === "PENDING_REVIEW") {
    if (plan.planType && plan.planType !== "UNPLANNED") return false;
    if (step && step !== "POST_ACTIVITY_REVIEW") return false;

    const userEmpId = user.employeeId;
    if (!userEmpId) return false;

    // Creator employee cannot review their own activity
    const creatorEmployeeId = plan.employeeId || plan.employee?.id;
    if (creatorEmployeeId && userEmpId === creatorEmployeeId) {
      return false;
    }

    const directManagerId =
      plan.currentApproverEmployeeId ||
      plan.employee?.managerId ||
      plan.creator?.employee?.managerId;

    return Boolean(directManagerId && directManagerId === userEmpId);
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

  // 3.5 Step 2.5: Product Withdrawal Approval
  if (plan.status === "PENDING_MARKETING_APPROVAL") {
    return canUserApproveProductWithdrawal(user);
  }

  // 3.6 Cancellation Approval (Dual Approval: Line Approver + Marketing Manager)
  if (plan.status === "PENDING_CANCELLATION") {
    const userEmpId = user.employeeId;
    if (!userEmpId) return false;

    // 1. Creator / Owner cannot approve their own cancellation (unless Admin)
    const creatorEmployeeId = plan.employeeId || plan.employee?.id;
    const isOwner =
      (creatorEmployeeId && userEmpId === creatorEmployeeId) ||
      (plan.createdById && user.id === plan.createdById) ||
      ((plan as any).cancellationRequestedById &&
        user.id === (plan as any).cancellationRequestedById);

    if (isOwner && !isUserAdmin(user)) {
      return false;
    }

    // 2. Operational staff (Salesperson, Promoter, Marketing Staff) cannot approve cancellations
    const posTitle = (user.positionTitle || "").toLowerCase();
    const isOperationalStaff =
      posTitle.includes("พนักงานขาย") ||
      posTitle === "sales" ||
      posTitle.includes("sales_employee") ||
      posTitle.includes("พนักงานส่งเสริม") ||
      posTitle.includes("sales_promotion") ||
      posTitle.includes("พนักงานการตลาด") ||
      posTitle.includes("employee_mk");

    if (isOperationalStaff && !isUserAdmin(user)) {
      return false;
    }

    const hasWithdrawal =
      Boolean((plan as any).hasProductWithdrawal) ||
      ((plan as any).type7aPlots && (plan as any).type7aPlots.length > 0) ||
      Boolean((plan as any).type7b?.hasProducts) ||
      Boolean((plan as any).type13?.hasProducts) ||
      Boolean((plan as any).type14?.hasProducts);

    const isSalesAdmin = isUserSalesAdminManager(user);
    const isLineApprover = Boolean(
      (isSalesAdmin ||
        plan.employee?.managerId === userEmpId ||
        plan.creator?.employee?.managerId === userEmpId ||
        plan.currentApproverEmployeeId === userEmpId) &&
        plan.lineCancellationApproved !== true,
    );

    const isMktApprover = Boolean(
      hasWithdrawal &&
        canUserApproveProductWithdrawal(user) &&
        plan.mktCancellationApproved !== true,
    );

    return isLineApprover || isMktApprover;
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
      hasSalesPromotion && plan.salesPromotionApproved !== true;
    const mktPending =
      hasMarketing && plan.marketingApproved !== true;

    const requiredSalesPromotionOk =
      !hasSalesPromotion || plan.salesPromotionApproved === true;
    const requiredMarketingOk =
      !hasMarketing || plan.marketingApproved === true;

    const directorPending =
      (hasSalesPromotion || hasMarketing) &&
      requiredSalesPromotionOk &&
      requiredMarketingOk &&
      plan.salesManagerApproved !== true;

    // Stage 2: Final Budget Approval (Sales Director / Total Budget Approver)
    if (directorPending && canUserApproveTotalBudget(user)) {
      return true;
    }

    // Stage 1: Parallel Budget Approvals
    if (spPending && canUserApproveSPBudget(user)) {
      return true;
    }
    if (mktPending && canUserApproveMKTBudget(user)) {
      return true;
    }

    // Parallel Helper Approvals in Budget step
    if (hasPendingSalesHelpers && canUserApproveSalesHelper(user)) {
      return true;
    }
    if (hasPendingMktHelpers && canUserApproveMKTHelper(user)) {
      return true;
    }

    return false;
  }

  // 5. Step 4: Helper Approval (When plan had no budget requested)
  if (plan.status === "PENDING_HELPER_APPROVAL") {
    const pendingHelpers = (plan.helpers || []).filter(
      (h) => h.status === "PENDING" && !h.respondedAt,
    );
    if (pendingHelpers.length === 0) return false;

    const hasPendingSalesHelper = pendingHelpers.some(isSalesHelperEmployee);
    const hasPendingMktHelper = pendingHelpers.some(isMarketingHelperEmployee);

    if (hasPendingSalesHelper && canUserApproveSalesHelper(user)) {
      return true;
    }
    if (hasPendingMktHelper && canUserApproveMKTHelper(user)) {
      return true;
    }

    return false;
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
    hasProductWithdrawal?: boolean | null;
    productWithdrawalApproved?: boolean | null;
    salesPromotionBudgetRequested?: any;
    marketingBudgetRequested?: any;
    salesPromotionApproved?: boolean | null;
    marketingApproved?: boolean | null;
    salesManagerApproved?: boolean | null;
    lineCancellationApproved?: boolean | null;
    mktCancellationApproved?: boolean | null;
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

  // 0. Post-Activity Review (Unplanned)
  if (plan.status === "PENDING_REVIEW") {
    badges.push({
      id: "post_activity_review",
      label: "ตรวจสอบผลการปฏิบัติงาน",
      variant: "line",
    });
    return badges;
  }

  // 1. Line Approval
  if (plan.status === "PENDING_LINE_APPROVAL") {
    badges.push({
      id: "line",
      label: "อนุมัติตามสายงาน",
      variant: "line",
    });

    const sp = Number(plan.salesPromotionBudgetRequested || 0);
    const mkt = Number(plan.marketingBudgetRequested || 0);
    const unreviewedHelpers = (plan.helpers || []).filter(
      (h) => h.status === "PENDING" && !h.respondedAt,
    );
    const salesHelpers = unreviewedHelpers.filter(isSalesHelperEmployee);
    const mktHelpers = unreviewedHelpers.filter(isMarketingHelperEmployee);

    if (canUserApproveSPBudget(user) && sp > 0 && plan.salesPromotionApproved !== true) {
      badges.push({
        id: "sp_budget",
        label: `งบส่งเสริมการขาย ${sp.toLocaleString()} บาท`,
        variant: "sp_budget",
      });
    }
    if (canUserApproveSalesHelper(user) && salesHelpers.length > 0) {
      badges.push({
        id: "sales_helper",
        label: `ผู้ช่วยฝ่ายขาย ${salesHelpers.length} คน`,
        variant: "sales_helper",
      });
    }

    if (canUserApproveMKTBudget(user) && mkt > 0 && plan.marketingApproved !== true) {
      badges.push({
        id: "mkt_budget",
        label: `งบการตลาด ${mkt.toLocaleString()} บาท`,
        variant: "mkt_budget",
      });
    }
    if (canUserApproveMKTHelper(user) && mktHelpers.length > 0) {
      badges.push({
        id: "mkt_helper",
        label: `ผู้ช่วยฝ่ายการตลาด ${mktHelpers.length} คน`,
        variant: "mkt_helper",
      });
    }
    if (canUserApproveProductWithdrawal(user) && plan.hasProductWithdrawal && plan.productWithdrawalApproved !== true) {
      badges.push({
        id: "product_withdrawal",
        label: "อนุมัติการเบิกสินค้า",
        variant: "mkt_budget",
      });
    }

    return badges;
  }

  // 1.5 Product Withdrawal Approval
  if (plan.status === "PENDING_MARKETING_APPROVAL") {
    if (canUserApproveProductWithdrawal(user)) {
      badges.push({
        id: "product_withdrawal",
        label: "อนุมัติการเบิกสินค้า",
        variant: "mkt_budget",
      });
    }

    const mkt = Number(plan.marketingBudgetRequested || 0);
    if (canUserApproveMKTBudget(user) && mkt > 0 && plan.marketingApproved !== true) {
      badges.push({
        id: "mkt_budget",
        label: `งบการตลาด ${mkt.toLocaleString()} บาท`,
        variant: "mkt_budget",
      });
    }
    const unreviewedHelpers = (plan.helpers || []).filter(
      (h) => h.status === "PENDING" && !h.respondedAt,
    );
    const mktHelpers = unreviewedHelpers.filter(isMarketingHelperEmployee);
    if (canUserApproveMKTHelper(user) && mktHelpers.length > 0) {
      badges.push({
        id: "mkt_helper",
        label: `ผู้ช่วยฝ่ายการตลาด ${mktHelpers.length} คน`,
        variant: "mkt_helper",
      });
    }

    return badges;
  }

  // 1.6 Cancellation Approval
  if (plan.status === "PENDING_CANCELLATION") {
    if (plan.lineCancellationApproved !== true) {
      badges.push({
        id: "cancel_line",
        label: "อนุมัติยกเลิก (สายงาน)",
        variant: "line",
      });
    }
    if (plan.mktCancellationApproved !== true) {
      badges.push({
        id: "cancel_mkt",
        label: "อนุมัติยกเลิก (ตรวจคืนสินค้า)",
        variant: "mkt_budget",
      });
    }
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

    const directorTurn = (sp > 0 || mkt > 0) && stage1Complete && plan.salesManagerApproved !== true;

    if (canUserApproveTotalBudget(user) && directorTurn) {
      badges.push({
        id: "total_budget",
        label: `งบประมาณรวม ${total.toLocaleString()} บาท`,
        variant: "total_budget",
      });
    }

    if (canUserApproveSPBudget(user) && sp > 0 && plan.salesPromotionApproved !== true) {
      badges.push({
        id: "sp_budget",
        label: `งบส่งเสริมการขาย ${sp.toLocaleString()} บาท`,
        variant: "sp_budget",
      });
    }

    if (canUserApproveSalesHelper(user) && salesHelpers.length > 0) {
      badges.push({
        id: "sales_helper",
        label: `ผู้ช่วยฝ่ายขาย ${salesHelpers.length} คน`,
        variant: "sales_helper",
      });
    }

    if (canUserApproveMKTBudget(user) && mkt > 0 && plan.marketingApproved !== true) {
      badges.push({
        id: "mkt_budget",
        label: `งบการตลาด ${mkt.toLocaleString()} บาท`,
        variant: "mkt_budget",
      });
    }

    if (canUserApproveMKTHelper(user) && mktHelpers.length > 0) {
      badges.push({
        id: "mkt_helper",
        label: `ผู้ช่วยฝ่ายการตลาด ${mktHelpers.length} คน`,
        variant: "mkt_helper",
      });
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

    if (canUserApproveSalesHelper(user) && salesHelpers.length > 0) {
      badges.push({
        id: "sales_helper",
        label: `ผู้ช่วยฝ่ายขาย ${salesHelpers.length} คน`,
        variant: "sales_helper",
      });
    }
    if (canUserApproveMKTHelper(user) && mktHelpers.length > 0) {
      badges.push({
        id: "mkt_helper",
        label: `ผู้ช่วยฝ่ายการตลาด ${mktHelpers.length} คน`,
        variant: "mkt_helper",
      });
    }

    return badges;
  }

  // 4. Cancellation Approval
  if (plan.status === "PENDING_CANCELLATION") {
    const userEmpId = user?.employeeId;
    const isLineApproved = plan.lineCancellationApproved === true;
    const isMktApproved = plan.mktCancellationApproved === true;

    const isSalesAdmin = isUserSalesAdminManager(user);
    const isLineApprover = Boolean(
      isAdmin ||
        isSalesAdmin ||
        (userEmpId &&
          (plan.currentApproverEmployeeId === userEmpId ||
            (plan as any).employee?.managerId === userEmpId)),
    );

    if (isLineApprover && !isLineApproved) {
      badges.push({
        id: "cancel_line",
        label: "อนุมัติยกเลิกตามสายงาน",
        variant: "line",
      });
    }

    const hasWithdrawal =
      Boolean((plan as any).hasProductWithdrawal) ||
      ((plan as any).type7aPlots && (plan as any).type7aPlots.length > 0) ||
      Boolean((plan as any).type7b?.hasProducts) ||
      Boolean((plan as any).type13?.hasProducts) ||
      Boolean((plan as any).type14?.hasProducts);

    if (
      hasWithdrawal &&
      (isAdmin || canUserApproveProductWithdrawal(user)) &&
      !isMktApproved
    ) {
      badges.push({
        id: "cancel_mkt",
        label: "ตรวจรับคืนสต็อกสินค้า",
        variant: "mkt_budget",
      });
    }

    return badges;
  }

  return badges;
}
