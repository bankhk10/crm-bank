import { db } from "@/lib/db";

interface CleanupOptions {
  dryRun?: boolean;
}

export async function cleanupUnusedTradeNameGroups(options: CleanupOptions = { dryRun: false }) {
  const { dryRun } = options;

  console.log("================================================================");
  console.log(`🧹 CLEANUP UNUSED TRADENAME GROUPS (${dryRun ? "DRY RUN MODE" : "EXECUTE MODE"})`);
  console.log("================================================================\n");

  // 1. Find all active TradeNameGroups that have NO products attached
  const unusedGroups = await db.tradeNameGroup.findMany({
    where: {
      deletedAt: null,
      products: {
        none: {},
      },
    },
    select: {
      id: true,
      code: true,
      description: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { description: "asc" },
  });

  const count = unusedGroups.length;
  console.log(`📊 Found ${count} unused TradeNameGroups (products count = 0):\n`);

  unusedGroups.forEach((g, idx) => {
    console.log(`   [${idx + 1}] "${g.description}" (code: "${g.code}", id: ${g.id})`);
  });

  console.log("----------------------------------------------------------------");

  if (count === 0) {
    console.log("No unused TradeNameGroups found to clean up.");
    return;
  }

  if (dryRun) {
    console.log(`\n💡 [DRY RUN] ${count} unused groups would be soft-deleted.`);
    console.log("To execute the cleanup, run with --execute");
    return;
  }

  // 2. Perform soft delete
  console.log(`\n🚀 Soft-deleting ${count} unused TradeNameGroups...`);
  const idsToSoftDelete = unusedGroups.map((g) => g.id);

  const result = await db.tradeNameGroup.updateMany({
    where: {
      id: { in: idsToSoftDelete },
      products: { none: {} }, // Double check safety
    },
    data: {
      deletedAt: new Date(),
    },
  });

  console.log("\n================================================================");
  console.log(`✅ CLEANUP COMPLETED`);
  console.log(`   - Soft-deleted: ${result.count} groups`);
  console.log("================================================================\n");

  // 3. Post-verification: count active TradeNameGroups remaining
  const activeRemaining = await db.tradeNameGroup.count({
    where: { deletedAt: null },
  });

  const activeWithProducts = await db.tradeNameGroup.count({
    where: {
      deletedAt: null,
      products: { some: {} },
    },
  });

  console.log(`🔎 Verification:`);
  console.log(`   - Total Active TradeNameGroups remaining: ${activeRemaining}`);
  console.log(`   - Active TradeNameGroups with Products: ${activeWithProducts}`);
  console.log(`   - Unused Active TradeNameGroups: ${activeRemaining - activeWithProducts}`);

  if (activeRemaining === activeWithProducts) {
    console.log("\n🎉 All active TradeNameGroups now strictly have associated products!");
  }
}

if (require.main === module || process.argv[1]?.includes("cleanup-unused-tradename-groups")) {
  const isExecute = process.argv.includes("--execute");
  cleanupUnusedTradeNameGroups({ dryRun: !isExecute })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Cleanup failed:", err);
      process.exit(1);
    });
}
