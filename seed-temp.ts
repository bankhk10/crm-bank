import { db } from './lib/db';

async function main() {
  const perm = await db.permission.upsert({
    where: { key: 'menu.activity_plan' },
    update: {},
    create: {
      key: 'menu.activity_plan',
      name: 'ดูเมนูแผนกิจกรรม',
      category: 'MENU',
      menuPath: '/activity-plan'
    }
  });
  console.log('Permission created:', perm.key);
  
  const roles = await db.role.findMany();
  for (const role of roles) {
    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: perm.id,
        allow: true
      }
    });
  }
}

main().catch(console.error).finally(() => process.exit(0));
