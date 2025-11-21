import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.userPermissionOverride.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const [sales, cs, ops] = await Promise.all([
    prisma.department.create({
      data: {
        name: "Information Technology",
        code: "IT",
        description: "แผนกเทคโนโลยีสารสนเทศ",
      },
    }),
    prisma.department.create({
      data: {
        name: "Sales Administration",
        code: "SA",
        description: "แผนกบริหารงานขาย",
      },
    }),
    prisma.department.create({
      data: {
        name: "Sales Support",
        code: "SS",
        description: "แผนกธุรการขาย",
      },
    }),
    prisma.department.create({
      data: {
        name: "Marketing",
        code: "MKT",
        description: "แผนกการตลาด",
      },
    }),
    prisma.department.create({
      data: {
        name: "Market Development",
        code: "MD",
        description: "แผนกพัฒนาตลาด",
      },
    }),
    prisma.department.create({
      data: {
        name: "Accounting",
        code: "ACC",
        description: "แผนกบัญชี",
      },
    }),
    prisma.department.create({
      data: {
        name: "Human Resources",
        code: "HR",
        description: "แผนกทรัพยากรบุคคล",
      },
    }),
  ]);

  const [salesManager, salesRep, csLead, csAgent, opsAnalyst] =
    await Promise.all([
      prisma.position.create({
        data: {
          name: "Sales Manager",
          level: 3,
          isManagerial: true,
          departmentId: sales.id,
        },
      }),
      prisma.position.create({
        data: {
          name: "Sales Representative",
          level: 1,
          departmentId: sales.id,
        },
      }),
      prisma.position.create({
        data: {
          name: "CS Lead",
          level: 3,
          isManagerial: true,
          departmentId: cs.id,
        },
      }),
      prisma.position.create({
        data: {
          name: "CS Agent",
          level: 1,
          departmentId: cs.id,
        },
      }),
      prisma.position.create({
        data: {
          name: "Operations Analyst",
          level: 2,
          departmentId: ops.id,
        },
      }),
    ]);

  const roles = await prisma.$transaction([
    prisma.role.create({
      data: {
        name: "Administrator",
        slug: "administrator",
        description: "Full access to every module",
        isSystem: true,
      },
    }),
    prisma.role.create({
      data: {
        name: "Manager",
        slug: "manager",
        description: "Department manager with approval capabilities",
        isSystem: true,
      },
    }),
    prisma.role.create({
      data: {
        name: "Sales Representative",
        slug: "sales_rep",
        description: "Standard sales access",
      },
    }),
  ]);

  const [adminRole, managerRole, salesRole] = roles;

  await prisma.position.update({
    where: { id: salesManager.id },
    data: { defaultRoleId: managerRole.id },
  });
  await prisma.position.update({
    where: { id: salesRep.id },
    data: { defaultRoleId: salesRole.id },
  });
  await prisma.position.update({
    where: { id: csLead.id },
    data: { defaultRoleId: managerRole.id },
  });

  const permissions = await prisma.$transaction([
    prisma.permission.create({
      data: {
        key: "menu.dashboard",
        name: "Dashboard menu",
        category: "MENU",
        menuPath: "/dashboard",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.sales",
        name: "Sales menu",
        category: "MENU",
        menuPath: "/dashboard/salesReport",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.products",
        name: "Product menu",
        category: "MENU",
        menuPath: "/dashboard/products",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.employees",
        name: "Employee menu",
        category: "MENU",
        menuPath: "/employee",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.companies",
        name: "Company menu",
        category: "MENU",
        menuPath: "/companies",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.create",
        name: "Create product",
        category: "ACTION",
        resource: "product",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.edit",
        name: "Edit product",
        category: "ACTION",
        resource: "product",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.delete",
        name: "Delete product",
        category: "ACTION",
        resource: "product",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.approve",
        name: "Approve product",
        category: "ACTION",
        resource: "product",
        action: "approve",
      },
    }),
    prisma.permission.create({
      data: {
        key: "company.create",
        name: "Create company",
        category: "ACTION",
        resource: "company",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "company.edit",
        name: "Edit company",
        category: "ACTION",
        resource: "company",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "company.delete",
        name: "Delete company",
        category: "ACTION",
        resource: "company",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "randomize",
        name: "Randomize data",
        category: "ACTION",
        action: "randomize",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.reject",
        name: "Reject product",
        category: "ACTION",
        resource: "product",
        action: "reject",
      },
    }),
    prisma.permission.create({
      data: {
        key: "employee.manage",
        name: "Manage employees",
        category: "ACTION",
        resource: "employee",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "rbac.manage",
        name: "Manage RBAC",
        category: "ACTION",
        resource: "rbac",
        action: "manage",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.products",
        name: "Product data scope",
        category: "DATA",
        resource: "product",
        defaultDataAccess: "VIEW_DEPARTMENT",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.employees",
        name: "Employee data scope",
        category: "DATA",
        resource: "employee",
        defaultDataAccess: "VIEW_DEPARTMENT",
      },
    }),
  ]);

  const permissionMap = Object.fromEntries(
    permissions.map((permission) => [permission.key, permission])
  );

  const allowAll = Object.values(permissionMap).map((permission) => ({
    permissionId: permission.id,
  }));

  await prisma.rolePermission.createMany({
    data: allowAll.map((entry) => ({
      permissionId: entry.permissionId,
      roleId: adminRole.id,
      allow: true,
      dataAccess: "VIEW_ALL",
    })),
  });

  await prisma.rolePermission.createMany({
    data: [
      "menu.dashboard",
      "menu.sales",
      "menu.companies",
      "menu.products",
      "product.create",
      "product.edit",
      "product.approve",
      "product.reject",
      "company.create",
      "company.edit",
      "company.delete",
      "randomize",
      "data.products",
    ].map((key) => ({
      roleId: managerRole.id,
      permissionId: permissionMap[key].id,
      allow: true,
      dataAccess: key.startsWith("data") ? "VIEW_DEPARTMENT" : null,
    })),
  });

  await prisma.rolePermission.createMany({
    data: [
      "menu.dashboard",
      "menu.sales",
      "product.create",
      "product.edit",
      "data.products",
    ].map((key) => ({
      roleId: salesRole.id,
      permissionId: permissionMap[key].id,
      allow: true,
      dataAccess: key.startsWith("data") ? "VIEW_OWN" : null,
    })),
  });

  const [adminPassword, managerPassword, sellerPassword] = await Promise.all([
    hash("admin123", 12),
    hash("manager123", 12),
    hash("seller123", 12),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "Somsak Admin",
      email: "admin@move-crm.local",
      password: adminPassword,
      departmentId: ops.id,
      positionId: opsAnalyst.id,
      userRoles: {
        create: { roleId: adminRole.id },
      },
    },
    include: { userRoles: true },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Nok Manager",
      email: "manager@move-crm.local",
      password: managerPassword,
      departmentId: sales.id,
      positionId: salesManager.id,
      userRoles: {
        create: { roleId: managerRole.id },
      },
    },
  });

  const seller = await prisma.user.create({
    data: {
      name: "View Seller",
      email: "seller@move-crm.local",
      password: sellerPassword,
      departmentId: sales.id,
      positionId: salesRep.id,
      userRoles: {
        create: { roleId: salesRole.id },
      },
    },
  });

  // Employee seed data removed per request.
  // Company seed data removed per request.
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
