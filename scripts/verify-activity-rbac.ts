import { db as prisma } from "../lib/db";
import bcrypt from "bcryptjs";
import { findRBACSummary } from "../modules/rbac/infrastructure/rbac.repository";

interface CheckItem {
  id: string;
  name: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
  error?: string;
}

const checks: CheckItem[] = [];

function recordCheck(
  id: string,
  name: string,
  expected: string,
  actual: string,
  passed: boolean,
  error?: string,
) {
  const status = passed ? "PASS" : "FAIL";
  checks.push({ id, name, expected, actual, status, error });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} [${id}] ${name} -> ${status} (Actual: ${actual})`);
  if (error) console.error(`   Error details:`, error);
}

async function verify() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("🔍 STARTING ACTIVITY RBAC MASTER DATA VERIFICATION SUITE");
  console.log("═════════════════════════════════════════════════════════════════\n");

  // ──────────────────────────────────────────────────────────────────────────
  // A. Role Count Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log("--- A. Role Count ---");
  const allRoles = await prisma.role.findMany({
    where: { deletedAt: null },
    include: {
      permissions: { include: { permission: true } },
      userRoles: true,
    },
    orderBy: { name: "asc" },
  });

  const expectedRoleCount = 20;
  recordCheck(
    "CHK-A-001",
    "Total Role Count (13 Existing + 7 Activity Roles = 20)",
    "20 roles",
    `${allRoles.length} roles`,
    allRoles.length === expectedRoleCount,
    allRoles.length !== expectedRoleCount ? `Expected 20, found ${allRoles.length}` : undefined,
  );

  // Check 13 Existing Roles
  const existingRoleSlugs = [
    "administrator",
    "admin",
    "ceo",
    "sales_manager",
    "sales_employee",
    "sales_admin",
    "marketing_manager",
    "employee_mk",
    "sales_promotion",
    "sales_promotion_supervisor",
    "activity_plan_user",
    "activity_plan_approver",
    "activity_plan_admin",
  ];

  const foundExistingSlugs = existingRoleSlugs.filter((slug) =>
    allRoles.some((r) => r.slug === slug),
  );
  recordCheck(
    "CHK-A-002",
    "Existing 13 Roles Preserved 100%",
    "13 roles",
    `${foundExistingSlugs.length} roles`,
    foundExistingSlugs.length === 13,
  );

  // ──────────────────────────────────────────────────────────────────────────
  // B. 7 Activity Roles Slugs & Names
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- B. 7 Activity Roles Slugs & Names ---");
  const targetActivityRoles = [
    { slug: "activity_promoter", name: "พนักงานส่งเสริมการขาย-กิจกรรม" },
    { slug: "activity_sales_employee", name: "พนักงานขาย-กิจกรรม" },
    { slug: "activity_area_manager", name: "ผู้จัดการภาค-กิจกรรม" },
    { slug: "activity_district_manager", name: "ผู้จัดการเขต-กิจกรรม" },
    { slug: "activity_sales_admin_manager", name: "ผู้จัดการแผนกบริหารงานขาย-กิจกรรม" },
    { slug: "activity_marketing_manager", name: "ผู้จัดการแผนกการตลาด-กิจกรรม" },
    { slug: "activity_sales_director", name: "ผู้จัดการฝ่ายขาย-กิจกรรม" },
  ];

  for (const target of targetActivityRoles) {
    const role = allRoles.find((r) => r.slug === target.slug);
    recordCheck(
      `CHK-B-${target.slug}`,
      `Role ${target.slug} ("${target.name}")`,
      `slug=${target.slug}, name="${target.name}"`,
      role ? `slug=${role.slug}, name="${role.name}"` : "NOT FOUND",
      !!role && role.name === target.name,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // C. Activity Permissions
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- C. Activity Permissions ---");
  const expectedPermissions = [
    "activity_plan.view",
    "activity_plan.create",
    "activity_plan.edit",
    "activity_plan.submit",
    "activity_plan.view_own",
    "activity_plan.view_pending",
    "activity_plan.approve",
    "activity_plan.reject",
    "activity_plan.request_correction",
    "activity_plan.approve_sales_promotion_budget",
    "activity_plan.approve_marketing_budget",
    "activity_plan.approve_total_budget",
    "activity_plan.review_sales_helper",
    "activity_plan.review_marketing_helper",
    "activity_plan.view_calendar",
    "activity_plan.record_actual",
    "activity_plan.edit_actual",
    "menu.activity_plans",
    "data.activity_plans",
  ];

  const allPerms = await prisma.permission.findMany({
    where: { deletedAt: null },
  });

  for (const key of expectedPermissions) {
    const perm = allPerms.find((p) => p.key === key);
    recordCheck(
      `CHK-C-${key}`,
      `Permission ${key}`,
      "Exists in DB",
      perm ? `Found (${perm.name})` : "NOT FOUND",
      !!perm,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // D. RolePermission Matrix Mapping
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- D. RolePermission Matrix Mapping ---");

  // Helper function to check role permissions
  const checkRolePerms = (
    slug: string,
    expectedKeys: string[],
    expectedDataAccess?: string,
  ) => {
    const role = allRoles.find((r) => r.slug === slug);
    if (!role) {
      recordCheck(`CHK-D-${slug}`, `Role ${slug} Mapping`, "Role exists", "NOT FOUND", false);
      return;
    }

    const assignedKeys = role.permissions.map((p) => p.permission.key);
    const missingKeys = expectedKeys.filter((k) => !assignedKeys.includes(k));

    let dataAccessMatches = true;
    if (expectedDataAccess) {
      const dataPerm = role.permissions.find((p) => p.permission.key === "data.activity_plans");
      dataAccessMatches = dataPerm?.dataAccess === expectedDataAccess;
    }

    const passed = missingKeys.length === 0 && dataAccessMatches;
    recordCheck(
      `CHK-D-${slug}`,
      `Role ${slug} has ${expectedKeys.length} permissions + dataScope=${expectedDataAccess}`,
      `All ${expectedKeys.length} keys + ${expectedDataAccess}`,
      `Count=${assignedKeys.length} (Missing: ${missingKeys.length > 0 ? missingKeys.join(",") : "None"}), DataAccess=${role.permissions.find((p) => p.permission.key === "data.activity_plans")?.dataAccess}`,
      passed,
    );
  };

  // Promoter: 10 perms
  checkRolePerms(
    "activity_promoter",
    [
      "activity_plan.view",
      "activity_plan.create",
      "activity_plan.edit",
      "activity_plan.submit",
      "activity_plan.view_own",
      "activity_plan.view_calendar",
      "activity_plan.record_actual",
      "activity_plan.edit_actual",
      "menu.activity_plans",
      "data.activity_plans",
    ],
    "VIEW_OWN",
  );

  // Sales Employee: 14 perms
  checkRolePerms(
    "activity_sales_employee",
    [
      "activity_plan.view",
      "activity_plan.create",
      "activity_plan.edit",
      "activity_plan.submit",
      "activity_plan.view_own",
      "activity_plan.view_pending",
      "activity_plan.approve",
      "activity_plan.reject",
      "activity_plan.request_correction",
      "activity_plan.view_calendar",
      "activity_plan.record_actual",
      "activity_plan.edit_actual",
      "menu.activity_plans",
      "data.activity_plans",
    ],
    "VIEW_TEAM",
  );

  // Area Manager: 14 perms
  checkRolePerms(
    "activity_area_manager",
    [
      "activity_plan.view",
      "activity_plan.create",
      "activity_plan.edit",
      "activity_plan.submit",
      "activity_plan.view_own",
      "activity_plan.view_pending",
      "activity_plan.approve",
      "activity_plan.reject",
      "activity_plan.request_correction",
      "activity_plan.view_calendar",
      "activity_plan.record_actual",
      "activity_plan.edit_actual",
      "menu.activity_plans",
      "data.activity_plans",
    ],
    "VIEW_TEAM",
  );

  // District Manager: 14 perms
  checkRolePerms(
    "activity_district_manager",
    [
      "activity_plan.view",
      "activity_plan.create",
      "activity_plan.edit",
      "activity_plan.submit",
      "activity_plan.view_own",
      "activity_plan.view_pending",
      "activity_plan.approve",
      "activity_plan.reject",
      "activity_plan.request_correction",
      "activity_plan.view_calendar",
      "activity_plan.record_actual",
      "activity_plan.edit_actual",
      "menu.activity_plans",
      "data.activity_plans",
    ],
    "VIEW_TEAM",
  );

  // Sales Admin Manager: 16 perms
  checkRolePerms(
    "activity_sales_admin_manager",
    [
      "activity_plan.view",
      "activity_plan.create",
      "activity_plan.edit",
      "activity_plan.submit",
      "activity_plan.view_own",
      "activity_plan.view_pending",
      "activity_plan.approve",
      "activity_plan.reject",
      "activity_plan.request_correction",
      "activity_plan.approve_sales_promotion_budget",
      "activity_plan.review_sales_helper",
      "activity_plan.view_calendar",
      "activity_plan.record_actual",
      "activity_plan.edit_actual",
      "menu.activity_plans",
      "data.activity_plans",
    ],
    "VIEW_ALL",
  );

  // Marketing Manager: 16 perms
  checkRolePerms(
    "activity_marketing_manager",
    [
      "activity_plan.view",
      "activity_plan.create",
      "activity_plan.edit",
      "activity_plan.submit",
      "activity_plan.view_own",
      "activity_plan.view_pending",
      "activity_plan.approve",
      "activity_plan.reject",
      "activity_plan.request_correction",
      "activity_plan.approve_marketing_budget",
      "activity_plan.review_marketing_helper",
      "activity_plan.view_calendar",
      "activity_plan.record_actual",
      "activity_plan.edit_actual",
      "menu.activity_plans",
      "data.activity_plans",
    ],
    "VIEW_ALL",
  );

  // Sales Director: 15 perms
  checkRolePerms(
    "activity_sales_director",
    [
      "activity_plan.view",
      "activity_plan.create",
      "activity_plan.edit",
      "activity_plan.submit",
      "activity_plan.view_own",
      "activity_plan.view_pending",
      "activity_plan.approve",
      "activity_plan.reject",
      "activity_plan.request_correction",
      "activity_plan.approve_total_budget",
      "activity_plan.view_calendar",
      "activity_plan.record_actual",
      "activity_plan.edit_actual",
      "menu.activity_plans",
      "data.activity_plans",
    ],
    "VIEW_ALL",
  );

  // ──────────────────────────────────────────────────────────────────────────
  // E. UserRole Multi-Role Assignment
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- E. UserRole Multi-Role Assignment ---");
  const testUserRoleExpectations = [
    {
      email: "test.promoter@crm.local",
      expectedActivityRole: "activity_promoter",
      legacyRoles: ["sales_promotion", "activity_plan_user"],
    },
    {
      email: "test.sales@crm.local",
      expectedActivityRole: "activity_sales_employee",
      legacyRoles: ["sales_employee"],
    },
    {
      email: "test.districtmgr@crm.local",
      expectedActivityRole: "activity_district_manager",
      legacyRoles: ["sales_manager"],
    },
    {
      email: "test.areamgr@crm.local",
      expectedActivityRole: "activity_area_manager",
      legacyRoles: ["sales_manager"],
    },
    {
      email: "test.salesadmin@crm.local",
      expectedActivityRole: "activity_sales_admin_manager",
      legacyRoles: ["sales_manager"],
    },
    {
      email: "test.mktmgr@crm.local",
      expectedActivityRole: "activity_marketing_manager",
      legacyRoles: ["marketing_manager"],
    },
    {
      email: "test.salesdir@crm.local",
      expectedActivityRole: "activity_sales_director",
      legacyRoles: ["sales_manager"],
    },
    {
      email: "test.mktstaff@crm.local",
      expectedActivityRole: undefined, // stays employee_mk
      legacyRoles: ["employee_mk"],
    },
  ];

  for (const exp of testUserRoleExpectations) {
    const user = await prisma.user.findUnique({
      where: { email: exp.email },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      recordCheck(`CHK-E-${exp.email}`, `User ${exp.email} Exists`, "User exists", "NOT FOUND", false);
      continue;
    }

    const currentSlugs = user.userRoles.map((ur) => ur.role.slug);
    const hasActivityRole = exp.expectedActivityRole ? currentSlugs.includes(exp.expectedActivityRole) : true;
    const hasLegacyRoles = exp.legacyRoles.every((r) => currentSlugs.includes(r));

    recordCheck(
      `CHK-E-${exp.email}`,
      `User ${exp.email} multi-role assignment`,
      `Legacy: [${exp.legacyRoles.join(",")}] + Activity: ${exp.expectedActivityRole || "None"}`,
      `Current: [${currentSlugs.join(",")}]`,
      hasActivityRole && hasLegacyRoles,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // F. District Manager Login & Employee Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- F. District Manager Login & Organization Structure ---");
  const districtMgrUser = await prisma.user.findUnique({
    where: { email: "test.districtmgr@crm.local" },
    include: {
      employeeProfile: {
        include: { manager: true, position: true, department: true },
      },
      userRoles: { include: { role: true } },
    },
  });

  if (!districtMgrUser) {
    recordCheck("CHK-F-USER", "District Manager User Record", "User exists", "NOT FOUND", false);
  } else {
    // Check password hash match
    const passwordMatch = await bcrypt.compare("password123", districtMgrUser.password);
    recordCheck(
      "CHK-F-AUTH",
      "District Manager Password Auth (password123)",
      "Valid password",
      passwordMatch ? "Valid (Match)" : "Invalid",
      passwordMatch,
    );

    // Check employee record & managerId
    const emp = districtMgrUser.employeeProfile;
    recordCheck(
      "CHK-F-EMP",
      "District Manager Employee Record",
      "Employee exists with position 'ผู้จัดการเขต'",
      emp ? `Found (${emp.positionTitle})` : "NO EMPLOYEE PROFILE",
      !!emp && emp.positionTitle === "ผู้จัดการเขต",
    );

    const reportsToAreaMgr = emp?.manager?.email === "test.areamgr@crm.local";
    recordCheck(
      "CHK-F-HIERARCHY",
      "District Manager reports to Area Manager (managerId = empAreaMgr.id)",
      "Manager email = test.areamgr@crm.local",
      emp?.manager ? `Manager email = ${emp.manager.email}` : "NO MANAGER SET",
      reportsToAreaMgr,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // G. RBAC Console findRBACSummary Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- G. RBAC Console Data Verification ---");
  const summary = await findRBACSummary();
  const summaryRoles = summary.roles;

  const foundInSummary = targetActivityRoles.filter((target) =>
    summaryRoles.some((r) => r.slug === target.slug),
  );

  recordCheck(
    "CHK-G-SUMMARY",
    "findRBACSummary() returns all 7 Activity Roles for /rbac Console",
    "7 activity roles in summary.roles",
    `${foundInSummary.length}/7 roles present`,
    foundInSummary.length === 7,
  );

  console.log("\n═════════════════════════════════════════════════════════════════");
  const failed = checks.filter((c) => c.status === "FAIL");
  if (failed.length === 0) {
    console.log(`🎉 ALL ${checks.length} VERIFICATION CHECKS PASSED SUCCESSFULLY! (100%)`);
  } else {
    console.error(`❌ ${failed.length} of ${checks.length} CHECKS FAILED:`);
    for (const f of failed) {
      console.error(`   - [${f.id}] ${f.name}: Expected ${f.expected}, got ${f.actual}`);
    }
  }
  console.log("═════════════════════════════════════════════════════════════════\n");

  await prisma.$disconnect();

  if (failed.length > 0) {
    process.exit(1);
  }
}

verify().catch(async (e) => {
  console.error("Verification failed with exception:", e);
  await prisma.$disconnect();
  process.exit(1);
});
