import assert from "node:assert";
import { hydrateType7bPlannedData } from "@/modules/activity/features/type-7b/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 7B Edit Form Hydration Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: Hydration with full type7b relation (as returned from getActivityPlanAction)
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Hydrating from plan with complete type7b relation...");

  const planWithFullType7b = {
    id: "cmvm33vda0027jgo9unih387t",
    code: "TP26100006",
    title: "ติดตามแปลงสาธิต ข้าวโพดหวาน",
    startDate: new Date("2026-10-24"),
    endDate: new Date("2026-10-24"),
    status: "APPROVED",
    type7b: {
      id: "t7b-record-001",
      activityPlanId: "cmvm33vda0027jgo9unih387t",
      sourceActivityPlanId: "src-plan-7a-123",
      hasProducts: true,
      objective: "ติดตามการงอกและการเจริญเติบโตหลังฉีดพ่นรอบแรก",
      notes: "ติดตามการงอกและการเจริญเติบโตหลังฉีดพ่นรอบแรก",
      sourceActivityPlan: {
        id: "src-plan-7a-123",
        code: "TP26100001",
        title: "ทำแปลงสาธิต ข้าวโพดหวานแปลง 1",
      },
      plots: [
        {
          id: "t7b-plot-1",
          type7bId: "t7b-record-001",
          demoPlotId: "demo-plot-uuid-99",
          plotName: "แปลงสาธิตข้าวโพดหวาน คุณสมชาย",
          cropName: "ข้าวโพดหวาน",
          ownerName: "นายสมชาย ใจดี",
          province: "นครราชสีมา",
          district: "ปากช่อง",
          areaRai: 5.5,
          treeCount: null,
          demoPlot: {
            id: "demo-plot-uuid-99",
            code: "DP2603001",
            name: "แปลงสาธิตข้าวโพดหวาน คุณสมชาย",
            ownerName: "นายสมชาย ใจดี",
            cropCategory: "พืชไร่",
            cropName: "ข้าวโพดหวาน",
            activityPlanId: "src-plan-7a-123",
          },
        },
      ],
      products: [
        {
          id: "t7b-prod-1",
          type7bId: "t7b-record-001",
          productId: "prod-uuid-1",
          productName: "เอ็กซอล",
          quantity: 2,
          unit: "ขวด",
          product: {
            id: "prod-uuid-1",
            name: "เอ็กซอล",
            productCode: "EX001",
            unit: "ขวด",
          },
        },
        {
          id: "t7b-prod-2",
          type7bId: "t7b-record-001",
          productId: "prod-uuid-2",
          productName: "นูริชแคลเซียมโบรอน",
          quantity: 3,
          unit: "ขวด",
          product: {
            id: "prod-uuid-2",
            name: "นูริชแคลเซียมโบรอน",
            productCode: "NCB002",
            unit: "ขวด",
          },
        },
      ],
    },
  };

  const hydrated = hydrateType7bPlannedData(planWithFullType7b);

  assert.strictEqual(hydrated.length, 1, "Should hydrate 1 Type 7B plan item");
  const item = hydrated[0];

  assert.strictEqual(item.selectedPlanId, "src-plan-7a-123", "Source plan ID should match");
  assert.deepStrictEqual(item.selectedPlotIds, ["demo-plot-uuid-99"], "Selected plot IDs should contain demoPlotId");
  assert.strictEqual(item.demoPlotId, "demo-plot-uuid-99", "demoPlotId should match");
  assert.strictEqual(item.existingPlotName, "แปลงสาธิตข้าวโพดหวาน คุณสมชาย", "Plot name should match");
  assert.strictEqual(item.ownerName, "นายสมชาย ใจดี", "Owner name should match");
  assert.strictEqual(item.cropName, "ข้าวโพดหวาน", "Crop name should match");
  assert.strictEqual(item.cropCategory, "พืชไร่", "Crop category should match from demoPlot relation");
  assert.strictEqual(item.areaRai, 5.5, "Area Rai should match");
  assert.strictEqual(item.hasProductWithdrawal, true, "hasProductWithdrawal should be true");
  assert.strictEqual(item.withdrawnProducts?.length, 2, "Should hydrate 2 withdrawn products");
  assert.strictEqual(item.withdrawnProducts?.[0].productId, "prod-uuid-1", "Product 1 ID should match");
  assert.strictEqual(item.withdrawnProducts?.[0].productName, "เอ็กซอล", "Product 1 name should match");
  assert.strictEqual(item.withdrawnProducts?.[0].quantity, 2, "Product 1 quantity should match");
  assert.strictEqual(item.withdrawnProducts?.[1].productId, "prod-uuid-2", "Product 2 ID should match");
  assert.strictEqual(item.withdrawnProducts?.[1].productName, "นูริชแคลเซียมโบรอน", "Product 2 name should match");
  assert.strictEqual(item.withdrawnProducts?.[1].quantity, 3, "Product 2 quantity should match");
  assert.strictEqual(item.objective, "ติดตามการงอกและการเจริญเติบโตหลังฉีดพ่นรอบแรก", "Objective should match");
  assert.strictEqual(item.detail, "ติดตามการงอกและการเจริญเติบโตหลังฉีดพ่นรอบแรก", "Detail should match");

  console.log("✓ Test 1 passed: Full plan hydrated successfully with plots, source plan, objective, and products.");

  // -------------------------------------------------------------------------
  // Test 2: Hydration from plan with type7bPlots fallback (defensive resilience)
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Testing fallback hydration when type7b is in type7bPlots array...");

  const planFallback = {
    id: "plan-fallback-01",
    objective: "วัตถุประสงค์สำรอง",
    type7bPlots: [
      {
        id: "plot-fb-1",
        demoPlotId: "demo-plot-fb",
        plotName: "แปลงทุเรียนหลังสวน",
        ownerName: "ลุงป้อม",
        cropName: "ทุเรียน",
        province: "ชุมพร",
        district: "หลังสวน",
      },
    ],
    type7bProducts: [
      {
        id: "fb-p-1",
        productId: "prod-durian-1",
        productName: "ปุ๋ยทุเรียนเร่งราก",
        quantity: 5,
        unit: "กระสอบ",
      },
    ],
  };

  const hydratedFallback = hydrateType7bPlannedData(planFallback);
  assert.strictEqual(hydratedFallback.length, 1);
  const fbItem = hydratedFallback[0];
  assert.strictEqual(fbItem.existingPlotName, "แปลงทุเรียนหลังสวน");
  assert.strictEqual(fbItem.ownerName, "ลุงป้อม");
  assert.strictEqual(fbItem.hasProductWithdrawal, true);
  assert.strictEqual(fbItem.withdrawnProducts?.length, 1);
  assert.strictEqual(fbItem.withdrawnProducts?.[0].productName, "ปุ๋ยทุเรียนเร่งราก");
  assert.strictEqual(fbItem.objective, "วัตถุประสงค์สำรอง");

  console.log("✓ Test 2 passed: Fallback hydration works seamlessly.");

  // -------------------------------------------------------------------------
  // Test 3: Hydration from Real Prisma structure (type7bTargets & type7bProducts)
  // This is the EXACT structure returned by getActivityPlanAction from PostgreSQL / Prisma
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Testing hydration from Real Prisma structure (type7bTargets + type7bProducts)...");

  const planFromPrisma = {
    id: "cmvm33vda0027jgo9unih387t",
    code: "TP26100006",
    title: "ติดตามแปลงสาธิต ข้าวโพดหวาน",
    startDate: new Date("2026-10-24"),
    endDate: new Date("2026-10-24"),
    status: "APPROVED",
    objective: "ติดตามการงอกและการเจริญเติบโตหลังฉีดพ่นรอบแรก",
    type7bTargets: [
      {
        id: "target-cuid-001",
        activityPlanId: "cmvm33vda0027jgo9unih387t",
        demoPlotId: "demo-plot-uuid-99",
        sourceActivityPlanId: "src-plan-7a-123",
        plotName: "แปลงสาธิตข้าวโพดหวาน คุณสมชาย",
        cropName: "ข้าวโพดหวาน",
        ownerName: "นายสมชาย ใจดี",
        province: "นครราชสีมา",
        district: "ปากช่อง",
        areaRai: "5.50",
        treeCount: null,
        dealerName: "ร้าน ปากช่องการเกษตร",
        objective: "ติดตามการงอกและการเจริญเติบโตหลังฉีดพ่นรอบแรก",
        notes: "ติดตามการงอกและการเจริญเติบโตหลังฉีดพ่นรอบแรก",
        demoPlot: {
          id: "demo-plot-uuid-99",
          code: "DP2603001",
          name: "แปลงสาธิตข้าวโพดหวาน คุณสมชาย",
          ownerName: "นายสมชาย ใจดี",
          cropCategory: "พืชไร่",
          cropName: "ข้าวโพดหวาน",
          activityPlanId: "src-plan-7a-123",
          province: "นครราชสีมา",
          district: "ปากช่อง",
          areaRai: "5.50",
          treeCount: null,
        },
        sourceActivityPlan: {
          id: "src-plan-7a-123",
          code: "TP26100001",
          title: "ทำแปลงสาธิต ข้าวโพดหวานแปลง 1",
          startDate: new Date("2026-10-20"),
          endDate: new Date("2026-10-20"),
        },
        products: [
          {
            id: "t7b-prod-1",
            activityPlanId: "cmvm33vda0027jgo9unih387t",
            targetId: "target-cuid-001",
            productId: "prod-uuid-1",
            productName: "เอ็กซอล",
            quantity: "2.00",
            unit: "ขวด",
            product: {
              id: "prod-uuid-1",
              name: "เอ็กซอล",
              productCode: "EX001",
              unit: "ขวด",
            },
          },
        ],
      },
    ],
    type7bProducts: [
      {
        id: "t7b-prod-1",
        activityPlanId: "cmvm33vda0027jgo9unih387t",
        targetId: "target-cuid-001",
        productId: "prod-uuid-1",
        productName: "เอ็กซอล",
        quantity: "2.00",
        unit: "ขวด",
        product: {
          id: "prod-uuid-1",
          name: "เอ็กซอล",
          productCode: "EX001",
          unit: "ขวด",
        },
      },
      {
        id: "t7b-prod-2",
        activityPlanId: "cmvm33vda0027jgo9unih387t",
        targetId: "target-cuid-001",
        productId: "prod-uuid-2",
        productName: "นูริชแคลเซียมโบรอน",
        quantity: "3.00",
        unit: "ขวด",
        product: {
          id: "prod-uuid-2",
          name: "นูริชแคลเซียมโบรอน",
          productCode: "NCB002",
          unit: "ขวด",
        },
      },
    ],
  };

  const hydratedPrisma = hydrateType7bPlannedData(planFromPrisma);
  assert.strictEqual(hydratedPrisma.length, 1, "Should hydrate 1 Type 7B plan item from Prisma schema");
  const prismaItem = hydratedPrisma[0];

  assert.strictEqual(prismaItem.selectedPlanId, "src-plan-7a-123", "Source plan ID must match from type7bTargets");
  assert.deepStrictEqual(prismaItem.selectedPlotIds, ["demo-plot-uuid-99"], "Plot IDs must match demoPlotId");
  assert.strictEqual(prismaItem.demoPlotId, "demo-plot-uuid-99");
  assert.strictEqual(prismaItem.existingPlotName, "แปลงสาธิตข้าวโพดหวาน คุณสมชาย");
  assert.strictEqual(prismaItem.ownerName, "นายสมชาย ใจดี");
  assert.strictEqual(prismaItem.cropName, "ข้าวโพดหวาน");
  assert.strictEqual(prismaItem.cropCategory, "พืชไร่");
  assert.strictEqual(prismaItem.areaRai, 5.5);
  assert.strictEqual(prismaItem.sourcePlanCode, "TP26100001");
  assert.strictEqual(prismaItem.sourcePlanTitle, "ทำแปลงสาธิต ข้าวโพดหวานแปลง 1");
  assert.strictEqual(prismaItem.hasProductWithdrawal, true);
  assert.strictEqual(prismaItem.withdrawnProducts?.length, 2, "Should hydrate all products from type7bProducts");
  assert.strictEqual(prismaItem.withdrawnProducts?.[0].productName, "เอ็กซอล");
  assert.strictEqual(prismaItem.withdrawnProducts?.[0].quantity, 2);
  assert.strictEqual(prismaItem.withdrawnProducts?.[1].productName, "นูริชแคลเซียมโบรอน");
  assert.strictEqual(prismaItem.withdrawnProducts?.[1].quantity, 3);
  assert.strictEqual(prismaItem.objective, "ติดตามการงอกและการเจริญเติบโตหลังฉีดพ่นรอบแรก");

  console.log("✓ Test 3 passed: Real Prisma database structure hydrated with 100% accuracy.");

  // -------------------------------------------------------------------------
  // Test 4: Hydration with Multiple Plots in type7bTargets
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Testing hydration with multiple plots in type7bTargets...");

  const multiPlotPlan = {
    id: "plan-multi-plot",
    type7bTargets: [
      {
        id: "target-1",
        demoPlotId: "plot-aaa",
        plotName: "แปลงที่ 1 ทุเรียนหมอนทอง",
        ownerName: "นายกานต์",
        cropName: "ทุเรียน",
        sourceActivityPlanId: "plan-7a-master",
      },
      {
        id: "target-2",
        demoPlotId: "plot-bbb",
        plotName: "แปลงที่ 2 ทุเรียนก้านยาว",
        ownerName: "นางมาลี",
        cropName: "ทุเรียน",
        sourceActivityPlanId: "plan-7a-master",
      },
    ],
    type7bProducts: [],
  };

  const hydratedMulti = hydrateType7bPlannedData(multiPlotPlan);
  assert.strictEqual(hydratedMulti.length, 1);
  const multiItem = hydratedMulti[0];
  assert.deepStrictEqual(multiItem.selectedPlotIds, ["plot-aaa", "plot-bbb"], "Must contain all plot IDs");
  assert.strictEqual(multiItem.selectedPlanId, "plan-7a-master");
  assert.strictEqual(multiItem.plots?.length, 2, "Must retain raw plots array for individual metadata");

  console.log("✓ Test 4 passed: Multi-plot plan hydrated successfully.");

  // -------------------------------------------------------------------------
  // Test 5: Fallback to demoPlotVisits
  // -------------------------------------------------------------------------
  console.log("\n[Test 5] Testing fallback hydration from demoPlotVisits...");

  const visitFallbackPlan = {
    id: "plan-visit-fallback",
    demoPlotVisits: [
      {
        id: "visit-1",
        demoPlotId: "dp-visit-01",
        notes: "ตรวจสภาพแปลงรอบที่ 2",
        demoPlot: {
          id: "dp-visit-01",
          name: "แปลงเยี่ยมชมมะม่วง",
          ownerName: "พี่สมพงษ์",
          cropName: "มะม่วงน้ำดอกไม้",
          activityPlanId: "src-7a-visit",
          areaRai: 10,
        },
      },
    ],
  };

  const hydratedVisit = hydrateType7bPlannedData(visitFallbackPlan);
  assert.strictEqual(hydratedVisit.length, 1);
  const visitItem = hydratedVisit[0];
  assert.strictEqual(visitItem.existingPlotName, "แปลงเยี่ยมชมมะม่วง");
  assert.strictEqual(visitItem.ownerName, "พี่สมพงษ์");
  assert.strictEqual(visitItem.selectedPlanId, "src-7a-visit");
  assert.strictEqual(visitItem.objective, "ตรวจสภาพแปลงรอบที่ 2");

  console.log("✓ Test 5 passed: demoPlotVisits fallback hydrated successfully.");

  console.log("\n🎉 ALL HYDRATION UNIT TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

