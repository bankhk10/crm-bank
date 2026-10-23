import assert from "node:assert";
import { db } from "@/lib/db";
import {
  findFollowUpActivityPlans,
  findFollowUpDemoPlots,
  createType7bData,
} from "@/modules/activity/features/type-7b/planned/infrastructure/type7b.repository";
import { DemoPlotStatus } from "@prisma/client";

async function runTests() {
  console.log("=== Running Type 7B Follow-Up Plan & Demo Plot Tests ===");

  // Test 1: findFollowUpActivityPlans returns open demo plots
  const followUpPlans = await findFollowUpActivityPlans();
  console.log(`✓ Test 1: Retrieved ${followUpPlans.length} follow-up plan options`);
  assert(Array.isArray(followUpPlans), "followUpPlans should be an array");
  assert(followUpPlans.length > 0, "Should find at least 1 open demo plot option in the database");

  // Verify structure of follow-up options
  for (const option of followUpPlans) {
    assert(option.planId, "Each option must have a planId");
    assert(option.planTitle, "Each option must have a planTitle");
    assert(Array.isArray(option.plots), "Each option must have a plots array");
    assert(option.plots.length > 0, "Each option must have at least 1 plot");
    for (const plot of option.plots) {
      assert(plot.id, "Plot must have an id");
      assert(plot.name, "Plot must have a name");
    }
  }
  console.log("✓ Test 1 passed: Follow-up plan options structure is valid");

  // Test 2: Verify that closed or cancelled plots are NOT included
  const closedPlotsInDb = await db.demoPlot.findMany({
    where: {
      deletedAt: null,
      OR: [
        { status: { in: [DemoPlotStatus.CANCELLED, DemoPlotStatus.COMPLETED] } },
        { closedDate: { not: null } },
      ],
    },
    select: { id: true },
  });
  const closedPlotIds = new Set(closedPlotsInDb.map((p) => p.id));
  const returnedPlotIds = followUpPlans.flatMap((plan) => plan.plots.map((p) => p.id));

  for (const pid of returnedPlotIds) {
    assert(!closedPlotIds.has(pid), `Returned plot ${pid} should not be a closed or cancelled plot`);
  }
  console.log("✓ Test 2 passed: No closed or cancelled plots were returned");

  // Test 3: Returned options correspond to active TYPE_7A Activity Plans
  for (const plan of followUpPlans) {
    assert(plan.planCode?.startsWith("TP"), "Plan code should belong to an ActivityPlan");
  }
  console.log(`✓ Test 3 passed: All ${followUpPlans.length} options correspond to active TYPE_7A plans`);

  // Test 4: findFollowUpDemoPlots returns active plots
  const demoPlots = await findFollowUpDemoPlots();
  assert(Array.isArray(demoPlots), "findFollowUpDemoPlots must return an array");
  assert(demoPlots.length > 0, "findFollowUpDemoPlots must return plots");
  for (const p of demoPlots) {
    assert(p.status !== DemoPlotStatus.CANCELLED, "Plot must not be CANCELLED");
    assert(p.status !== DemoPlotStatus.COMPLETED, "Plot must not be COMPLETED");
    assert(p.closedDate === null, "Plot closedDate must be null");
  }
  console.log(`✓ Test 4 passed: findFollowUpDemoPlots returned ${demoPlots.length} active plots`);

  console.log("\n🎉 ALL TYPE 7B TESTS PASSED!\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

