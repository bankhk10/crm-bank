import "dotenv/config";
import { db } from "./lib/db";

async function main() {
  const somchai = await db.employee.findFirst({
    where: { name: { contains: "Somchai" } },
  });
  const mana = await db.employee.findFirst({
    where: { name: { contains: "Mana" } },
  });

  if (somchai && mana) {
    await db.employee.update({
      where: { id: somchai.id },
      data: { managerId: mana.id },
    });
    console.log(`Assigned ${mana.name} as manager of ${somchai.name}`);
  } else {
    console.error("Could not find Somchai or Mana");
  }
}

main().catch(console.error);
