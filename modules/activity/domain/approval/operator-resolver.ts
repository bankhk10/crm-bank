/**
 * Domain Service: Activity Plan Operator Resolver
 * Resolves who is responsible for the current workflow step.
 * Follows Step-by-Step Domain Decomposition.
 */

import { isTourActivityPlan } from "./can-approve";

export interface ApproverDirectoryContext {
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

/**
 * Clean up test or internal role annotations from Employee.name
 * e.g., "สมคิด บริหารงานขาย (ผจก.แผนก SA)" -> "สมคิด บริหารงานขาย"
 */
export function formatEmployeeName(name?: string | null): string {
  if (!name) return "";
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/**
 * Format position title or system role into a human-readable display role
 */
export function formatApproverRole(
  positionTitleOrRole?: string | null,
): string {
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
  if (title.includes("พนักงานส่งเสริมการขาย") || title === "sales_promotion") {
    return "Sales Promotion";
  }
  if (title.includes("พนักงานการตลาด") || title === "employee_mk") {
    return "Marketing Staff";
  }

  return title;
}

// -------------------------------------------------------------
// Step 1: Waiting for Correction (Creator)
// -------------------------------------------------------------
export function resolveCreatorOperator(
  plan: any,
  precomputedName?: string | null,
): CurrentOperatorInfo {
  const creatorName = formatEmployeeName(
    plan.employee?.name || plan.createdBy?.name,
  );
  return {
    roleName: "Creator",
    roleTitleTh: "ผู้สร้างแผนงาน",
    displayRole: "ผู้จัดทำแผน (รอแก้ไข)",
    operatorName: precomputedName || creatorName || "ผู้สร้างแผนงาน",
    employeeName: creatorName || null,
    stepDescription: "รอผู้จัดทำแผนแก้ไขและส่งใหม่",
  };
}

// -------------------------------------------------------------
// Step 2: Line Approval (Direct Line Manager)
// -------------------------------------------------------------
export function resolveLineApprover(
  plan: any,
  precomputedName?: string | null,
): CurrentOperatorInfo {
  const rawPos =
    plan.currentApprover?.positionTitle ||
    plan.currentApprover?.position?.name;

  const formattedRole = rawPos ? formatApproverRole(rawPos) : "หัวหน้างานสายตรง";
  const empRawName = plan.currentApprover?.name || null;
  const empCleanName = formatEmployeeName(empRawName);

  return {
    roleName: formattedRole,
    roleTitleTh: rawPos || formattedRole,
    displayRole: formattedRole,
    operatorName: precomputedName || empCleanName || formattedRole,
    employeeName: empCleanName || empRawName,
    stepDescription: "อนุมัติตามสายงาน",
  };
}

// -------------------------------------------------------------
// Step 2.5: Product Withdrawal Approval (Marketing Manager)
// -------------------------------------------------------------
export function resolveMarketingWithdrawalApprover(
  precomputedName?: string | null,
): CurrentOperatorInfo {
  return {
    roleName: "Marketing Manager",
    roleTitleTh: "ผู้จัดการแผนกการตลาด",
    displayRole: "ผู้จัดการแผนกการตลาด",
    operatorName: precomputedName || "ผู้จัดการแผนกการตลาด",
    employeeName: null,
    stepDescription: "อนุมัติการเบิกสินค้าในแปลงสาธิต",
  };
}

// -------------------------------------------------------------
// Step 2.6: Cancellation Approval (Dual: Line Approver + Marketing Manager)
// -------------------------------------------------------------
export function resolveCancellationApprover(
  plan: any,
  precomputedName?: string | null,
): CurrentOperatorInfo {
  const hasWithdrawal =
    Boolean(plan.hasProductWithdrawal) ||
    Boolean(plan.type7aProducts?.length) ||
    (plan.type7aTargets && plan.type7aTargets.length > 0) ||
    (plan.type7aPlots && plan.type7aPlots.length > 0) ||
    Boolean(plan.type7b?.hasProducts) ||
    Boolean(plan.type13?.hasProducts) ||
    Boolean(plan.type13Products?.length) ||
    Boolean(plan.type13Targets?.some((t: any) => t.products?.length > 0)) ||
    Boolean(plan.type14?.hasProducts) ||
    Boolean(plan.type14Products?.length);

  const isLineApproved = plan.lineCancellationApproved === true;
  const isMktApproved = plan.mktCancellationApproved === true;

  const lineApprover =
    plan.currentApprover || plan.employee?.manager || null;

  const rawLinePos =
    lineApprover?.positionTitle || lineApprover?.position?.name;

  const formattedLineRole = rawLinePos
    ? formatApproverRole(rawLinePos)
    : "หัวหน้างานสายตรง";
  const lineTitleTh = rawLinePos || formattedLineRole || "หัวหน้างานสายตรง";
  const empRawName = lineApprover?.name || null;
  const empCleanName = formatEmployeeName(empRawName);

  // Case 1: If plan has NO product withdrawal, only Line Approver is needed
  if (!hasWithdrawal) {
    return {
      roleName: formattedLineRole,
      roleTitleTh: lineTitleTh,
      displayRole: formattedLineRole,
      operatorName: precomputedName || empCleanName || lineTitleTh,
      employeeName: empCleanName || empRawName,
      stepDescription: `รอ${lineTitleTh} อนุมัติการยกเลิก`,
    };
  }

  // Case 2: Plan has product withdrawal -> Dual approval
  let desc = `รออนุมัติการยกเลิก (${lineTitleTh} + ผจก.การตลาด)`;
  let roleTitle = `${lineTitleTh} / ผู้จัดการแผนกการตลาด`;
  let display = `${formattedLineRole} / Marketing Manager`;
  let currentEmpName: string | null = null;

  if (isLineApproved && !isMktApproved) {
    desc = "รอ ผจก.การตลาด อนุมัติตรวจรับคืนสินค้า";
    roleTitle = "ผู้จัดการแผนกการตลาด";
    display = "Marketing Manager";
    currentEmpName = null;
  } else if (!isLineApproved && isMktApproved) {
    desc = `รอ${lineTitleTh} อนุมัติการยกเลิก`;
    roleTitle = lineTitleTh;
    display = formattedLineRole;
    currentEmpName = empCleanName || empRawName;
  }

  return {
    roleName: display,
    roleTitleTh: roleTitle,
    displayRole: display,
    operatorName: precomputedName || currentEmpName || roleTitle,
    employeeName: currentEmpName,
    stepDescription: desc,
  };
}

// -------------------------------------------------------------
// Step 3: Budget Approval (Sales Admin Mgr, Marketing Mgr, Sales Director)
// -------------------------------------------------------------
export function resolveBudgetApprover(
  plan: any,
  approverDirectory?: ApproverDirectoryContext | null,
  precomputedName?: string | null,
): CurrentOperatorInfo {
  const hasSalesPromotion = Number(plan.salesPromotionBudgetRequested || 0) > 0;
  const hasMarketing = Number(plan.marketingBudgetRequested || 0) > 0;
  const isTour = isTourActivityPlan(plan);

  const spPending = hasSalesPromotion && plan.salesPromotionApproved !== true;
  const mktPending = hasMarketing && plan.marketingApproved !== true;

  const requiredSalesPromotionOk =
    !hasSalesPromotion || plan.salesPromotionApproved === true;
  const requiredMarketingOk = !hasMarketing || plan.marketingApproved === true;

  const directorPending =
    (hasSalesPromotion || hasMarketing || isTour) &&
    requiredSalesPromotionOk &&
    requiredMarketingOk &&
    plan.salesManagerApproved !== true;

  if (directorPending && (!spPending && !mktPending)) {
    const dirNames = approverDirectory?.salesDirectorEmployees || [];
    const opName = dirNames.length > 0 ? dirNames.join(", ") : null;
    return {
      roleName: "Sales Director",
      roleTitleTh: isTour && !hasSalesPromotion && !hasMarketing
        ? "ผู้จัดการฝ่ายขาย-กิจกรรม (อนุมัติทัวร์)"
        : isTour
          ? "ผู้จัดการฝ่ายขาย-กิจกรรม (อนุมัติทัวร์ & งบรวม)"
          : "ผู้จัดการฝ่ายขาย (อนุมัติงบรวม)",
      displayRole: "Sales Director",
      operatorName: precomputedName || opName || "Sales Director",
      stepDescription: isTour && !hasSalesPromotion && !hasMarketing
        ? "อนุมัติแผนงานทัวร์ (Type 12)"
        : "อนุมัติงบประมาณภาพรวมทั้งหมด",
    };
  }

  if (mktPending && !spPending) {
    const mktNames = approverDirectory?.marketingEmployees || [];
    const opName = mktNames.length > 0 ? mktNames.join(", ") : null;
    return {
      roleName: "Marketing Manager",
      roleTitleTh: "ผู้จัดการแผนกการตลาด",
      displayRole: "Marketing Manager",
      operatorName: precomputedName || opName || "Marketing Manager",
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
      operatorName: precomputedName || opName || "Sales Admin Manager",
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
      operatorName:
        precomputedName || opName || "Sales Admin Manager, Marketing Manager",
      stepDescription: "อนุมัติงบส่งเสริมการขายและการตลาดคู่ขนาน",
    };
  }

  const dirNames = approverDirectory?.salesDirectorEmployees || [];
  const opName = dirNames.length > 0 ? dirNames.join(", ") : null;
  return {
    roleName: "Sales Director",
    roleTitleTh: "ผู้จัดการฝ่ายขาย",
    displayRole: "Sales Director",
    operatorName: precomputedName || opName || "Sales Director",
    stepDescription: "อนุมัติงบประมาณ",
  };
}

// -------------------------------------------------------------
// Step 4: Helper Approval (Manager of Requested Helper)
// -------------------------------------------------------------
export function resolveHelperApprover(
  plan: any,
  approverDirectory?: ApproverDirectoryContext | null,
  precomputedName?: string | null,
): CurrentOperatorInfo {
  if (plan.helpers && plan.helpers.length > 0) {
    const pendingHelpers = plan.helpers.filter(
      (h: any) => h.status === "PENDING" && !h.respondedAt,
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
        operatorName: precomputedName || opName || "Sales Admin Manager",
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
        operatorName: precomputedName || opName || "Marketing Manager",
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
        operatorName:
          precomputedName || opName || "Sales Admin Manager, Marketing Manager",
        stepDescription: "อนุมัติพนักงานช่วยงานทั้งฝ่ายขายและการตลาด",
      };
    }
  }

  const fallbackEmp = formatEmployeeName(plan.currentApprover?.name);
  return {
    roleName: "Department Manager",
    roleTitleTh: "ผู้จัดการต้นสังกัดของผู้ช่วยงาน",
    displayRole: "ผู้จัดการต้นสังกัดของผู้ช่วย",
    operatorName:
      precomputedName || fallbackEmp || "ผู้จัดการต้นสังกัดของผู้ช่วย",
    stepDescription: "อนุมัติพนักงานช่วยงาน",
  };
}

// -------------------------------------------------------------
// Main Facade: Resolves operator based on plan status
// -------------------------------------------------------------
export function resolveCurrentOperator(
  plan?: any,
  approverDirectory?: ApproverDirectoryContext | null,
): CurrentOperatorInfo | null {
  if (!plan || !plan.status) return null;

  // Terminal / Non-pending statuses
  if (
    plan.status === "APPROVED" ||
    plan.status === "REJECTED" ||
    plan.status === "CANCELLED" ||
    plan.status === "DRAFT"
  ) {
    return null;
  }

  const precomputedName = plan.currentOperatorName || null;

  switch (plan.status) {
    case "WAITING_FOR_CORRECTION":
      return resolveCreatorOperator(plan, precomputedName);

    case "PENDING_LINE_APPROVAL":
      return resolveLineApprover(plan, precomputedName);

    case "PENDING_MARKETING_APPROVAL":
      return resolveMarketingWithdrawalApprover(precomputedName);

    case "PENDING_CANCELLATION":
      return resolveCancellationApprover(plan, precomputedName);

    case "PENDING_BUDGET_APPROVAL":
      return resolveBudgetApprover(plan, approverDirectory, precomputedName);

    case "PENDING_HELPER_APPROVAL":
      return resolveHelperApprover(plan, approverDirectory, precomputedName);

    default:
      return null;
  }
}
