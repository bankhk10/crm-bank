import assert from "node:assert";
import {
  CROP_CATEGORIES,
  CROP_NAMES_BY_CATEGORY,
  OTHER_CROP_OPTIONS,
} from "@/modules/activity/features/type-7a/shared/constants";
import { validateType7aFormItems } from "@/modules/activity/features/type-7a/planned/application/planned-validation";
import {
  hydrateType7aPlannedData,
  extractType7aPlanTargets,
} from "@/modules/activity/features/type-7a/planned/application/planned-mapper";
import { parseType7aActualResult } from "@/modules/activity/features/type-7a/planned/application/actual-mapper";
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

  // 4. Persistence & Hydration (Dedicated Type Tables: ActivityPlanType7aTarget + ActivityPlanType7aProduct)
  const createdTargets: any[] = [];
  const createdProducts: any[] = [];
  const mockTx: any = {
    $executeRaw: async () => {},
    activityPlanType7aTarget: {
      findMany: async () => [],
      deleteMany: async () => ({ count: 0 }),
      create: async ({ data }: any) => {
        createdTargets.push(data);
        return { id: "t7a-1", code: data.code || "DP26100001", ...data };
      },
      update: async () => {},
    },
    activityPlanType7aProduct: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async ({ data }: any) => {
        createdProducts.push(...data);
        return { count: data.length };
      },
    },
    product: {
      findMany: async () => [{ id: "p-1", name: "ยาบำรุง A" }],
    },
  };

  await syncType7aPlots(
    mockTx,
    "plan-7a-1",
    [
      {
        plotName: "แปลงทุเรียนสาธิต",
        storeId: "dealer-1",
        dealerName: "ร้านดีลเลอร์เกษตร",
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

  assert.strictEqual(createdTargets.length, 1);
  assert.strictEqual(createdTargets[0].activityPlanId, "plan-7a-1");
  assert.strictEqual(createdTargets[0].plotName, "แปลงทุเรียนสาธิต");
  assert.strictEqual(createdTargets[0].storeId, "dealer-1");
  assert.strictEqual(createdTargets[0].cropCategory, "พืชสวน");
  assert.strictEqual(createdTargets[0].cropName, "พืชสวนอื่นๆ");
  assert.strictEqual(createdTargets[0].customCropName, "มังคุด");
  assert.strictEqual(createdTargets[0].treeCount, 80);
  assert.strictEqual(createdTargets[0].objective, "ทดสอบการติดผลดก");
  assert.strictEqual(createdTargets[0].categoryId, "cat-1");

  assert.strictEqual(createdProducts.length, 1);
  assert.strictEqual(createdProducts[0].productId, "p-1");
  assert.strictEqual(createdProducts[0].productName, "ยาบำรุง A");
  assert.strictEqual(Number(createdProducts[0].quantity), 3);

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

  // 5. Actual Outcome Extraction & Detail View Data Pipeline
  const mockPlanWithActual = {
    id: "plan-7a-actual-1",
    type7aPlots: [
      {
        id: "dp-actual-1",
        code: "DP26100099",
        name: "แปลงข้าวโพดสาธิต แปลง 1",
        ownerName: "สมชาย รักสงบ",
        ownerPhone: "0812345678",
        isUnregisteredFarmer: true,
        customerId: "dealer-99",
        customer: { id: "dealer-99", name: "ร้านรุ่งเรืองการเกษตร", customerCode: "CUST-099" },
        province: "เชียงใหม่",
        district: "ฝาง",
        ownerSubdistrict: "เวียง",
        cropCategory: "พืชไร่",
        cropName: "ข้าวโพดเลี้ยงสัตว์",
        areaRai: 5,
        treeCount: null,
        objective: "ทดสอบการคุมวัชพืช",
        latitude: 19.921345,
        longitude: 99.213456,
        mainCropInfo: "ข้าวโพดพันธุ์ CP-888 ปลูกแบบหยอดเมล็ด",
        experimentDetail: "เปรียบเทียบแปลงฉีดยาบริษัท กับแปลงของเกษตรกร",
        plantingDate: new Date("2026-10-01"),
        initialSprayDate: new Date("2026-10-15"),
        nextSprayDate: new Date("2026-10-30"),
        sprayMethod: "TANK_MIXED",
        sprayEquipment: "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
        otherEquipment: "หัวฉีดพัดลมเบอร์ 2",
        hasExternalChemicals: true,
        notes: "สภาพดินร่วนปนทราย สภาพความชื้นในดินดีมาก",
        irrigations: [{ id: "irr-1", method: "น้ำหยด" }, { id: "irr-2", method: "สปริงเกอร์" }],
        externalProducts: [
          {
            id: "ext-1",
            company: "บ.เคมีเกษตรไทย",
            productName: "สารจับใบ ซูเปอร์สเปรด",
            activeIngredient: "Alkyl aryl polyglycol ether",
            formula: "SL",
            applicationRate: "5 ซีซี ต่อน้ำ 20 ลิตร",
          },
        ],
        demoProducts: [
          {
            id: "dpp-planned-1",
            productId: "prod-herb-1",
            productName: "ยาคุมหญ้าเอ็กซ์ตร้า",
            quantity: 2,
            withdrawnQuantity: 2,
            actualQuantity: 2,
            extraQuantity: "50",
            extraUnit: "ซีซี",
            applicationRate: "20 ซีซี ต่อน้ำ 20 ลิตร",
            isAdditional: false,
          },
          {
            id: "dpp-add-1",
            productId: "prod-add-1",
            productName: "ฮอร์โมนเร่งราก",
            quantity: 1,
            actualQuantity: 1,
            extraQuantity: "",
            extraUnit: "ซีซี",
            applicationRate: "10 ซีซี ต่อน้ำ 20 ลิตร",
            isAdditional: true,
          },
        ],
        visits: [
          {
            id: "visit-1",
            visitNumber: 1,
            cropAgeValue: 14,
            cropAgeUnit: "วัน",
            growthStage: "ระยะ 3-4 ใบ",
            plotImageUrls: ["https://example.com/plot1.jpg"],
          },
        ],
      },
    ],
  };

  const extractedTargets = extractType7aPlanTargets(mockPlanWithActual);
  assert.strictEqual(extractedTargets.list.length, 1);
  const target1 = extractedTargets.primary;
  assert.strictEqual(target1.plotName, "แปลงข้าวโพดสาธิต แปลง 1");
  assert.strictEqual(target1.farmerName, "สมชาย รักสงบ");
  assert.strictEqual(target1.farmerPhone, "0812345678");
  assert.strictEqual(target1.isUnregisteredFarmer, true);
  assert.strictEqual(target1.dealerName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(target1.latitude, 19.921345);
  assert.strictEqual(target1.longitude, 99.213456);
  assert.strictEqual(target1.mainCropInfo, "ข้าวโพดพันธุ์ CP-888 ปลูกแบบหยอดเมล็ด");
  assert.deepStrictEqual(target1.irrigations, ["น้ำหยด", "สปริงเกอร์"]);
  assert.strictEqual(target1.sprayMethod, "TANK_MIXED");
  assert.strictEqual(target1.cropAgeValue, 14);
  assert.strictEqual(target1.growthStage, "ระยะ 3-4 ใบ");
  assert.strictEqual(target1.externalProducts?.length, 1);
  assert.strictEqual(target1.externalProducts[0].productName, "สารจับใบ ซูเปอร์สเปรด");
  assert.strictEqual(target1.demoProducts?.length, 2);
  assert.strictEqual(target1.demoProducts[0].actualQuantity, 2);
  assert.strictEqual(target1.demoProducts[0].extraQuantity, "50");
  assert.strictEqual(target1.demoProducts[1].isAdditional, true);

  const parsedActual = parseType7aActualResult({ activityPlan: mockPlanWithActual });
  assert.strictEqual(parsedActual.t7PlotName, "แปลงข้าวโพดสาธิต แปลง 1");
  assert.strictEqual(parsedActual.t7FarmerName, "สมชาย รักสงบ");
  assert.strictEqual(parsedActual.t7Latitude, 19.921345);
  assert.strictEqual(parsedActual.t7SprayMethod, "TANK_MIXED");
  assert.strictEqual(parsedActual.t7CropAgeValue, 14);
  assert.strictEqual(parsedActual.t7ExternalProducts?.length, 1);
  assert.strictEqual(parsedActual.t7PlannedProducts?.length, 1);
  assert.strictEqual(parsedActual.t7AdditionalProducts?.length, 1);
  assert.strictEqual(parsedActual.t7InitialPhotos?.length, 1);
  assert.strictEqual(parsedActual.t7InitialPhotos[0].url, "https://example.com/plot1.jpg");
  console.log("✓ Test 5 passed: Actual Outcome Extraction and Detail View Data Pipeline verified");

  console.log("\n🎉 ALL TYPE 7A TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

