import "dotenv/config";
import {
  ActivityStatus,
  ActivityApprovalStep,
  DrugWithdrawalStatus,
  Prisma,
} from "@prisma/client";
import { db as prisma } from "../lib/db";
import { seedWorkflowTestUsers } from "../prisma/seed/activity/workflow-test-users";
import { seedActivityTypes } from "../prisma/seed/activity/activity-types";
import {
  submitActivityPlanUseCase,
  approveActivityPlanUseCase,
  requestCorrectionPlanUseCase,
} from "../modules/activity-plans/application";
import {
  createActivityPlan,
  updateActivityPlan,
} from "../modules/activity-plans/infrastructure/activity-plan.repository";

interface TestResult {
  id: string;
  name: string;
  status: "PASS" | "FAIL";
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function recordResult(id: string, name: string, passed: boolean, details?: string, error?: string) {
  const status = passed ? "PASS" : "FAIL";
  results.push({ id, name, status, details, error });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} [${id}] ${name} -> ${status} ${details ? `(${details})` : ""}`);
  if (error) console.error(`   Error details:`, error);
}

async function runPhase5Tests() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("🧪 STARTING DRUG WITHDRAWAL — PHASE 5 VERIFICATION SUITE");
  console.log("═════════════════════════════════════════════════════════════════\n");

  // Step 0: Ensure Test Users and Types
  const seedData = await seedWorkflowTestUsers(prisma);
  const { uPromoter, uSales, uAreaMgr, uSalesAdmin, uMktMgr, uSalesDir } = seedData.users;
  const { empPromoter, empSales, empAreaMgr, empSalesAdmin, empMktMgr, empSalesDir } = seedData.employees;

  await seedActivityTypes(prisma);
  const type7b = await prisma.activityType.findFirst({ where: { code: "TYPE_7B" } });
  if (!type7b) throw new Error("TYPE_7B activity type not found");

  const products = await prisma.product.findMany({ where: { deletedAt: null }, take: 2 });
  if (products.length === 0) throw new Error("Need active products for test");

  const cleanPlan = async (planId: string) => {
    try {
      await prisma.drugWithdrawalItem.deleteMany({
        where: { drugWithdrawal: { activityPlanId: planId } },
      });
      await prisma.drugWithdrawal.deleteMany({ where: { activityPlanId: planId } });
      await prisma.activityApprovalLog.deleteMany({ where: { activityPlanId: planId } });
      await prisma.activityHelper.deleteMany({ where: { activityPlanId: planId } });
      await prisma.activityPlanWorkType.deleteMany({ where: { activityPlanId: planId } });
      await prisma.activityPlan.deleteMany({ where: { id: planId } });
    } catch (e) {
      // ignore cleanup errors
    }
  };

  const now = new Date();
  const tomorrow = new Date(Date.now() + 86400000);

  // Helper to create test plan directly in DRAFT
  let planSeq = 1;
  const createPlanFixture = async (options: {
    userId: string;
    employeeId: string;
    hasWithdrawal?: boolean;
    salesBudget?: number;
    marketingBudget?: number;
  }) => {
    const code = `P5-TEST-${Date.now()}-${planSeq++}`;
    const plan = await prisma.activityPlan.create({
      data: {
        code,
        title: `Phase 5 Plan ${code}`,
        activityType: { connect: { id: type7b.id } },
        employee: { connect: { id: options.employeeId } },
        createdBy: { connect: { id: options.userId } },
        status: ActivityStatus.DRAFT,
        objective: "Phase 5 verification test objective",
        fiscalYear: now.getFullYear(),
        fiscalMonth: now.getMonth() + 1,
        fiscalQuarter: Math.ceil((now.getMonth() + 1) / 3),
        durationDays: 1,
        startDate: now,
        endDate: tomorrow,
        salesPromotionBudgetRequested: options.salesBudget
          ? new Prisma.Decimal(options.salesBudget)
          : null,
        marketingBudgetRequested: options.marketingBudget
          ? new Prisma.Decimal(options.marketingBudget)
          : null,
        totalBudgetRequested: new Prisma.Decimal(
          (options.salesBudget || 0) + (options.marketingBudget || 0),
        ),
      },
    });

    if (options.hasWithdrawal) {
      await prisma.drugWithdrawal.create({
        data: {
          activityPlan: { connect: { id: plan.id } },
          requestedBy: { connect: { id: options.employeeId } },
          status: DrugWithdrawalStatus.DRAFT,
          notes: "Initial test withdrawal",
          items: {
            create: [
              {
                plotIdentifier: "แปลง 1",
                product: { connect: { id: products[0].id } },
                productName: products[0].name,
                quantity: new Prisma.Decimal(5),
                unit: "ขวด",
              },
            ],
          },
        },
      });
    }

    await prisma.activityPlanWorkType.create({
      data: {
        activityPlanId: plan.id,
        activityTypeId: type7b.id,
      },
    });

    return plan;
  };

  // ──────────────────────────────────────────────────────────
  // Test A: No budget + NO Withdrawal
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test A: No budget + NO Withdrawal ---");
  const planA = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: false,
  });
  try {
    // 1. Submit: Promoter -> Line approval with Salesperson
    await submitActivityPlanUseCase(planA.id, uPromoter.id);
    let p = await prisma.activityPlan.findUnique({ where: { id: planA.id } });
    if (p?.status !== ActivityStatus.PENDING_LINE_APPROVAL) {
      throw new Error(`Expected PENDING_LINE_APPROVAL, got ${p?.status}`);
    }

    // 2. Sales approves -> Area Mgr
    await approveActivityPlanUseCase(planA.id, uSales.id, "Sales approve");
    // 3. Area Mgr approves -> Sales Admin Mgr
    await approveActivityPlanUseCase(planA.id, uAreaMgr.id, "Area Mgr approve");
    // 4. Sales Admin Mgr approves -> Since no budget and no withdrawal, completes directly to APPROVED!
    await approveActivityPlanUseCase(planA.id, uSalesAdmin.id, "Sales Admin approve");
    p = await prisma.activityPlan.findUnique({ where: { id: planA.id } });

    const passed = p?.status === ActivityStatus.APPROVED;
    recordResult("Test A", "No budget + NO Withdrawal", passed, `Final status: ${p?.status}`);
  } catch (err: any) {
    recordResult("Test A", "No budget + NO Withdrawal", false, undefined, err.message);
  } finally {
    await cleanPlan(planA.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test B: No budget + Withdrawal
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test B: No budget + Withdrawal ---");
  const planB = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
  });
  try {
    // 1. Submit
    await submitActivityPlanUseCase(planB.id, uPromoter.id);
    // 2. Pass line approvals
    await approveActivityPlanUseCase(planB.id, uSales.id, "Sales approve");
    await approveActivityPlanUseCase(planB.id, uAreaMgr.id, "Area Mgr approve");
    // 3. Terminal Line approval by Sales Admin Mgr
    await approveActivityPlanUseCase(planB.id, uSalesAdmin.id, "Sales Admin terminal line approve");

    let p = await prisma.activityPlan.findUnique({ where: { id: planB.id } });
    const dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planB.id } });

    // Should NOT be APPROVED yet! Must be in PENDING_BUDGET_APPROVAL waiting for Marketing Manager
    const inBudgetApproval = p?.status === ActivityStatus.PENDING_BUDGET_APPROVAL;
    const withdrawalPending = dw?.status === DrugWithdrawalStatus.PENDING_APPROVAL;

    // 4. Marketing Manager approves
    await approveActivityPlanUseCase(planB.id, uMktMgr.id, "MKT Manager approve withdrawal");
    p = await prisma.activityPlan.findUnique({ where: { id: planB.id } });
    const dwApproved = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planB.id } });

    const passed =
      inBudgetApproval &&
      withdrawalPending &&
      p?.status === ActivityStatus.APPROVED &&
      dwApproved?.status === DrugWithdrawalStatus.APPROVED &&
      dwApproved?.approvedById === empMktMgr.id &&
      dwApproved?.approvedAt !== null;

    recordResult(
      "Test B",
      "No budget + Withdrawal requires MKT Manager",
      passed,
      `Paused in BUDGET_APPROVAL: ${inBudgetApproval}, final: ${p?.status}, DW: ${dwApproved?.status}`,
    );
  } catch (err: any) {
    recordResult("Test B", "No budget + Withdrawal", false, undefined, err.message);
  } finally {
    await cleanPlan(planB.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test C: Sales Promotion budget + Withdrawal
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test C: Sales Promotion budget + Withdrawal ---");
  const planC = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
    salesBudget: 5000,
  });
  try {
    await submitActivityPlanUseCase(planC.id, uPromoter.id);
    await approveActivityPlanUseCase(planC.id, uSales.id);
    await approveActivityPlanUseCase(planC.id, uAreaMgr.id);
    // Terminal line approval + SP budget approval by Sales Admin
    await approveActivityPlanUseCase(planC.id, uSalesAdmin.id, "Sales Admin approves SP budget");

    let p = await prisma.activityPlan.findUnique({ where: { id: planC.id } });
    let dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planC.id } });

    // Plan must still be in PENDING_BUDGET_APPROVAL because Withdrawal is not approved yet
    const spApproved = p?.salesPromotionApproved === true;
    const stillPending = p?.status === ActivityStatus.PENDING_BUDGET_APPROVAL;
    const dwStillPending = dw?.status === DrugWithdrawalStatus.PENDING_APPROVAL;

    // Marketing Manager approves withdrawal
    await approveActivityPlanUseCase(planC.id, uMktMgr.id, "MKT Mgr approves withdrawal");
    dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planC.id } });

    // Now Sales Director approves total budget
    await approveActivityPlanUseCase(planC.id, uSalesDir.id, "Sales Director approves total budget");
    p = await prisma.activityPlan.findUnique({ where: { id: planC.id } });

    const passed =
      spApproved &&
      stillPending &&
      dwStillPending &&
      dw?.status === DrugWithdrawalStatus.APPROVED &&
      p?.status === ActivityStatus.APPROVED;

    recordResult(
      "Test C",
      "Sales Promotion budget + Withdrawal",
      passed,
      `SP approved: ${spApproved}, final status: ${p?.status}, DW status: ${dw?.status}`,
    );
  } catch (err: any) {
    recordResult("Test C", "Sales Promotion budget + Withdrawal", false, undefined, err.message);
  } finally {
    await cleanPlan(planC.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test D: Marketing budget + Withdrawal
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test D: Marketing budget + Withdrawal ---");
  const planD = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
    marketingBudget: 8000,
  });
  try {
    await submitActivityPlanUseCase(planD.id, uPromoter.id);
    await approveActivityPlanUseCase(planD.id, uSales.id);
    await approveActivityPlanUseCase(planD.id, uAreaMgr.id);
    await approveActivityPlanUseCase(planD.id, uSalesAdmin.id); // passes line approval to budget

    // Marketing Manager approves (covers both marketing budget and withdrawal)
    await approveActivityPlanUseCase(planD.id, uMktMgr.id, "MKT Manager approves budget & DW");
    let p = await prisma.activityPlan.findUnique({ where: { id: planD.id } });
    let dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planD.id } });

    const mktApproved = p?.marketingApproved === true;
    const dwApproved = dw?.status === DrugWithdrawalStatus.APPROVED;

    // Sales Director final approval
    await approveActivityPlanUseCase(planD.id, uSalesDir.id, "Sales Director total budget");
    p = await prisma.activityPlan.findUnique({ where: { id: planD.id } });

    const passed = mktApproved && dwApproved && p?.status === ActivityStatus.APPROVED;
    recordResult(
      "Test D",
      "Marketing budget + Withdrawal handles both",
      passed,
      `MKT approved: ${mktApproved}, DW approved: ${dwApproved}, final: ${p?.status}`,
    );
  } catch (err: any) {
    recordResult("Test D", "Marketing budget + Withdrawal", false, undefined, err.message);
  } finally {
    await cleanPlan(planD.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test E: Sales Promotion + Marketing Budget + Withdrawal
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test E: Sales Promotion + Marketing Budget + Withdrawal ---");
  const planE = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
    salesBudget: 5000,
    marketingBudget: 8000,
  });
  try {
    await submitActivityPlanUseCase(planE.id, uPromoter.id);
    await approveActivityPlanUseCase(planE.id, uSales.id);
    await approveActivityPlanUseCase(planE.id, uAreaMgr.id);
    await approveActivityPlanUseCase(planE.id, uSalesAdmin.id); // approves line + SP budget

    let p = await prisma.activityPlan.findUnique({ where: { id: planE.id } });
    // Still in BUDGET_APPROVAL
    const waitMkt = p?.status === ActivityStatus.PENDING_BUDGET_APPROVAL;

    // Marketing Manager approves MKT budget + Withdrawal
    await approveActivityPlanUseCase(planE.id, uMktMgr.id);
    p = await prisma.activityPlan.findUnique({ where: { id: planE.id } });
    const dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planE.id } });

    // Still waiting for Sales Director
    const waitDirector = p?.status === ActivityStatus.PENDING_BUDGET_APPROVAL;

    // Sales Director approves
    await approveActivityPlanUseCase(planE.id, uSalesDir.id);
    p = await prisma.activityPlan.findUnique({ where: { id: planE.id } });

    const passed =
      waitMkt &&
      waitDirector &&
      dw?.status === DrugWithdrawalStatus.APPROVED &&
      p?.status === ActivityStatus.APPROVED;

    recordResult(
      "Test E",
      "Both budgets + Withdrawal",
      passed,
      `All steps executed sequentially, final: ${p?.status}`,
    );
  } catch (err: any) {
    recordResult("Test E", "Both budgets + Withdrawal", false, undefined, err.message);
  } finally {
    await cleanPlan(planE.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test F: Submit with Withdrawal (DRAFT -> PENDING_APPROVAL)
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test F: Submit with Withdrawal ---");
  const planF = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
  });
  try {
    let dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planF.id } });
    const initialStatus = dw?.status;

    await submitActivityPlanUseCase(planF.id, uPromoter.id);
    dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planF.id } });
    const p = await prisma.activityPlan.findUnique({ where: { id: planF.id } });

    const passed =
      initialStatus === DrugWithdrawalStatus.DRAFT &&
      dw?.status === DrugWithdrawalStatus.PENDING_APPROVAL &&
      p?.status === ActivityStatus.PENDING_LINE_APPROVAL;

    recordResult(
      "Test F",
      "Submit transitions Withdrawal DRAFT -> PENDING_APPROVAL",
      passed,
      `Initial DW: ${initialStatus}, Submitted DW: ${dw?.status}, Plan status: ${p?.status}`,
    );
  } catch (err: any) {
    recordResult("Test F", "Submit with Withdrawal", false, undefined, err.message);
  } finally {
    await cleanPlan(planF.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test G: Marketing Manager approves Withdrawal
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test G: Marketing Manager approves Withdrawal ---");
  const planG = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
  });
  try {
    await submitActivityPlanUseCase(planG.id, uPromoter.id);
    await approveActivityPlanUseCase(planG.id, uSales.id);
    await approveActivityPlanUseCase(planG.id, uAreaMgr.id);
    await approveActivityPlanUseCase(planG.id, uSalesAdmin.id); // transitions to BUDGET_APPROVAL

    await approveActivityPlanUseCase(planG.id, uMktMgr.id, "MKT Manager approves DW");
    const dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planG.id } });
    const p = await prisma.activityPlan.findUnique({ where: { id: planG.id } });

    const passed =
      dw?.status === DrugWithdrawalStatus.APPROVED &&
      dw?.approvedById === empMktMgr.id &&
      dw?.approvedAt !== null &&
      p?.marketingApproved === null; // No MKT budget requested, so marketingApproved must remain null!

    recordResult(
      "Test G",
      "MKT Manager approves Withdrawal: DW approved, approvedById & approvedAt set",
      passed,
      `DW status: ${dw?.status}, approvedById: ${dw?.approvedById}, approvedAt: ${dw?.approvedAt}, marketingApproved: ${p?.marketingApproved}`,
    );
  } catch (err: any) {
    recordResult("Test G", "Marketing Manager approves Withdrawal", false, undefined, err.message);
  } finally {
    await cleanPlan(planG.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test H: Marketing Manager returns Withdrawal (PENDING_APPROVAL -> RETURNED)
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test H: Marketing Manager returns Withdrawal ---");
  const planH = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
  });
  try {
    await submitActivityPlanUseCase(planH.id, uPromoter.id);
    await approveActivityPlanUseCase(planH.id, uSales.id);
    await approveActivityPlanUseCase(planH.id, uAreaMgr.id);
    await approveActivityPlanUseCase(planH.id, uSalesAdmin.id); // to BUDGET_APPROVAL

    const correctionReason = "กรุณาลดจำนวนขวดที่ขอเบิกยาลง 2 ขวด";
    await requestCorrectionPlanUseCase(planH.id, uMktMgr.id, correctionReason);

    const dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planH.id } });
    const p = await prisma.activityPlan.findUnique({ where: { id: planH.id } });
    const log = await prisma.activityApprovalLog.findFirst({
      where: { activityPlanId: planH.id, action: "REQUEST_CORRECTION" },
      orderBy: { createdAt: "desc" },
    });

    const passed =
      dw?.status === DrugWithdrawalStatus.RETURNED &&
      dw?.rejectionReason === correctionReason &&
      p?.status === ActivityStatus.WAITING_FOR_CORRECTION &&
      log?.step === ActivityApprovalStep.BUDGET_APPROVAL;

    recordResult(
      "Test H",
      "Marketing Manager returns Withdrawal -> RETURNED with reason",
      passed,
      `DW status: ${dw?.status}, Reason: "${dw?.rejectionReason}", Plan status: ${p?.status}, Log step: ${log?.step}`,
    );
  } catch (err: any) {
    recordResult("Test H", "Marketing Manager returns Withdrawal", false, undefined, err.message);
  } finally {
    await cleanPlan(planH.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test I: Returned Activity Save (remains RETURNED)
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test I: Returned Activity Save ---");
  const planI = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
  });
  try {
    await submitActivityPlanUseCase(planI.id, uPromoter.id);
    await approveActivityPlanUseCase(planI.id, uSales.id);
    await approveActivityPlanUseCase(planI.id, uAreaMgr.id);
    await approveActivityPlanUseCase(planI.id, uSalesAdmin.id);
    await requestCorrectionPlanUseCase(planI.id, uMktMgr.id, "Edit needed");

    // Creator edits and saves via updateActivityPlan
    await updateActivityPlan(planI.id, {
      title: "Updated Title on Return",
      drugWithdrawal: {
        hasDrugWithdrawal: true,
        notes: "Updated notes on return",
        items: [
          {
            plotIdentifier: "แปลง 1",
            productId: products[0].id,
            productName: products[0].name,
            quantity: new Prisma.Decimal(3),
            unit: "ขวด",
          },
        ],
      },
    }, uSales.id);

    const dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planI.id } });
    const p = await prisma.activityPlan.findUnique({ where: { id: planI.id } });

    const passed =
      dw?.status === DrugWithdrawalStatus.RETURNED &&
      p?.status === ActivityStatus.WAITING_FOR_CORRECTION;

    recordResult(
      "Test I",
      "Returned Activity Save preserves RETURNED status",
      passed,
      `DW status: ${dw?.status}, Plan status: ${p?.status}`,
    );
  } catch (err: any) {
    recordResult("Test I", "Returned Activity Save", false, undefined, err.message);
  } finally {
    await cleanPlan(planI.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test J: Returned Activity explicit Submit (RETURNED -> PENDING_APPROVAL)
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test J: Returned Activity explicit Submit ---");
  const planJ = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
  });
  try {
    await submitActivityPlanUseCase(planJ.id, uPromoter.id);
    await approveActivityPlanUseCase(planJ.id, uSales.id);
    await approveActivityPlanUseCase(planJ.id, uAreaMgr.id);
    await approveActivityPlanUseCase(planJ.id, uSalesAdmin.id);
    await requestCorrectionPlanUseCase(planJ.id, uMktMgr.id, "Please adjust");

    // Resubmit
    await submitActivityPlanUseCase(planJ.id, uPromoter.id);

    const dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planJ.id } });
    const p = await prisma.activityPlan.findUnique({ where: { id: planJ.id } });

    const passed =
      dw?.status === DrugWithdrawalStatus.PENDING_APPROVAL &&
      p?.status === ActivityStatus.PENDING_LINE_APPROVAL;

    recordResult(
      "Test J",
      "Returned Activity explicit Submit transitions to PENDING_APPROVAL",
      passed,
      `DW status: ${dw?.status}, Plan status: ${p?.status}`,
    );
  } catch (err: any) {
    recordResult("Test J", "Returned Activity explicit Submit", false, undefined, err.message);
  } finally {
    await cleanPlan(planJ.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test K: Attempt final Activity approval while Withdrawal is not APPROVED
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test K: Attempt final Activity approval while Withdrawal is not APPROVED ---");
  const planK = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
  });
  try {
    await submitActivityPlanUseCase(planK.id, uPromoter.id);
    await approveActivityPlanUseCase(planK.id, uSales.id);
    await approveActivityPlanUseCase(planK.id, uAreaMgr.id);
    await approveActivityPlanUseCase(planK.id, uSalesAdmin.id); // to BUDGET_APPROVAL

    // Sales Admin (not Mkt Manager) tries to approve budget
    const unauthorizedRes = await approveActivityPlanUseCase(planK.id, uSalesAdmin.id, "Unauthorized try");

    // Also check if plan is still PENDING_BUDGET_APPROVAL
    const p = await prisma.activityPlan.findUnique({ where: { id: planK.id } });
    const dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planK.id } });

    const passed =
      unauthorizedRes.success === false &&
      p?.status === ActivityStatus.PENDING_BUDGET_APPROVAL &&
      dw?.status === DrugWithdrawalStatus.PENDING_APPROVAL;

    recordResult(
      "Test K",
      "Server rejects non-MKT approval when only Withdrawal is pending",
      passed,
      `Rejected with error: "${unauthorizedRes.error}", Plan status: ${p?.status}`,
    );
  } catch (err: any) {
    recordResult("Test K", "Attempt final approval while Withdrawal not approved", false, undefined, err.message);
  } finally {
    await cleanPlan(planK.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test L: Withdrawal approved -> Activity continues to APPROVED
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test L: Withdrawal approved -> Activity continues ---");
  const planL = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
  });
  try {
    await submitActivityPlanUseCase(planL.id, uPromoter.id);
    await approveActivityPlanUseCase(planL.id, uSales.id);
    await approveActivityPlanUseCase(planL.id, uAreaMgr.id);
    await approveActivityPlanUseCase(planL.id, uSalesAdmin.id);

    // MKT Manager approves
    const resMkt = await approveActivityPlanUseCase(planL.id, uMktMgr.id, "MKT Manager approves DW");
    const p = await prisma.activityPlan.findUnique({ where: { id: planL.id } });
    const dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planL.id } });

    const passed =
      resMkt.success === true &&
      dw?.status === DrugWithdrawalStatus.APPROVED &&
      p?.status === ActivityStatus.APPROVED;

    recordResult(
      "Test L",
      "Withdrawal approved allows Activity to reach APPROVED",
      passed,
      `MKT result: ${resMkt.success}, DW: ${dw?.status}, Plan: ${p?.status}`,
    );
  } catch (err: any) {
    recordResult("Test L", "Withdrawal approved allows Activity to continue", false, undefined, err.message);
  } finally {
    await cleanPlan(planL.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test M: No Withdrawal regression check
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test M: No Withdrawal regression check ---");
  const planM = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: false,
    salesBudget: 3000,
  });
  try {
    await submitActivityPlanUseCase(planM.id, uPromoter.id);
    await approveActivityPlanUseCase(planM.id, uSales.id);
    await approveActivityPlanUseCase(planM.id, uAreaMgr.id);
    // Sales Admin approves line + SP budget
    await approveActivityPlanUseCase(planM.id, uSalesAdmin.id);

    // Sales Director approves total budget
    await approveActivityPlanUseCase(planM.id, uSalesDir.id);

    const p = await prisma.activityPlan.findUnique({ where: { id: planM.id } });
    const passed = p?.status === ActivityStatus.APPROVED;

    recordResult(
      "Test M",
      "No Withdrawal regression: Standard budget approval flow works without MKT Manager",
      passed,
      `Final status: ${p?.status}`,
    );
  } catch (err: any) {
    recordResult("Test M", "No Withdrawal regression check", false, undefined, err.message);
  } finally {
    await cleanPlan(planM.id);
  }

  // ──────────────────────────────────────────────────────────
  // Test N: No Marketing Budget + Withdrawal (verify marketingApproved untouched)
  // ──────────────────────────────────────────────────────────
  console.log("\n--- Test N: No Marketing Budget + Withdrawal ---");
  const planN = await createPlanFixture({
    userId: uPromoter.id,
    employeeId: empPromoter.id,
    hasWithdrawal: true,
    salesBudget: 5000,
    marketingBudget: 0,
  });
  try {
    await submitActivityPlanUseCase(planN.id, uPromoter.id);
    await approveActivityPlanUseCase(planN.id, uSales.id);
    await approveActivityPlanUseCase(planN.id, uAreaMgr.id);
    await approveActivityPlanUseCase(planN.id, uSalesAdmin.id); // SP budget approved

    // MKT Manager approves Withdrawal
    await approveActivityPlanUseCase(planN.id, uMktMgr.id, "MKT Manager approves DW");
    let p = await prisma.activityPlan.findUnique({ where: { id: planN.id } });
    let dw = await prisma.drugWithdrawal.findUnique({ where: { activityPlanId: planN.id } });

    // CRITICAL: marketingApproved must NOT be true!
    const marketingApprovedUntouched = p?.marketingApproved !== true;
    const withdrawalApproved = dw?.status === DrugWithdrawalStatus.APPROVED;

    // Sales Director approves total budget
    await approveActivityPlanUseCase(planN.id, uSalesDir.id, "Director approves");
    p = await prisma.activityPlan.findUnique({ where: { id: planN.id } });

    const passed =
      marketingApprovedUntouched &&
      withdrawalApproved &&
      p?.marketingApproved !== true &&
      p?.status === ActivityStatus.APPROVED;

    recordResult(
      "Test N",
      "No Marketing Budget + Withdrawal: marketingApproved is NOT set to true",
      passed,
      `marketingApproved: ${p?.marketingApproved}, DW status: ${dw?.status}, Plan: ${p?.status}`,
    );
  } catch (err: any) {
    recordResult("Test N", "No Marketing Budget + Withdrawal", false, undefined, err.message);
  } finally {
    await cleanPlan(planN.id);
  }

  // ──────────────────────────────────────────────────────────
  // Final Verification Summary
  // ──────────────────────────────────────────────────────────
  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("📊 PHASE 5 VERIFICATION SUITE SUMMARY");
  console.log("═════════════════════════════════════════════════════════════════");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  console.log(`Total Tests: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);

  results.forEach((r) => {
    console.log(`  ${r.status === "PASS" ? "✅" : "❌"} [${r.id}] ${r.name}`);
  });

  if (failCount > 0) {
    console.error(`\n❌ VERIFICATION FAILED: ${failCount} tests failed.`);
    process.exit(1);
  } else {
    console.log("\n🎉 ALL PHASE 5 VERIFICATION TESTS PASSED SUCCESSFULLY!");
  }
}

runPhase5Tests()
  .catch((e) => {
    console.error("FATAL SUITE ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
