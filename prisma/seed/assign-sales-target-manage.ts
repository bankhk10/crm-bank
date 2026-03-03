import "dotenv/config";
import { PrismaClient, DataAccessLevel } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const prisma = new PrismaClient({ adapter });

async function main() {
  // Find the new permission
  const perm = await prisma.permission.findUnique({
    where: { key: "sales_target.manage" },
  });

  if (!perm) {
    console.error("❌ Permission 'sales_target.manage' not found");
    return;
  }

  // Roles to assign: administrator + admin
  const roleSlugs = ["administrator", "admin"];

  for (const slug of roleSlugs) {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) {
      console.warn(`⚠️  Role '${slug}' not found`);
      continue;
    }

    const exists = await prisma.rolePermission.findFirst({
      where: { roleId: role.id, permissionId: perm.id },
    });

    if (exists) {
      console.log(`✅ Already assigned: ${slug} → sales_target.manage`);
      continue;
    }

    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: perm.id,
        allow: true,
        dataAccess: DataAccessLevel.VIEW_ALL,
        editAccess: null,
        deleteAccess: null,
      },
    });
    console.log(`✅ Assigned: ${slug} → sales_target.manage`);
  }

  console.log("🎉 Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
