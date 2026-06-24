import { db } from './lib/db';

async function main() {
  await db.$executeRaw`TRUNCATE TABLE "ActivityApprovalRouteConfig" CASCADE;`;
  console.log('Cleared Config Table');
}

main().catch(console.error).finally(() => process.exit(0));
