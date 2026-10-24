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

  const storeDeletions: any[] = [];
  const productDeletions: any[] = [];
  const createdStores: any[] = [];
  const createdProducts: any[] = [];
  let planUpdateData: any = null;

  const mockTx: any = {
    activityPlanStore: {
      deleteMany: async (args: any) => {
        storeDeletions.push(args);
      },
      create: async (args: any) => {
        createdStores.push(args.data);
        return { id: "new-store-1", ...args.data };
      },
    },
    activityPlanProduct: {
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

  assert.strictEqual(storeDeletions.length, 1, "Should delete old stores");
  assert.strictEqual(productDeletions.length, 1, "Should delete old products");
  assert.strictEqual(createdStores.length, 1, "Should create 1 ActivityPlanStore");
  assert.strictEqual(createdStores[0].storeId, "dealer-555");
  assert.strictEqual(createdStores[0].remarks, "แนะนำวิธีการใช้ปุ๋ยเคมีร่วมกับสารป้องกันกำจัดแมลง");

  assert.strictEqual(createdProducts.length, 2, "Should create 2 target products");
  assert.strictEqual(createdProducts[0].productId, "prod-bigkill");
  assert.strictEqual(createdProducts[1].productId, "prod-proclaim");

  assert.ok(planUpdateData, "Should update ActivityPlan targetAttendeesCount");
  assert.strictEqual(planUpdateData.data.targetAttendeesCount, 50, "targetAttendeesCount should be 50");

  console.log("✓ Test 3 passed: type8PlannedStrategy.savePlan correctly saves stores, products, and targetAttendeesCount.");

  console.log("\n🎉 ALL TYPE 8 SAVE & HYDRATION TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
