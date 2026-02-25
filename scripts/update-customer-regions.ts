import { db } from "@/lib/db";
import { getRegionByProvince } from "@/lib/province-region-mapping";

async function main() {
  console.log("Starting customer region update based on current mapping...");

  // Get all active customers
  const customers = await db.customer.findMany({
    where: {
      deletedAt: null,
      province: { not: null },
    },
    select: {
      id: true,
      province: true,
      region: true,
    },
  });

  console.log(`Found ${customers.length} customers with province data.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const customer of customers) {
    if (!customer.province) {
      skippedCount++;
      continue;
    }

    const correctRegion = getRegionByProvince(customer.province);

    // If region is different (or null currently), update it
    if (correctRegion && customer.region !== correctRegion) {
      await db.customer.update({
        where: { id: customer.id },
        data: { region: correctRegion },
      });
      // console.log(`Updated active customer ${customer.id}: ${customer.province} -> ${correctRegion}`);
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log("Update active customers complete.");
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (Already correct or no region found): ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // await db.$disconnect();
    process.exit(0);
  });
