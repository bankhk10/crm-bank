import assert from "node:assert";
import {
  parseType6ActualResult,
} from "@/modules/activity/features/type-6/planned/application/actual-mapper";
import { type6PlannedStrategy } from "@/modules/activity/features/type-6/planned/infrastructure/type6-planned.strategy";
import {
  mapType6UnplannedToPayload,
  hydrateType6UnplannedData,
} from "@/modules/activity/features/type-6/unplanned/application/unplanned-mapper";
import { type6UnplannedStrategy } from "@/modules/activity/features/type-6/unplanned/infrastructure/type6-unplanned.strategy";
import type { Type6UnplannedItem } from "@/modules/activity/features/type-6/unplanned/types/unplanned.types";

async function runTests() {
  console.log("=== Running Type 6 Planned & Unplanned Save and Hydrate Tests ===");

  // -------------------------------------------------------------
  // Test 1: parseType6ActualResult parses issueResults & attachments
  // -------------------------------------------------------------
  console.log("\n[Test 1] Verifying parseType6ActualResult extracts issue results and images...");

  const rawDbResult = {
    id: "res-type6-1",
    activityPlanId: "plan-type6-1",
    resultStatus: "COMPLETED",
    issueResults: [
      {
        id: "issue-item-1",
        productId: "prod-1",
        product: { id: "prod-1", name: "ปุ๋ยเคมีสูตรพิเศษ 20-20-20" },
        productName: "ปุ๋ยเคมีสูตรพิเศษ 20-20-20",
        lotNumber: "LOT-680412",
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        storeId: "store-1",
        store: { id: "store-1", name: "ร้านรุ่งเรืองการเกษตร" },
        storeName: "ร้านรุ่งเรืองการเกษตร",
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "ฝาขวดแตกร้าวมีน้ำยาซึมออกมา",
        problemFound: "ฝาขวดแตกร้าวมีน้ำยาซึมออกมา",
        status: "เสร็จสิ้น",
        attachments: [
          {
            id: "att-1",
            category: "ISSUE",
            fileUrl: "/uploads/broken-cap.jpg",
            fileName: "ฝาแตก.jpg",
          },
        ],
      },
    ],
    attachments: [
      {
        id: "att-1",
        category: "ISSUE",
        fileUrl: "/uploads/broken-cap.jpg",
        fileName: "ฝาแตก.jpg",
      },
    ],
  };

  const parsed = parseType6ActualResult(rawDbResult);

  assert.ok(parsed.t6IssueRecord, "Must produce t6IssueRecord");
  assert.strictEqual(parsed.t6ProductId, "prod-1");
  assert.strictEqual(parsed.t6ProductName, "ปุ๋ยเคมีสูตรพิเศษ 20-20-20");
  assert.strictEqual(parsed.t6LotNumber, "LOT-680412");
  assert.strictEqual(parsed.t6PurchaseChannel, "ร้านค้าตัวแทนจำหน่าย");
  assert.strictEqual(parsed.t6StoreId, "store-1");
  assert.strictEqual(parsed.t6StoreName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(parsed.t6IssueType, "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย");
  assert.strictEqual(parsed.t6Detail, "ฝาขวดแตกร้าวมีน้ำยาซึมออกมา");
  assert.strictEqual(parsed.t6Status, "เสร็จสิ้น");
  assert.strictEqual(parsed.t6Images?.length, 1);
  assert.strictEqual(parsed.t6Images?.[0]?.url, "/uploads/broken-cap.jpg");

  console.log("✓ Test 1 passed: parseType6ActualResult extracts all fields and images.");

  // -------------------------------------------------------------
  // Test 2: type6PlannedStrategy.saveActual saves issue items and attachments
  // -------------------------------------------------------------
  console.log("\n[Test 2] Verifying type6PlannedStrategy.saveActual auto-creates ActivityResult if missing...");

  const testPlanId = "plan-type6-planned";
  const createdIssues: any[] = [];
  const createdAttachments: any[] = [];
  let createdResultRecord: any = null;

  const mockTx: any = {
    activityPlan: {
      findUnique: async () => ({
        id: testPlanId,
        startDate: new Date("2026-10-22T08:00:00Z"),
        endDate: new Date("2026-10-22T17:00:00Z"),
      }),
    },
    activityResult: {
      findFirst: async () => createdResultRecord,
      create: async (args: any) => {
        createdResultRecord = { id: "res-auto-created-6", ...args.data };
        return createdResultRecord;
      },
    },
    activityResultIssueItem: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdIssues.push(...args.data);
      },
    },
    activityAttachment: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdAttachments.push(...args.data);
      },
    },
  };

  const actualData = {
    issueResults: [
      {
        id: "issue-item-client-1",
        productId: "prod-1",
        productName: "ปุ๋ยเคมีสูตรพิเศษ 20-20-20",
        lotNumber: "LOT-680412",
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        storeId: "store-1",
        storeName: "ร้านรุ่งเรืองการเกษตร",
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "ฝาขวดแตกร้าว",
        status: "เสร็จสิ้น",
        images: [
          {
            id: "img-1",
            url: "/uploads/broken-cap.jpg",
            name: "ฝาแตก.jpg",
          },
        ],
      },
    ],
  };

  await type6PlannedStrategy.saveActual!(mockTx, testPlanId, actualData);

  assert.ok(createdResultRecord, "Must auto-create ActivityResult");
  assert.strictEqual(createdResultRecord.activityPlanId, testPlanId);
  assert.strictEqual(createdIssues.length, 1);
  assert.strictEqual(createdIssues[0].lotNumber, "LOT-680412");
  assert.strictEqual(createdIssues[0].purchaseChannel, "ร้านค้าตัวแทนจำหน่าย");
  assert.strictEqual(createdAttachments.length, 1);
  assert.strictEqual(createdAttachments[0].category, "ISSUE");
  assert.strictEqual(createdAttachments[0].type6ResultId || createdAttachments[0].issueItemId, createdIssues[0].id);

  console.log("✓ Test 2 passed: saveActual creates ActivityResult and links attachments.");

  // -------------------------------------------------------------
  // Test 3: mapType6UnplannedToPayload maps items cleanly
  // -------------------------------------------------------------
  console.log("\n[Test 3] Verifying mapType6UnplannedToPayload...");

  const unplannedItems: Type6UnplannedItem[] = [
    {
      id: "unplanned-6-1",
      isManualCustomer: false,
      storeId: "store-1",
      customerName: "ร้านรุ่งเรืองการเกษตร",
      issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
      detail: "ฝาแตกร้าว",
      purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
      productId: "prod-1",
      productName: "ปุ๋ยเคมีสูตรพิเศษ",
      lotNumber: "LOT-001",
      status: "เสร็จสิ้น",
      images: [{ id: "i1", url: "/uploads/img1.jpg", name: "รูป1.jpg" }],
    },
    {
      id: "unplanned-6-2",
      isManualCustomer: true,
      manualCustomerName: "คุณสมชาย หมายมั่น",
      manualCustomerAddress: "ม.3 ต.หนองบัว",
      manualCustomerPhone: "081-234-5678",
      issueType: "เกิดความเสียหายหลังการใช้สินค้า",
      detail: "พ่นแล้วใบไหม้",
      purchaseChannel: "ออนไลน์",
      productId: "prod-2",
      productName: "ฮอร์โมนพืช",
      lotNumber: "LOT-002",
      status: "รอติดตาม",
      images: [],
    },
  ];

  const mapped = mapType6UnplannedToPayload(unplannedItems);

  assert.strictEqual(mapped.type6Targets.length, 2);
  assert.strictEqual(mapped.type6Targets[0].customerName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(mapped.type6Targets[1].manualCustomerName, "คุณสมชาย หมายมั่น");
  assert.strictEqual(mapped.type6ActualIssues.length, 2);
  assert.strictEqual(mapped.type6ActualIssues[0].lotNumber, "LOT-001");
  assert.strictEqual(mapped.type6ActualIssues[1].purchaseChannel, "ออนไลน์");

  console.log("✓ Test 3 passed: mapType6UnplannedToPayload handles both customer types.");

  // -------------------------------------------------------------
  // Test 4: type6UnplannedStrategy.savePlan persists targets & actuals
  // -------------------------------------------------------------
  console.log("\n[Test 4] Verifying type6UnplannedStrategy.savePlan...");

  const unplannedPlanId = "plan-unplanned-t6";
  const createdUnplannedTargets: any[] = [];
  const createdUnplannedStores: any[] = [];
  const createdUnplannedIssues: any[] = [];
  let unplannedResultRecord: any = null;

  const mockUnplannedTx: any = {
    activityPlan: {
      findUnique: async () => ({
        id: unplannedPlanId,
        startDate: new Date(),
        endDate: new Date(),
      }),
    },
    activityResult: {
      findFirst: async () => unplannedResultRecord,
      create: async (args: any) => {
        unplannedResultRecord = { id: "res-unplanned-6", ...args.data };
        return unplannedResultRecord;
      },
    },
    activityPlanType6Target: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdUnplannedTargets.push(...args.data);
      },
    },
    activityPlanStore: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdUnplannedStores.push(...args.data);
      },
    },
    activityResultType6: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdUnplannedIssues.push(...args.data);
      },
    },
    activityResultIssueItem: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdUnplannedIssues.push(...args.data);
      },
    },
    activityAttachment: {
      deleteMany: async () => {},
      createMany: async () => {},
    },
  };

  await type6UnplannedStrategy.savePlan(mockUnplannedTx, unplannedPlanId, {
    planType: "UNPLANNED",
    type6Targets: mapped.type6Targets,
    type6ActualIssues: mapped.type6ActualIssues,
  });

  assert.strictEqual(createdUnplannedTargets.length, 2, "Must create 2 targets");
  assert.strictEqual(createdUnplannedIssues.length, 2, "Must create 2 issue records");
  assert.strictEqual(createdUnplannedIssues[0].lotNumber, "LOT-001");
  assert.strictEqual(createdUnplannedIssues[1].lotNumber, "LOT-002");

  console.log("✓ Test 4 passed: type6UnplannedStrategy.savePlan persists targets and actuals.");

  // -------------------------------------------------------------
  // Test 5: hydrateType6UnplannedData restores data on reload / edit
  // -------------------------------------------------------------
  console.log("\n[Test 5] Verifying hydrateType6UnplannedData...");

  const loadedPlanFromDb = {
    id: unplannedPlanId,
    type6Targets: [
      {
        id: "target-1",
        storeId: "store-1",
        store: { id: "store-1", name: "ร้านรุ่งเรืองการเกษตร" },
        customerName: "ร้านรุ่งเรืองการเกษตร",
        isManualCustomer: false,
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "ฝาแตกร้าว",
      },
      {
        id: "target-2",
        storeId: null,
        customerName: "คุณสมชาย หมายมั่น",
        manualCustomerName: "คุณสมชาย หมายมั่น",
        isManualCustomer: true,
        issueType: "เกิดความเสียหายหลังการใช้สินค้า",
        detail: "พ่นแล้วใบไหม้",
      },
    ],
    result: {
      id: "res-unplanned-6",
      issueResults: [
        {
          id: "issue-1",
          storeId: "store-1",
          productId: "prod-1",
          product: { id: "prod-1", name: "ปุ๋ยเคมีสูตรพิเศษ" },
          productName: "ปุ๋ยเคมีสูตรพิเศษ",
          lotNumber: "LOT-001",
          purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
          issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
          detail: "ฝาแตกร้าว",
          status: "เสร็จสิ้น",
          attachments: [
            {
              id: "att-1",
              category: "ISSUE",
              fileUrl: "/uploads/img1.jpg",
              fileName: "รูป1.jpg",
            },
          ],
        },
        {
          id: "issue-2",
          storeId: null,
          productId: "prod-2",
          product: { id: "prod-2", name: "ฮอร์โมนพืช" },
          productName: "ฮอร์โมนพืช",
          lotNumber: "LOT-002",
          purchaseChannel: "ออนไลน์",
          issueType: "เกิดความเสียหายหลังการใช้สินค้า",
          detail: "พ่นแล้วใบไหม้",
          status: "รอติดตาม",
          attachments: [],
        },
      ],
    },
  };

  const hydrated = hydrateType6UnplannedData(loadedPlanFromDb);

  assert.strictEqual(hydrated.length, 2, "Must hydrate 2 items");

  // Item 1
  assert.ok(hydrated[0]);
  assert.strictEqual(hydrated[0].customerName, "ร้านรุ่งเรืองการเกษตร");
  assert.strictEqual(hydrated[0].lotNumber, "LOT-001");
  assert.strictEqual(hydrated[0].productName, "ปุ๋ยเคมีสูตรพิเศษ");
  assert.strictEqual(hydrated[0].purchaseChannel, "ร้านค้าตัวแทนจำหน่าย");
  assert.strictEqual(hydrated[0].status, "เสร็จสิ้น");
  assert.strictEqual(hydrated[0].images?.length, 1);

  // Item 2
  assert.ok(hydrated[1]);
  assert.strictEqual(hydrated[1].manualCustomerName, "คุณสมชาย หมายมั่น");
  assert.strictEqual(hydrated[1].isManualCustomer, true);
  assert.strictEqual(hydrated[1].lotNumber, "LOT-002");
  assert.strictEqual(hydrated[1].purchaseChannel, "ออนไลน์");
  assert.strictEqual(hydrated[1].status, "รอติดตาม");

  console.log("✓ Test 5 passed: hydrateType6UnplannedData restores targets, issue details, and images.");

  // -------------------------------------------------------------
  // Test 6: type6PlannedStrategy.savePlan does not pass client id to createMany
  // -------------------------------------------------------------
  console.log("\n[Test 6] Verifying type6PlannedStrategy.savePlan leaves ID generation to Prisma...");

  const planId1 = "plan-type6-planned-1";
  const createdTargetsBatch1: any[] = [];
  const mockPlanTx: any = {
    activityPlanType6Target: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdTargetsBatch1.push(...args.data);
      },
    },
  };

  // User form sends id: "1" from initial form state
  await type6PlannedStrategy.savePlan(mockPlanTx, planId1, {
    type6Targets: [
      {
        id: "1",
        customerName: "ร้านทดสอบ",
        storeId: "store-test",
        issueType: "สินค้าชำรุด",
        detail: "กล่องบุบ",
      },
    ],
  });

  assert.strictEqual(createdTargetsBatch1.length, 1);
  assert.strictEqual(
    createdTargetsBatch1[0].id,
    undefined,
    "Target data sent to createMany must NOT specify client id '1', allowing Prisma @default(cuid()) to generate unique IDs"
  );
  assert.strictEqual(createdTargetsBatch1[0].activityPlanId, planId1);
  assert.strictEqual(createdTargetsBatch1[0].customerName, "ร้านทดสอบ");

  console.log("✓ Test 6 passed: savePlan leaves id undefined so Prisma generates unique CUIDs.");

  // -------------------------------------------------------------
  // Test 7: Multi-Target Actual Form validation and saveActual
  // -------------------------------------------------------------
  console.log("\n[Test 7] Verifying multi-target Actual validation and saveActual for 2 targets...");

  const { validateType6Actual } = await import(
    "@/modules/activity/features/type-6/planned/application/actual-validation"
  );

  // Validation with 2 targets: first valid, second missing lot number
  const invalidMultiCheck = validateType6Actual({
    items: [
      {
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        storeId: "store-1",
        productId: "prod-1",
        lotNumber: "LOT-111",
        issueType: "สินค้าชำรุด",
        detail: "ฝาแตก",
        status: "เสร็จสิ้น",
      },
      {
        customerName: "เกษตรกรทดสอบ",
        purchaseChannel: "ออนไลน์",
        productId: "prod-2",
        lotNumber: "", // Missing
        issueType: "เกิดความเสียหายหลังการใช้สินค้า",
        detail: "ใบไหม้",
        status: "รอติดตาม",
      },
    ],
  });

  assert.strictEqual(invalidMultiCheck.isValid, false);
  assert.ok(
    invalidMultiCheck.error?.includes("รายการที่ 2"),
    "Error should indicate item 2 missing lot number",
  );

  // Valid 2 targets
  const validMultiCheck = validateType6Actual({
    items: [
      {
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        storeId: "store-1",
        productId: "prod-1",
        lotNumber: "LOT-111",
        issueType: "สินค้าชำรุด",
        status: "เสร็จสิ้น",
      },
      {
        customerName: "เกษตรกรทดสอบ",
        purchaseChannel: "ออนไลน์",
        productId: "prod-2",
        lotNumber: "LOT-222",
        issueType: "เกิดความเสียหายหลังการใช้สินค้า",
        status: "รอติดตาม",
      },
    ],
  });

  assert.strictEqual(validMultiCheck.isValid, true);

  // saveActual with 2 targets
  const planId2 = "plan-type6-multi-actual";
  const createdMultiActuals: any[] = [];
  const createdMultiAttachments: any[] = [];
  const mockMultiActualTx: any = {
    activityResult: {
      findFirst: async () => ({ id: "res-multi-6" }),
    },
    activityResultType6: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdMultiActuals.push(...args.data);
      },
    },
    activityPlanType6Target: {
      findMany: async () => [
        { id: "target-db-1", storeId: "store-1", customerName: "ร้านค้า 1" },
        { id: "target-db-2", storeId: null, customerName: "เกษตรกร 2" },
      ],
    },
    activityAttachment: {
      deleteMany: async () => {},
      createMany: async (args: any) => {
        createdMultiAttachments.push(...args.data);
      },
    },
  };

  await type6PlannedStrategy.saveActual!(mockMultiActualTx, planId2, {
    type6Results: [
      {
        id: "issue-client-1",
        targetId: "target-db-1",
        storeId: "store-1",
        productId: "prod-1",
        lotNumber: "LOT-111",
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        issueType: "สินค้าชำรุด",
        status: "เสร็จสิ้น",
        images: [{ url: "/img1.jpg", name: "1.jpg" }],
      },
      {
        id: "issue-client-2",
        targetId: "target-db-2",
        storeId: null,
        customerName: "เกษตรกร 2",
        productId: "prod-2",
        lotNumber: "LOT-222",
        purchaseChannel: "ออนไลน์",
        issueType: "เกิดความเสียหายหลังการใช้สินค้า",
        status: "รอติดตาม",
        images: [{ url: "/img2.jpg", name: "2.jpg" }],
      },
    ],
  });

  assert.strictEqual(createdMultiActuals.length, 2, "Must save 2 actual issue records");
  assert.strictEqual(createdMultiActuals[0].targetId, "target-db-1");
  assert.strictEqual(createdMultiActuals[1].targetId, "target-db-2");
  assert.strictEqual(createdMultiAttachments.length, 2, "Must save 2 attachments linked to their records");
  assert.strictEqual(createdMultiAttachments[0].type6ResultId, createdMultiActuals[0].id);
  assert.strictEqual(createdMultiAttachments[1].type6ResultId, createdMultiActuals[1].id);

  console.log("✓ Test 7 passed: Multi-target validation and saveActual successfully handles 2 targets.");

  console.log("\n🎉 ALL TYPE 6 TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

