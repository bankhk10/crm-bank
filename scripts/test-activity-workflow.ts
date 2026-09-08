import {
  ActivityStatus,
  ActivityHelperStatus,
  CalendarEventStatus,
  CalendarAttendeeRole,
} from "@prisma/client";
import { db as prisma } from "../lib/db";
import { seedWorkflowTestUsers } from "../prisma/seed/activity/workflow-test-users";
import { seedActivityTypes } from "../prisma/seed/activity/activity-types";
import {
  submitActivityPlanUseCase,
  approveActivityPlanUseCase,
  rejectActivityPlanUseCase,
  requestCorrectionPlanUseCase,
  syncActivityPlanToCalendarUseCase,
  cancelActivityPlanCalendarUseCase,
  listActivityCalendarEventsUseCase,
  getApprovalQueueDataUseCase,
} from "../modules/activity-plans/application";

interface TestResult {
  id: string;
  scenario: string;
  approverSequence: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
  error?: string;
}

const results: TestResult[] = [];

async function logResult(
  id: string,
  scenario: string,
  approverSequence: string,
  expected: string,
  actual: string,
  passed: boolean,
  error?: string,
) {
  const status = passed ? "PASS" : "FAIL";
  results.push({ id, scenario, approverSequence, expected, actual, status, error });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} [${id}] ${scenario} -> ${status} (Actual: ${actual})`);
  if (error) console.error(`   Error details:`, error);
}

async function runTests() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("🚀 STARTING ACTIVITY BUSINESS WORKFLOW AUTOMATED TEST SUITE");
  console.log("═════════════════════════════════════════════════════════════════\n");

  // Step 0: Ensure Test Users
  const seedData = await seedWorkflowTestUsers(prisma);
  const { uPromoter, uSales, uAreaMgr, uSalesAdmin, uMktMgr, uSalesDir } = seedData.users;
  const { empPromoter, empSales, empAreaMgr, empSalesAdmin, empMktMgr, empSalesDir, empMktStaff } = seedData.employees;

  // Ensure Activity Types exist
  await seedActivityTypes(prisma);
  const allTypes = await prisma.activityType.findMany();
  const typeMap = Object.fromEntries(allTypes.map((t) => [t.code, t]));

  // Clean old automated test plans (only AUTO-ACT-* to preserve any manual UAT data)
  const oldPlans = await prisma.activityPlan.findMany({
    where: { code: { startsWith: "AUTO-ACT-" } },
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
    await prisma.activityApprovalLog.deleteMany({ where: { activityPlanId: { in: oldPlanIds } } });
    await prisma.activityHelper.deleteMany({ where: { activityPlanId: { in: oldPlanIds } } });
    await prisma.activityPlanWorkType.deleteMany({ where: { activityPlanId: { in: oldPlanIds } } });
    await prisma.activityPlan.deleteMany({ where: { id: { in: oldPlanIds } } });
  }

  const now = new Date();
  const tomorrow = new Date(Date.now() + 86400000);

  // Helper to create test plan with fiscal dimensions
  const createTestPlan = async (data: any) => {
    const { primaryTypeCode, workTypeCodes = [], ...rest } = data;
    const startDate = rest.startDate || now;
    const endDate = rest.endDate || tomorrow;
    const primaryType = primaryTypeCode ? typeMap[primaryTypeCode] : null;

    const plan = await prisma.activityPlan.create({
      data: {
        fiscalYear: startDate.getFullYear(),
        fiscalMonth: startDate.getMonth() + 1,
        fiscalQuarter: Math.ceil((startDate.getMonth() + 1) / 3),
        durationDays: 1,
        objective: rest.objective || "ทดสอบการจัดกิจกรรม",
        status: rest.status || ActivityStatus.DRAFT,
        activityTypeId: primaryType?.id ?? null,
        ...rest,
        startDate,
        endDate,
      },
    });

    const codesToLink =
      workTypeCodes.length > 0
        ? workTypeCodes
        : primaryTypeCode
          ? [primaryTypeCode]
          : [];

    for (const wtCode of codesToLink) {
      const wt = typeMap[wtCode];
      if (wt) {
        await prisma.activityPlanWorkType.create({
          data: {
            activityPlanId: plan.id,
            activityTypeId: wt.id,
          },
        });
      }
    }

    return plan;
  };

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-001: Promoter - 4-step Line Approval, No Budget, No Helper -> Auto Calendar
  // Sequence: Promoter -> Sales -> Area Manager -> Sales Admin Manager -> APPROVED
  // ─────────────────────────────────────────────────────────────
  try {
    const plan1 = await createTestPlan({
      code: "AUTO-ACT-001",
      primaryTypeCode: "TYPE_1",
      workTypeCodes: ["TYPE_1"],
      title: "งานจัดแปลงสาธิตข้าวโพด อ.แม่ริม",
      location: "แปลงสาธิต อ.แม่ริม",
      province: "เชียงใหม่",
      district: "แม่ริม",
      objective: "ทดสอบและสาธิตผลิตภัณฑ์",
      employeeId: empPromoter.id,
      createdById: uPromoter.id,
    });

    // 1. Submit by Promoter
    await submitActivityPlanUseCase(plan1.id, uPromoter.id);
    let p = await prisma.activityPlan.findUnique({ where: { id: plan1.id } });
    if (p?.status !== ActivityStatus.PENDING_LINE_APPROVAL || p.currentApproverEmployeeId !== empSales.id) {
      throw new Error(`Expected PENDING_LINE_APPROVAL with Sales, got ${p?.status} / ${p?.currentApproverEmployeeId}`);
    }

    // 2. Approved by Salesperson
    await approveActivityPlanUseCase(plan1.id, uSales.id, "อนุมัติจาก พนง.ขาย");
    p = await prisma.activityPlan.findUnique({ where: { id: plan1.id } });
    if (p?.currentApproverEmployeeId !== empAreaMgr.id) {
      throw new Error(`Expected next approver Area Manager, got ${p?.currentApproverEmployeeId}`);
    }

    // 3. Approved by Area Manager
    await approveActivityPlanUseCase(plan1.id, uAreaMgr.id, "อนุมัติจาก ผจก.ภาค");
    p = await prisma.activityPlan.findUnique({ where: { id: plan1.id } });
    if (p?.currentApproverEmployeeId !== empSalesAdmin.id) {
      throw new Error(`Expected next approver Sales Admin Manager, got ${p?.currentApproverEmployeeId}`);
    }

    // 4. Approved by Sales Admin Manager (Terminal Line Manager)
    await approveActivityPlanUseCase(plan1.id, uSalesAdmin.id, "อนุมัติขั้นสุดท้ายตามสายงาน");
    p = await prisma.activityPlan.findUnique({ where: { id: plan1.id } });

    // Step 5: Check Calendar Event
    const calEvent = await prisma.activityCalendarEvent.findUnique({
      where: { activityPlanId: plan1.id },
      include: { attendees: true },
    });

    const passed =
      p?.status === ActivityStatus.APPROVED &&
      calEvent !== null &&
      calEvent.status === CalendarEventStatus.SCHEDULED &&
      calEvent.attendees.some((a) => a.employeeId === empPromoter.id && a.role === CalendarAttendeeRole.CREATOR);

    await logResult(
      "ACT-001",
      "Promoter: 4-step Line Approval (No Budget/No Helper)",
      "Promoter -> Sales -> Area Mgr -> Sales Admin Mgr",
      "Status: APPROVED, Calendar Event Created",
      `Status: ${p?.status}, Calendar: ${calEvent ? "Created" : "Missing"}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-001 Error:", err);
    await logResult("ACT-001", "Line Approval", "Promoter -> ... -> Sales Admin Mgr", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-002: Sales - Sales Promotion Budget (SP) Aggregated Approval
  // Sequence: Sales -> Area Mgr -> Sales Admin Mgr (Line + SP Budget in ONE Turn!) -> Sales Director (Overall)
  // ─────────────────────────────────────────────────────────────
  try {
    const plan2 = await createTestPlan({
      code: "AUTO-ACT-002",
      primaryTypeCode: "TYPE_9",
      workTypeCodes: ["TYPE_9"],
      title: "กิจกรรมส่งเสริมการขายหน้าร้าน ตลาดไท",
      location: "ตลาดไท",
      province: "ปทุมธานี",
      district: "คลองหลวง",
      objective: "กระตุ้นยอดขายหน้าร้าน",
      salesPromotionBudgetRequested: 5000,
      employeeId: empSales.id,
      createdById: uSales.id,
    });

    await submitActivityPlanUseCase(plan2.id, uSales.id);
    await approveActivityPlanUseCase(plan2.id, uAreaMgr.id, "ผจก.ภาค อนุมัติสายงาน");

    // Sales Admin Manager approves Line + SP Budget aggregated in ONE turn!
    await approveActivityPlanUseCase(plan2.id, uSalesAdmin.id, "ผจก.บริหารงานขาย อนุมัติสายงานและงบ SP 5,000");

    let p = await prisma.activityPlan.findUnique({ where: { id: plan2.id } });
    if (p?.salesPromotionApproved !== true || p?.salesManagerApproved === true || p?.status !== ActivityStatus.PENDING_BUDGET_APPROVAL) {
      throw new Error(`Expected SP approved, pending Sales Director, got status=${p?.status}, spApproved=${p?.salesPromotionApproved}`);
    }

    // Sales Director approves overall budget
    await approveActivityPlanUseCase(plan2.id, uSalesDir.id, "ผจก.ฝ่ายขาย อนุมัติภาพรวม");
    p = await prisma.activityPlan.findUnique({ where: { id: plan2.id } });

    const calEvent = await prisma.activityCalendarEvent.findUnique({ where: { activityPlanId: plan2.id } });
    const passed = p?.status === ActivityStatus.APPROVED && Number(p.totalBudgetApproved) === 5000 && calEvent !== null;

    await logResult(
      "ACT-002",
      "Sales Promotion Budget Aggregated Approval",
      "Area Mgr -> Sales Admin Mgr (Line+SP 1-turn) -> Sales Dir",
      "Status: APPROVED, SP Budget Approved: 5000, No Duplicate Turn",
      `Status: ${p?.status}, BudgetApproved: ${p?.totalBudgetApproved}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-002 Error:", err);
    await logResult("ACT-002", "Sales Promotion Budget", "Line -> Budget -> Overall", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-003: Area Mgr - Marketing Budget (MKT)
  // Sequence: Area Mgr -> Sales Admin Mgr (Line) -> MKT Manager (Budget) -> Sales Director (Overall)
  // ─────────────────────────────────────────────────────────────
  try {
    const plan3 = await createTestPlan({
      code: "AUTO-ACT-003",
      primaryTypeCode: "TYPE_8",
      workTypeCodes: ["TYPE_8"],
      title: "จัดประชุมเกษตรกรและสัมมนาวิชาการ",
      location: "โรงแรมริมน้ำ",
      province: "สุพรรณบุรี",
      district: "เมือง",
      objective: "แนะนำผลิตภัณฑ์ใหม่",
      marketingBudgetRequested: 8000,
      employeeId: empAreaMgr.id,
      createdById: uAreaMgr.id,
    });

    await submitActivityPlanUseCase(plan3.id, uAreaMgr.id);
    await approveActivityPlanUseCase(plan3.id, uSalesAdmin.id, "ผจก.บริหารงานขาย อนุมัติสายงาน");

    // Marketing Manager approves MKT Budget
    await approveActivityPlanUseCase(plan3.id, uMktMgr.id, "ผจก.การตลาด อนุมัติงบการตลาด 8,000");

    // Sales Director approves overall budget
    await approveActivityPlanUseCase(plan3.id, uSalesDir.id, "ผจก.ฝ่ายขาย อนุมัติภาพรวม");
    const p = await prisma.activityPlan.findUnique({ where: { id: plan3.id } });

    const passed = p?.status === ActivityStatus.APPROVED && Number(p.totalBudgetApproved) === 8000;
    await logResult(
      "ACT-003",
      "Marketing Budget Approval",
      "Sales Admin Mgr (Line) -> MKT Mgr (Budget) -> Sales Dir",
      "Status: APPROVED, MKT Budget Approved: 8000",
      `Status: ${p?.status}, BudgetApproved: ${p?.totalBudgetApproved}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-003 Error:", err);
    await logResult("ACT-003", "Marketing Budget", "MKT Mgr -> Sales Dir", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-004: Parallel Budget & Helpers Approval Aggregation (Business Rule Flow)
  // SP = 10,000, MKT = 15,000, Helpers = Sales Helper A & B + MKT Helper A
  // Sequence: Promoter -> Sales -> Area Mgr -> Sales Admin Mgr (Line + SP + Sales Helpers in 1 Turn)
  //           -> MKT Mgr (MKT + MKT Helper in 1 Turn) -> Sales Dir (Final Budget) -> APPROVED
  // ─────────────────────────────────────────────────────────────
  try {
    const plan4 = await createTestPlan({
      code: "AUTO-ACT-004",
      primaryTypeCode: "TYPE_10",
      workTypeCodes: ["TYPE_10"],
      title: "งานใหญ่ Field Day ประจำปี",
      location: "ศูนย์เรียนรู้การเกษตร",
      province: "นครราชสีมา",
      district: "ปากช่อง",
      objective: "งานแสดงสินค้าและสัมมนาใหญ่",
      salesPromotionBudgetRequested: 10000,
      marketingBudgetRequested: 15000,
      employeeId: empPromoter.id,
      createdById: uPromoter.id,
      helpers: {
        create: [
          { employeeId: empSales.id, departmentName: "แผนกบริหารงานขาย" },
          { employeeId: empAreaMgr.id, departmentName: "แผนกบริหารงานขาย" },
          { employeeId: empMktStaff.id, departmentName: "แผนกการตลาด" },
        ],
      },
    });

    // 1. Submit by Promoter
    await submitActivityPlanUseCase(plan4.id, uPromoter.id);

    // 2. Sales approves Line
    await approveActivityPlanUseCase(plan4.id, uSales.id, "พนง.ขาย อนุมัติสายงาน");

    // 3. Area Mgr approves Line
    await approveActivityPlanUseCase(plan4.id, uAreaMgr.id, "ผจก.ภาค อนุมัติสายงาน");

    // 4. Sales Admin Manager Turn: Line + SP 10,000 + Sales Helpers in ONE Turn!
    await approveActivityPlanUseCase(
      plan4.id,
      uSalesAdmin.id,
      "ผจก.บริหารงานขาย อนุมัติ Line + SP 10,000 + Sales Helpers",
      [empSales.id, empAreaMgr.id],
    );

    let p = await prisma.activityPlan.findUnique({
      where: { id: plan4.id },
      include: { helpers: true },
    });

    const salesHelperA = p?.helpers.find((h) => h.employeeId === empSales.id);
    const salesHelperB = p?.helpers.find((h) => h.employeeId === empAreaMgr.id);
    const mktHelperA = p?.helpers.find((h) => h.employeeId === empMktStaff.id);

    if (
      p?.salesPromotionApproved !== true ||
      salesHelperA?.status !== ActivityHelperStatus.APPROVED ||
      salesHelperB?.status !== ActivityHelperStatus.APPROVED ||
      mktHelperA?.status !== ActivityHelperStatus.PENDING
    ) {
      throw new Error("Sales Admin aggregation failed: SP or Sales Helpers not approved properly, or MKT helper affected");
    }

    // 5. Marketing Manager Turn: MKT 15,000 + Marketing Helper in ONE Turn!
    await approveActivityPlanUseCase(
      plan4.id,
      uMktMgr.id,
      "ผจก.การตลาด อนุมัติ MKT 15,000 + MKT Helper",
      [empMktStaff.id],
    );

    p = await prisma.activityPlan.findUnique({
      where: { id: plan4.id },
      include: { helpers: true },
    });

    const mktHelperAfter = p?.helpers.find((h) => h.employeeId === empMktStaff.id);
    if (p?.marketingApproved !== true || mktHelperAfter?.status !== ActivityHelperStatus.APPROVED) {
      throw new Error("Marketing Manager aggregation failed: MKT budget or MKT helper not approved");
    }

    // 6. Sales Director Turn: Final Budget 25,000
    await approveActivityPlanUseCase(plan4.id, uSalesDir.id, "ผจก.ฝ่ายขาย อนุมัติงบรวม 25,000");

    p = await prisma.activityPlan.findUnique({
      where: { id: plan4.id },
      include: { helpers: true },
    });

    // 7. Check Calendar attendees
    const calEvent = await prisma.activityCalendarEvent.findUnique({
      where: { activityPlanId: plan4.id },
      include: { attendees: true },
    });

    const hasCreator = calEvent?.attendees.some((a) => a.employeeId === empPromoter.id && a.role === "CREATOR");
    const hasHelper1 = calEvent?.attendees.some((a) => a.employeeId === empSales.id && a.role === "HELPER");
    const hasHelper2 = calEvent?.attendees.some((a) => a.employeeId === empAreaMgr.id && a.role === "HELPER");
    const hasHelper3 = calEvent?.attendees.some((a) => a.employeeId === empMktStaff.id && a.role === "HELPER");

    const passed =
      p?.status === ActivityStatus.APPROVED &&
      Number(p.totalBudgetApproved) === 25000 &&
      calEvent !== null &&
      hasCreator &&
      hasHelper1 &&
      hasHelper2 &&
      hasHelper3;

    await logResult(
      "ACT-004",
      "ACT-004 Parallel Budget & Multi-Helper Aggregated Flow",
      "Promoter -> Sales -> Area Mgr -> Sales Admin (Line+SP+Helpers) -> MKT Mgr (MKT+Helper) -> Sales Dir",
      "Status: APPROVED, Total: 25000, Calendar: Creator + 3 Helpers",
      `Status: ${p?.status}, TotalBudget: ${p?.totalBudgetApproved}, Attendees: ${calEvent?.attendees.length}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-004 Error:", err);
    await logResult("ACT-004", "ACT-004 Aggregation Flow", "Line+Budget+Helper Aggregation", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-005: Sales Helper Employee Approval (No Budget)
  // Sequence: Line -> Sales Admin Mgr (Line + Sales Helper in 1 Turn) -> APPROVED
  // ─────────────────────────────────────────────────────────────
  try {
    const plan5 = await createTestPlan({
      code: "AUTO-ACT-005",
      primaryTypeCode: "TYPE_5",
      workTypeCodes: ["TYPE_5", "TYPE_11"],
      title: "งานจัดบูธส่งเสริมการขายร่วมกับทีมภาค",
      location: "สหกรณ์การเกษตร",
      province: "ขอนแก่น",
      district: "เมือง",
      objective: "ร่วมจัดกิจกรรม",
      employeeId: empSales.id,
      createdById: uSales.id,
      helpers: {
        create: [
          {
            employeeId: empPromoter.id,
            departmentName: "แผนกบริหารงานขาย",
          },
        ],
      },
    });

    await submitActivityPlanUseCase(plan5.id, uSales.id);
    await approveActivityPlanUseCase(plan5.id, uAreaMgr.id);

    // Sales Admin Manager approves Line + Sales Helper in ONE turn!
    await approveActivityPlanUseCase(plan5.id, uSalesAdmin.id, "ผจก.บริหารงานขาย อนุมัติสายงานและผู้ช่วย");

    const p = await prisma.activityPlan.findUnique({
      where: { id: plan5.id },
      include: { helpers: true },
    });
    const calEvent = await prisma.activityCalendarEvent.findUnique({
      where: { activityPlanId: plan5.id },
      include: { attendees: true },
    });

    const hasCreator = calEvent?.attendees.some((a) => a.employeeId === empSales.id && a.role === "CREATOR");
    const hasHelper = calEvent?.attendees.some((a) => a.employeeId === empPromoter.id && a.role === "HELPER");
    const helperApproved = p?.helpers.some((h) => h.employeeId === empPromoter.id && h.status === ActivityHelperStatus.APPROVED);

    const passed = p?.status === ActivityStatus.APPROVED && helperApproved && calEvent !== null && hasCreator && hasHelper;

    await logResult(
      "ACT-005",
      "Sales Helper Employee Approval (No Budget - Aggregated in Line)",
      "Area Mgr -> Sales Admin Mgr (Line+Helper 1-turn) -> APPROVED",
      "Status: APPROVED immediately without 2nd helper phase",
      `Status: ${p?.status}, Attendees: ${calEvent?.attendees.length}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-005 Error:", err);
    await logResult("ACT-005", "Sales Helper", "Sales Admin Aggregated Line+Helper", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-006: Marketing Helper Employee Approval (No Budget)
  // Sequence: Line (Sales Admin) -> MKT Mgr (Helper Review in 1 Turn) -> APPROVED
  // ─────────────────────────────────────────────────────────────
  try {
    const plan6 = await createTestPlan({
      code: "AUTO-ACT-006",
      primaryTypeCode: "TYPE_7",
      workTypeCodes: ["TYPE_7"],
      title: "เปิดตัวสินค้าใหม่ร่วมกับทีมการตลาด",
      location: "ศูนย์ประชุม",
      province: "กรุงเทพมหานคร",
      district: "จตุจักร",
      objective: "สาธิตสินค้า",
      employeeId: empSales.id,
      createdById: uSales.id,
      helpers: {
        create: [
          {
            employeeId: empMktStaff.id,
            departmentName: "แผนกการตลาด",
          },
        ],
      },
    });

    await submitActivityPlanUseCase(plan6.id, uSales.id);
    await approveActivityPlanUseCase(plan6.id, uAreaMgr.id);
    // Sales Admin Manager approves Line (Marketing Helper remains pending since out of SA authority)
    await approveActivityPlanUseCase(plan6.id, uSalesAdmin.id, "ผจก.บริหารงานขาย อนุมัติสายงาน");

    let p = await prisma.activityPlan.findUnique({ where: { id: plan6.id } });
    if (p?.status !== ActivityStatus.PENDING_HELPER_APPROVAL) {
      throw new Error(`Expected PENDING_HELPER_APPROVAL for MKT Helper, got ${p?.status}`);
    }

    // Marketing Manager approves MKT staff helper in 1 turn
    await approveActivityPlanUseCase(plan6.id, uMktMgr.id, "ผจก.การตลาด อนุมัติผู้ช่วยการตลาด");

    p = await prisma.activityPlan.findUnique({ where: { id: plan6.id } });
    const calEvent = await prisma.activityCalendarEvent.findUnique({
      where: { activityPlanId: plan6.id },
      include: { attendees: true },
    });

    const hasMktHelper = calEvent?.attendees.some((a) => a.employeeId === empMktStaff.id && a.role === "HELPER");
    const passed = p?.status === ActivityStatus.APPROVED && hasMktHelper;

    await logResult(
      "ACT-006",
      "Marketing Helper Employee Approval (No Budget)",
      "Sales Admin (Line) -> MKT Mgr (Helper 1-turn) -> APPROVED",
      "Status: APPROVED, Calendar has MKT Helper",
      `Status: ${p?.status}, MKT Helper in Calendar: ${hasMktHelper}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-006 Error:", err);
    await logResult("ACT-006", "Marketing Helper", "MKT Mgr Helper Review", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-007: Rejection Flow
  // Sequence: Area Manager rejects -> REJECTED
  // ─────────────────────────────────────────────────────────────
  try {
    const plan7 = await createTestPlan({
      code: "AUTO-ACT-007",
      primaryTypeCode: "TYPE_3",
      workTypeCodes: ["TYPE_3"],
      title: "แผนงานที่ไม่ผ่านเกณฑ์",
      objective: "ทดสอบการปฏิเสธแผนงาน",
      employeeId: empSales.id,
      createdById: uSales.id,
    });

    await submitActivityPlanUseCase(plan7.id, uSales.id);
    await rejectActivityPlanUseCase(plan7.id, uAreaMgr.id, "ข้อมูลไม่เพียงพอ ปฏิเสธแผนงาน");

    const p = await prisma.activityPlan.findUnique({ where: { id: plan7.id } });
    const passed = p?.status === ActivityStatus.REJECTED;

    await logResult(
      "ACT-007",
      "Rejection Flow",
      "Area Manager Rejects",
      "Status: REJECTED",
      `Status: ${p?.status}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-007 Error:", err);
    await logResult("ACT-007", "Rejection Flow", "Reject", "REJECTED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-008: Request Correction Flow
  // Sequence: Area Manager requests correction -> WAITING_FOR_CORRECTION
  // ─────────────────────────────────────────────────────────────
  try {
    const plan8 = await createTestPlan({
      code: "AUTO-ACT-008",
      primaryTypeCode: "TYPE_6",
      workTypeCodes: ["TYPE_6"],
      title: "แผนงานที่ต้องแก้ไขเป้าหมาย",
      objective: "ทดสอบการขอข้อมูลเพิ่มเติม",
      employeeId: empSales.id,
      createdById: uSales.id,
    });

    await submitActivityPlanUseCase(plan8.id, uSales.id);
    await requestCorrectionPlanUseCase(plan8.id, uAreaMgr.id, "กรุณาระบุกลุ่มเป้าหมายให้ชัดเจนขึ้น");

    const p = await prisma.activityPlan.findUnique({ where: { id: plan8.id } });
    const passed = p?.status === ActivityStatus.WAITING_FOR_CORRECTION;

    await logResult(
      "ACT-008",
      "Request Correction Flow",
      "Area Mgr Requests Correction",
      "Status: WAITING_FOR_CORRECTION",
      `Status: ${p?.status}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-008 Error:", err);
    await logResult("ACT-008", "Request Correction", "Correction", "WAITING_FOR_CORRECTION", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-009: Resubmit Flow after Correction
  // Sequence: Edit -> Submit again -> PENDING_LINE_APPROVAL
  // ─────────────────────────────────────────────────────────────
  try {
    const plan9 = await createTestPlan({
      code: "AUTO-ACT-009",
      primaryTypeCode: "TYPE_2",
      workTypeCodes: ["TYPE_2"],
      title: "แผนงานแก้ไขแล้ว",
      objective: "ทดสอบการส่งแผนงานซ้ำ",
      status: ActivityStatus.WAITING_FOR_CORRECTION,
      employeeId: empSales.id,
      createdById: uSales.id,
    });

    await submitActivityPlanUseCase(plan9.id, uSales.id);
    const p = await prisma.activityPlan.findUnique({ where: { id: plan9.id } });

    const passed = p?.status === ActivityStatus.PENDING_LINE_APPROVAL && p.currentApproverEmployeeId === empAreaMgr.id;

    await logResult(
      "ACT-009",
      "Resubmit Flow after Correction",
      "Creator Resubmits",
      "Status: PENDING_LINE_APPROVAL (restart flow)",
      `Status: ${p?.status}, Approver: ${p?.currentApproverEmployeeId}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-009 Error:", err);
    await logResult("ACT-009", "Resubmit Flow", "Resubmit", "PENDING_LINE_APPROVAL", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-010: Calendar Synchronization, Query, and Cancellation Lifecycle
  // ─────────────────────────────────────────────────────────────
  try {
    const plan10 = await createTestPlan({
      code: "AUTO-ACT-010",
      primaryTypeCode: "TYPE_1",
      workTypeCodes: ["TYPE_1"],
      title: "ปฏิทินนัดหมายแปลงทดลองภาคสนาม",
      objective: "ทดสอบปฏิทินและผู้เข้าร่วม",
      location: "แปลงทดลอง อ.ดอยสะเก็ด",
      province: "เชียงใหม่",
      district: "ดอยสะเก็ด",
      status: ActivityStatus.APPROVED,
      employeeId: empPromoter.id,
      createdById: uPromoter.id,
      helpers: {
        create: [{ employeeId: empSales.id, status: "APPROVED" }],
      },
    });

    // 1. Sync Calendar
    await syncActivityPlanToCalendarUseCase(plan10);

    // 2. Query Calendar Events for Promoter and Helper
    const queryResult = await listActivityCalendarEventsUseCase({ employeeId: empPromoter.id });
    const hasEvent = queryResult.events.some((e) => e.activityPlanId === plan10.id);

    // 3. Cancel Calendar Event
    await cancelActivityPlanCalendarUseCase(plan10.id);
    const updatedEv = await prisma.activityCalendarEvent.findUnique({ where: { activityPlanId: plan10.id } });

    const passed = hasEvent && updatedEv?.status === CalendarEventStatus.CANCELLED;

    await logResult(
      "ACT-010",
      "Calendar Lifecycle (Create -> Query -> Cancel)",
      "Sync -> Query -> Cancel",
      "Event Created, Found in Query, Cancelled on Demand",
      `EventFound: ${hasEvent}, FinalStatus: ${updatedEv?.status}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-010 Error:", err);
    await logResult("ACT-010", "Calendar Lifecycle", "Sync/Cancel", "PASS", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-011: Aggregated Approval with All Helpers Selected & Cross-Department Security
  // Verifies:
  // - All scoped helpers are approved when selected
  // - Cross-department helper submitted by frontend is filtered out by backend authority check
  // - Single transaction & approval log created
  // ─────────────────────────────────────────────────────────────
  try {
    const plan11 = await createTestPlan({
      code: "AUTO-ACT-011",
      primaryTypeCode: "TYPE_9",
      workTypeCodes: ["TYPE_9"],
      title: "ทดสอบ Aggregated Approval All Selected + Security Guard",
      objective: "ทดสอบการอนุมัติรวมและการตรวจสิทธิข้ามแผนก",
      salesPromotionBudgetRequested: 5000,
      employeeId: empSales.id,
      createdById: uSales.id,
      helpers: {
        create: [
          { employeeId: empPromoter.id, departmentName: "แผนกบริหารงานขาย" },
          { employeeId: empMktStaff.id, departmentName: "แผนกการตลาด" },
        ],
      },
    });

    await submitActivityPlanUseCase(plan11.id, uSales.id);
    await approveActivityPlanUseCase(plan11.id, uAreaMgr.id);

    // Sales Admin attempts to pass both empPromoter (Sales) AND empMktStaff (Marketing)
    await approveActivityPlanUseCase(
      plan11.id,
      uSalesAdmin.id,
      "ผจก.บริหารงานขาย อนุมัติ Line + SP + Helpers",
      [empPromoter.id, empMktStaff.id],
    );

    const p = await prisma.activityPlan.findUnique({
      where: { id: plan11.id },
      include: { helpers: true, approvalLogs: true },
    });

    const salesHelper = p?.helpers.find((h) => h.employeeId === empPromoter.id);
    const mktHelper = p?.helpers.find((h) => h.employeeId === empMktStaff.id);

    // Check:
    // 1. Line approved & SP Budget approved
    // 2. salesHelper is APPROVED
    // 3. mktHelper is STRICTLY PENDING (Sales Admin cannot approve MKT helper!)
    // 4. ApprovalLog has bulk helper comment
    const helperLog = p?.approvalLogs.find((l) => l.step === "HELPER_APPROVAL");

    const passed =
      p?.salesPromotionApproved === true &&
      salesHelper?.status === ActivityHelperStatus.APPROVED &&
      mktHelper?.status === ActivityHelperStatus.PENDING &&
      helperLog !== undefined;

    await logResult(
      "ACT-011",
      "Aggregated Approval All Selected + Cross-Dept Guard",
      "Sales Admin approves in 1-turn (Attempts cross-dept)",
      "Sales Helper: APPROVED, MKT Helper: PENDING (Cross-dept blocked)",
      `SalesHelper: ${salesHelper?.status}, MktHelper: ${mktHelper?.status}, LogStep: ${helperLog?.step}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-011 Error:", err);
    await logResult("ACT-011", "Aggregated All Selected", "Sales Admin 1-turn", "PASS", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-012: Aggregated Approval with Unselected Helper ("Unselected ≠ REJECTED" & "Activity-First")
  // Verifies:
  // - Selected helper is APPROVED
  // - Unselected helper remains PENDING (NEVER REJECTED)
  // - Approver turn completes and does NOT loop back to Sales Admin (No Infinite Loop)
  // - Sales Director can finalize budget, plan becomes APPROVED
  // - Calendar ONLY contains Creator + APPROVED helper (unselected helper omitted)
  // ─────────────────────────────────────────────────────────────
  try {
    const plan12 = await createTestPlan({
      code: "AUTO-ACT-012",
      primaryTypeCode: "TYPE_9",
      workTypeCodes: ["TYPE_9"],
      title: "ทดสอบ Unselected Helper คงสถานะ PENDING และไม่บล็อกแผน",
      objective: "ทดสอบ Soft Helper / Unselected Helper Policy",
      salesPromotionBudgetRequested: 5000,
      employeeId: empSales.id,
      createdById: uSales.id,
      helpers: {
        create: [
          { employeeId: empPromoter.id, departmentName: "แผนกบริหารงานขาย" },
          { employeeId: empAreaMgr.id, departmentName: "แผนกบริหารงานขาย" },
        ],
      },
    });

    await submitActivityPlanUseCase(plan12.id, uSales.id);
    await approveActivityPlanUseCase(plan12.id, uAreaMgr.id);

    // Sales Admin selects ONLY empPromoter. empAreaMgr is unselected!
    await approveActivityPlanUseCase(
      plan12.id,
      uSalesAdmin.id,
      "ผจก.บริหารงานขาย อนุมัติ Line + SP + เลือกเฉพาะสุดา",
      [empPromoter.id], // empAreaMgr omitted!
    );

    let p = await prisma.activityPlan.findUnique({
      where: { id: plan12.id },
      include: { helpers: true },
    });

    const selectedHelper = p?.helpers.find((h) => h.employeeId === empPromoter.id);
    const unselectedHelper = p?.helpers.find((h) => h.employeeId === empAreaMgr.id);

    // Crucial: Unselected must be PENDING, NOT REJECTED!
    if (selectedHelper?.status !== ActivityHelperStatus.APPROVED) {
      throw new Error(`Expected selected helper APPROVED, got ${selectedHelper?.status}`);
    }
    if (unselectedHelper?.status !== ActivityHelperStatus.PENDING) {
      throw new Error(`Expected unselected helper PENDING (Unselected != REJECTED), got ${unselectedHelper?.status}`);
    }
    if (!unselectedHelper.respondedAt) {
      throw new Error("Expected unselected helper respondedAt to be recorded so no infinite loop occurs");
    }

    // Now Sales Director approves final budget
    await approveActivityPlanUseCase(plan12.id, uSalesDir.id, "ผจก.ฝ่ายขาย อนุมัติงบรวม");

    p = await prisma.activityPlan.findUnique({
      where: { id: plan12.id },
      include: { helpers: true },
    });

    // Plan must be APPROVED ("Activity-First / Soft Helper" policy)
    const calEvent = await prisma.activityCalendarEvent.findUnique({
      where: { activityPlanId: plan12.id },
      include: { attendees: true },
    });

    const hasCreator = calEvent?.attendees.some((a) => a.employeeId === empSales.id && a.role === "CREATOR");
    const hasSelectedHelper = calEvent?.attendees.some((a) => a.employeeId === empPromoter.id && a.role === "HELPER");
    const hasUnselectedHelper = calEvent?.attendees.some((a) => a.employeeId === empAreaMgr.id && a.role === "HELPER");

    const passed =
      p?.status === ActivityStatus.APPROVED &&
      selectedHelper?.status === ActivityHelperStatus.APPROVED &&
      unselectedHelper?.status === ActivityHelperStatus.PENDING &&
      hasCreator &&
      hasSelectedHelper &&
      !hasUnselectedHelper; // Unselected helper is NOT in calendar!

    await logResult(
      "ACT-012",
      "Aggregated Approval with Unselected Helper (Soft Helper Policy)",
      "Sales Admin unselects Helper B -> Sales Dir approves final",
      "Plan: APPROVED, Helper A: APPROVED, Helper B: PENDING (not in cal)",
      `PlanStatus: ${p?.status}, HelperA: ${selectedHelper?.status}, HelperB: ${unselectedHelper?.status}, InCalendar: ${hasSelectedHelper && !hasUnselectedHelper}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-012 Error:", err);
    await logResult("ACT-012", "Unselected Helper", "Sales Admin unselects helper", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-013: Approval Queue Cleanliness Across Workflow Transitions
  // Verifies:
  // - Plan appears in current approver's queue
  // - After approval turn, plan leaves that approver's queue immediately
  // - Plan does not appear in unrelated or already-completed approvers' queues
  // ─────────────────────────────────────────────────────────────
  try {
    const plan13 = await createTestPlan({
      code: "AUTO-ACT-013",
      primaryTypeCode: "TYPE_10",
      workTypeCodes: ["TYPE_10"],
      title: "ทดสอบ Approval Queue Cleanliness",
      objective: "ตรวจสอบว่างานหลุดจากคิวทันทีหลังกดอนุมัติ",
      salesPromotionBudgetRequested: 5000,
      marketingBudgetRequested: 5000,
      employeeId: empSales.id,
      createdById: uSales.id,
    });

    await submitActivityPlanUseCase(plan13.id, uSales.id);

    const getQueueForUser = async (u: { id: string }, emp: { id: string }) => {
      const data = await getApprovalQueueDataUseCase({
        id: u.id,
        employeeId: emp.id,
        permissions: ["activity.approve"],
        roles: [],
      });
      return data.myPendingPlans;
    };

    // 1. Area Mgr queue should have it, Sales Admin should NOT
    const inAreaBefore = (await getQueueForUser(uAreaMgr, empAreaMgr)).some((p) => p.id === plan13.id);
    const inSalesAdminBefore = (await getQueueForUser(uSalesAdmin, empSalesAdmin)).some((p) => p.id === plan13.id);

    // 2. Area Mgr approves
    await approveActivityPlanUseCase(plan13.id, uAreaMgr.id);

    const inAreaAfter = (await getQueueForUser(uAreaMgr, empAreaMgr)).some((p) => p.id === plan13.id); // false
    const inSalesAdminTurn = (await getQueueForUser(uSalesAdmin, empSalesAdmin)).some((p) => p.id === plan13.id); // true

    // 3. Sales Admin approves (Line + SP in ONE Turn)
    await approveActivityPlanUseCase(plan13.id, uSalesAdmin.id, "ผจก.บริหารงานขาย อนุมัติ");

    const inSalesAdminAfter = (await getQueueForUser(uSalesAdmin, empSalesAdmin)).some((p) => p.id === plan13.id); // false!
    const inMktTurn = (await getQueueForUser(uMktMgr, empMktMgr)).some((p) => p.id === plan13.id); // true
    const inSalesDirEarly = (await getQueueForUser(uSalesDir, empSalesDir)).some((p) => p.id === plan13.id); // false (waiting for MKT)

    // 4. Marketing Manager approves
    await approveActivityPlanUseCase(plan13.id, uMktMgr.id, "ผจก.การตลาด อนุมัติ");

    const inMktAfter = (await getQueueForUser(uMktMgr, empMktMgr)).some((p) => p.id === plan13.id); // false!
    const inSalesDirTurn = (await getQueueForUser(uSalesDir, empSalesDir)).some((p) => p.id === plan13.id); // true!

    // 5. Sales Director approves final budget
    await approveActivityPlanUseCase(plan13.id, uSalesDir.id, "ผจก.ฝ่ายขาย อนุมัติงบรวม");

    const inSalesDirAfter = (await getQueueForUser(uSalesDir, empSalesDir)).some((p) => p.id === plan13.id); // false!

    const passed =
      inAreaBefore &&
      !inSalesAdminBefore &&
      !inAreaAfter &&
      inSalesAdminTurn &&
      !inSalesAdminAfter &&
      inMktTurn &&
      !inSalesDirEarly &&
      !inMktAfter &&
      inSalesDirTurn &&
      !inSalesDirAfter;

    await logResult(
      "ACT-013",
      "Approval Queue Cleanliness Across Workflow Transitions",
      "Track queue membership across all 4 approvers",
      "Plan appears only in active turn, leaves queue immediately after turn",
      `AreaOk: ${inAreaBefore && !inAreaAfter}, SAOk: ${inSalesAdminTurn && !inSalesAdminAfter}, MktOk: ${inMktTurn && !inMktAfter}, DirOk: ${inSalesDirTurn && !inSalesDirAfter}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-013 Error:", err);
    await logResult("ACT-013", "Queue Cleanliness", "Queue tracking", "PASS", "FAILED", false, err.message);
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("📊 TEST EXECUTION SUMMARY");
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

  const totalPassed = results.filter((r) => r.status === "PASS").length;
  const totalFailed = results.filter((r) => r.status === "FAIL").length;
  console.log(`\nTotal Tests: ${results.length} | Passed: ${totalPassed} | Failed: ${totalFailed}`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("FATAL ERROR IN TEST SUITE:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
