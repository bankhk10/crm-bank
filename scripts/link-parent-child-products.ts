import "dotenv/config";
import { db as prisma } from "../lib/db";

async function main() {
  // Check if --commit flag is passed
  const isCommit = process.argv.includes("--commit");

  console.log("=========================================");
  console.log("  Product Parent-Child Sync & Link Script");
  console.log(`  Mode: ${isCommit ? "COMMIT (Live Update)" : "DRY RUN (Preview)"}`);
  console.log("=========================================\n");

  console.log("Fetching active products...");
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      productCode: true,
      parentId: true,
      name: true,
      commonName: true,
      categoryId: true,
      productABCTypeId: true,
      productGroupId: true,
      tradeNameGroupId: true,
    },
  });

  console.log(`Total active products: ${products.length}`);

  const updatePayloads: {
    childId: string;
    childCode: string;
    parentCode: string;
    parentId: string;
    commonName: string | null;
    categoryId: string | null;
    productABCTypeId: string | null;
    productGroupId: string | null;
    tradeNameGroupId: string | null;
    changes: string[];
  }[] = [];
  const skippedParentCodes: string[] = [];

  for (const parentCandidate of products) {
    const parentCode = parentCandidate.productCode;

    // Find all products where productCode starts with the parentCandidate's code
    const matches = products.filter((p) => p.productCode.startsWith(parentCode));

    // Rule: Match count must be exactly 2
    if (matches.length === 2) {
      const child = matches.find((p) => p.productCode !== parentCode);
      if (child) {
        const changes: string[] = [];
        
        if (child.parentId !== parentCandidate.id) {
          changes.push(`parentId (${child.parentId} -> ${parentCandidate.id})`);
        }
        if (child.commonName !== parentCandidate.commonName) {
          changes.push(`commonName (${child.commonName} -> ${parentCandidate.commonName})`);
        }
        if (child.categoryId !== parentCandidate.categoryId) {
          changes.push(`categoryId (${child.categoryId} -> ${parentCandidate.categoryId})`);
        }
        if (child.productABCTypeId !== parentCandidate.productABCTypeId) {
          changes.push(`productABCTypeId (${child.productABCTypeId} -> ${parentCandidate.productABCTypeId})`);
        }
        if (child.productGroupId !== parentCandidate.productGroupId) {
          changes.push(`productGroupId (${child.productGroupId} -> ${parentCandidate.productGroupId})`);
        }
        if (child.tradeNameGroupId !== parentCandidate.tradeNameGroupId) {
          changes.push(`tradeNameGroupId (${child.tradeNameGroupId} -> ${parentCandidate.tradeNameGroupId})`);
        }

        // Only queue for update if there are actual changes to be made
        if (changes.length > 0) {
          updatePayloads.push({
            childId: child.id,
            childCode: child.productCode,
            parentCode: parentCode,
            parentId: parentCandidate.id,
            commonName: parentCandidate.commonName,
            categoryId: parentCandidate.categoryId,
            productABCTypeId: parentCandidate.productABCTypeId,
            productGroupId: parentCandidate.productGroupId,
            tradeNameGroupId: parentCandidate.tradeNameGroupId,
            changes,
          });
        }
      }
    } else if (matches.length > 2) {
      skippedParentCodes.push(`${parentCode} (matched ${matches.length} products: ${matches.map(m => m.productCode).join(", ")})`);
    }
  }

  console.log(`\nIdentified child products needing updates: ${updatePayloads.length}`);
  if (updatePayloads.length > 0) {
    console.log("\nSample of updates to perform:");
    updatePayloads.slice(0, 15).forEach((payload, index) => {
      console.log(`  ${index + 1}. Child "${payload.childCode}" (Parent: "${payload.parentCode}")`);
      console.log(`     Changes: ${payload.changes.join(", ")}`);
    });
    if (updatePayloads.length > 15) {
      console.log(`  ... and ${updatePayloads.length - 15} more products`);
    }
  }

  if (skippedParentCodes.length > 0) {
    console.log(`\nSkipped groups (matched count not exactly 2): ${skippedParentCodes.length}`);
    console.log("Sample of skipped groups:");
    skippedParentCodes.slice(0, 10).forEach((msg) => console.log(`  - ${msg}`));
    if (skippedParentCodes.length > 10) {
      console.log(`  ... and ${skippedParentCodes.length - 10} more`);
    }
  }

  if (updatePayloads.length === 0) {
    console.log("\nNo updates needed. All child products already match their parents' values.");
    return;
  }

  if (isCommit) {
    console.log(`\nExecuting database updates inside a transaction for ${updatePayloads.length} items...`);
    
    const startTime = Date.now();
    try {
      const result = await prisma.$transaction(
        updatePayloads.map((payload) =>
          prisma.product.update({
            where: { id: payload.childId },
            data: {
              parentId: payload.parentId,
              commonName: payload.commonName,
              categoryId: payload.categoryId,
              productABCTypeId: payload.productABCTypeId,
              productGroupId: payload.productGroupId,
              tradeNameGroupId: payload.tradeNameGroupId,
            },
          })
        )
      );
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\nSuccess! Updated ${result.length} child products in ${duration}s.`);
    } catch (error) {
      console.error("\nError updating database: ", error);
      process.exit(1);
    }
  } else {
    console.log("\n-----------------------------------------");
    console.log("DRY RUN completed. No database changes were made.");
    console.log("To apply these changes, run the command with --commit:");
    console.log("  npx tsx scripts/link-parent-child-products.ts --commit");
    console.log("-----------------------------------------");
  }
}

main()
  .catch((error) => {
    console.error("Fatal error in script:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
