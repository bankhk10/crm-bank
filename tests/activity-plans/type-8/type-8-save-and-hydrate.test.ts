process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://mock:mock@localhost:5432/mock_db?schema=public";

import assert from "node:assert";
import {
  hydrateType8PlannedData,
  mapType8ToSectionItems,
} from "@/modules/activity/features/type-8/planned/application/planned-mapper";
import {
  encodeType8StoreNotes,
  decodeType8StoreNotes,
} from "@/modules/activity/features/type-8/shared/notes";
import { type8PlannedStrategy } from "@/modules/activity/features/type-8/planned/infrastructure/type8-planned.strategy";

async function runTests() {
  console.log("=== Running Type 8 Save & Hydration Unit Tests ===");

  // -------------------------------------------------------------------------
  // Test 1: encodeType8StoreNotes & decodeType8StoreNotes with full metadata
  // -------------------------------------------------------------------------
  console.log("\n[Test 1] Testing encode and decode of Type 8 Store Notes...");

  const encoded = encodeType8StoreNotes(
    "กำหนดการประชุมช่วงเช้า 09:00 - 12:00",
    ["โปรโมชัน 10 แถม 1", "ลด 5% เมื่อซื้อเงินสด"],
    {
      meetingTarget: "SUBDEALER",
      farmerChannel: "SUBDEALER",
      venueType: "STORE",
      isUnregisteredSubdealer: true,
      subDealerStore: "ร้านรุ่งเรืองการเกษตร (นอกระบบ)",
      dealerId: "dealer-001",
      dealerName: "หจก. ตัวแทนจำหน่ายหลัก",
      attendeesCount: 35,
    },
  );

  assert.ok(encoded, "Encoded notes should not be empty");
  const decoded = decodeType8StoreNotes(encoded);

  assert.strictEqual(
    decoded.detail,
    "กำหนดการประชุมช่วงเช้า 09:00 - 12:00",
    "Detail should match",
  );
  assert.deepStrictEqual(
    decoded.promotions,
    ["โปรโมชัน 10 แถม 1", "ลด 5% เมื่อซื้อเงินสด"],
    "Promotions should match",
  );
  assert.strictEqual(decoded.meetingTarget, "SUBDEALER");
  assert.strictEqual(decoded.farmerChannel, "SUBDEALER");
  assert.strictEqual(decoded.venueType, "STORE");
  assert.strictEqual(decoded.isUnregisteredSubdealer, true);
  assert.strictEqual(decoded.subDealerStore, "ร้านรุ่งเรืองการเกษตร (นอกระบบ)");
  assert.strictEqual(decoded.dealerId, "dealer-001");
  assert.strictEqual(decoded.dealerName, "หจก. ตัวแทนจำหน่ายหลัก");
  assert.strictEqual(decoded.attendeesCount, 35);

  console.log("✓ Test 1 passed: Notes encoded and decoded perfectly with metadata.");

  // -------------------------------------------------------------------------
  // Test 2: Hydrating from Database Plan Record (Simulating Reload after Save)
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] Hydrating Type 8 form from Plan record fetched from DB...");

  const mockDbPlan = {
    id: "plan-t8-101",
    title: "จัดประชุมเกษตรกรผู้ปลูกข้าว",
    targetAttendeesCount: 45,
    stores: [
      {
        id: "store-rec-1",
        activityPlanId: "plan-t8-101",
        workTypeCode: "TYPE_8",
        visitPurpose: "STORE",
        storeId: "dealer-001",
        storeName: "หจก. ตัวแทนจำหน่ายหลัก",
        subDealerStore: "ร้านรุ่งเรืองการเกษตร (นอกระบบ)",
        remarks: "ประชุมชี้แจงโปรโมชันฤดูกาลใหม่",
        notes: encoded,
      },
    ],
    products: [
      {
        id: "prod-rec-1",
        activityPlanId: "plan-t8-101",
        workTypeCode: "TYPE_8",
        storeId: "dealer-001",
        productId: "prod-bigkill",
        productName: "บิ๊กกิล",
      },
      {
        id: "prod-rec-2",
        activityPlanId: "plan-t8-101",
        workTypeCode: "TYPE_8",
        storeId: "dealer-001",
        productId: "prod-proclaim",
        productName: "โปรคลาม",
      },
    ],
  };

  const hydrated = hydrateType8PlannedData(mockDbPlan);

  assert.strictEqual(hydrated.length, 1, "Should hydrate exactly 1 meeting item");
  const meeting = hydrated[0];

  assert.strictEqual(meeting.meetingTarget, "SUBDEALER", "Meeting target should be SUBDEALER");
  assert.strictEqual(meeting.farmerChannel, "SUBDEALER", "Farmer channel should be SUBDEALER");
  assert.strictEqual(meeting.dealerId, "dealer-001", "Dealer ID should be dealer-001");
  assert.strictEqual(meeting.dealerName, "หจก. ตัวแทนจำหน่ายหลัก", "Dealer name should match");
  assert.strictEqual(meeting.isUnregisteredSubdealer, true, "Should be unregistered subdealer");
  assert.strictEqual(meeting.subDealerStore, "ร้านรุ่งเรืองการเกษตร (นอกระบบ)", "Subdealer store name should match");
  assert.strictEqual(meeting.topic, "ประชุมชี้แจงโปรโมชันฤดูกาลใหม่", "Topic should match remarks");
  assert.strictEqual(meeting.detail, "กำหนดการประชุมช่วงเช้า 09:00 - 12:00", "Detail should match");
  assert.strictEqual(meeting.attendeesCount, 35, "Attendees count should match");
  assert.deepStrictEqual(meeting.targetProducts, ["บิ๊กกิล", "โปรคลาม"], "Target products should match");
  assert.deepStrictEqual(meeting.targetProductIds, ["prod-bigkill", "prod-proclaim"], "Target product IDs should match");
  assert.ok(meeting.promotionProducts, "Should have promotion products array");
  assert.strictEqual(meeting.promotionProducts.length, 2, "Should have 2 promotion items");
  assert.strictEqual(meeting.promotionProducts[0]?.notes, "โปรโมชัน 10 แถม 1");
  assert.strictEqual(meeting.promotionProducts[1]?.notes, "ลด 5% เมื่อซื้อเงินสด");

  console.log("✓ Test 2 passed: DB plan hydrated accurately into form fields without missing data.");

  // -------------------------------------------------------------------------
  // Test 3: Strategy savePlan Execution (Mock Transaction Verification)
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Testing type8PlannedStrategy.savePlan transaction calls...");

  const targetDeletions: any[] = [];
  const productDeletions: any[] = [];
  const createdTargets: any[] = [];
  const createdProducts: any[] = [];
  let planUpdateData: any = null;

  const mockTx: any = {
    activityPlanType8Target: {
      deleteMany: async (args: any) => {
        targetDeletions.push(args);
      },
      create: async (args: any) => {
        const item = { id: "t8-target-db-1", ...args.data };
        createdTargets.push(item);
        return item;
      },
    },
    activityPlanType8Product: {
      deleteMany: async (args: any) => {
        productDeletions.push(args);
      },
      create: async (args: any) => {
        createdProducts.push(args.data);
        return { id: "new-prod-1", ...args.data };
      },
    },
    activityPlan: {
      update: async (args: any) => {
        planUpdateData = args;
        return { id: args.where.id };
      },
    },
    product: {
      findFirst: async (args: any) => {
        return null;
      },
    },
    customer: {
      findUnique: async (args: any) => {
        return { id: args.where.id, name: "ร้านค้าทดสอบ" };
      },
    },
  };

  const planPayload = {
    type8Data: {
      meetings: [
        {
          meetingTarget: "FARMER",
          farmerChannel: "DEALER",
          dealerId: "dealer-555",
          dealerName: "ร้าน ปุ๋ยเกษตรพัฒนา",
          topic: "แนะนำวิธีการใช้ปุ๋ยเคมีร่วมกับสารป้องกันกำจัดแมลง",
          targetProducts: ["บิ๊กกิล", "โปรคลาม"],
          targetProductIds: ["prod-bigkill", "prod-proclaim"],
          attendeesCount: 50,
          detail: "มีเกษตรกรกลุ่มเป้าหมาย 50 คน",
          venueType: "STORE",
          promotions: [
            { id: "p1", notes: "ซื้อ 5 ลัง แถมเสื้อ 1 ตัว" },
          ],
        },
      ],
    },
  };

  await type8PlannedStrategy.savePlan(mockTx, "plan-t8-101", planPayload);

  assert.strictEqual(targetDeletions.length, 1, "Should delete old targets");
  assert.strictEqual(productDeletions.length, 1, "Should delete old products");
  assert.strictEqual(createdTargets.length, 1, "Should create 1 ActivityPlanType8Target");
  assert.strictEqual(createdTargets[0].dealerId, "dealer-555");
  assert.strictEqual(createdTargets[0].topic, "แนะนำวิธีการใช้ปุ๋ยเคมีร่วมกับสารป้องกันกำจัดแมลง");

  const targetProds = createdProducts.filter((p) => p.productRole === "TARGET");
  const promoProds = createdProducts.filter((p) => p.productRole === "PROMOTION");
  assert.strictEqual(targetProds.length, 2, "Should create 2 target products");
  assert.strictEqual(promoProds.length, 1, "Should create 1 promotion product");
  assert.strictEqual(targetProds[0].productId, "prod-bigkill");
  assert.strictEqual(targetProds[1].productId, "prod-proclaim");

  assert.ok(planUpdateData, "Should update ActivityPlan targetAttendeesCount");
  assert.strictEqual(planUpdateData.data.targetAttendeesCount, 50, "targetAttendeesCount should be 50");

  console.log("✓ Test 3 passed: type8PlannedStrategy.savePlan correctly saves targets, products, and targetAttendeesCount.");

  // -------------------------------------------------------------------------
  // Test 4: Type 8 Actual Result Parsing & Attachment Mapping
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Testing Type 8 Actual Result Parsing & Attachment Mapping...");

  const { parseType8ActualResult } = await import(
    "@/modules/activity/features/type-8/planned/application/actual-mapper"
  );

  const mockActualData = {
    actualAttendeesCount: 45,
    resultSummary: "จัดประชุม: อบรมการใช้ปุ๋ยเคมี (ผู้เข้าร่วมจริง: 45 คน)\nQ&A: เกษตรกรสอบถามเรื่องระยะเวลาการใส่ปุ๋ย",
    type8Products: [
      {
        id: "sale-1",
        productId: "prod-bigkill",
        productName: "บิ๊กกิล",
        actualQuantity: 10,
        actualTotal: 4500,
        unclosedReason: "ขายพร้อมแถมเสื้อ",
        workTypeCode: "TYPE_8",
      },
    ],
    attachments: [
      {
        id: "att-reg-1",
        workTypeCode: "TYPE_8",
        category: "GENERAL",
        fileUrl: "/uploads/activity-plans/plan-1/registration/type8_registration/reg.jpg",
        fileName: "ใบลงทะเบียนเกษตรกร.jpg",
      },
      {
        id: "att-atmos-1",
        workTypeCode: "TYPE_8",
        category: "ATMOSPHERE",
        fileUrl: "/uploads/activity-plans/plan-1/atmosphere/type8_atmosphere/atmos.jpg",
        fileName: "ภาพบรรยากาศการประชุม.jpg",
      },
    ],
  };

  const parsedActual = parseType8ActualResult(mockActualData);
  assert.strictEqual(parsedActual.t8ActualAttendees, "45", "t8ActualAttendees should be 45");
  assert.strictEqual(parsedActual.t8FeedbackQnA, "เกษตรกรสอบถามเรื่องระยะเวลาการใส่ปุ๋ย", "Q&A should match");
  assert.strictEqual(parsedActual.t8ProductSalesDetails?.length, 1, "Should have 1 sale item");
  assert.strictEqual(parsedActual.t8ProductSalesDetails?.[0].productName, "บิ๊กกิล");
  assert.strictEqual(parsedActual.t8ProductSalesDetails?.[0].actualQty, "10");

  assert.strictEqual(parsedActual.t8RegistrationImages?.length, 1, "Should map registration image correctly");
  assert.strictEqual(parsedActual.t8RegistrationImages?.[0].name, "ใบลงทะเบียนเกษตรกร.jpg");
  assert.strictEqual(parsedActual.t8Images?.length, 1, "Should map atmosphere image correctly");
  assert.strictEqual(parsedActual.t8Images?.[0].name, "ภาพบรรยากาศการประชุม.jpg");

  console.log("✓ Test 4 passed: Type 8 Actual results, attendees, sales, and attachments parsed successfully.");

  // -------------------------------------------------------------
  // Test 5: Verify parseResultSummary parses Type 8 data accurately
  // -------------------------------------------------------------
  console.log("\n[Test 5] Testing parseResultSummary with Type 8 data...");
  const { parseResultSummary } = await import(
    "@/modules/activity/domain/summary/result-summary-parser"
  );

  const mockPlanResult = {
    actualAttendeesCount: 30,
    resultSummary: "จัดประชุม: อบรมเทคนิคการใช้ฮอร์โมน (ผู้เข้าร่วมจริง: 30 คน) | Q&A: เกษตรกรสนใจสินค้าใหม่",
    type8Products: [
      {
        id: "sale-t8-1",
        productId: "prod-1",
        productName: "เอ็นไซม์พลัส",
        actualQuantity: 15,
        workTypeCode: "TYPE_8",
      },
    ],
  };

  const parsedSummary = parseResultSummary(mockPlanResult);
  assert.strictEqual(parsedSummary.actualAttendeesCount, 30, "actualAttendeesCount should be 30");
  assert.strictEqual(parsedSummary.actualAttendees, 30, "actualAttendees should be 30");
  assert.strictEqual(parsedSummary.t8ActualAttendees, "30", "t8ActualAttendees should be '30'");
  assert.strictEqual(parsedSummary.type8Actual?.t8ActualAttendees, "30", "type8Actual.t8ActualAttendees should be '30'");
  assert.strictEqual(parsedSummary.t8FeedbackQnA, "เกษตรกรสนใจสินค้าใหม่", "t8FeedbackQnA should match");
  assert.strictEqual(parsedSummary.t8ProductSalesDetails?.length, 1, "Should have 1 sale item");

  console.log("✓ Test 5 passed: parseResultSummary seamlessly parses Type 8 actual attendees, Q&A, and sales.");

  console.log("\n🎉 ALL TYPE 8 SAVE & HYDRATION TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
