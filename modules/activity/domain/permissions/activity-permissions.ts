/**
 * Domain Authorization Rules: Activity Module Permissions
 *
 * Centralized Single Source of Truth for Activity Module permissions.
 * Pure logic decoupled from database queries - safe for both Server and Client environments.
 */

export interface ActivityUserContext {
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
  [key: string]: any;
}

export interface ActivityPlanPermissionContext {
  id?: string;
  createdById?: string | null;
  employeeId?: string | null;
  status?: string | null;
  planType?: string | null;
  [key: string]: any;
}

export interface PermissionCheckResult {
  allowed: boolean;
  error?: string;
}

/**
 * Check if the user has Administrative / Superuser privileges for Activity Module
 */
export function isActivityAdmin(user?: ActivityUserContext | null): boolean {
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

/**
 * Check if the user has a specific permission key (or is an Admin)
 */
export function hasActivityPermission(
  user?: ActivityUserContext | null,
  permissionKey?: string,
): boolean {
  if (!user || !permissionKey) return false;
  if (isActivityAdmin(user)) return true;

  const permissions = user.permissions || user.permissionKeys || [];
  return permissions.includes(permissionKey);
}

/**
 * Check permission to create Planned Activity (Trip Plan)
 */
export function canCreatePlannedActivity(
  user?: ActivityUserContext | null,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (
    isActivityAdmin(user) ||
    hasActivityPermission(user, "activity.create") ||
    hasActivityPermission(user, "activity.manage")
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "Forbidden: คุณไม่มีสิทธิ์สร้าง Trip Plan",
  };
}

/**
 * Check permission to create Unplanned Activity
 */
export function canCreateUnplannedActivity(
  user?: ActivityUserContext | null,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (
    isActivityAdmin(user) ||
    hasActivityPermission(user, "activity.create") ||
    hasActivityPermission(user, "activity.manage")
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "Forbidden: คุณไม่มีสิทธิ์สร้างกิจกรรมนอกแผน",
  };
}

/**
 * Check permission to edit an existing Activity Plan
 */
export function canEditActivityPlan(
  user: ActivityUserContext | null | undefined,
  plan?: ActivityPlanPermissionContext | null,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (!plan) {
    return { allowed: false, error: "ไม่พบข้อมูลแผนงาน" };
  }

  if (isActivityAdmin(user)) {
    return { allowed: true };
  }

  const isCreator =
    (plan.createdById && user.id === plan.createdById) ||
    (user.employeeId && plan.employeeId === user.employeeId);

  if (!isCreator) {
    return {
      allowed: false,
      error: "Forbidden: คุณไม่ใช่ผู้สร้างแผนงานนี้จึงไม่มีสิทธิ์แก้ไข",
    };
  }

  if (plan.status === "APPROVED") {
    return {
      allowed: false,
      error: "ไม่สามารถแก้ไขแผนงานที่ได้รับการอนุมัติเรียบร้อยแล้วได้",
    };
  }

  return { allowed: true };
}

/**
 * Check permission to record actual results (Actual)
 */
export function canRecordActualResult(
  user: ActivityUserContext | null | undefined,
  plan?: ActivityPlanPermissionContext | null,
  isTestMode = false,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (!plan) {
    return { allowed: false, error: "ไม่พบ Trip Plan" };
  }

  if (plan.status !== "APPROVED" && !isTestMode) {
    return {
      allowed: false,
      error: "สามารถบันทึกผลได้เฉพาะแผนกิจกรรมที่ได้รับการอนุมัติเรียบร้อยแล้วเท่านั้น",
    };
  }

  if (isActivityAdmin(user)) {
    return { allowed: true };
  }

  const isCreator =
    (plan.createdById && user.id === plan.createdById) ||
    (user.employeeId && plan.employeeId === user.employeeId);

  if (!isCreator) {
    return {
      allowed: false,
      error: "เฉพาะผู้สร้างแผนงาน (Creator) เท่านั้นที่มีสิทธิ์บันทึกผลการปฏิบัติงานจริง",
    };
  }

  return { allowed: true };
}

/**
 * Check permission to approve, reject, or return an activity plan
 */
export function canApproveActivityPlan(
  user?: ActivityUserContext | null,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (
    isActivityAdmin(user) ||
    hasActivityPermission(user, "activity.approve") ||
    hasActivityPermission(user, "activity.manage")
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "Forbidden: คุณไม่มีสิทธิ์อนุมัติแผนงานนี้",
  };
}

/**
 * Check permission to access the approval queue and statistics
 */
export function canAccessApprovalQueue(
  user?: ActivityUserContext | null,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (
    isActivityAdmin(user) ||
    hasActivityPermission(user, "activity.approve") ||
    hasActivityPermission(user, "activity.manage") ||
    hasActivityPermission(user, "menu.activity_plans")
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "Forbidden: คุณไม่มีสิทธิ์เข้าถึงคิวอนุมัติ",
  };
}

/**
 * Check permission to delete an Activity Plan
 */
export function canDeleteActivityPlan(
  user: ActivityUserContext | null | undefined,
  plan?: ActivityPlanPermissionContext | null,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (!plan) {
    return { allowed: false, error: "ไม่พบข้อมูลแผนงาน" };
  }

  if (isActivityAdmin(user)) {
    return { allowed: true };
  }

  const isCreator =
    (plan.createdById && user.id === plan.createdById) ||
    (user.employeeId && plan.employeeId === user.employeeId);

  const deletableStatuses = ["DRAFT", "REJECTED", "CANCELLED", "WAITING_FOR_CORRECTION"];
  if (isCreator && plan.status && deletableStatuses.includes(plan.status)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "คุณสามารถลบได้เฉพาะแผนงานของคุณเองที่อยู่ในสถานะแบบร่าง หรือถูกปฏิเสธเท่านั้น",
  };
}

/**
 * Check permission to create promotional materials
 */
export function canCreatePromotionalMaterial(
  user?: ActivityUserContext | null,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (
    isActivityAdmin(user) ||
    hasActivityPermission(user, "promotional_material.create") ||
    hasActivityPermission(user, "menu.promotional_materials") ||
    hasActivityPermission(user, "activity.manage") ||
    hasActivityPermission(user, "system.settings")
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "Forbidden: ไม่มีสิทธิ์สร้างสื่อส่งเสริมการขาย",
  };
}

/**
 * Check permission to edit promotional materials
 */
export function canEditPromotionalMaterial(
  user?: ActivityUserContext | null,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (
    isActivityAdmin(user) ||
    hasActivityPermission(user, "promotional_material.edit") ||
    hasActivityPermission(user, "menu.promotional_materials") ||
    hasActivityPermission(user, "activity.manage") ||
    hasActivityPermission(user, "system.settings")
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "Forbidden: ไม่มีสิทธิ์แก้ไขสื่อส่งเสริมการขาย",
  };
}

/**
 * Check permission to delete promotional materials
 */
export function canDeletePromotionalMaterial(
  user?: ActivityUserContext | null,
): PermissionCheckResult {
  if (!user) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (
    isActivityAdmin(user) ||
    hasActivityPermission(user, "promotional_material.delete") ||
    hasActivityPermission(user, "menu.promotional_materials") ||
    hasActivityPermission(user, "activity.manage") ||
    hasActivityPermission(user, "system.settings")
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "Forbidden: ไม่มีสิทธิ์ลบสื่อส่งเสริมการขาย",
  };
}
