import { db as prisma } from "@/src/infrastructure/database";

export async function findRoleWithPermissions(roleId: string) {
  return prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        where: { deletedAt: null },
        include: { permission: true },
      },
    },
  });
}

export async function findActivePermissions() {
  return prisma.permission.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

