import { db } from "../lib/db";

async function checkMasterData() {
  const customers = await db.customer.count({ where: { deletedAt: null } });
  const products = await db.product.count({ where: { deletedAt: null } });
  const employees = await db.employee.count({ where: { deletedAt: null } });
  const demoPlots = await db.demoPlot.count();
  const users = await db.user.count({ where: { isActive: true } });
  const promotionalMaterials = await db.promotionalMaterial.count();

  console.log("MASTER DATA SUMMARY:");
  console.log(`Customers (Active): ${customers}`);
  console.log(`Products (Active): ${products}`);
  console.log(`Employees (Active): ${employees}`);
  console.log(`Demo Plots: ${demoPlots}`);
  console.log(`Users (Active): ${users}`);
  console.log(`Promotional Materials: ${promotionalMaterials}`);

  if (customers === 0 || products === 0 || employees === 0 || users === 0) {
    console.error("CRITICAL: Missing essential Master Data!");
    process.exit(1);
  }
}

checkMasterData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
