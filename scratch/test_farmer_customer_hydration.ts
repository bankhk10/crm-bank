import "dotenv/config";
import { db as prisma } from "../lib/db";
import { findActivityPlanById, upsertActivityResult } from "../modules/activity-plans/infrastructure/activity-plan.repository";

async function main() {
  console.log("=== Testing TYPE7A Farmer Customer ID & Dealer Preservation ===");

  // 1. Find or pick a Dealer customer and a Farmer customer
  const dealer = await prisma.customer.findFirst({
    where: { customerType: "DEALER", deletedAt: null },
  });
  const farmer = await prisma.customer.findFirst({
    where: { customerType: "FARMER", deletedAt: null },
  });
  const product = await prisma.product.findFirst({
    where: { deletedAt: null },
  });

  if (!dealer || !farmer || !product) {
    console.log("Could not find dealer, farmer, or product in DB", { dealer: !!dealer, farmer: !!farmer, product: !!product });
    return;
  }

  console.log(`Dealer: [${dealer.id}] ${dealer.name}`);
  console.log(`Farmer: [${farmer.id}] ${farmer.name}`);

  // Find an existing activity plan with TYPE_7A or create a test one
  const plan = await prisma.activityPlan.findFirst({
    where: {
      deletedAt: null,
      workTypes: { some: { activityType: { code: "TYPE_7A" } } },
      demoPlotVisits: { some: {} },
    },
    include: {
      demoPlotVisits: { include: { demoPlot: true } },
    },
  });

  if (!plan || !plan.demoPlotVisits[0]?.demoPlot) {
    console.log("No existing TYPE_7A plan with DemoPlot found for non-destructive test, testing directly against DemoPlot table logic");
    return;
  }

  const plotId = plan.demoPlotVisits[0].demoPlot.id;
  const originalCustomerId = plan.demoPlotVisits[0].demoPlot.customerId || dealer.id;

  // Set initial customerId to Dealer A
  await prisma.demoPlot.update({
    where: { id: plotId },
    data: { customerId: originalCustomerId },
  });

  console.log(`Testing with Plan ID: ${plan.id}, DemoPlot ID: ${plotId}`);
  console.log(`Initial DemoPlot.customerId (Dealer): ${originalCustomerId}`);

  // CASE A — Registered Farmer Save
  console.log("\n--- Executing CASE A: Save Actual with Registered Farmer B ---");
  await upsertActivityResult({
    activityPlanId: plan.id,
    actualStartDate: new Date(),
    actualEndDate: new Date(),
    resultStatus: "COMPLETED",
    type7aDemoPlot: {
      plotName: "แปลงทดสอบ Case A",
      ownerName: farmer.name,
      ownerPhone: farmer.phone || "0811111111",
      ownerProvince: farmer.province || "สุพรรณบุรี",
      isUnregisteredFarmer: false,
      farmerCustomerId: farmer.id, // Farmer Customer ID
      customerId: null, // should NOT overwrite Dealer
      province: "สุพรรณบุรี",
      latitude: 14.1234,
      longitude: 100.1234,
      cropCategory: "พืชไร่",
      cropName: "ข้าว",
      sprayMethod: "SINGLE",
      hasExternalChemicals: false,
      demoProducts: [
        {
          productId: product.id,
          productName: "สินค้า 1",
          quantity: 1,
          applicationRate: "อัตรา 1",
        },
      ],
    },
  });

  // Reload via findActivityPlanById
  const reloadedPlanA = await findActivityPlanById(plan.id);
  const reloadedPlotA = (reloadedPlanA as any)?.demoPlotVisits?.[0]?.demoPlot;

  console.log("Reloaded Case A Results:");
  console.log(`  DemoPlot.customerId (Dealer): ${reloadedPlotA?.customerId} (Expected: ${originalCustomerId})`);
  console.log(`  DemoPlot.farmerCustomerId: ${reloadedPlotA?.farmerCustomerId} (Expected: ${farmer.id})`);
  console.log(`  DemoPlot.ownerName: ${reloadedPlotA?.ownerName} (Expected: ${farmer.name})`);
  console.log(`  DemoPlot.isUnregisteredFarmer: ${reloadedPlotA?.isUnregisteredFarmer} (Expected: false)`);

  const caseAPassed =
    reloadedPlotA?.customerId === originalCustomerId &&
    reloadedPlotA?.farmerCustomerId === farmer.id &&
    reloadedPlotA?.isUnregisteredFarmer === false;
  console.log(`Case A Assertion: ${caseAPassed ? "PASSED" : "FAILED"}`);

  // CASE B — Unregistered Farmer Save
  console.log("\n--- Executing CASE B: Save Actual with Unregistered Farmer C ---");
  await upsertActivityResult({
    activityPlanId: plan.id,
    actualStartDate: new Date(),
    actualEndDate: new Date(),
    resultStatus: "COMPLETED",
    type7aDemoPlot: {
      plotName: "แปลงทดสอบ Case B",
      ownerName: "นายเกษตรกร อิสระ",
      ownerPhone: "0899999999",
      ownerProvince: "เชียงใหม่",
      isUnregisteredFarmer: true,
      farmerCustomerId: null, // Unregistered -> null
      customerId: null, // should NOT overwrite Dealer
      province: "เชียงใหม่",
      latitude: 18.1234,
      longitude: 98.1234,
      cropCategory: "ไม้ผล",
      cropName: "ส้ม",
      sprayMethod: "SINGLE",
      hasExternalChemicals: false,
      demoProducts: [
        {
          productId: product.id,
          productName: "สินค้า 1",
          quantity: 1,
          applicationRate: "อัตรา 1",
        },
      ],
    },
  });

  // Reload via findActivityPlanById
  const reloadedPlanB = await findActivityPlanById(plan.id);
  const reloadedPlotB = (reloadedPlanB as any)?.demoPlotVisits?.[0]?.demoPlot;

  console.log("Reloaded Case B Results:");
  console.log(`  DemoPlot.customerId (Dealer): ${reloadedPlotB?.customerId} (Expected: ${originalCustomerId})`);
  console.log(`  DemoPlot.farmerCustomerId: ${reloadedPlotB?.farmerCustomerId} (Expected: null)`);
  console.log(`  DemoPlot.ownerName: ${reloadedPlotB?.ownerName} (Expected: นายเกษตรกร อิสระ)`);
  console.log(`  DemoPlot.isUnregisteredFarmer: ${reloadedPlotB?.isUnregisteredFarmer} (Expected: true)`);

  const caseBPassed =
    reloadedPlotB?.customerId === originalCustomerId &&
    reloadedPlotB?.farmerCustomerId === null &&
    reloadedPlotB?.isUnregisteredFarmer === true;
  console.log(`Case B Assertion: ${caseBPassed ? "PASSED" : "FAILED"}`);

  // CASE C — Dealer Preservation verification
  const caseCPassed = reloadedPlotA?.customerId === originalCustomerId && reloadedPlotB?.customerId === originalCustomerId;
  console.log(`\nCase C (Dealer Preservation) Assertion: ${caseCPassed ? "PASSED" : "FAILED"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
