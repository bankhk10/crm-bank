import assert from "node:assert";
import { Prisma } from "@prisma/client";
import {
  mapType5UnplannedToPayload,
  hydrateType5UnplannedData,
} from "@/modules/activity/features/type-5/unplanned/application/unplanned-mapper";
import { type5UnplannedStrategy } from "@/modules/activity/features/type-5/unplanned/infrastructure/type5-unplanned.strategy";
import type { Type5UnplannedItem } from "@/modules/activity/features/type-5/unplanned/types/unplanned.types";

async function runTests() {
  console.log("=== Running Type 5 Unplanned Save & Hydration Tests ===");

  // -------------------------------------------------------------
  // Test 1: mapType5UnplannedToPayload maps items cleanly
  // -------------------------------------------------------------
  console.log("\n[Test 1] Verifying mapType5UnplannedToPayload...");

  const rawItems: Type5UnplannedItem[] = [
    {
      id: "unplanned-item-1",
      storeId: "store-uuid-1",
      storeName: "ร้านรุ่งเรืองการเกษตร",
      productId: "prod-uuid-1",
      comparedProduct: "ยาฆ่าหญ้าตราปืนใหญ่",
      detail: "สำรวจร้านค้าตัวแทนหลัก",
      competitorBrand: "ตราเสือคู่",
      competitorProduct: "ปุ๋ยเคมี 16-16-16",
      posPrice: 450,
      dealerPrice: 380,
      subdealerPrice: 410,
      farmerPrice: 450,
      sellingPoints: "เม็ดปุ๋ยแกร่ง ละลายดี ไม่เป็นฝุ่น",
      bottleImages: [
        {
          id: "img-1",
          url: "/uploads/bottle-1.jpg",
          name: "ขวดปุ๋ย.jpg",
          size: 1024,
          type: "image/jpeg",
        },
      ],
      promotionalImages: [
        {
          id: "img-2",
          url: "/uploads/promo-1.jpg",
          name: "ป้ายโปรโมท.jpg",
          size: 2048,
          type: "image/jpeg",
        },
      ],
    },
    {
      id: "unplanned-item-2",
      storeId: "store-uuid-2",
      storeName: "ร้าน ป.การเกษตร",
      productId: "prod-uuid-2",
      comparedProduct: "ฮอร์โมนเร่งราก",
      detail: "ร้านค้าย่อยในอำเภอ",
      competitorBrand: "ตราช้างบิน",
      competitorProduct: "สารจับใบพลัส",
      posPrice: 120,
      dealerPrice: 95,
      subdealerPrice: 105,
      farmerPrice: 120,
      sellingPoints: "เข้มข้น ประหยัดปริมาณการใช้",
      bottleImages: [],
      promotionalImages: [],
    },
  ];

  const mapped = mapType5UnplannedToPayload(rawItems);

  assert.strictEqual(mapped.type5Targets.length, 2, "Must produce 2 targets");
  assert.strictEqual(mapped.type5Targets[0].storeName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(mapped.type5Targets[1].storeName, "ร้าน ป.การเกษตร");

  assert.strictEqual(mapped.type5SurveyRecords.length, 2, "Must produce 2 survey records");
  assert.strictEqual(mapped.type5SurveyRecords[0].competitorBrand, "ตราเสือคู่");
  assert.strictEqual(mapped.type5SurveyRecords[1].competitorBrand, "ตราช้างบิน");
  assert.strictEqual(mapped.type5SurveyRecords[0].posPrice, 450);

  console.log("✓ Test 1 passed: mapType5UnplannedToPayload maps items cleanly.");

  // -------------------------------------------------------------
  // Test 2: type5UnplannedStrategy.savePlan creates ActivityResult if missing and persists items
  // -------------------------------------------------------------
  console.log("\n[Test 2] Verifying type5UnplannedStrategy.savePlan auto-creates ActivityResult and saves survey items...");

  const planId = "plan-unplanned-t5";
  const createdTargets: any[] = [];
  const createdSurveyItems: any[] = [];
  const createdAttachments: any[] = [];
  let createdResultRecord: any = null;

  const mockTx: any = {
    activityPlan: {
      findUnique: async () => ({
        id: planId,
        startDate: new Date("2026-10-22T08:00:00Z"),
        endDate: new Date("2026-10-22T17:00:00Z"),
      }),
    },
    activityResult: {
      findFirst: async () => createdResultRecord,
      create: async (args: any) => {
        createdResultRecord = { id: "res-new-t5", ...args.data };
        return createdResultRecord;
      },
    },
    activityPlanType5Target: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdTargets.push(...args.data);
      },
    },
    activityPlanStore: {
      deleteMany: async () => {},
      createMany: async () => {},
    },
    activityPlanProduct: {
      deleteMany: async () => {},
      createMany: async () => {},
    },
    activityResultSurveyItem: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdSurveyItems.push(...args.data);
      },
    },
    activityAttachment: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdAttachments.push(...args.data);
      },
    },
  };

  const planPayload = {
    planType: "UNPLANNED",
    type5Targets: mapped.type5Targets,
    type5SurveyRecords: mapped.type5SurveyRecords,
    targetActualResults: mapped.type5SurveyRecords,
  };

  await type5UnplannedStrategy.savePlan(mockTx, planId, planPayload);

  // 1. Must create targets
  assert.strictEqual(createdTargets.length, 2, "Must save 2 targets to activityPlanType5Target");
  assert.strictEqual(createdTargets[0].storeId, "store-uuid-1");
  assert.strictEqual(createdTargets[1].storeId, "store-uuid-2");

  // 2. Must create ActivityResult because it didn't exist
  assert.ok(createdResultRecord, "Must auto-create ActivityResult for unplanned activity");
  assert.strictEqual(createdResultRecord.activityPlanId, planId);
  assert.strictEqual(createdResultRecord.resultStatus, "COMPLETED");

  // 3. Must create 2 survey records
  assert.strictEqual(createdSurveyItems.length, 2, "Must save 2 survey items to activityResultSurveyItem");
  assert.strictEqual(createdSurveyItems[0].competitorBrand, "ตราเสือคู่");
  assert.strictEqual(createdSurveyItems[1].competitorBrand, "ตราช้างบิน");
  assert.strictEqual(Number(createdSurveyItems[0].posPrice), 450);
  assert.strictEqual(Number(createdSurveyItems[1].dealerPrice), 95);

  // 4. Must save attachments linked to survey item
  assert.strictEqual(createdAttachments.length, 2, "Must save 2 attachments (bottle + promo)");
  assert.strictEqual(createdAttachments[0].category, "SURVEY_BOTTLE");
  assert.strictEqual(createdAttachments[1].category, "SURVEY_PROMO_MATERIAL");
  assert.strictEqual(createdAttachments[0].surveyItemId, createdSurveyItems[0].id);

  console.log("✓ Test 2 passed: Auto-creates ActivityResult, saves targets, survey items, and attachments.");

  // -------------------------------------------------------------
  // Test 3: hydrateType5UnplannedData restores data on edit / reload
  // -------------------------------------------------------------
  console.log("\n[Test 3] Verifying hydrateType5UnplannedData restores data on reload...");

  const loadedPlanFromDb = {
    id: planId,
    title: "สำรวจตลาดปุ๋ยยาคู่แข่ง",
    type5Targets: [
      {
        id: "target-1",
        storeId: "store-uuid-1",
        store: { id: "store-uuid-1", name: "ร้านรุ่งเรืองการเกษตร" },
        productId: "prod-uuid-1",
        product: { id: "prod-uuid-1", name: "ยาฆ่าหญ้าตราปืนใหญ่" },
        detail: "สำรวจร้านค้าตัวแทนหลัก",
      },
      {
        id: "target-2",
        storeId: "store-uuid-2",
        store: { id: "store-uuid-2", name: "ร้าน ป.การเกษตร" },
        productId: "prod-uuid-2",
        product: { id: "prod-uuid-2", name: "ฮอร์โมนเร่งราก" },
        detail: "ร้านค้าย่อยในอำเภอ",
      },
    ],
    result: {
      id: "res-new-t5",
      surveyResults: [
        {
          id: "survey-item-1",
          storeId: "store-uuid-1",
          store: { id: "store-uuid-1", name: "ร้านรุ่งเรืองการเกษตร" },
          productId: "prod-uuid-1",
          competitorBrand: "ตราเสือคู่",
          competitorProduct: "ปุ๋ยเคมี 16-16-16",
          posPrice: new Prisma.Decimal(450),
          dealerPrice: new Prisma.Decimal(380),
          subdealerPrice: new Prisma.Decimal(410),
          farmerPrice: new Prisma.Decimal(450),
          sellingPoints: "เม็ดปุ๋ยแกร่ง ละลายดี ไม่เป็นฝุ่น",
          attachments: [
            {
              id: "att-1",
              category: "SURVEY_BOTTLE",
              fileUrl: "/uploads/bottle-1.jpg",
              fileName: "ขวดปุ๋ย.jpg",
            },
            {
              id: "att-2",
              category: "SURVEY_PROMO_MATERIAL",
              fileUrl: "/uploads/promo-1.jpg",
              fileName: "ป้ายโปรโมท.jpg",
            },
          ],
        },
        {
          id: "survey-item-2",
          storeId: "store-uuid-2",
          store: { id: "store-uuid-2", name: "ร้าน ป.การเกษตร" },
          productId: "prod-uuid-2",
          competitorBrand: "ตราช้างบิน",
          competitorProduct: "สารจับใบพลัส",
          posPrice: new Prisma.Decimal(120),
          dealerPrice: new Prisma.Decimal(95),
          subdealerPrice: new Prisma.Decimal(105),
          farmerPrice: new Prisma.Decimal(120),
          sellingPoints: "เข้มข้น ประหยัดปริมาณการใช้",
          attachments: [],
        },
      ],
    },
  };

  const hydrated = hydrateType5UnplannedData(loadedPlanFromDb);

  assert.strictEqual(hydrated.length, 2, "Must hydrate 2 unplanned items");

  // Item 1
  assert.strictEqual(hydrated[0].storeName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(hydrated[0].comparedProduct, "ยาฆ่าหญ้าตราปืนใหญ่");
  assert.strictEqual(hydrated[0].competitorBrand, "ตราเสือคู่");
  assert.strictEqual(hydrated[0].competitorProduct, "ปุ๋ยเคมี 16-16-16");
  assert.strictEqual(hydrated[0].posPrice, 450);
  assert.strictEqual(hydrated[0].dealerPrice, 380);
  assert.strictEqual(hydrated[0].subdealerPrice, 410);
  assert.strictEqual(hydrated[0].farmerPrice, 450);
  assert.strictEqual(hydrated[0].sellingPoints, "เม็ดปุ๋ยแกร่ง ละลายดี ไม่เป็นฝุ่น");
  assert.strictEqual(hydrated[0].bottleImages.length, 1);
  assert.strictEqual(hydrated[0].promotionalImages.length, 1);

  // Item 2
  assert.strictEqual(hydrated[1].storeName, "ร้าน ป.การเกษตร");
  assert.strictEqual(hydrated[1].comparedProduct, "ฮอร์โมนเร่งราก");
  assert.strictEqual(hydrated[1].competitorBrand, "ตราช้างบิน");
  assert.strictEqual(hydrated[1].competitorProduct, "สารจับใบพลัส");
  assert.strictEqual(hydrated[1].posPrice, 120);
  assert.strictEqual(hydrated[1].dealerPrice, 95);

  console.log("✓ Test 3 passed: Hydrates correctly with relation objects, survey results, and photos restored.");

  // -------------------------------------------------------------
  // Test 4: hydrateType5UnplannedData fallback when targets are missing
  // -------------------------------------------------------------
  console.log("\n[Test 4] Verifying fallback hydration when type5Targets is missing but surveyResults exist...");

  const planWithOnlySurveyResults = {
    id: planId,
    type5Targets: [],
    result: loadedPlanFromDb.result,
  };

  const fallbackHydrated = hydrateType5UnplannedData(planWithOnlySurveyResults);
  assert.strictEqual(fallbackHydrated.length, 2, "Must hydrate from surveyResults fallback");
  assert.strictEqual(fallbackHydrated[0].competitorBrand, "ตราเสือคู่");
  assert.strictEqual(fallbackHydrated[1].competitorBrand, "ตราช้างบิน");

  console.log("✓ Test 4 passed: Fallback hydration works seamlessly.");

  console.log("\n🎉 ALL TYPE 5 UNPLANNED TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

