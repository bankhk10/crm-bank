import assert from "node:assert";
import { parseType8ActualResult } from "@/modules/activity/features/type-8/planned/application/actual-mapper";
import { extractType8PlanTargets } from "@/modules/activity/features/type-8/planned/application/planned-mapper";

async function runTests() {
  console.log("=== Running Type 8 Dedicated Tables Actual Hydration Test ===");

  // Simulating plan object as returned by getActivityPlanAction with ACTIVITY_PLAN_FULL_INCLUDE
  // after actual result has been saved into activity_type_8_result and activity_type_8_products
  const mockPlanFromDb = {
    id: "plan-t8-actual-test",
    title: "จัดประชุมเกษตรกรตำบลหนองบัว",
    workTypes: [{ activityType: { code: "TYPE_8" } }],
    targetAttendeesCount: 30,
    type8Targets: [
      {
        id: "t8-target-001",
        activityPlanId: "plan-t8-actual-test",
        topic: "ประชุมชี้แจงเทคนิคการใช้ปุ๋ยและยาป้องกันแมลง",
        dealerId: "cust-001",
        dealerName: "หจก. การเกษตรเพิ่มผล",
        meetingTarget: "FARMER",
        farmerChannel: "DEALER",
        venueType: "STORE",
        targetAttendeesCount: 30,
        products: [
          {
            id: "t8-prod-target-1",
            activityPlanId: "plan-t8-actual-test",
            targetId: "t8-target-001",
            productId: "prod-101",
            productName: "บิ๊กกิล 500 ซีซี",
            productRole: "TARGET",
            actualQuantity: "15",
            actualUnitPrice: "320.00",
            actualTotal: "4800.00",
            actualNotes: "เกษตรกรสั่งจอง 15 ขวด",
          },
          {
            id: "t8-prod-target-2",
            activityPlanId: "plan-t8-actual-test",
            targetId: "t8-target-001",
            productId: "prod-102",
            productName: "โปรคลาม 1 กก.",
            productRole: "TARGET",
            actualQuantity: "8",
            actualUnitPrice: "650.00",
            actualTotal: "5200.00",
            actualNotes: "ส่งมอบวันพฤหัส",
          },
          {
            id: "t8-prod-promo-1",
            activityPlanId: "plan-t8-actual-test",
            targetId: "t8-target-001",
            productId: "prod-101",
            productName: "บิ๊กกิล 500 ซีซี (10 แถม 1)",
            productRole: "PROMOTION",
            targetQuantity: 10,
            targetUnitPrice: 300,
            promotionNotes: "ซื้อ 10 แถม 1",
          },
          {
            id: "t8-prod-add-1",
            activityPlanId: "plan-t8-actual-test",
            targetId: "t8-target-001",
            productId: "prod-103",
            productName: "แอคทารา 25 ดับบลิวจี",
            productRole: "ADDITIONAL_SALE",
            actualQuantity: "5",
            actualUnitPrice: "450.00",
            actualTotal: "2250.00",
            actualNotes: "ขายเพิ่มนอกแผนหน้าร้าน",
          },
        ],
        result: {
          id: "t8-result-001",
          activityPlanId: "plan-t8-actual-test",
          targetId: "t8-target-001",
          actualAttendeesCount: 28,
          feedbackQnA: "เกษตรกรต้องการให้จัดอบรมเรื่องโรคราสนิมเพิ่มเติมในเดือนหน้า",
        },
      },
    ],
    type8Products: [
      {
        id: "t8-prod-target-1",
        activityPlanId: "plan-t8-actual-test",
        targetId: "t8-target-001",
        productId: "prod-101",
        productName: "บิ๊กกิล 500 ซีซี",
        productRole: "TARGET",
        actualQuantity: "15",
        actualNotes: "เกษตรกรสั่งจอง 15 ขวด",
      },
      {
        id: "t8-prod-target-2",
        activityPlanId: "plan-t8-actual-test",
        targetId: "t8-target-001",
        productId: "prod-102",
        productName: "โปรคลาม 1 กก.",
        productRole: "TARGET",
        actualQuantity: "8",
        actualNotes: "ส่งมอบวันพฤหัส",
      },
      {
        id: "t8-prod-add-1",
        activityPlanId: "plan-t8-actual-test",
        targetId: "t8-target-001",
        productId: "prod-103",
        productName: "แอคทารา 25 ดับบลิวจี",
        productRole: "ADDITIONAL_SALE",
        actualQuantity: "5",
        actualNotes: "ขายเพิ่มนอกแผนหน้าร้าน",
      },
    ],
    type8Results: [
      {
        id: "t8-result-001",
        activityPlanId: "plan-t8-actual-test",
        targetId: "t8-target-001",
        actualAttendeesCount: 28,
        feedbackQnA: "เกษตรกรต้องการให้จัดอบรมเรื่องโรคราสนิมเพิ่มเติมในเดือนหน้า",
      },
    ],
    result: {
      id: "result-main-001",
      activityPlanId: "plan-t8-actual-test",
      actualAttendeesCount: 28,
      resultSummary: "จัดประชุม: ประชุมชี้แจงเทคนิคการใช้ปุ๋ยและยาป้องกันแมลง (ผู้เข้าร่วมจริง: 28 คน)",
      attachments: [
        {
          id: "att-reg-1",
          workTypeCode: "TYPE_8",
          category: "GENERAL",
          fileName: "รูปใบลงทะเบียนผู้เข้าร่วมงาน_1.jpg",
          fileUrl: "https://storage.example.com/registration/reg1.jpg",
        },
        {
          id: "att-atm-1",
          workTypeCode: "TYPE_8",
          category: "ATMOSPHERE",
          fileName: "ภาพถ่ายบรรยากาศการประชุม_1.jpg",
          fileUrl: "https://storage.example.com/meeting/atm1.jpg",
        },
      ],
    },
    attachments: [
      {
        id: "att-reg-1",
        workTypeCode: "TYPE_8",
        category: "GENERAL",
        fileName: "รูปใบลงทะเบียนผู้เข้าร่วมงาน_1.jpg",
        fileUrl: "https://storage.example.com/registration/reg1.jpg",
      },
      {
        id: "att-atm-1",
        workTypeCode: "TYPE_8",
        category: "ATMOSPHERE",
        fileName: "ภาพถ่ายบรรยากาศการประชุม_1.jpg",
        fileUrl: "https://storage.example.com/meeting/atm1.jpg",
      },
    ],
  };

  // [Step 1] Test extractType8PlanTargets extracts actual targets, additional items, and result
  console.log("\n[Step 1] Testing extractType8PlanTargets with DB actual data...");
  const extracted = extractType8PlanTargets(mockPlanFromDb);
  assert.ok(extracted.list.length > 0, "Should extract targets");
  const target = extracted.list[0];

  assert.strictEqual(target.topic, "ประชุมชี้แจงเทคนิคการใช้ปุ๋ยและยาป้องกันแมลง");
  assert.strictEqual(target.targetProductItems?.length, 2, "Should have 2 target products");
  assert.strictEqual(target.targetProductItems?.[0].productName, "บิ๊กกิล 500 ซีซี");
  assert.strictEqual(target.targetProductItems?.[0].actualQty, "15", "Should extract target product 1 actualQty");
  assert.strictEqual(target.targetProductItems?.[0].notes, "เกษตรกรสั่งจอง 15 ขวด");
  assert.strictEqual(target.targetProductItems?.[1].actualQty, "8", "Should extract target product 2 actualQty");

  assert.ok(target.additionalProductItems, "Should extract additionalProductItems");
  assert.strictEqual(target.additionalProductItems.length, 1, "Should have 1 additional product");
  assert.strictEqual(target.additionalProductItems[0].productName, "แอคทารา 25 ดับบลิวจี");
  assert.strictEqual(target.additionalProductItems[0].actualQty, "5");
  assert.strictEqual(target.additionalProductItems[0].isAdditional, true);

  assert.ok(target.result, "Should attach target.result");
  assert.strictEqual(target.result.actualAttendeesCount, 28);
  assert.strictEqual(target.result.feedbackQnA, "เกษตรกรต้องการให้จัดอบรมเรื่องโรคราสนิมเพิ่มเติมในเดือนหน้า");
  console.log("✓ Step 1 passed: extractType8PlanTargets extracted all target & additional actual data!");

  // [Step 2] Test parseType8ActualResult directly from payloadToHydrate
  console.log("\n[Step 2] Testing parseType8ActualResult from payloadToHydrate...");
  const payloadToHydrate = {
    ...mockPlanFromDb.result,
    type8Results: mockPlanFromDb.type8Results,
    type8Products: mockPlanFromDb.type8Products,
    type8Targets: mockPlanFromDb.type8Targets,
    activityPlan: mockPlanFromDb,
    attachments: mockPlanFromDb.attachments,
  };

  const parsed = parseType8ActualResult(payloadToHydrate);

  assert.strictEqual(parsed.t8ActualAttendees, "28", "Attendees should be 28");
  assert.strictEqual(
    parsed.t8FeedbackQnA,
    "เกษตรกรต้องการให้จัดอบรมเรื่องโรคราสนิมเพิ่มเติมในเดือนหน้า",
    "Feedback/QnA should match DB record"
  );
  assert.ok(parsed.t8ProductSalesDetails, "Should have productSalesDetails");
  assert.strictEqual(parsed.t8ProductSalesDetails.length, 3, "Should have 3 sales details (2 target + 1 additional)");

  const targetSale1 = parsed.t8ProductSalesDetails.find((s) => s.productName === "บิ๊กกิล 500 ซีซี");
  assert.ok(targetSale1, "Should find target product 1 in sales");
  assert.strictEqual(targetSale1.actualQty, "15");
  assert.strictEqual(targetSale1.notes, "เกษตรกรสั่งจอง 15 ขวด");
  assert.strictEqual(targetSale1.isAdditional, false);

  const targetSale2 = parsed.t8ProductSalesDetails.find((s) => s.productName === "โปรคลาม 1 กก.");
  assert.ok(targetSale2, "Should find target product 2 in sales");
  assert.strictEqual(targetSale2.actualQty, "8");
  assert.strictEqual(targetSale2.notes, "ส่งมอบวันพฤหัส");
  assert.strictEqual(targetSale2.isAdditional, false);

  const addSale = parsed.t8ProductSalesDetails.find((s) => s.productName === "แอคทารา 25 ดับบลิวจี");
  assert.ok(addSale, "Should find additional product in sales");
  assert.strictEqual(addSale.actualQty, "5");
  assert.strictEqual(addSale.notes, "ขายเพิ่มนอกแผนหน้าร้าน");
  assert.strictEqual(addSale.isAdditional, true);

  assert.ok(parsed.t8RegistrationImages, "Should extract registration images");
  assert.strictEqual(parsed.t8RegistrationImages.length, 1);
  assert.strictEqual(parsed.t8RegistrationImages[0].url, "https://storage.example.com/registration/reg1.jpg");

  assert.ok(parsed.t8Images, "Should extract meeting atmosphere images");
  assert.strictEqual(parsed.t8Images.length, 1);
  assert.strictEqual(parsed.t8Images[0].url, "https://storage.example.com/meeting/atm1.jpg");
  console.log("✓ Step 2 passed: parseType8ActualResult extracted all fields from DB tables accurately!");

  // [Step 3] Test fallback when only plan is passed
  console.log("\n[Step 3] Testing parseType8ActualResult when passed plan directly...");
  const parsedDirectPlan = parseType8ActualResult(mockPlanFromDb);
  assert.strictEqual(parsedDirectPlan.t8ActualAttendees, "28");
  assert.strictEqual(parsedDirectPlan.t8FeedbackQnA, "เกษตรกรต้องการให้จัดอบรมเรื่องโรคราสนิมเพิ่มเติมในเดือนหน้า");
  assert.strictEqual(parsedDirectPlan.t8ProductSalesDetails?.length, 3);
  console.log("✓ Step 3 passed: direct plan hydration works seamlessly!");

  console.log("\n🎉 ALL TYPE 8 ACTUAL HYDRATION TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

