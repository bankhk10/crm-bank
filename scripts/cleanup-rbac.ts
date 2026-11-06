import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  console.log("🧹 Starting Comprehensive RBAC & Test Data Cleanup...\n");

  const testEmails = [
    // Group 3.1: Workflow Test Users
    "test.areamgr@crm.local",
    "test.districtmgr@crm.local",
    "test.mktmgr@crm.local",
    "test.mktstaff@crm.local",
    "test.promoter@crm.local",
    "test.salesadmin@crm.local",
    "test.sales@crm.local",
    "test.salesdir@crm.local",
    "sales-promotion.test@example.com",
    // Group 3.2: Dummy / Random Test Users
    "a001@gmail.com",
    "a002@gmail.com",
    "a0@gmail.com",
    "asd@gmail.com",
    "cccccc@gmail.com",
    "dsadsadsa@gmail.com",
    "dsadsa@gmail.com",
    "dsasdasda@gmail.com",
    "dsasdsda@gmail.com",
    "dsdsasads@gmail.com",
    "hhh@gmail.com",
    "qasdd@gmail.com",
    "saddsadsa@gmail.com",
    "saddsadsasda@gmail.com",
    "sadds@gmail.com",
    "sadsadsa@gmail.com",
    "sdaasasddsaaasda@gmail.com",
  ];

  const permissionsToDelete = [
    // 6 test_activity permissions
    "menu.test_activity",
    "menu.test_activity.trip_plan",
    "menu.test_activity.activity_report",
    "menu.test_activity.budget_report",
    "menu.test_activity.customer_report",
    "menu.test_activity.reports",
    // 17 duplicate activity_plan.* permissions
    "activity_plan.view",
    "activity_plan.view_own",
    "activity_plan.view_calendar",
    "activity_plan.view_pending",
    "activity_plan.create",
    "activity_plan.edit",
    "activity_plan.submit",
    "activity_plan.record_actual",
    "activity_plan.edit_actual",
    "activity_plan.approve",
    "activity_plan.reject",
    "activity_plan.request_correction",
    "activity_plan.approve_sales_promotion_budget",
    "activity_plan.approve_marketing_budget",
    "activity_plan.approve_total_budget",
    "activity_plan.review_sales_helper",
    "activity_plan.review_marketing_helper",
  ];

  const rolesToDelete = [
    "area_manager",
    "sales",
    "activity_plan_admin",
    "activity_plan_approver",
    "activity_plan_user",
    "sales_promotion",
    "sales_promotion_supervisor",
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: Migrate Real Staff to activity_promoter Role
  // ──────────────────────────────────────────────────────────────────────────
  console.log("👉 Step 1: Migrating real staff to activity_promoter role...");
  const realStaffEmails = [
    "warapornboonaoi1@gmail.com",
    "koiijai14@gmail.com",
    "mueanfan011199@gmail.com",
    "marchmellow2541@gmail.com",
  ];

  let activityPromoterRole = await db.role.findUnique({
    where: { slug: "activity_promoter" },
  });

  if (!activityPromoterRole) {
    activityPromoterRole = await db.role.create({
      data: {
        name: "พนักงานส่งเสริมการขาย-กิจกรรม",
        slug: "activity_promoter",
        description: "พนักงานส่งเสริมการขาย - สร้าง/ส่งแผนงานกิจกรรมภาคสนาม และบันทึกผลงานจริง",
        isActive: true,
      },
    });
  }

  for (const email of realStaffEmails) {
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      await db.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: activityPromoterRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: activityPromoterRole.id,
        },
      });
      console.log(`   ✓ Assured activity_promoter role for ${email}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2: Clean up Activity Plans created by test users / employees
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n👉 Step 2: Cleaning up Activity Plans associated with test accounts...");
  const testUsers = await db.user.findMany({
    where: { email: { in: testEmails } },
    select: { id: true, email: true },
  });
  const testUserIds = testUsers.map((u) => u.id);

  const testEmployees = await db.employee.findMany({
    where: {
      OR: [
        { email: { in: testEmails } },
        { userId: { in: testUserIds } },
      ],
    },
    select: { id: true, email: true },
  });
  const testEmployeeIds = testEmployees.map((e) => e.id);

  // Delete activity helpers linked to test employees or test plans
  const deletedHelpers = await db.activityHelper.deleteMany({
    where: {
      OR: [
        { employeeId: { in: testEmployeeIds } },
        { activityPlan: { createdById: { in: testUserIds } } },
        { activityPlan: { employeeId: { in: testEmployeeIds } } },
      ],
    },
  });
  console.log(`   - Deleted ${deletedHelpers.count} ActivityHelper records.`);

  // Delete activity calendar attendees linked to test employees
  const deletedAttendees = await db.activityCalendarAttendee.deleteMany({
    where: {
      employeeId: { in: testEmployeeIds },
    },
  });
  console.log(`   - Deleted ${deletedAttendees.count} ActivityCalendarAttendee records.`);

  // Delete activity calendar events created by test employees
  const deletedEvents = await db.activityCalendarEvent.deleteMany({
    where: {
      employeeId: { in: testEmployeeIds },
    },
  });
  console.log(`   - Deleted ${deletedEvents.count} ActivityCalendarEvent records.`);

  // Delete actual activity plans
  const deletedPlans = await db.activityPlan.deleteMany({
    where: {
      OR: [
        { createdById: { in: testUserIds } },
        { employeeId: { in: testEmployeeIds } },
      ],
    },
  });
  console.log(`   - Deleted ${deletedPlans.count} ActivityPlan records.`);

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: Clean up Overrides & UserRoles for test users
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n👉 Step 3: Cleaning up Permission Overrides & UserRoles for test accounts...");
  const deletedOverrides = await db.userPermissionOverride.deleteMany({
    where: {
      OR: [
        { userId: { in: testUserIds } },
        { reason: "Activity Workflow Testing" },
      ],
    },
  });
  console.log(`   - Deleted ${deletedOverrides.count} UserPermissionOverride records.`);

  const deletedUserRoles = await db.userRole.deleteMany({
    where: {
      userId: { in: testUserIds },
    },
  });
  console.log(`   - Deleted ${deletedUserRoles.count} UserRole records for test users.`);

  // ──────────────────────────────────────────────────────────────────────────
  // Step 4: Disconnect hierarchy and delete test Employees & Positions
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n👉 Step 4: Deleting test Employees & Positions...");
  // Clear managerId pointing to test employees to prevent foreign key errors
  await db.employee.updateMany({
    where: { managerId: { in: testEmployeeIds } },
    data: { managerId: null },
  });

  // Also clear managerId on test employees themselves
  await db.employee.updateMany({
    where: { id: { in: testEmployeeIds } },
    data: { managerId: null },
  });

  // Delete test employees
  const deletedEmps = await db.employee.deleteMany({
    where: { id: { in: testEmployeeIds } },
  });
  console.log(`   - Deleted ${deletedEmps.count} Employee records.`);

  // Delete test positions (pos_test_*)
  const deletedPositions = await db.position.deleteMany({
    where: { id: { startsWith: "pos_test_" } },
  });
  console.log(`   - Deleted ${deletedPositions.count} Position records.`);

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5: Delete test Users
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n👉 Step 5: Deleting test Users...");
  const deletedUsers = await db.user.deleteMany({
    where: { id: { in: testUserIds } },
  });
  console.log(`   - Deleted ${deletedUsers.count} User records.`);

  // ──────────────────────────────────────────────────────────────────────────
  // Step 6: Delete duplicate & unused Permissions
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n👉 Step 6: Deleting duplicate & unused Permissions...");
  const permsToDeleteRecords = await db.permission.findMany({
    where: { key: { in: permissionsToDelete } },
    select: { id: true, key: true },
  });
  const permIdsToDelete = permsToDeleteRecords.map((p) => p.id);

  if (permIdsToDelete.length > 0) {
    const deletedRolePerms = await db.rolePermission.deleteMany({
      where: { permissionId: { in: permIdsToDelete } },
    });
    console.log(`   - Deleted ${deletedRolePerms.count} RolePermission records.`);

    const deletedPermOverrides = await db.userPermissionOverride.deleteMany({
      where: { permissionId: { in: permIdsToDelete } },
    });
    console.log(`   - Deleted ${deletedPermOverrides.count} UserPermissionOverride records.`);

    const deletedPerms = await db.permission.deleteMany({
      where: { id: { in: permIdsToDelete } },
    });
    console.log(`   - Deleted ${deletedPerms.count} Permission records.`);
  } else {
    console.log("   - No matching permissions found to delete.");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 7: Delete obsolete / legacy Roles
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n👉 Step 7: Deleting obsolete / legacy Roles...");
  const targetRoles = await db.role.findMany({
    where: { slug: { in: rolesToDelete } },
    select: { id: true, slug: true },
  });
  const roleIdsToDelete = targetRoles.map((r) => r.id);

  if (roleIdsToDelete.length > 0) {
    // Delete remaining user roles for these roles
    const remainingUserRoles = await db.userRole.deleteMany({
      where: { roleId: { in: roleIdsToDelete } },
    });
    console.log(`   - Deleted ${remainingUserRoles.count} remaining UserRole records.`);

    // Delete role permissions for these roles
    const remainingRolePerms = await db.rolePermission.deleteMany({
      where: { roleId: { in: roleIdsToDelete } },
    });
    console.log(`   - Deleted ${remainingRolePerms.count} RolePermission records.`);

    // Nullify defaultRoleId on Position if any
    await db.position.updateMany({
      where: { defaultRoleId: { in: roleIdsToDelete } },
      data: { defaultRoleId: null },
    });

    const deletedRoles = await db.role.deleteMany({
      where: { id: { in: roleIdsToDelete } },
    });
    console.log(`   - Deleted ${deletedRoles.count} Role records (${targetRoles.map(r => r.slug).join(", ")}).`);
  } else {
    console.log("   - No matching roles found to delete.");
  }

  console.log("\n✅ Database RBAC Cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

