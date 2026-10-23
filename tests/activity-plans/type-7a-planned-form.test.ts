import assert from "node:assert";
import {
  CROP_CATEGORIES,
  CROP_NAMES_BY_CATEGORY,
  OTHER_CROP_OPTIONS,
} from "@/modules/activity/features/type-7a/shared/constants";
import { validateType7aFormItems } from "@/modules/activity/features/type-7a/planned/application/planned-validation";
import { hydrateType7aPlannedData } from "@/modules/activity/features/type-7a/planned/application/planned-mapper";
import { syncType7aPlots } from "@/modules/activity/features/type-7a/planned/infrastructure/type7a.repository";

async function runTests() {
  console.log("=== Running Type 7A Planned Form & Business Logic Tests ===");

  // 1. Crop Categories & Dependent Crop Names
  assert.deepStrictEqual(
    [...CROP_CATEGORIES],
    ["ผักและพืชล้มลุก", "พืชไร่", "พืชสวน"],
  );
  assert.deepStrictEqual([...CROP_NAMES_BY_CATEGORY["ผักและพืชล้มลุก"]], [
    "คะน้า",
    "กะหล่ำปลี",
    "พริก",
    "ผักและพืชล้มลุกอื่นๆ",
  ]);
  assert.deepStrictEqual([...CROP_NAMES_BY_CATEGORY["พืชไร่"]], [
    "ข้าว",
    "อ้อย",
    "ยางพารา",
    "พืชไร่อื่นๆ",
  ]);
  assert.deepStrictEqual([...CROP_NAMES_BY_CATEGORY["พืชสวน"]], [
    "ทุเรียน",
    "ชมพู่",
    "ยางพารา",
    "พืชสวนอื่นๆ",
  ]);
  assert.deepStrictEqual([...OTHER_CROP_OPTIONS], [
    "ผักและพืชล้มลุกอื่นๆ",
    "พืชไร่อื่นๆ",
    "พืชสวนอื่นๆ",
  ]);
  console.log("✓ Test 1 passed: Crop categories and dependent crop names match spec");

  // 2. Custom crop name validation when "อื่นๆ" is selected
  const missingCustom = validateType7aFormItems([
    {
      id: "plot-1",
      plotName: "แปลงผักสาธิต",
      storeId: "dealer-1",
      ownerName: "ร้านเกษตรเจริญ",
      cropCategory: "ผักและพืชล้มลุก",
      cropName: "ผักและพืชล้มลุกอื่นๆ",
      customCropName: "",
      areaRai: 5,
    },
  ]);
  assert.strictEqual(missingCustom.isValid, false);
  assert.ok(missingCustom.error?.includes("กรุณาระบุชื่อพืชเพิ่มเติม"));

  const validCustom = validateType7aFormItems([
    {
      id: "plot-1",
      plotName: "แปลงผักสาธิต",
      storeId: "dealer-1",
      ownerName: "ร้านเกษตรเจริญ",
      cropCategory: "ผักและพืชล้มลุก",
      cropName: "ผักและพืชล้มลุกอื่นๆ",
      customCropName: "กวางตุ้งฮ่องเต้",
      areaRai: 5,
    },
  ]);
  assert.strictEqual(validCustom.isValid, true);
  console.log("✓ Test 2 passed: Custom crop name validated when 'อื่นๆ' is selected");

  // 3. Tree Count vs Area Rai validation
  const missingTreeCount = validateType7aFormItems([
    {
      id: "plot-orchard",
      plotName: "แปลงทุเรียน",
      storeId: "dealer-1",
      ownerName: "ร้านเกษตรเจริญ",
      cropCategory: "พืชสวน",
      cropName: "ทุเรียน",
      areaRai: 10,
      treeCount: null,
    },
  ]);
  assert.strictEqual(missingTreeCount.isValid, false);
  assert.ok(missingTreeCount.error?.includes("กรุณาระบุจำนวนต้น"));

  const validOrchard = validateType7aFormItems([
    {
      id: "plot-orchard",
      plotName: "แปลงทุเรียน",
      storeId: "dealer-1",
      ownerName: "ร้านเกษตรเจริญ",
      cropCategory: "พืชสวน",
      cropName: "ทุเรียน",
      areaRai: null,
      treeCount: 120,
    },
  ]);
  assert.strictEqual(validOrchard.isValid, true);

  const missingAreaRai = validateType7aFormItems([
    {
      id: "plot-field",
      plotName: "แปลงข้าว",
      storeId: "dealer-1",
      ownerName: "ร้านเกษตรเจริญ",
      cropCategory: "พืชไร่",
      cropName: "ข้าว",
      areaRai: null,
      treeCount: 100,
    },
  ]);
  assert.strictEqual(missingAreaRai.isValid, false);
  assert.ok(missingAreaRai.error?.includes("กรุณาระบุพื้นที่ (ไร่)"));
  console.log("✓ Test 3 passed: Dynamic treeCount (พืชสวน) vs areaRai validation works");

  // 4. Persistence & Hydration (Single-Entity Architecture: DemoPlot + DemoPlotProduct)
  const createdDemoPlots: any[] = [];
  const createdDemoPlotProducts: any[] = [];
  const mockTx: any = {
    $executeRaw: async () => {},
    demoPlot: {
      findMany: async () => [],
      create: async ({ data }: any) => {
        createdDemoPlots.push(data);
        return { id: "dp-1", code: data.code || "DP26100001", ...data };
      },
      update: async () => {},
      delete: async () => {},
    },
    demoPlotProduct: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async ({ data }: any) => {
        createdDemoPlotProducts.push(...data);
        return { count: data.length };
      },
    },
    activityPlanStore: {
      deleteMany: async () => ({ count: 0 }),
      create: async () => ({ id: "store-1" }),
    },
    activityPlanProduct: {
      deleteMany: async () => ({ count: 0 }),
      create: async () => ({ id: "prod-1" }),
    },
  };

  await syncType7aPlots(
    mockTx,
    "plan-7a-1",
    [
      {
        plotName: "แปลงทุเรียนสาธิต",
        storeId: "dealer-1",
        ownerName: "ร้านดีลเลอร์เกษตร",
        cropCategory: "พืชสวน",
        cropName: "พืชสวนอื่นๆ",
        customCropName: "มังคุด",
        treeCount: 80,
        areaRai: null,
        objective: "ทดสอบการติดผลดก",
        categoryId: "cat-1",
        demoProducts: [
          {
            categoryId: "cat-1",
            productId: "p-1",
            productName: "ยาบำรุง A",
            quantity: 3,
            unit: "ขวด",
          },
        ],
      },
    ],
    new Date("2026-10-22"),
    "emp-1",
  );

  assert.strictEqual(createdDemoPlots.length, 1);
  assert.strictEqual(createdDemoPlots[0].activityPlanId, "plan-7a-1");
  assert.strictEqual(createdDemoPlots[0].name, "แปลงทุเรียนสาธิต");
  assert.strictEqual(createdDemoPlots[0].customerId, "dealer-1");
  assert.strictEqual(createdDemoPlots[0].cropCategory, "พืชสวน");
  assert.strictEqual(createdDemoPlots[0].cropName, "พืชสวนอื่นๆ");
  assert.strictEqual(createdDemoPlots[0].customCropName, "มังคุด");
  assert.strictEqual(createdDemoPlots[0].treeCount, 80);
  assert.strictEqual(createdDemoPlots[0].objective, "ทดสอบการติดผลดก");
  assert.strictEqual(createdDemoPlots[0].categoryId, "cat-1");
  assert.strictEqual(createdDemoPlots[0].hasProducts, true);

  assert.strictEqual(createdDemoPlotProducts.length, 1);
  assert.strictEqual(createdDemoPlotProducts[0].productId, "p-1");
  assert.strictEqual(createdDemoPlotProducts[0].productName, "ยาบำรุง A");
  assert.strictEqual(Number(createdDemoPlotProducts[0].quantity), 3);
  assert.strictEqual(createdDemoPlotProducts[0].isAdditional, false);

  const hydrated = hydrateType7aPlannedData({
    type7aPlots: [
      {
        id: "dp-1",
        code: "DP26100001",
        name: "แปลงทุเรียนสาธิต",
        customerId: "dealer-1",
        ownerName: "ร้านดีลเลอร์เกษตร",
        cropCategory: "พืชสวน",
        cropName: "พืชสวนอื่นๆ",
        customCropName: "มังคุด",
        treeCount: 80,
        areaRai: null,
        objective: "ทดสอบการติดผลดก",
        categoryId: "cat-1",
        demoProducts: [
          {
            id: "dpp-1",
            productId: "p-1",
            productName: "ยาบำรุง A",
            quantity: 3,
            unit: "ขวด",
            product: { id: "p-1", name: "ยาบำรุง A", categoryId: "cat-1" },
          },
        ],
      },
    ],
  });

  assert.strictEqual(hydrated.length, 1);
  assert.strictEqual(hydrated[0].cropCategory, "พืชสวน");
  assert.strictEqual(hydrated[0].cropName, "พืชสวนอื่นๆ");
  assert.strictEqual(hydrated[0].customCropName, "มังคุด");
  assert.strictEqual(hydrated[0].treeCount, 80);
  assert.strictEqual(hydrated[0].objective, "ทดสอบการติดผลดก");
  assert.strictEqual(hydrated[0].categoryId, "cat-1");
  assert.strictEqual(hydrated[0].demoProducts?.[0]?.categoryId, "cat-1");
  assert.strictEqual(hydrated[0].demoProducts?.[0]?.productId, "p-1");
  console.log("✓ Test 4 passed: Single-Entity DemoPlot persistence and hydration work end-to-end");

  console.log("\n🎉 ALL TYPE 7A TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

