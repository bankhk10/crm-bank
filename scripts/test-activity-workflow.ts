import { Prisma, ActivityStatus, CalendarEventStatus, CalendarAttendeeRole } from "@prisma/client";
import { db as prisma } from "../lib/db";
import { seedWorkflowTestUsers } from "../prisma/seed/activity/workflow-test-users";
import { seedActivityTypes } from "../prisma/seed/activity/activity-types";
import {
  submitActivityPlanUseCase,
  approveActivityPlanUseCase,
  rejectActivityPlanUseCase,
  requestCorrectionPlanUseCase,
  cancelActivityPlanUseCase,
  reviewSingleActivityHelperUseCase,
  syncActivityPlanToCalendarUseCase,
  cancelActivityPlanCalendarUseCase,
  listActivityCalendarEventsUseCase,
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
  const { uPromoter, uSales, uAreaMgr, uSalesAdmin, uMktMgr, uSalesDir, uMktStaff } = seedData.users;
  const { empPromoter, empSales, empAreaMgr, empSalesAdmin, empMktMgr, empSalesDir, empMktStaff } = seedData.employees;

  // Ensure Activity Types exist
  await seedActivityTypes(prisma);
  const allTypes = await prisma.activityType.findMany();
  const typeMap = Object.fromEntries(allTypes.map((t) => [t.code, t]));

  // Clean old test plans
  await prisma.activityPlan.deleteMany({
    where: { code: { startsWith: "TEST-ACT-" } },
  });

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
      code: "TEST-ACT-001",
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
  // TEST ACT-002: Sales - Sales Promotion Budget (SP)
  // Sequence: Sales -> Area Mgr -> Sales Admin Mgr (Line) -> Sales Admin Mgr (SP Budget) -> Sales Director (Overall)
  // ─────────────────────────────────────────────────────────────
  try {
    const plan2 = await createTestPlan({
      code: "TEST-ACT-002",
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
    await approveActivityPlanUseCase(plan2.id, uSalesAdmin.id, "ผจก.บริหารงานขาย อนุมัติสายงาน");

    // Check Budget Stage
    let p = await prisma.activityPlan.findUnique({ where: { id: plan2.id } });
    if (p?.status !== ActivityStatus.PENDING_BUDGET_APPROVAL || p.salesPromotionApproved !== false) {
      throw new Error(`Expected PENDING_BUDGET_APPROVAL, got ${p?.status}`);
    }

    // Sales Admin Manager approves SP Budget
    await approveActivityPlanUseCase(plan2.id, uSalesAdmin.id, "อนุมัติงบส่งเสริมการขาย 5,000");
    p = await prisma.activityPlan.findUnique({ where: { id: plan2.id } });
    if (p?.salesPromotionApproved !== true || p.salesManagerApproved !== false) {
      throw new Error(`Expected SP approved, pending Sales Director`);
    }

    // Sales Director approves overall budget
    await approveActivityPlanUseCase(plan2.id, uSalesDir.id, "ผจก.ฝ่ายขาย อนุมัติภาพรวม");
    p = await prisma.activityPlan.findUnique({ where: { id: plan2.id } });

    const calEvent = await prisma.activityCalendarEvent.findUnique({ where: { activityPlanId: plan2.id } });
    const passed = p?.status === ActivityStatus.APPROVED && Number(p.totalBudgetApproved) === 5000 && calEvent !== null;

    await logResult(
      "ACT-002",
      "Sales Promotion Budget Approval",
      "Area Mgr -> Sales Admin Mgr -> Sales Dir",
      "Status: APPROVED, SP Budget Approved: 5000",
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
      code: "TEST-ACT-003",
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
      "Sales Admin Mgr -> MKT Mgr -> Sales Dir",
      "Status: APPROVED, MKT Budget Approved: 8000",
      `Status: ${p?.status}, BudgetApproved: ${p?.totalBudgetApproved}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-003 Error:", err);
    await logResult("ACT-003", "Marketing Budget", "MKT Mgr -> Sales Dir", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-004: Parallel Budget Approval (Both SP and MKT)
  // Sequence: Line -> [MKT Mgr & Sales Admin Mgr parallel] -> Sales Director
  // ─────────────────────────────────────────────────────────────
  try {
    const plan4 = await createTestPlan({
      code: "TEST-ACT-004",
      primaryTypeCode: "TYPE_10",
      workTypeCodes: ["TYPE_10"],
      title: "งานใหญ่ Field Day ประจำปี",
      location: "ศูนย์เรียนรู้การเกษตร",
      province: "นครราชสีมา",
      district: "ปากช่อง",
      objective: "งานแสดงสินค้าและสัมมนาใหญ่",
      salesPromotionBudgetRequested: 10000,
      marketingBudgetRequested: 15000,
      employeeId: empSales.id,
      createdById: uSales.id,
    });

    await submitActivityPlanUseCase(plan4.id, uSales.id);
    await approveActivityPlanUseCase(plan4.id, uAreaMgr.id, "ผจก.ภาค อนุมัติสายงาน");
    await approveActivityPlanUseCase(plan4.id, uSalesAdmin.id, "ผจก.บริหารงานขาย อนุมัติสายงาน");

    // Parallel 1: Marketing Manager approves first
    await approveActivityPlanUseCase(plan4.id, uMktMgr.id, "ผจก.การตลาด อนุมัติงบ MKT 15,000");
    let p = await prisma.activityPlan.findUnique({ where: { id: plan4.id } });
    if (p?.marketingApproved !== true || p.salesPromotionApproved !== false || p.status !== ActivityStatus.PENDING_BUDGET_APPROVAL) {
      throw new Error(`Parallel state error: MKT should be approved, SP pending`);
    }

    // Parallel 2: Sales Admin Manager approves second
    await approveActivityPlanUseCase(plan4.id, uSalesAdmin.id, "ผจก.บริหารงานขาย อนุมัติงบ SP 10,000");
    p = await prisma.activityPlan.findUnique({ where: { id: plan4.id } });
    if (p?.salesPromotionApproved !== true || p.marketingApproved !== true) {
      throw new Error(`Both budgets should be approved`);
    }

    // Overall: Sales Director approves
    await approveActivityPlanUseCase(plan4.id, uSalesDir.id, "ผจก.ฝ่ายขาย อนุมัติงบรวมทั้งสองส่วน");
    p = await prisma.activityPlan.findUnique({ where: { id: plan4.id } });

    const passed = p?.status === ActivityStatus.APPROVED && Number(p.totalBudgetApproved) === 25000;
    await logResult(
      "ACT-004",
      "Parallel Budget Approval (Both SP + MKT)",
      "Parallel (MKT Mgr & Sales Admin) -> Sales Dir",
      "Status: APPROVED, Total Budget: 25000",
      `Status: ${p?.status}, TotalBudgetApproved: ${p?.totalBudgetApproved}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-004 Error:", err);
    await logResult("ACT-004", "Parallel Budget Approval", "Parallel -> Overall", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-005: Sales Helper Employee Approval
  // Sequence: Line -> Helper Approval (Sales Admin Mgr) -> APPROVED & Calendar for both
  // ─────────────────────────────────────────────────────────────
  try {
    const plan5 = await createTestPlan({
      code: "TEST-ACT-005",
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
    await approveActivityPlanUseCase(plan5.id, uSalesAdmin.id);

    let p = await prisma.activityPlan.findUnique({ where: { id: plan5.id } });
    if (p?.status !== ActivityStatus.PENDING_HELPER_APPROVAL) {
      throw new Error(`Expected PENDING_HELPER_APPROVAL, got ${p?.status}`);
    }

    // Sales Admin Manager approves Promoter helper via single helper review
    await reviewSingleActivityHelperUseCase(plan5.id, empPromoter.id, uSalesAdmin.id, "APPROVE");

    p = await prisma.activityPlan.findUnique({ where: { id: plan5.id } });
    const calEvent = await prisma.activityCalendarEvent.findUnique({
      where: { activityPlanId: plan5.id },
      include: { attendees: true },
    });

    const hasCreator = calEvent?.attendees.some((a) => a.employeeId === empSales.id && a.role === "CREATOR");
    const hasHelper = calEvent?.attendees.some((a) => a.employeeId === empPromoter.id && a.role === "HELPER");

    const passed = p?.status === ActivityStatus.APPROVED && calEvent !== null && hasCreator && hasHelper;

    await logResult(
      "ACT-005",
      "Sales Helper Employee Approval",
      "Line -> Sales Admin Mgr (Helper Review)",
      "Status: APPROVED, Calendar has Creator + Helper",
      `Status: ${p?.status}, Attendees: ${calEvent?.attendees.length}`,
      Boolean(passed),
    );
  } catch (err: any) {
    console.error("ACT-005 Error:", err);
    await logResult("ACT-005", "Sales Helper", "Sales Admin Helper Review", "APPROVED", "FAILED", false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST ACT-006: Marketing Helper Employee Approval
  // Sequence: Line -> Helper Approval (Marketing Manager) -> APPROVED
  // ─────────────────────────────────────────────────────────────
  try {
    const plan6 = await createTestPlan({
      code: "TEST-ACT-006",
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
    await approveActivityPlanUseCase(plan6.id, uSalesAdmin.id);

    // Marketing Manager approves MKT staff helper
    await reviewSingleActivityHelperUseCase(plan6.id, empMktStaff.id, uMktMgr.id, "APPROVE");

    const p = await prisma.activityPlan.findUnique({ where: { id: plan6.id } });
    const calEvent = await prisma.activityCalendarEvent.findUnique({
      where: { activityPlanId: plan6.id },
      include: { attendees: true },
    });

    const hasMktHelper = calEvent?.attendees.some((a) => a.employeeId === empMktStaff.id && a.role === "HELPER");
    const passed = p?.status === ActivityStatus.APPROVED && hasMktHelper;

    await logResult(
      "ACT-006",
      "Marketing Helper Employee Approval",
      "Line -> MKT Mgr (Helper Review)",
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
  // Sequence: Area Manager rejects -> REJECTED & Calendar Cancelled
  // ─────────────────────────────────────────────────────────────
  try {
    const plan7 = await createTestPlan({
      code: "TEST-ACT-007",
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
      code: "TEST-ACT-008",
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
      code: "TEST-ACT-009",
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
      code: "TEST-ACT-010",
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
