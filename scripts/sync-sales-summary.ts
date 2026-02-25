import { syncSalesSummary } from "@/lib/sales-summary-service";
import { db } from "@/lib/db";

async function main() {
  await syncSalesSummary();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // If db instance needs explicit disconnect in script context
    // usually in nextjs singleton effectively handles it but for script:
    // await db.$disconnect();
    // Actually db from @/lib/db might not expose $disconnect if it's the singleton.
    // simpler to just let process exit.
  });
