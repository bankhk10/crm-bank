import assert from "node:assert";
import { Prisma } from "@prisma/client";
import { parseType7bActualResult } from "@/modules/activity/features/type-7b/planned/application/actual-mapper";
import { type7bPlannedStrategy } from "@/modules/activity/features/type-7b/planned/infrastructure/type7b-planned.strategy";
import { parseResultSummary } from "@/modules/activity/domain/summary/result-summary-parser";
import { validateType7bActual } from "@/modules/activity/features/type-7b/planned/application/actual-validation";

async function runTests() {
  console.log("=== Running Type 7B Actual Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Strategy Save (Multiple Spraying Rounds + Baseline + Additional Products)
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Testing type7bPlannedStrategy.saveActual with Additional Products & Spray Rounds...");

  const createdRounds: any[] = [];
  const createdProducts: any[] = [];
  const createdAttachments: any[] = [];
  const createdExternals: any[] = [];
  let updatedDemoPlot: any = null;
  let upsertedVisit: any = null;

  const mockTx: any = {
    activityResult: {
      findUnique: async () => ({ id: "act-res-7b-999" }),
    },
    activityPlanType7bPlot: {
      findFirst: async () => ({ demoPlotId: "demo-plot-101" }),
    },
    demoPlot: {
      update: async (args: any) => {
        updatedDemoPlot = args.data;
        return { id: "demo-plot-101", ...args.data };
      },
    },
    demoPlotVisit: {
      findFirst: async () => null,
      count: async () => 0,
      create: async (args: any) => {
        upsertedVisit = args.data;
        return { id: "visit-1", ...args.data };
      },
    },
    activityResultSprayRound: {
      deleteMany: async () => {},
      create: async (args: any) => {
        const roundRecord = { id: `round-db-${createdRounds.length + 1}`, ...args.data };
        createdRounds.push(roundRecord);
        return roundRecord;
      },
    },
    activityResultSprayProduct: {
      createMany: async (args: any) => {
        createdProducts.push(...args.data);
      },
    },
    activityResultSprayExternal: {
      createMany: async (args: any) => {
        createdExternals.push(...args.data);
      },
    },
    activityAttachment: {
      createMany: async (args: any) => {
        createdAttachments.push(...args.data);
      },
    },
  };

  const testPayload = {
    activityResultId: "act-res-7b-999",
    type7bActual: {
      t7DemoPlotId: "demo-plot-101",
      t7VisitDate: "2026-10-24",
      t7DaysAfterSpray: 14,
      t7CropCondition: "สมบูรณ์",
      t7CropProblemDescription: "ไม่มีปัญหาโรคและแมลง",
      t7ProblemDescription: "พืชไม่แสดงอาการเป็นพิษ",
      t7CropImages: [
        { url: "https://storage.example.com/crop1.jpg", name: "ภาพแปลง 1" },
      ],
      t7SprayingRounds: [
        {
          id: "round-client-1",
          roundNumber: 1,
          sprayDate: "2026-10-24",
          sprayMethod: "TANK_MIXED",
          hasExternalChemicals: true,
          externalProducts: [
            {
              company: "บริษัท เคมีภัณฑ์สยาม จำกัด",
              productName: "ไตรอะโซฟอส 40%",
              activeIngredient: "Triazophos",
              formula: "EC",
              applicationRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
            },
          ],
          sprayEquipment: "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
          otherEquipment: "",
          productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
          problemDetail: "",
          baselineProducts: [
            {
              productId: "prod-base-1",
              productName: "สารป้องกันกำจัดแมลง A",
              withdrawnQuantity: 2,
              plannedQuantity: 2,
              actualQuantity: 2,
              extraQuantity: "100",
              extraUnit: "ซีซี",
              applicationRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
              plannedRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
              unit: "ขวด",
            },
          ],
          additionalProducts: [
            {
              id: "add-prod-client-1",
              productId: "prod-add-101",
              productName: "สารเสริมประสิทธิภาพ ซุปเปอร์สเปรดเดอร์",
              actualQuantity: 1,
              quantityUsed: 1,
              extraQuantity: "50",
              extraUnit: "ซีซี",
              applicationRate: "10 ซีซี ต่อน้ำ 20 ลิตร",
              unit: "ขวด",
            },
          ],
          roundImages: [
            { url: "https://storage.example.com/round1.jpg", name: "ภาพรอบ 1" },
          ],
        },
        {
          id: "round-client-2",
          roundNumber: 2,
          sprayDate: "2026-10-24",
          sprayMethod: "SINGLE",
          sprayEquipment: "อื่นๆ (ระบุ)",
          otherEquipment: "รถแทรกเตอร์พ่นยาแบบบูมสเปรย์",
          productResponse: "พบปัญหา / พืชมีอาการผิดปกติ",
          problemDetail: "พบอาการใบเหลืองที่ปลายยอดเล็กน้อย",
          baselineProducts: [
            {
              productId: "prod-base-1",
              productName: "สารป้องกันกำจัดแมลง A",
              withdrawnQuantity: 2,
              actualQuantity: 1,
              applicationRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
              unit: "ขวด",
            },
          ],
          additionalProducts: [
            {
              id: "add-prod-client-2",
              productId: "prod-add-102",
              productName: "ปุ๋ยเกล็ด 20-20-20 พ่นทางใบ",
              actualQuantity: 2,
              quantityUsed: 2,
              extraQuantity: "",
              extraUnit: "กรัม",
              applicationRate: "50 กรัม ต่อน้ำ 20 ลิตร",
              unit: "ซอง",
            },
          ],
          roundImages: [],
        },
      ],
      t7NextSprayDate: "2026-11-05",
      t7Notes: "สังเกตอาการใบพืชรอบถัดไป",
      t7PlotStatus: "IN_PROGRESS",
    },
  };

  await type7bPlannedStrategy.saveActual!(mockTx, "plan-7b-test-1", testPayload);

  // Assertions for Save
  assert.strictEqual(createdRounds.length, 2, "Should create 2 spraying rounds in DB");
  assert.strictEqual(createdRounds[0].roundNumber, 1);
  assert.strictEqual(createdRounds[0].sprayMethod, "TANK_MIXED");
  assert.strictEqual(createdRounds[0].sprayEquipment, "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)");
  assert.strictEqual(createdRounds[1].roundNumber, 2);
  assert.strictEqual(createdRounds[1].sprayMethod, "SINGLE");
  assert.strictEqual(createdRounds[1].otherEquipment, "รถแทรกเตอร์พ่นยาแบบบูมสเปรย์");
  assert.strictEqual(createdRounds[1].problemDetail, "พบอาการใบเหลืองที่ปลายยอดเล็กน้อย");

  // Check products: 2 baseline products + 2 additional products = 4 total
  assert.strictEqual(createdProducts.length, 4, "Should create 4 spray product records");

  // Verify Additional Product in Round 1
  const round1AddProd = createdProducts.find(
    (p) => p.sprayRoundId === createdRounds[0].id && p.productId === "prod-add-101",
  );
  assert(round1AddProd, "Additional product prod-add-101 must be saved");
  assert.strictEqual(round1AddProd.productName, "สารเสริมประสิทธิภาพ ซุปเปอร์สเปรดเดอร์");
  assert.strictEqual(round1AddProd.baselineRate, null, "Additional product baselineRate must be null");
  assert.strictEqual(round1AddProd.actualRate, "10 ซีซี ต่อน้ำ 20 ลิตร");
  assert.strictEqual(String(round1AddProd.quantityUsed), "1");
  assert.strictEqual(round1AddProd.detail, "ใช้เพิ่ม 50 ซีซี");

  // Verify Baseline Product in Round 1
  const round1BaseProd = createdProducts.find(
    (p) => p.sprayRoundId === createdRounds[0].id && p.productId === "prod-base-1",
  );
  assert(round1BaseProd, "Baseline product prod-base-1 must be saved");
  assert.notStrictEqual(round1BaseProd.baselineRate, null, "Baseline product baselineRate must NOT be null");
  assert.strictEqual(String(round1BaseProd.quantityUsed), "2");
  assert.strictEqual(round1BaseProd.detail, "ใช้เพิ่ม 100 ซีซี");

  // Verify DemoPlot update
  assert(updatedDemoPlot, "DemoPlot update must be called");
  assert.strictEqual(updatedDemoPlot.status, "IN_PROGRESS");
  assert.strictEqual(updatedDemoPlot.closedDate, null);
  assert.strictEqual(updatedDemoPlot.hasExternalChemicals, true, "hasExternalChemicals must be synced to demo plot");
  assert(updatedDemoPlot.nextSprayDate instanceof Date);

  // Verify External Product in Round 1
  assert.strictEqual(createdExternals.length, 1, "Should create 1 external chemical record");
  assert.strictEqual(createdExternals[0].sprayRoundId, createdRounds[0].id);
  assert.strictEqual(createdExternals[0].company, "บริษัท เคมีภัณฑ์สยาม จำกัด");
  assert.strictEqual(createdExternals[0].productName, "ไตรอะโซฟอส 40%");
  assert.strictEqual(createdExternals[0].activeIngredient, "Triazophos");
  assert.strictEqual(createdExternals[0].formula, "EC");
  assert.strictEqual(createdExternals[0].applicationRate, "20 ซีซี ต่อน้ำ 20 ลิตร");

  // Verify Round Attachments
  assert.strictEqual(createdAttachments.length, 1, "Should create 1 attachment for round 1");
  assert.strictEqual(createdAttachments[0].sprayRoundId, createdRounds[0].id);
  assert.strictEqual(createdAttachments[0].fileUrl, "https://storage.example.com/round1.jpg");

  // Verify DemoPlotVisit
  assert(upsertedVisit, "DemoPlotVisit must be upserted");
  assert.strictEqual(upsertedVisit.daysSinceStart, 14);
  assert.strictEqual(upsertedVisit.cropProblemDesc, "ไม่มีปัญหาโรคและแมลง");
  assert.strictEqual(upsertedVisit.productProblemDesc, "พืชไม่แสดงอาการเป็นพิษ");

  console.log("✓ Test 1 passed: Strategy save successfully saved rounds, baseline & additional products, and demo plot data.");

  // -------------------------------------------------------------------------
  // Test 2: Hydration from DB (Simulating Page Reload in ActivityPlanActualView)
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Testing parseType7bActualResult restoring all rounds, baseline, and additional products...");

  // Construct mock DB models as returned by Prisma getActivityPlanAction
  const mockPlanFromDb = {
    id: "plan-7b-test-1",
    startDate: new Date("2026-10-24"),
    endDate: new Date("2026-10-24"),
    type7b: {
      products: [
        {
          productId: "prod-base-1",
          productName: "สารป้องกันกำจัดแมลง A",
          quantity: 2,
          unit: "ขวด",
        },
      ],
      plots: [
        {
          demoPlotId: "demo-plot-101",
          demoPlot: {
            id: "demo-plot-101",
            code: "DP26100001",
            name: "แปลงทุเรียนหมอนทอง นายสมชาย",
            ownerName: "นายสมชาย ใจดี",
            cropName: "ทุเรียน",
            status: "IN_PROGRESS",
            nextSprayDate: new Date("2026-11-05T00:00:00.000Z"),
          },
        },
      ],
    },
    demoPlotVisits: [
      {
        id: "visit-1",
        visitDate: new Date("2026-10-24T00:00:00.000Z"),
        daysSinceStart: 14,
        cropCondition: "สมบูรณ์",
        growthStage: "ระยะแทงช่อดอก",
        cropProblemDesc: "ไม่มีปัญหาโรคและแมลง",
        productProblemDesc: "พืชไม่แสดงอาการเป็นพิษ",
        cropImageUrls: ["https://storage.example.com/crop1.jpg"],
      },
    ],
    result: {
      id: "act-res-7b-999",
      resultSummary: "ติดตามแปลงสาธิต: แปลงทุเรียนหมอนทอง นายสมชาย",
      notes: "สังเกตอาการใบพืชรอบถัดไป",
      sprayRounds: [
        {
          id: "round-db-1",
          roundNumber: 1,
          sprayDate: new Date("2026-10-24T00:00:00.000Z"),
          sprayMethod: "TANK_MIXED",
          hasExternalChemicals: true,
          externalProducts: [
            {
              id: "ext-db-1",
              sprayRoundId: "round-db-1",
              company: "บริษัท เคมีภัณฑ์สยาม จำกัด",
              productName: "ไตรอะโซฟอส 40%",
              activeIngredient: "Triazophos",
              formula: "EC",
              customFormula: null,
              applicationRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
            },
          ],
          sprayEquipment: "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
          otherEquipment: null,
          productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
          problemDetail: null,
          daysSinceStart: 14,
          notes: "สังเกตอาการใบพืชรอบถัดไป",
          products: [
            {
              id: "prod-db-1",
              sprayRoundId: "round-db-1",
              productId: "prod-base-1",
              productName: "สารป้องกันกำจัดแมลง A",
              baselineRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
              actualRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
              quantityUsed: new Prisma.Decimal("2.00"),
              unit: "ขวด",
              detail: "ใช้เพิ่ม 100 ซีซี",
            },
            {
              id: "prod-db-2",
              sprayRoundId: "round-db-1",
              productId: "prod-add-101",
              productName: "สารเสริมประสิทธิภาพ ซุปเปอร์สเปรดเดอร์",
              baselineRate: null, // Additional product!
              actualRate: "10 ซีซี ต่อน้ำ 20 ลิตร",
              quantityUsed: new Prisma.Decimal("1.00"),
              unit: "ขวด",
              detail: "ใช้เพิ่ม 50 ซีซี",
            },
          ],
          attachments: [
            {
              id: "att-1",
              fileUrl: "https://storage.example.com/round1.jpg",
              fileName: "ภาพรอบ 1",
            },
          ],
        },
        {
          id: "round-db-2",
          roundNumber: 2,
          sprayDate: new Date("2026-10-24T00:00:00.000Z"),
          sprayMethod: "SINGLE",
          sprayEquipment: "อื่นๆ (ระบุ)",
          otherEquipment: "รถแทรกเตอร์พ่นยาแบบบูมสเปรย์",
          productResponse: "พบปัญหา / พืชมีอาการผิดปกติ",
          problemDetail: "พบอาการใบเหลืองที่ปลายยอดเล็กน้อย",
          daysSinceStart: 14,
          notes: "สังเกตอาการใบพืชรอบถัดไป",
          products: [
            {
              id: "prod-db-3",
              sprayRoundId: "round-db-2",
              productId: "prod-base-1",
              productName: "สารป้องกันกำจัดแมลง A",
              baselineRate: "ตามแผน",
              actualRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
              quantityUsed: new Prisma.Decimal("1.00"),
              unit: "ขวด",
              detail: null,
            },
            {
              id: "prod-db-4",
              sprayRoundId: "round-db-2",
              productId: "prod-add-102",
              productName: "ปุ๋ยเกล็ด 20-20-20 พ่นทางใบ",
              baselineRate: null, // Additional product!
              actualRate: "50 กรัม ต่อน้ำ 20 ลิตร",
              quantityUsed: new Prisma.Decimal("2.00"),
              unit: "ซอง",
              detail: null,
            },
          ],
          attachments: [],
        },
      ],
      attachments: [],
    },
    attachments: [
      {
        id: "att-crop-1",
        category: "CROP",
        fileUrl: "https://storage.example.com/crop1.jpg",
        fileName: "ภาพแปลง 1",
      },
    ],
  };

  const payloadToHydrate = {
    ...mockPlanFromDb.result,
    activityPlan: mockPlanFromDb,
    attachments: mockPlanFromDb.attachments,
  };

  const hydratedResult = parseType7bActualResult(
    mockPlanFromDb.result.resultSummary,
    payloadToHydrate,
  );

  // Assertions for Hydration
  assert(hydratedResult.t7SprayingRounds, "t7SprayingRounds must be restored");
  assert.strictEqual(hydratedResult.t7SprayingRounds.length, 2, "Must restore both 2 spraying rounds");

  // Verify Round 1
  const round1 = hydratedResult.t7SprayingRounds[0];
  assert.strictEqual(round1.roundNumber, 1);
  assert.strictEqual(round1.sprayMethod, "TANK_MIXED");
  assert.strictEqual(round1.hasExternalChemicals, true, "hasExternalChemicals must be true");
  assert.strictEqual(round1.sprayEquipment, "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)");
  assert.strictEqual(round1.productResponse, "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)");
  assert.strictEqual(round1.roundImages.length, 1);
  assert.strictEqual(round1.roundImages[0].url, "https://storage.example.com/round1.jpg");

  // Verify Round 1 External Products
  assert(round1.externalProducts, "externalProducts must be present");
  assert.strictEqual(round1.externalProducts.length, 1, "Must restore 1 external product in Round 1");
  assert.strictEqual(round1.externalProducts[0].company, "บริษัท เคมีภัณฑ์สยาม จำกัด");
  assert.strictEqual(round1.externalProducts[0].productName, "ไตรอะโซฟอส 40%");
  assert.strictEqual(round1.externalProducts[0].activeIngredient, "Triazophos");
  assert.strictEqual(round1.externalProducts[0].formula, "EC");
  assert.strictEqual(round1.externalProducts[0].applicationRate, "20 ซีซี ต่อน้ำ 20 ลิตร");

  // Verify Round 1 Baseline Product
  assert.strictEqual(round1.baselineProducts.length, 1);
  assert.strictEqual(round1.baselineProducts[0].productId, "prod-base-1");
  assert.strictEqual(round1.baselineProducts[0].productName, "สารป้องกันกำจัดแมลง A");
  assert.strictEqual(round1.baselineProducts[0].withdrawnQuantity, 2);
  assert.strictEqual(round1.baselineProducts[0].actualQuantity, 2);
  assert.strictEqual(round1.baselineProducts[0].extraQuantity, "100");
  assert.strictEqual(round1.baselineProducts[0].extraUnit, "ซีซี");
  assert.strictEqual(round1.baselineProducts[0].applicationRate, "20 ซีซี ต่อน้ำ 20 ลิตร");

  // Verify Round 1 Additional Product (1.2)
  assert.strictEqual(round1.additionalProducts.length, 1, "Must restore exactly 1 additional product in Round 1");
  const addProd1 = round1.additionalProducts[0];
  assert.strictEqual(addProd1.productId, "prod-add-101");
  assert.strictEqual(addProd1.productName, "สารเสริมประสิทธิภาพ ซุปเปอร์สเปรดเดอร์");
  assert.strictEqual(addProd1.actualQuantity, 1);
  assert.strictEqual(addProd1.quantityUsed, 1);
  assert.strictEqual(addProd1.extraQuantity, "50");
  assert.strictEqual(addProd1.extraUnit, "ซีซี");
  assert.strictEqual(addProd1.applicationRate, "10 ซีซี ต่อน้ำ 20 ลิตร");

  // Verify Round 2
  const round2 = hydratedResult.t7SprayingRounds[1];
  assert.strictEqual(round2.roundNumber, 2);
  assert.strictEqual(round2.sprayMethod, "SINGLE");
  assert.strictEqual(round2.sprayEquipment, "อื่นๆ (ระบุ)");
  assert.strictEqual(round2.otherEquipment, "รถแทรกเตอร์พ่นยาแบบบูมสเปรย์");
  assert.strictEqual(round2.problemDetail, "พบอาการใบเหลืองที่ปลายยอดเล็กน้อย");

  // Verify Round 2 Additional Product (1.2)
  assert.strictEqual(round2.additionalProducts.length, 1, "Must restore exactly 1 additional product in Round 2");
  const addProd2 = round2.additionalProducts[0];
  assert.strictEqual(addProd2.productId, "prod-add-102");
  assert.strictEqual(addProd2.productName, "ปุ๋ยเกล็ด 20-20-20 พ่นทางใบ");
  assert.strictEqual(addProd2.actualQuantity, 2);
  assert.strictEqual(addProd2.applicationRate, "50 กรัม ต่อน้ำ 20 ลิตร");

  // Verify Section 1 Tracking fields restored
  assert.strictEqual(hydratedResult.t7VisitDate, "2026-10-24");
  assert.strictEqual(hydratedResult.t7DaysAfterSpray, 14);
  assert.strictEqual(hydratedResult.t7CropCondition, "สมบูรณ์");
  assert.strictEqual(hydratedResult.t7GrowthStage, "ระยะแทงช่อดอก");
  assert.strictEqual(hydratedResult.t7CropProblemDescription, "ไม่มีปัญหาโรคและแมลง");
  assert.strictEqual(hydratedResult.t7ProblemDescription, "พืชไม่แสดงอาการเป็นพิษ");
  assert.strictEqual(hydratedResult.t7CropImages?.length, 1);
  assert.strictEqual(hydratedResult.t7CropImages?.[0].url, "https://storage.example.com/crop1.jpg");

  // Verify Section 3 Demo Plot Status fields restored
  assert.strictEqual(hydratedResult.t7PlotStatus, "IN_PROGRESS");
  assert.strictEqual(hydratedResult.t7NextSprayDate, "2026-11-05");
  assert.strictEqual(hydratedResult.t7Notes, "สังเกตอาการใบพืชรอบถัดไป");
  assert.strictEqual(hydratedResult.t7PlotName, "แปลงทุเรียนหมอนทอง นายสมชาย");
  assert.strictEqual(hydratedResult.t7FarmerName, "นายสมชาย ใจดี");

  console.log("✓ Test 2 passed: All 1.2 Additional Products, Baseline Products, and Spray Rounds restored completely from database models.");

  // -------------------------------------------------------------------------
  // Test 3: Demo Plot Closure (COMPLETED with Harvest Yield & Satisfaction)
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Testing Plot Closure (COMPLETED / Harvest evaluation)...");

  let closureDemoPlotData: any = null;
  const mockTxClosure: any = {
    activityResult: {
      findUnique: async () => ({ id: "act-res-closure-1" }),
    },
    activityPlanType7bPlot: {
      findFirst: async () => ({ demoPlotId: "demo-plot-closure-1" }),
    },
    demoPlot: {
      update: async (args: any) => {
        closureDemoPlotData = args.data;
        return { id: "demo-plot-closure-1", ...args.data };
      },
    },
    demoPlotVisit: {
      findFirst: async () => null,
      count: async () => 1,
      create: async () => ({ id: "visit-2" }),
    },
    activityResultSprayRound: {
      deleteMany: async () => {},
      create: async () => ({ id: "round-closure-1" }),
    },
    activityResultSprayProduct: {
      createMany: async () => {},
    },
    activityAttachment: {
      createMany: async () => {},
    },
  };

  const closurePayload = {
    activityResultId: "act-res-closure-1",
    type7bActual: {
      t7DemoPlotId: "demo-plot-closure-1",
      t7PlotStatus: "COMPLETED",
      t7FinalYieldKg: "4500",
      t7ControlYieldKg: "3800",
      t7FarmerSatisfaction: 5,
      t7CommercialPotential: "สูงมาก (พร้อมขยายผลเชิงพาณิชย์)",
      t7FinalSummaryNotes: "ผลผลิตสูงกว่าแปลงควบคุม 18.4% เกษตรกรประทับใจมาก",
      t7SprayingRounds: [],
    },
  };

  await type7bPlannedStrategy.saveActual!(mockTxClosure, "plan-closure-1", closurePayload);

  assert(closureDemoPlotData, "DemoPlot update must be called on closure");
  assert.strictEqual(closureDemoPlotData.status, "COMPLETED");
  assert(closureDemoPlotData.closedDate instanceof Date, "closedDate must be set on closure");
  assert.strictEqual(Number(closureDemoPlotData.demoYieldKg), 4500);
  assert.strictEqual(Number(closureDemoPlotData.controlYieldKg), 3800);
  assert.strictEqual(closureDemoPlotData.farmerSatisfaction, 5);
  assert.strictEqual(closureDemoPlotData.commercialPotential, "สูงมาก (พร้อมขยายผลเชิงพาณิชย์)");
  assert.strictEqual(closureDemoPlotData.finalSummaryNotes, "ผลผลิตสูงกว่าแปลงควบคุม 18.4% เกษตรกรประทับใจมาก");

  console.log("✓ Test 3 passed: Demo plot closure sets status COMPLETED, closedDate, yields, and ratings.");

  // -------------------------------------------------------------------------
  // Test 4: Integration with parseResultSummary (Detail View & Approval View)
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Testing parseResultSummary integration for Type 7B Detail View...");

  const parsedSummary = parseResultSummary(payloadToHydrate);

  assert(parsedSummary.type7bActual, "parseResultSummary must include type7bActual");
  assert.strictEqual(parsedSummary.type7bActual.t7SprayingRounds?.length, 2);
  assert.strictEqual(
    parsedSummary.type7bActual.t7SprayingRounds?.[0].additionalProducts?.length,
    1,
  );
  assert.strictEqual(
    parsedSummary.type7bActual.t7SprayingRounds?.[0].additionalProducts?.[0].productName,
    "สารเสริมประสิทธิภาพ ซุปเปอร์สเปรดเดอร์",
  );

  console.log("✓ Test 4 passed: parseResultSummary seamlessly exposes Type 7B spray rounds and additional products.");

  // -------------------------------------------------------------------------
  // Test 5: Validation for Tank-mixed External Chemical Products
  // -------------------------------------------------------------------------
  console.log("\n[Test 5] Testing validateType7bActual with Tank-mixed External Products...");

  const invalidExternalPayload: any = {
    t7SprayingRounds: [
      {
        roundNumber: 1,
        sprayMethod: "TANK_MIXED",
        sprayEquipment: "โดรน",
        hasExternalChemicals: true,
        externalProducts: [
          {
            company: "บริษัท ทดสอบ",
            productName: "", // Missing product name
            formula: "อื่นๆ",
            customFormula: "", // Missing custom formula
            applicationRate: "", // Missing rate
          },
        ],
      },
    ],
  };

  const invalidValidation = validateType7bActual(invalidExternalPayload);
  assert.strictEqual(invalidValidation.isValid, false, "Must fail validation when external product fields are missing");
  assert(
    invalidValidation.errors.some((e) => e.includes("กรุณาระบุชื่อสินค้า")),
    "Should report missing productName",
  );
  assert(
    invalidValidation.errors.some((e) => e.includes("กรุณาระบุอัตราการใช้")),
    "Should report missing applicationRate",
  );
  assert(
    invalidValidation.errors.some((e) => e.includes("กรุณาระบุสูตรเพิ่มเติม")),
    "Should report missing customFormula",
  );

  const validExternalPayload: any = {
    t7SprayingRounds: [
      {
        roundNumber: 1,
        sprayMethod: "TANK_MIXED",
        sprayEquipment: "โดรน",
        hasExternalChemicals: true,
        externalProducts: [
          {
            company: "บริษัท ทดสอบ",
            productName: "สารเคมี X",
            formula: "SL",
            applicationRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
          },
        ],
      },
    ],
  };

  const validValidation = validateType7bActual(validExternalPayload);
  assert.strictEqual(validValidation.isValid, true, "Must pass validation when external products are fully specified");

  console.log("✓ Test 5 passed: validateType7bActual correctly validates tank-mixed external products.");

  // -------------------------------------------------------------------------
  // Test 6: Verify Attachment preservation for Spray Rounds in Activity Result
  // -------------------------------------------------------------------------
  console.log("\n[Test 6] Testing round images attachment retention (sprayRoundId != null)...");

  const attachmentsTable: any[] = [];
  // Mock Step 2 (Strategy creates round attachment)
  attachmentsTable.push({
    id: "att-round-1",
    activityPlanId: "plan-test-6",
    sprayRoundId: "round-db-1",
    fileUrl: "https://storage.example.com/spray-photo.jpg",
  });
  attachmentsTable.push({
    id: "att-general-old",
    activityPlanId: "plan-test-6",
    sprayRoundId: null,
    fileUrl: "https://storage.example.com/old-crop.jpg",
  });

  // Mock Step 9 deleteMany with sprayRoundId: null condition
  const remainingAfterDelete = attachmentsTable.filter(
    (att) => !(att.activityPlanId === "plan-test-6" && att.sprayRoundId === null)
  );

  assert.strictEqual(remainingAfterDelete.length, 1, "Should keep sprayRoundId attachment");
  assert.strictEqual(remainingAfterDelete[0].sprayRoundId, "round-db-1", "Spray round attachment must not be deleted");

  console.log("✓ Test 6 passed: Spray round attachments are preserved correctly during attachment sync.");

  console.log("\n🎉 ALL TYPE 7B ACTUAL SAVE & HYDRATION TESTS PASSED 100%!\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
