import {
  ActivityStatus,
  ActivityHelperStatus,
  CalendarEventStatus,
} from "@prisma/client";
import { db as prisma } from "../lib/db";
import { applyDataScope, canAccessRecord } from "../lib/data-scope";
import { seedWorkflowTestUsers } from "../prisma/seed/activity/workflow-test-users";
import { seedActivityTypes } from "../prisma/seed/activity/activity-types";
import {
  syncActivityPlanToCalendarUseCase,
  listActivityCalendarEventsUseCase,
  recordActivityResultUseCase,
} from "../modules/activity-plans/application";

interface TestResult {
  id: string;
  scenario: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
  error?: string;
}

const results: TestResult[] = [];

async function logResult(
  id: string,
  scenario: string,
  expected: string,
  actual: string,
  passed: boolean,
  error?: string,
) {
  const status = passed ? "PASS" : "FAIL";
  results.push({ id, scenario, expected, actual, status, error });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} [${id}] ${scenario} -> ${status} (Actual: ${actual})`);
  if (error) console.error(`   Error details:`, error);
}

async function runHelperAccessTests() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("🚀 STARTING HELPER ACCESS & DATA SCOPE AUTOMATED TEST SUITE");
  console.log("═════════════════════════════════════════════════════════════════\n");

  // Step 0: Ensure Test Users
  const seedData = await seedWorkflowTestUsers(prisma);
  const { uPromoter, uSales, uAreaMgr, uSalesAdmin, uMktMgr, uSalesDir } = seedData.users;
  const { empPromoter, empSales, empAreaMgr, empSalesAdmin, empMktMgr, empSalesDir, empMktStaff } = seedData.employees;

  await seedActivityTypes(prisma);
  const allTypes = await prisma.activityType.findMany();
  const type1 = allTypes.find((t) => t.code === "TYPE_1") || allTypes[0];

  // Clean old test plans for helper tests
  const oldPlans = await prisma.activityPlan.findMany({
    where: { code: { startsWith: "HELPER-TEST-" } },
    select: { id: true },
  });
  const oldPlanIds = oldPlans.map((p) => p.id);
  if (oldPlanIds.length > 0) {
    const oldCalEvents = await prisma.activityCalendarEvent.findMany({
      where: { activityPlanId: { in: oldPlanIds } },
      select: { id: true },
    });
    const oldCalEventIds = oldCalEvents.map((e) => e.id);
    if (oldCalEventIds.length > 0) {
      await prisma.activityCalendarAttendee.deleteMany({
        where: { calendarEventId: { in: oldCalEventIds } },
      });
      await prisma.activityCalendarEvent.deleteMany({
        where: { id: { in: oldCalEventIds } },
      });
    }
    await prisma.activityResult.deleteMany({ where: { activityPlanId: { in: oldPlanIds } } });
    await prisma.activityHelper.deleteMany({ where: { activityPlanId: { in: oldPlanIds } } });
    await prisma.activityPlanWorkType.deleteMany({ where: { activityPlanId: { in: oldPlanIds } } });
    await prisma.activityPlan.deleteMany({ where: { id: { in: oldPlanIds } } });
  }

  const now = new Date();
  const tomorrow = new Date(Date.now() + 86400000);

  // Helper session mocks
  const promoterSession: any = {
    user: {
      id: uPromoter.id,
      name: uPromoter.name,
      employeeId: empPromoter.id,
      roles: ["activity_promoter"],
      dataAccessByResource: { activity_plan: "VIEW_OWN" },
    },
  };

  const salesSession: any = {
    user: {
      id: uSales.id,
      name: uSales.name,
      employeeId: empSales.id,
      roles: ["activity_sales_employee"],
      dataAccessByResource: { activity_plan: "VIEW_OWN" },
    },
  };

  const areaMgrSession: any = {
    user: {
      id: uAreaMgr.id,
      name: uAreaMgr.name,
      employeeId: empAreaMgr.id,
      roles: ["activity_area_manager"],
      dataAccessByResource: { activity_plan: "VIEW_TEAM" },
    },
  };

  const salesDirSession: any = {
    user: {
      id: uSalesDir.id,
      name: uSalesDir.name,
      employeeId: empSalesDir.id,
      roles: ["activity_sales_director"],
      dataAccessByResource: { activity_plan: "VIEW_ALL" },
    },
  };

  // Create test plans
  // Plan A: Created by Promoter
  const planA = await prisma.activityPlan.create({
    data: {
      code: "HELPER-TEST-001",
      title: "Plan A (Promoter Created)",
      objective: "Test Own Created Visibility",
      activityTypeId: type1.id,
      startDate: now,
      endDate: tomorrow,
      fiscalYear: 2026,
      fiscalMonth: 9,
      fiscalQuarter: 4,
      status: ActivityStatus.APPROVED,
      employeeId: empPromoter.id,
      createdById: uPromoter.id,
    },
  });

  // Plan B: Created by Area Manager, with Promoter as APPROVED Helper
  const planB = await prisma.activityPlan.create({
    data: {
      code: "HELPER-TEST-002",
      title: "Plan B (Area Manager Created - Promoter Approved Helper)",
      objective: "Test Approved Helper Visibility",
      activityTypeId: type1.id,
      startDate: now,
      endDate: tomorrow,
      fiscalYear: 2026,
      fiscalMonth: 9,
      fiscalQuarter: 4,
      status: ActivityStatus.APPROVED,
      employeeId: empAreaMgr.id,
      createdById: uAreaMgr.id,
      helpers: {
        create: [
          {
            employeeId: empPromoter.id,
            departmentName: "แผนกส่งเสริมการขาย",
            status: ActivityHelperStatus.APPROVED,
          },
        ],
      },
    },
  });

  // Plan C: Created by Sales, with Promoter as PENDING Helper
  const planC = await prisma.activityPlan.create({
    data: {
      code: "HELPER-TEST-003",
      title: "Plan C (Sales Created - Promoter Pending Helper)",
      objective: "Test Pending Helper Invisibility",
      activityTypeId: type1.id,
      startDate: now,
      endDate: tomorrow,
      fiscalYear: 2026,
      fiscalMonth: 9,
      fiscalQuarter: 4,
      status: ActivityStatus.PENDING_LINE_APPROVAL,
      employeeId: empSales.id,
      createdById: uSales.id,
      helpers: {
        create: [
          {
            employeeId: empPromoter.id,
            departmentName: "แผนกส่งเสริมการขาย",
            status: ActivityHelperStatus.PENDING,
          },
        ],
      },
    },
  });

  // Plan D: Created by Sales, with Promoter as REJECTED Helper
  const planD = await prisma.activityPlan.create({
    data: {
      code: "HELPER-TEST-004",
      title: "Plan D (Sales Created - Promoter Rejected Helper)",
      objective: "Test Rejected Helper Invisibility",
      activityTypeId: type1.id,
      startDate: now,
      endDate: tomorrow,
      fiscalYear: 2026,
      fiscalMonth: 9,
      fiscalQuarter: 4,
      status: ActivityStatus.PENDING_LINE_APPROVAL,
      employeeId: empSales.id,
      createdById: uSales.id,
      helpers: {
        create: [
          {
            employeeId: empPromoter.id,
            departmentName: "แผนกส่งเสริมการขาย",
            status: ActivityHelperStatus.REJECTED,
          },
        ],
      },
    },
  });

  // Plan E: Created by Sales, with Promoter as DELETED Helper
  const planE = await prisma.activityPlan.create({
    data: {
      code: "HELPER-TEST-005",
      title: "Plan E (Sales Created - Promoter Deleted Helper)",
      objective: "Test Deleted Helper Invisibility",
      activityTypeId: type1.id,
      startDate: now,
      endDate: tomorrow,
      fiscalYear: 2026,
      fiscalMonth: 9,
      fiscalQuarter: 4,
      status: ActivityStatus.PENDING_LINE_APPROVAL,
      employeeId: empSales.id,
      createdById: uSales.id,
      helpers: {
        create: [
          {
            employeeId: empPromoter.id,
            departmentName: "แผนกส่งเสริมการขาย",
            status: ActivityHelperStatus.APPROVED,
            deletedAt: new Date(),
          },
        ],
      },
    },
  });

  // Sync Plan A and Plan B to Calendar
  await syncActivityPlanToCalendarUseCase(planA);
  await syncActivityPlanToCalendarUseCase(planB);

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Own Created -> เห็นใน List View
  // ─────────────────────────────────────────────────────────────
  try {
    const where: any = { deletedAt: null, code: { in: ["HELPER-TEST-001", "HELPER-TEST-002", "HELPER-TEST-003", "HELPER-TEST-004", "HELPER-TEST-005"] } };
    await applyDataScope(where, promoterSession, "activity_plan");
    const found = await prisma.activityPlan.findMany({ where, select: { code: true } });
    const hasPlanA = found.some((p) => p.code === "HELPER-TEST-001");

    await logResult(
      "HLP-001",
      "List View: Own Created is visible",
      "Plan A is found",
      `hasPlanA: ${hasPlanA}`,
      hasPlanA,
    );
  } catch (err: any) {
    await logResult("HLP-001", "List View: Own Created is visible", "Plan A is found", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Approved Helper -> เห็นใน List View
  // ─────────────────────────────────────────────────────────────
  try {
    const where: any = { deletedAt: null, code: { in: ["HELPER-TEST-001", "HELPER-TEST-002", "HELPER-TEST-003", "HELPER-TEST-004", "HELPER-TEST-005"] } };
    await applyDataScope(where, promoterSession, "activity_plan");
    const found = await prisma.activityPlan.findMany({ where, select: { code: true } });
    const hasPlanB = found.some((p) => p.code === "HELPER-TEST-002");

    await logResult(
      "HLP-002",
      "List View: Approved Helper is visible",
      "Plan B is found",
      `hasPlanB: ${hasPlanB}`,
      hasPlanB,
    );
  } catch (err: any) {
    await logResult("HLP-002", "List View: Approved Helper is visible", "Plan B is found", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Pending Helper -> ไม่เห็นใน List View
  // ─────────────────────────────────────────────────────────────
  try {
    const where: any = { deletedAt: null, code: { in: ["HELPER-TEST-001", "HELPER-TEST-002", "HELPER-TEST-003", "HELPER-TEST-004", "HELPER-TEST-005"] } };
    await applyDataScope(where, promoterSession, "activity_plan");
    const found = await prisma.activityPlan.findMany({ where, select: { code: true } });
    const hasPlanC = found.some((p) => p.code === "HELPER-TEST-003");

    await logResult(
      "HLP-003",
      "List View: Pending Helper is NOT visible",
      "Plan C is not found",
      `hasPlanC: ${hasPlanC}`,
      !hasPlanC,
    );
  } catch (err: any) {
    await logResult("HLP-003", "List View: Pending Helper is NOT visible", "Plan C is not found", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Rejected Helper -> ไม่เห็นใน List View
  // ─────────────────────────────────────────────────────────────
  try {
    const where: any = { deletedAt: null, code: { in: ["HELPER-TEST-001", "HELPER-TEST-002", "HELPER-TEST-003", "HELPER-TEST-004", "HELPER-TEST-005"] } };
    await applyDataScope(where, promoterSession, "activity_plan");
    const found = await prisma.activityPlan.findMany({ where, select: { code: true } });
    const hasPlanD = found.some((p) => p.code === "HELPER-TEST-004");

    await logResult(
      "HLP-004",
      "List View: Rejected Helper is NOT visible",
      "Plan D is not found",
      `hasPlanD: ${hasPlanD}`,
      !hasPlanD,
    );
  } catch (err: any) {
    await logResult("HLP-004", "List View: Rejected Helper is NOT visible", "Plan D is not found", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Deleted Helper -> ไม่เห็นใน List View
  // ─────────────────────────────────────────────────────────────
  try {
    const where: any = { deletedAt: null, code: { in: ["HELPER-TEST-001", "HELPER-TEST-002", "HELPER-TEST-003", "HELPER-TEST-004", "HELPER-TEST-005"] } };
    await applyDataScope(where, promoterSession, "activity_plan");
    const found = await prisma.activityPlan.findMany({ where, select: { code: true } });
    const hasPlanE = found.some((p) => p.code === "HELPER-TEST-005");

    await logResult(
      "HLP-005",
      "List View: Deleted Helper is NOT visible",
      "Plan E is not found",
      `hasPlanE: ${hasPlanE}`,
      !hasPlanE,
    );
  } catch (err: any) {
    await logResult("HLP-005", "List View: Deleted Helper is NOT visible", "Plan E is not found", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Helper Detail -> canAccessRecord อนุญาตให้เปิด Detail
  // ─────────────────────────────────────────────────────────────
  try {
    const planBWithHelpers = await prisma.activityPlan.findUnique({
      where: { id: planB.id },
      include: { helpers: true, employee: true },
    });

    const canPromoterAccessPlanB = await canAccessRecord(promoterSession, "activity_plan", {
      resourceOwnerId: planBWithHelpers?.createdById,
      resourceEmployeeId: planBWithHelpers?.employeeId,
      resourceDepartmentId: planBWithHelpers?.employee?.departmentId,
      resourceHelpers: planBWithHelpers?.helpers,
    });

    // Verify unrelated user (Sales) cannot access Plan B
    const canSalesAccessPlanB = await canAccessRecord(salesSession, "activity_plan", {
      resourceOwnerId: planBWithHelpers?.createdById,
      resourceEmployeeId: planBWithHelpers?.employeeId,
      resourceDepartmentId: planBWithHelpers?.employee?.departmentId,
      resourceHelpers: planBWithHelpers?.helpers,
    });

    const passed = canPromoterAccessPlanB === true && canSalesAccessPlanB === false;

    await logResult(
      "HLP-006",
      "Detail View: Approved Helper can access Detail, Unrelated user blocked",
      "Promoter can access (true), Sales blocked (false)",
      `canPromoter: ${canPromoterAccessPlanB}, canSales: ${canSalesAccessPlanB}`,
      passed,
    );
  } catch (err: any) {
    await logResult("HLP-006", "Detail View Helper Access", "Promoter=true, Sales=false", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Helper Calendar -> เห็นเฉพาะกิจกรรมที่เกี่ยวข้อง (Own + Helper)
  // ─────────────────────────────────────────────────────────────
  try {
    const calRes = await listActivityCalendarEventsUseCase({
      employeeId: empPromoter.id,
      viewAll: false,
    });

    const eventIds = calRes.events.map((e) => e.activityPlanId);
    const hasOwnPlanA = eventIds.includes(planA.id);
    const hasHelperPlanB = eventIds.includes(planB.id);

    const passed = hasOwnPlanA && hasHelperPlanB;

    await logResult(
      "HLP-007",
      "Calendar: Helper sees only own + approved helper events",
      "Plan A (Own) and Plan B (Helper) are in Calendar",
      `hasPlanA: ${hasOwnPlanA}, hasPlanB: ${hasHelperPlanB}, totalEvents: ${calRes.events.length}`,
      passed,
    );
  } catch (err: any) {
    await logResult("HLP-007", "Calendar Helper Access", "Plan A & Plan B present", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 8: Sales Director Calendar -> เห็นทั้งหมด (viewAll: true)
  // ─────────────────────────────────────────────────────────────
  try {
    const calDirRes = await listActivityCalendarEventsUseCase({
      employeeId: empSalesDir.id,
      viewAll: true,
    });

    const eventIds = calDirRes.events.map((e) => e.activityPlanId);
    const hasAll = eventIds.includes(planA.id) && eventIds.includes(planB.id);

    await logResult(
      "HLP-008",
      "Calendar: Sales Director with VIEW_ALL sees all events",
      "All company events visible",
      `hasAll: ${hasAll}, totalEvents: ${calDirRes.events.length}`,
      hasAll,
    );
  } catch (err: any) {
    await logResult("HLP-008", "Calendar Sales Director VIEW_ALL", "All visible", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 9: Manager VIEW_TEAM -> เห็น Team ตาม Scope (teamEmployeeIds)
  // ─────────────────────────────────────────────────────────────
  try {
    // Area Manager team includes empAreaMgr and subordinates (empSales, empPromoter)
    const calTeamRes = await listActivityCalendarEventsUseCase({
      employeeId: empAreaMgr.id,
      viewAll: false,
      teamEmployeeIds: [empAreaMgr.id, empPromoter.id],
    });

    const eventIds = calTeamRes.events.map((e) => e.activityPlanId);
    const hasTeamEvents = eventIds.includes(planA.id) && eventIds.includes(planB.id);

    await logResult(
      "HLP-009",
      "Calendar: Manager with VIEW_TEAM sees Team activities",
      "Team plans visible without losing scope",
      `hasTeamEvents: ${hasTeamEvents}`,
      hasTeamEvents,
    );
  } catch (err: any) {
    await logResult("HLP-009", "Calendar Manager VIEW_TEAM", "Team plans visible", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 10: Helper -> ห้าม Record Actual (Backend Authorization)
  // ─────────────────────────────────────────────────────────────
  try {
    // Promoter attempts to record actual on Plan B (where they are only Helper, not Creator)
    const recordAsHelperRes = await recordActivityResultUseCase(
      planB.id,
      uPromoter.id,
      {
        actualStartDate: now,
        actualEndDate: tomorrow,
        resultStatus: "COMPLETED",
        resultSummary: "Helper attempt",
      },
    );

    const isBlocked = recordAsHelperRes.success === false &&
      (recordAsHelperRes.error || "").includes("เฉพาะผู้สร้างแผนงาน (Creator)");

    await logResult(
      "HLP-010",
      "Record Actual: Helper is FORBIDDEN from recording actual results",
      "Backend rejects with Creator-only error",
      `success: ${recordAsHelperRes.success}, error: "${recordAsHelperRes.error}"`,
      isBlocked,
    );
  } catch (err: any) {
    await logResult("HLP-010", "Record Actual Helper blocked", "Backend rejects", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 11: Creator -> Record Actual ได้ (Backend Authorization)
  // ─────────────────────────────────────────────────────────────
  try {
    // Promoter records actual on Plan A (where they ARE the Creator)
    const recordAsCreatorRes = await recordActivityResultUseCase(
      planA.id,
      uPromoter.id,
      {
        actualStartDate: now,
        actualEndDate: tomorrow,
        resultStatus: "COMPLETED",
        resultSummary: "Creator successfully recorded result",
      },
    );

    const isSuccess = recordAsCreatorRes.success === true;

    await logResult(
      "HLP-011",
      "Record Actual: Creator CAN record actual results",
      "Backend allows recording successfully",
      `success: ${recordAsCreatorRes.success}`,
      isSuccess,
    );
  } catch (err: any) {
    await logResult("HLP-011", "Record Actual Creator allowed", "Success=true", "ERROR", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("📊 HELPER ACCESS & DATA SCOPE TEST EXECUTION SUMMARY");
  console.log("═════════════════════════════════════════════════════════════════");
  console.table(
    results.map((r) => ({
      ID: r.id,
      Scenario: r.scenario,
      Expected: r.expected,
      Actual: r.actual,
      Status: r.status,
    })),
  );

  const passedCount = results.filter((r) => r.status === "PASS").length;
  const failedCount = results.filter((r) => r.status === "FAIL").length;
  console.log(`\nTotal Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runHelperAccessTests()
  .catch((err) => {
    console.error("Fatal Test Suite Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
