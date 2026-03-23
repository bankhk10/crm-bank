import "dotenv/config";
import { PrismaClient, DataAccessLevel, EditAccessLevel, DeleteAccessLevel } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// @ts-ignore
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting RBAC update script for sales_admin...");

  const role = await prisma.role.findUnique({
    where: { slug: "sales_admin" },
  });

  if (!role) {
    console.error("❌ Role 'sales_admin' not found.");
    process.exit(1);
  }

  // 1. Delete { key: "menu.show_product" }
  const permShowProduct = await prisma.permission.findUnique({
    where: { key: "menu.show_product" },
  });
  
  if (permShowProduct) {
    const deleted = await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: permShowProduct.id,
      },
    });
    if (deleted.count > 0) {
      console.log(`✅ Removed 'menu.show_product' from 'sales_admin'.`);
    } else {
      console.log(`⚠️ 'menu.show_product' was not assigned to 'sales_admin', no changes made.`);
    }
  } else {
    console.log(`⚠️ Permission 'menu.show_product' does not exist in the database.`);
  }

  // Helper to add/update permission
  async function assignPermission(
      key: string,
      dataAccess: DataAccessLevel | null = null,
      editAccess: EditAccessLevel | null = null,
      deleteAccess: DeleteAccessLevel | null = null
  ) {
    const permission = await prisma.permission.findUnique({
      where: { key },
    });

    if (!permission) {
      console.error(`❌ Permission '${key}' not found in the database. Cannot assign.`);
      return;
    }

    const existingRolePerm = await prisma.rolePermission.findFirst({
        where: { roleId: role!.id, permissionId: permission.id },
    });

    if (existingRolePerm) {
      // Update
      await prisma.rolePermission.update({
        where: { id: existingRolePerm.id },
        data: {
            allow: true,
            dataAccess,
            editAccess,
            deleteAccess,
        },
      });
      console.log(`✅ Updated '${key}' for 'sales_admin' with dataAccess: ${dataAccess || 'N/A'}`);
    } else {
      // Create
      await prisma.rolePermission.create({
        data: {
            roleId: role!.id,
            permissionId: permission.id,
            allow: true,
            dataAccess,
            editAccess,
            deleteAccess,
        },
      });
      console.log(`✅ Added '${key}' for 'sales_admin' with dataAccess: ${dataAccess || 'N/A'}`);
    }
  }

  // 2. Add { key: "sale.edit" }
  await assignPermission("sale.edit");

  // 3. Add { key: "sale.view", dataAccess: "VIEW_ALL" }
  await assignPermission("sale.view", DataAccessLevel.VIEW_ALL);

  console.log("🎉 Script finished updating permissions for 'sales_admin'.");
}

main()
  .catch((e) => {
    console.error("❌ Error running script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
