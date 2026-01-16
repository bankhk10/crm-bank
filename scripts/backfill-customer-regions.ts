import { db } from "@/src/infrastructure/database";
import { getRegionByProvince } from "@/lib/province-region-mapping";

async function main() {
  console.log("Starting customer region backfill...");

  let page = 1;
  const perPage = 100;
  let updatedCount = 0;
  let skippedCount = 0;

  while (true) {
    const customers = await db.customer.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        province: true,
        region: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    if (customers.length === 0) break;

    console.log(`Processing page ${page}, ${customers.length} customers...`);

    for (const customer of customers) {
      // Logic: Update if region is missing OR if it doesn't match the mapping (to correct data)
      const correctRegion = getRegionByProvince(customer.province);

      if (correctRegion && customer.region !== correctRegion) {
        await db.customer.update({
          where: { id: customer.id },
          data: { region: correctRegion },
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    page++;
  }

  console.log("Backfill complete.");
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // await db.$disconnect();
  });
