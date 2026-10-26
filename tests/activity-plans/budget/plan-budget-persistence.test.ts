import assert from "node:assert";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

async function runBudgetPersistenceTest() {
  console.log("=== Running Budget Persistence Integration Test ===");

  // 1. Find a test employee or user
  const employee = await db.employee.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true, userId: true },
  });

  if (!employee) {
    console.log("No active employee found, skipping DB integration test.");
    return;
  }

  const user = await db.user.findFirst({
    where: { id: employee.userId || undefined },
    select: { id: true },
  });

  const creatorId = user?.id || (await db.user.findFirst())?.id;
  if (!creatorId) {
    console.log("No user found for test, skipping.");
    return;
  }

  const activityType = await db.activityType.findFirst({
    where: { code: "TYPE_8" },
  });
  const activityTypeId = activityType?.id || (await db.activityType.findFirst())?.id;

  if (!activityTypeId) {
    console.log("No activity type found, skipping.");
    return;
  }

  const testTitle = `Test Budget Persistence ${Date.now()}`;
  let createdPlanId: string | null = null;

  try {
    // 2. Insert ActivityPlan with marketingItems and promotionItems via Transaction (simulating Server Action)
    console.log("\n[Step 1] Creating ActivityPlan with marketing & promotion items...");
    const plan = await db.$transaction(async (tx) => {
      const created = await tx.activityPlan.create({
        data: {
          code: `TP-TEST-${Date.now()}`,
          title: testTitle,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          durationDays: 1,
          fiscalYear: 2026,
          fiscalMonth: 10,
          fiscalQuarter: 4,
          activityTypeId,
          objective: "จัดประชุมทดสอบระบบงบประมาณ",
          planType: "PLANNED",
          marketingBudgetRequested: new Prisma.Decimal(500),
          salesPromotionBudgetRequested: new Prisma.Decimal(1200),
          totalBudgetRequested: new Prisma.Decimal(1700),
          status: "DRAFT",
          employeeId: employee.id,
          createdById: creatorId,
        },
      });

      // Save Marketing Items
      await tx.activityPlanMarketingItem.createMany({
        data: [
          {
            activityPlanId: created.id,
            category: "Banner",
            materialName: "ป้ายไวนิลตราปืนใหญ่ 2x1 ม.",
            unit: "ผืน",
            unitPrice: new Prisma.Decimal(250),
            quantity: 2,
            totalAmount: new Prisma.Decimal(500),
          },
        ],
      });

      // Save Promotion Items
      await tx.activityPlanPromotionItem.createMany({
        data: [
          {
            activityPlanId: created.id,
            budgetType: "งบการตลาด",
            detail: "ค่าอาหารและเครื่องดื่มจัดประชุมเกษตรกร",
            amount: new Prisma.Decimal(1200),
          },
        ],
      });

      return created;
    });

    createdPlanId = plan.id;
    console.log(`✓ ActivityPlan created with ID: ${createdPlanId}`);

    // 3. Verify that records exist in Database tables
    console.log("\n[Step 2] Verifying records in activity_plan_marketing_items table...");
    const marketingItems = await db.activityPlanMarketingItem.findMany({
      where: { activityPlanId: createdPlanId },
    });
    assert.strictEqual(marketingItems.length, 1, "Should have exactly 1 marketing item");
    assert.strictEqual(marketingItems[0].materialName, "ป้ายไวนิลตราปืนใหญ่ 2x1 ม.");
    assert.strictEqual(Number(marketingItems[0].totalAmount), 500);
    console.log("✓ activity_plan_marketing_items record successfully verified in DB:", {
      id: marketingItems[0].id,
      materialName: marketingItems[0].materialName,
      quantity: marketingItems[0].quantity,
      totalAmount: Number(marketingItems[0].totalAmount),
    });

    console.log("\n[Step 3] Verifying records in activity_plan_promotion_items table...");
    const promotionItems = await db.activityPlanPromotionItem.findMany({
      where: { activityPlanId: createdPlanId },
    });
    assert.strictEqual(promotionItems.length, 1, "Should have exactly 1 promotion item");
    assert.strictEqual(promotionItems[0].detail, "ค่าอาหารและเครื่องดื่มจัดประชุมเกษตรกร");
    assert.strictEqual(Number(promotionItems[0].amount), 1200);
    console.log("✓ activity_plan_promotion_items record successfully verified in DB:", {
      id: promotionItems[0].id,
      budgetType: promotionItems[0].budgetType,
      detail: promotionItems[0].detail,
      amount: Number(promotionItems[0].amount),
    });

    // 4. Update items (Simulating edit flow)
    console.log("\n[Step 4] Simulating update flow (adding 2nd marketing item and updating promotion)...");
    await db.$transaction(async (tx) => {
      // Re-insert marketing items
      await tx.activityPlanMarketingItem.deleteMany({
        where: { activityPlanId: createdPlanId! },
      });
      await tx.activityPlanMarketingItem.createMany({
        data: [
          {
            activityPlanId: createdPlanId!,
            category: "Banner",
            materialName: "ป้ายไวนิลตราปืนใหญ่ 2x1 ม.",
            unit: "ผืน",
            unitPrice: new Prisma.Decimal(250),
            quantity: 3,
            totalAmount: new Prisma.Decimal(750),
          },
          {
            activityPlanId: createdPlanId!,
            category: "Premium_item",
            materialName: "เสื้อยืดตราปืนใหญ่",
            unit: "ตัว",
            unitPrice: new Prisma.Decimal(150),
            quantity: 10,
            totalAmount: new Prisma.Decimal(1500),
          },
        ],
      });

      // Re-insert promotion items
      await tx.activityPlanPromotionItem.deleteMany({
        where: { activityPlanId: createdPlanId! },
      });
      await tx.activityPlanPromotionItem.createMany({
        data: [
          {
            activityPlanId: createdPlanId!,
            budgetType: "งบขาย",
            detail: "ค่าของรางวัลตอบคำถามเกษตรกร",
            amount: new Prisma.Decimal(2000),
          },
        ],
      });
    });

    const updatedMkt = await db.activityPlanMarketingItem.findMany({
      where: { activityPlanId: createdPlanId },
    });
    assert.strictEqual(updatedMkt.length, 2, "Should have 2 updated marketing items");
    console.log(`✓ Updated marketing items verified: ${updatedMkt.length} items`);

    const updatedPromo = await db.activityPlanPromotionItem.findMany({
      where: { activityPlanId: createdPlanId },
    });
    assert.strictEqual(updatedPromo.length, 1, "Should have 1 updated promotion item");
    assert.strictEqual(Number(updatedPromo[0].amount), 2000);
    console.log(`✓ Updated promotion items verified: ฿${Number(updatedPromo[0].amount)}`);

    console.log("\n🎉 ALL BUDGET DATABASE PERSISTENCE TESTS PASSED!");
  } finally {
    // Cleanup test data
    if (createdPlanId) {
      await db.activityPlan.delete({ where: { id: createdPlanId } }).catch(() => {});
      console.log(`Cleaned up test plan: ${createdPlanId}`);
    }
  }
}

runBudgetPersistenceTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  });
