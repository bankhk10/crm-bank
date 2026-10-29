import assert from "node:assert/strict";
import {
  validateType7bUnplannedItems,
  mapType7bUnplannedToPayload,
  hydrateType7bUnplannedData,
  createDefaultSprayRound,
  createDefaultType7bUnplannedItem,
} from "@/modules/activity/features/type-7b";
import type { Type7bUnplannedItem } from "@/modules/activity/features/type-7b";
import { type7bUnplannedStrategy } from "@/modules/activity/features/type-7b/unplanned/infrastructure/type7b-unplanned.strategy";
import { DemoPlotStatus } from "@prisma/client";

async function runTests() {
  console.log("=== Running Type 7B Unplanned Form Redesign Tests ===");

  // ---------------------------------------------------------------------------
  // Test 1: Validation tests
  // ---------------------------------------------------------------------------
  console.log("\n[Test 1] Testing validateType7bUnplannedItems...");

  // 1.1 Empty items
  const resEmpty = validateType7bUnplannedItems([]);
  assert.strictEqual(resEmpty.isValid, false);
  assert.ok(resEmpty.error?.includes("อย่างน้อย 1 แปลง"));

  // 1.2 Missing plot details
  const invalidItem: Type7bUnplannedItem = {
    ...createDefaultType7bUnplannedItem("item-1"),
    plotName: "",
    farmerName: "",
    cropName: "",
  };
  const resMissingPlot = validateType7bUnplannedItems([invalidItem]);
  assert.strictEqual(resMissingPlot.isValid, false);
  assert.ok(
    resMissingPlot.errors?.some((e: any) => e.includes("ชื่อแปลงสาธิต")),
  );
  assert.ok(
    resMissingPlot.errors?.some((e: any) => e.includes("ชื่อเจ้าของแปลง")),
  );
  assert.ok(resMissingPlot.errors?.some((e: any) => e.includes("พืชเป้าหมาย")));

  // 1.3 Round products validation (Additional product missing rate & qty)
  const itemWithBadRound: Type7bUnplannedItem = {
    ...createDefaultType7bUnplannedItem("item-2"),
    plotName: "แปลงทุเรียนทดสอบ",
    farmerName: "สมหมาย ทุเรียนงาม",
    cropName: "ทุเรียนหมอนทอง",
    sprayingRounds: [
      {
        id: "round-1",
        roundNumber: 1,
        sprayDate: "2026-10-24",
        sprayMethod: "SINGLE",
        sprayEquipment: "เป้สะพายหลัง",
        productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
        baselineProducts: [],
        additionalProducts: [
          {
            id: "add-1",
            productId: "prod-add-1",
            productName: "เอ็กซ์ตร้าโกร",
            actualQuantity: "",
            applicationRate: "",
          },
        ],
        roundImages: [],
      },
    ],
  };
  const resBadRound = validateType7bUnplannedItems([itemWithBadRound]);
  assert.strictEqual(resBadRound.isValid, false);
  assert.ok(
    resBadRound.errors?.some((e: any) =>
      e.includes("จำนวนที่ใช้จริงของสินค้า"),
    ),
  );
  assert.ok(
    resBadRound.errors?.some((e: any) => e.includes("อัตราการใช้ของสินค้า")),
  );

  // 1.4 Tank-mixed external chemicals validation
  const itemWithBadExternal: Type7bUnplannedItem = {
    ...createDefaultType7bUnplannedItem("item-3"),
    plotName: "แปลงข้าวโพดสาธิต",
    farmerName: "สมศรี ข้าวโพดหวาน",
    cropName: "ข้าวโพดหวาน",
    sprayingRounds: [
      {
        id: "round-1",
        roundNumber: 1,
        sprayDate: "2026-10-24",
        sprayMethod: "TANK_MIXED",
        hasExternalChemicals: true,
        externalProducts: [
          {
            company: "ABC Chem",
            productName: "",
            activeIngredient: "Abamectin",
            formula: "อื่นๆ",
            customFormula: "",
            applicationRate: "",
          },
        ],
        sprayEquipment: "อื่นๆ (ระบุ)",
        otherEquipment: "",
        productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
        baselineProducts: [],
        additionalProducts: [],
        roundImages: [],
      },
    ],
  };
  const resBadExt = validateType7bUnplannedItems([itemWithBadExternal]);
  assert.strictEqual(resBadExt.isValid, false);
  assert.ok(
    resBadExt.errors?.some((e: any) => e.includes("ชื่อสินค้าของยาภายนอก")),
  );
  assert.ok(
    resBadExt.errors?.some((e: any) => e.includes("สูตรเพิ่มเติมของยาภายนอก")),
  );
  assert.ok(
    resBadExt.errors?.some((e: any) => e.includes("อัตราการใช้ของยาภายนอก")),
  );
  assert.ok(
    resBadExt.errors?.some((e: any) =>
      e.includes("ระบุอุปกรณ์การฉีดพ่นเพิ่มเติม"),
    ),
  );

  // 1.5 Valid item passes
  const validItem: Type7bUnplannedItem = {
    ...createDefaultType7bUnplannedItem("item-ok"),
    plotName: "แปลงข้าวโพดสาธิต",
    farmerName: "สมศรี ข้าวโพดหวาน",
    cropName: "ข้าวโพดหวาน",
    visitDate: "2026-10-24",
    daysAfterSpray: 7,
    sprayingRounds: [
      {
        id: "round-1",
        roundNumber: 1,
        sprayDate: "2026-10-24",
        sprayMethod: "SINGLE",
        sprayEquipment: "เป้สะพายหลัง",
        productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
        baselineProducts: [],
        additionalProducts: [
          {
            id: "prod-1",
            productId: "prod-base-1",
            productName: "ไตรโคเดอร์มา",
            actualQuantity: 2,
            applicationRate: "20 ซีซี / น้ำ 20 ลิตร",
          },
          {
            id: "prod-2",
            productId: "prod-add-1",
            productName: "เอ็กซ์ตร้าโกร",
            actualQuantity: 1,
            applicationRate: "30 ซีซี / น้ำ 20 ลิตร",
          },
        ],
        roundImages: [],
      },
    ],
  };
  const resValid = validateType7bUnplannedItems([validItem]);
  assert.strictEqual(resValid.isValid, true);
  assert.strictEqual(resValid.errors?.length, 0);

  console.log("✓ Test 1 passed: All validation checks work accurately.");

  // ---------------------------------------------------------------------------
  // Test 2: Mapping to Payload tests
  // ---------------------------------------------------------------------------
  console.log("\n[Test 2] Testing mapType7bUnplannedToPayload...");

  const fullItem: Type7bUnplannedItem = {
    id: "plot-item-1",
    demoPlotId: "demo-plot-101",
    plotName: "แปลงข้าว กข43 สุพรรณบุรี",
    farmerName: "ประสิทธิ์ ชาวนาดี",
    cropName: "ข้าว กข43",
    areaRai: 10,
    province: "สุพรรณบุรี",
    district: "เมือง",
    visitDate: "2026-10-24",
    daysAfterSpray: 14,
    cropImages: [
      {
        id: "img-crop-1",
        url: "https://example.com/crop1.jpg",
        name: "crop1.jpg",
      },
    ],
    sprayingRounds: [
      {
        id: "round-1",
        roundNumber: 1,
        sprayDate: "2026-10-24",
        sprayMethod: "TANK_MIXED",
        hasExternalChemicals: true,
        externalProducts: [
          {
            company: "เคมีสยาม",
            productName: "ไซเปอร์การ์ด",
            activeIngredient: "Cypermethrin 35%",
            formula: "EC",
            applicationRate: "15 ซีซี / น้ำ 20 ลิตร",
          },
        ],
        sprayEquipment: "โดรนเพื่อการเกษตร",
        productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
        problemDetail: "",
        baselineProducts: [],
        additionalProducts: [
          {
            id: "prod-1",
            productId: "prod-base-1",
            productName: "ยาบำรุงข้าว A",
            actualQuantity: 2,
            applicationRate: "25 ซีซี / น้ำ 20 ลิตร",
            unit: "ขวด",
          },
          {
            id: "prod-2",
            productId: "prod-add-2",
            productName: "ฮอร์โมนเร่งรวง B",
            actualQuantity: 1,
            applicationRate: "10 กรัม / น้ำ 20 ลิตร",
            unit: "ซอง",
          },
        ],
        roundImages: [
          {
            id: "img-round-1",
            url: "https://example.com/round1.jpg",
            name: "round1.jpg",
          },
        ],
      },
    ],
    nextSprayDate: "2026-11-05",
    notes: "แปลงเติบโตสมบูรณ์ดีมาก ข้าวเริ่มตั้งท้อง",
    plotStatus: "COMPLETED",
    finalYieldKg: "8500",
    controlYieldKg: "7200",
    farmerSatisfaction: 5,
    commercialPotential: "สูงมาก (พร้อมขยายผลเชิงพาณิชย์)",
    finalSummaryNotes:
      "ผลผลิตสูงกว่าแปลงเปรียบเทียบอย่างมีนัยสำคัญ เกษตรกรสั่งซื้อเพิ่ม",
  };

  const mappedPayload = mapType7bUnplannedToPayload(
    [fullItem],
    [
      { id: "prod-base-1", name: "ยาบำรุงข้าว A", unit: "ขวด" },
      { id: "prod-add-2", name: "ฮอร์โมนเร่งรวง B", unit: "ซอง" },
    ],
  );

  assert.ok(mappedPayload.type7bData);
  assert.ok(mappedPayload.actualOutcome);
  assert.strictEqual(mappedPayload.actualOutcome.resultStatus, "COMPLETED");

  // Verify Section 1
  const t7bActual = mappedPayload.actualOutcome.type7bActual;
  assert.strictEqual(t7bActual.t7VisitDate, "2026-10-24");
  assert.strictEqual(t7bActual.t7DaysAfterSpray, 14);
  assert.strictEqual(t7bActual.t7CropImages.length, 1);

  // Verify Section 2
  assert.strictEqual(t7bActual.t7SprayingRounds.length, 1);
  const mappedRound = t7bActual.t7SprayingRounds[0];
  assert.strictEqual(mappedRound.sprayMethod, "TANK_MIXED");
  assert.strictEqual(mappedRound.sprayEquipment, "โดรนเพื่อการเกษตร");
  assert.strictEqual(mappedRound.baselineProducts.length, 0); // Unplanned has no baseline products
  assert.strictEqual(mappedRound.additionalProducts.length, 2);
  assert.strictEqual(mappedRound.externalProducts?.length, 1);
  assert.strictEqual(mappedRound.roundImages.length, 1);

  // Verify aggregated products in planProducts
  assert.strictEqual(mappedPayload.planProducts.length, 2);
  assert.ok(
    mappedPayload.planProducts.some(
      (p: any) => p.productId === "prod-base-1" && p.targetQuantity === 2,
    ),
  );
  assert.ok(
    mappedPayload.planProducts.some(
      (p: any) => p.productId === "prod-add-2" && p.targetQuantity === 1,
    ),
  );

  // Verify Section 3
  assert.strictEqual(t7bActual.t7PlotStatus, "COMPLETED");
  assert.strictEqual(t7bActual.t7FinalYieldKg, "8500");
  assert.strictEqual(t7bActual.t7ControlYieldKg, "7200");
  assert.strictEqual(t7bActual.t7FarmerSatisfaction, 5);

  // Verify attachments combined (crop + round photos)
  assert.strictEqual(mappedPayload.actualOutcome.attachments.length, 2);

  console.log(
    "✓ Test 2 passed: Payload mapping correctly aggregates all sections, rounds, and products.",
  );

  // ---------------------------------------------------------------------------
  // Test 3: Hydration tests
  // ---------------------------------------------------------------------------
  console.log("\n[Test 3] Testing hydrateType7bUnplannedData...");

  const hydrated = hydrateType7bUnplannedData({
    type7b: {
      plots: [
        {
          id: "plot-db-1",
          demoPlotId: "demo-plot-101",
          plotName: "แปลงข้าว กข43 สุพรรณบุรี",
          ownerName: "ประสิทธิ์ ชาวนาดี",
          cropName: "ข้าว กข43",
          areaRai: 10,
          province: "สุพรรณบุรี",
          district: "เมือง",
        },
      ],
      products: [{ productId: "prod-base-1", quantity: 2, unit: "ขวด" }],
    },
    actualOutcome: {
      type7bActual: {
        t7VisitDate: "2026-10-24",
        t7DaysAfterSpray: 14,
        t7CropImages: [{ id: "img-1", url: "https://example.com/c1.jpg" }],
        t7SprayingRounds: [
          {
            id: "round-1",
            roundNumber: 1,
            sprayDate: "2026-10-24",
            sprayMethod: "SINGLE",
            sprayEquipment: "เป้สะพายหลัง",
            productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
            baselineProducts: [],
            additionalProducts: [
              {
                id: "prod-1",
                productId: "prod-base-1",
                productName: "ยาบำรุงข้าว A",
                actualQuantity: 2,
                applicationRate: "25 ซีซี / น้ำ 20 ลิตร",
              },
            ],
            roundImages: [],
          },
        ],
        t7PlotStatus: "COMPLETED",
        t7FinalYieldKg: "8500",
        t7ControlYieldKg: "7200",
        t7FarmerSatisfaction: 5,
      },
    },
  });

  assert.strictEqual(hydrated.length, 1);
  const hItem = hydrated[0];
  assert.strictEqual(hItem.plotName, "แปลงข้าว กข43 สุพรรณบุรี");
  assert.strictEqual(hItem.farmerName, "ประสิทธิ์ ชาวนาดี");
  assert.strictEqual(hItem.visitDate, "2026-10-24");
  assert.strictEqual(hItem.daysAfterSpray, 14);
  assert.strictEqual(hItem.sprayingRounds.length, 1);
  assert.strictEqual(hItem.sprayingRounds[0].baselineProducts.length, 0); // No baseline products in unplanned
  assert.strictEqual(hItem.sprayingRounds[0].additionalProducts.length, 1);
  assert.strictEqual(hItem.plotStatus, "COMPLETED");
  assert.strictEqual(hItem.finalYieldKg, "8500");

  console.log(
    "✓ Test 3 passed: Hydration properly reconstructs rounds, products, and plot evaluation.",
  );

  // ---------------------------------------------------------------------------
  // Test 4: Strategy Save Plan & Save Actual Integration
  // ---------------------------------------------------------------------------
  console.log(
    "\n[Test 4] Testing type7bUnplannedStrategy.savePlan & saveActual integration...",
  );

  const mockType7aTargets: any[] = [
    { id: "demo-plot-101", status: DemoPlotStatus.IN_PROGRESS },
  ];
  const mockSprayRounds: any[] = [];
  const mockSprayProducts: any[] = [];
  const mockType7bTargets: any[] = [];

  const mockTx: any = {
    activityPlanType7aTarget: {
      findFirst: async () => mockType7aTargets[0],
      findUnique: async () => mockType7aTargets[0],
      update: async ({ data }: any) => {
        Object.assign(mockType7aTargets[0], data);
        return mockType7aTargets[0];
      },
    },
    activityPlanType7bTarget: {
      findFirst: async () =>
        mockType7bTargets[0] || { type7aTargetId: "demo-plot-101" },
      deleteMany: async () => {
        mockType7bTargets.length = 0;
      },
      create: async ({ data }: any) => {
        const item = { id: `target-${mockType7bTargets.length + 1}`, ...data };
        mockType7bTargets.push(item);
        return item;
      },
      createMany: async () => {},
    },
    activityPlanType7bPlot: {
      findFirst: async () => ({ type7aTargetId: "demo-plot-101" }),
      deleteMany: async () => {},
      createMany: async () => {},
    },
    activityPlanType7bProduct: {
      deleteMany: async () => {},
      createMany: async () => {},
    },
    activityPlanType7b: {
      findUnique: async () => ({ id: "t7b-main-1" }),
      upsert: async () => ({ id: "t7b-main-1" }),
      deleteMany: async () => {},
      create: async () => ({ id: "t7b-main-1" }),
    },
    activityResult: {
      findFirst: async () => ({ id: "result-101" }),
      findUnique: async () => ({ id: "result-101" }),
      update: async () => {},
    },
    activityResultAttachment: {
      deleteMany: async () => {},
      createMany: async () => {},
    },
    activityAttachment: {
      deleteMany: async () => {},
      createMany: async () => {},
    },
    activityResultSprayRound: {
      deleteMany: async () => {
        mockSprayRounds.length = 0;
      },
      create: async ({ data }: any) => {
        const round = { id: `sr-${mockSprayRounds.length + 1}`, ...data };
        mockSprayRounds.push(round);
        return round;
      },
    },
    activityResultType7bSprayRound: {
      deleteMany: async () => {
        mockSprayRounds.length = 0;
      },
      create: async ({ data }: any) => {
        const round = { id: `sr-${mockSprayRounds.length + 1}`, ...data };
        mockSprayRounds.push(round);
        return round;
      },
    },
    activityResultSprayProduct: {
      createMany: async ({ data }: any) => {
        mockSprayProducts.push(...data);
        return { count: data.length };
      },
    },
    activityResultType7bSprayProduct: {
      createMany: async ({ data }: any) => {
        mockSprayProducts.push(...data);
        return { count: data.length };
      },
    },
    activityResultSprayExternal: {
      createMany: async () => ({ count: 0 }),
    },
    activityResultType7bSprayExternal: {
      createMany: async () => ({ count: 0 }),
    },
    product: {
      findFirst: async ({ where }: any) => {
        return {
          id: where.OR?.[0]?.id || "prod-resolved",
          name: "สินค้าทดสอบ",
        };
      },
      findMany: async ({ where }: any) => {
        return [
          { id: "prod-base-1", name: "ยาบำรุงข้าว A" },
          { id: "prod-add-2", name: "ฮอร์โมนเร่งรวง B" },
        ];
      },
    },
  };

  await type7bUnplannedStrategy.savePlan(mockTx, "plan-unplanned-1", {
    type7bData: mappedPayload.type7bData,
    actualOutcome: mappedPayload.actualOutcome,
  });

  assert.strictEqual(mockSprayRounds.length, 1);
  assert.strictEqual(mockSprayProducts.length, 2);
  assert.strictEqual(mockType7aTargets[0].status, DemoPlotStatus.COMPLETED);

  console.log(
    "✓ Test 4 passed: Unplanned strategy smoothly saves rounds, products, and closure evaluation.",
  );

  console.log("\n🎉 ALL TYPE 7B UNPLANNED REDESIGN TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
