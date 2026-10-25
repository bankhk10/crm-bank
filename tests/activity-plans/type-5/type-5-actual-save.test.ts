import assert from "node:assert";
import { Prisma } from "@prisma/client";
import { parseType5ActualResult } from "@/modules/activity/features/type-5/planned/application/actual-mapper";
import { type5PlannedStrategy } from "@/modules/activity/features/type-5/planned/infrastructure/type5-planned.strategy";

async function runTests() {
  console.log("=== Running Type 5 Actual Form & Decimal Safety Tests ===");

  // -------------------------------------------------------------
  // Test 1: Decimal Safety (no [DecimalError] on blank, whitespace, or comma strings)
  // -------------------------------------------------------------
  console.log("\n[Test 1] Verifying Decimal safety when prices are blank or formatted...");

  const mockCreatedItems: any[] = [];
  const mockTx: any = {
    activityResult: {
      findFirst: async () => ({ id: "res-type5-123" }),
    },
    activityResultSurveyItem: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        mockCreatedItems.push(...args.data);
      },
    },
  };

  const testPlanId = "plan-type5-test";
  const actualDataWithBlankPrices = {
    activityResultId: "res-type5-123",
    t5SurveyDetails: [
      {
        id: "survey-item-1",
        storeId: "store-1",
        productId: "prod-1",
        competitorBrand: "ตราเสือคู่",
        competitorProduct: "ปุ๋ยเคมี 16-16-16",
        posPrice: "", // empty string
        dealerPrice: "   ", // whitespace
        subdealerPrice: null, // null
        farmerPrice: undefined, // undefined
        sellingPoints: "เม็ดปุ๋ยแกร่ง ละลายดี",
      },
      {
        id: "survey-item-2",
        storeId: "store-2",
        productId: "prod-2",
        competitorBrand: "ตราช้างบิน",
        competitorProduct: "ฮอร์โมนพืชสูตรเร่งดอก",
        posPrice: "1,250.50", // formatted with comma
        dealerPrice: "980", // valid numeric string
        subdealerPrice: 1050, // valid number
        farmerPrice: "", // blank
        sellingPoints: "ขวดทึบแสง มีสารจับใบ",
      },
    ],
  };

  // This should NOT throw [DecimalError]
  await type5PlannedStrategy.saveActual!(mockTx, testPlanId, actualDataWithBlankPrices);

  assert.strictEqual(mockCreatedItems.length, 2, "Must create 2 survey records");

  // Verify item 1 (blank prices become null, not throwing DecimalError)
  assert.strictEqual(mockCreatedItems[0].competitorBrand, "ตราเสือคู่");
  assert.strictEqual(mockCreatedItems[0].competitorProduct, "ปุ๋ยเคมี 16-16-16");
  assert.strictEqual(mockCreatedItems[0].posPrice, null);
  assert.strictEqual(mockCreatedItems[0].dealerPrice, null);
  assert.strictEqual(mockCreatedItems[0].subdealerPrice, null);
  assert.strictEqual(mockCreatedItems[0].farmerPrice, null);
  assert.strictEqual(mockCreatedItems[0].sellingPoints, "เม็ดปุ๋ยแกร่ง ละลายดี");

  // Verify item 2 (comma-formatted prices are cleanly converted to Decimal)
  assert.strictEqual(mockCreatedItems[1].competitorBrand, "ตราช้างบิน");
  assert.strictEqual(mockCreatedItems[1].competitorProduct, "ฮอร์โมนพืชสูตรเร่งดอก");
  assert.strictEqual(Number(mockCreatedItems[1].posPrice), 1250.5);
  assert.strictEqual(Number(mockCreatedItems[1].dealerPrice), 980);
  assert.strictEqual(Number(mockCreatedItems[1].subdealerPrice), 1050);
  assert.strictEqual(mockCreatedItems[1].farmerPrice, null);

  console.log("✓ Test 1 passed: Decimal safety works perfectly without [DecimalError].");

  // -------------------------------------------------------------
  // Test 2: parseType5ActualResult extracts survey results and attachments
  // -------------------------------------------------------------
  console.log("\n[Test 2] Verifying parseType5ActualResult extracts items & attachments...");

  const rawResData = {
    id: "res-type5-123",
    surveyResults: [
      {
        id: "survey-item-1",
        storeId: "store-1",
        store: { id: "store-1", name: "ร้านรุ่งเรืองการเกษตร" },
        productId: "prod-1",
        product: { id: "prod-1", name: "ยาฆ่าหญ้าตราปืนใหญ่" },
        competitorBrand: "ตราเสือคู่",
        competitorProduct: "ปุ๋ยเคมี 16-16-16",
        posPrice: new Prisma.Decimal(450),
        dealerPrice: new Prisma.Decimal(380),
        subdealerPrice: new Prisma.Decimal(410),
        farmerPrice: new Prisma.Decimal(450),
        sellingPoints: "จุดเด่นสินค้า",
      },
    ],
    attachments: [
      {
        id: "att-1",
        surveyItemId: "survey-item-1",
        category: "SURVEY_BOTTLE",
        fileUrl: "/uploads/activity-plans/plan-1/bottle/img1.jpg",
        fileName: "bottle.jpg",
      },
      {
        id: "att-2",
        surveyItemId: "survey-item-1",
        category: "SURVEY_PROMO_MATERIAL",
        fileUrl: "/uploads/activity-plans/plan-1/promo/img2.jpg",
        fileName: "promo.jpg",
      },
    ],
  };

  const parsed = parseType5ActualResult(rawResData);

  assert.ok(parsed.t5SurveyDetails, "t5SurveyDetails must exist");
  assert.strictEqual(parsed.t5SurveyDetails?.length, 1);
  assert.strictEqual(parsed.t5CompetitorBrand, "ตราเสือคู่");
  assert.strictEqual(parsed.t5CompetitorProduct, "ปุ๋ยเคมี 16-16-16");

  const parsedItem = parsed.t5SurveyDetails![0];
  assert.strictEqual(parsedItem.store, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(parsedItem.product, "ยาฆ่าหญ้าตราปืนใหญ่");
  assert.strictEqual(parsedItem.competitorBrand, "ตราเสือคู่");
  assert.strictEqual(parsedItem.competitorProduct, "ปุ๋ยเคมี 16-16-16");
  assert.strictEqual(parsedItem.posPrice, "450");
  assert.strictEqual(parsedItem.dealerPrice, "380");
  assert.strictEqual(parsedItem.subdealerPrice, "410");
  assert.strictEqual(parsedItem.farmerPrice, "450");
  assert.strictEqual(parsedItem.sellingPoints, "จุดเด่นสินค้า");

  // Verify attachments are mapped into bottleImages and promotionalImages
  assert.strictEqual(parsedItem.bottleImages?.length, 1, "Must have 1 bottle image");
  assert.strictEqual(parsedItem.bottleImages?.[0].url, "/uploads/activity-plans/plan-1/bottle/img1.jpg");
  assert.strictEqual(parsedItem.promotionalImages?.length, 1, "Must have 1 promo image");
  assert.strictEqual(parsedItem.promotionalImages?.[0].url, "/uploads/activity-plans/plan-1/promo/img2.jpg");

  console.log("✓ Test 2 passed: parseType5ActualResult restores all survey data and photos.");

  console.log("\n🎉 ALL TYPE 5 TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

