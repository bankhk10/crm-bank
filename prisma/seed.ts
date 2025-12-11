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
        name: "แผนกเทคโนโลยีสารสนเทศ",
        code: "IT",
      },
    }),
    prisma.department.create({
      data: {
        name: "แผนกบริหารงานขาย",
        code: "SA",
      },
    }),
    prisma.department.create({
      data: {
        name: "แผนกธุรการขาย",
        code: "SS",
      },
    }),
    prisma.department.create({
      data: {
        name: "แผนกการตลาด",
        code: "MKT",
      },
    }),
    prisma.department.create({
      data: {
        name: "แผนกพัฒนาตลาด",
        code: "MD",
      },
    }),
    prisma.department.create({
      data: {
        name: "แผนกบัญชี",
        code: "ACC",
      },
    }),
    prisma.department.create({
      data: {
        name: "แผนกทรัพยากรบุคคล",
        code: "HR",
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
        key: "menu.customers",
        name: "Customer menu",
        category: "MENU",
        menuPath: "/customers",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.credit_limits",
        name: "Credit Limit menu",
        category: "MENU",
        menuPath: "/credit-limits",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.temporary_credit_limits",
        name: "Temporary Credit Limit menu",
        category: "MENU",
        menuPath: "/temporary-credit-limits",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.products",
        name: "Product menu",
        category: "MENU",
        menuPath: "/products",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.create",
        name: "Create sale",
        category: "ACTION",
        resource: "sale",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.edit",
        name: "Edit sale",
        category: "ACTION",
        resource: "sale",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.view",
        name: "View sale details",
        category: "ACTION",
        resource: "sale",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.approve",
        name: "Approve sale",
        category: "ACTION",
        resource: "sale",
        action: "approve",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.confirm-payment",
        name: "Confirm sale payment",
        category: "ACTION",
        resource: "sale",
        action: "confirm_payment",
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
        key: "product.update",
        name: "Update product",
        category: "ACTION",
        resource: "product",
        action: "update",
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
        key: "product.view",
        name: "View product details",
        category: "ACTION",
        resource: "product",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.manage",
        name: "Manage product (pricing, stock, promotions)",
        category: "ACTION",
        resource: "product",
        action: "manage",
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
        key: "customer.create.dealer",
        name: "Create DEALER customer",
        category: "ACTION",
        resource: "customer",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.create.subdealer",
        name: "Create SUBDEALER customer",
        category: "ACTION",
        resource: "customer",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.create.farmer",
        name: "Create FARMER customer",
        category: "ACTION",
        resource: "customer",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.create.broker",
        name: "Create BROKER customer",
        category: "ACTION",
        resource: "customer",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.edit",
        name: "Edit customer",
        category: "ACTION",
        resource: "customer",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.delete",
        name: "Delete customer",
        category: "ACTION",
        resource: "customer",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.view",
        name: "View customer details",
        category: "ACTION",
        resource: "customer",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.create",
        name: "Create credit limit",
        category: "ACTION",
        resource: "creditlimit",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.edit",
        name: "Edit credit limit",
        category: "ACTION",
        resource: "creditlimit",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.delete",
        name: "Delete credit limit",
        category: "ACTION",
        resource: "creditlimit",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.view",
        name: "View credit limit details",
        category: "ACTION",
        resource: "creditlimit",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.create",
        name: "Create temporary credit limit",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.edit",
        name: "Edit temporary credit limit",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.delete",
        name: "Delete temporary credit limit",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.view",
        name: "View temporary credit limit details",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.approve",
        name: "Approve temporary credit limit",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "approve",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.reject",
        name: "Reject temporary credit limit",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "reject",
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
    prisma.permission.create({
      data: {
        key: "data.customers",
        name: "Customer data scope",
        category: "DATA",
        resource: "customer",
        defaultDataAccess: "VIEW_DEPARTMENT",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.creditlimits",
        name: "Credit Limit data scope",
        category: "DATA",
        resource: "creditlimit",
        defaultDataAccess: "VIEW_DEPARTMENT",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.temporary_creditlimits",
        name: "Temporary Credit Limit data scope",
        category: "DATA",
        resource: "temporary_creditlimit",
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
      "menu.customers",
      "menu.credit_limits",
      "menu.products",
      "sale.create",
      "sale.edit",
      "sale.view",
      "sale.approve",
      "sale.confirm-payment",
      "product.create",
      "product.update",
      "product.delete",
      "product.view",
      "product.manage",
      "company.create",
      "company.edit",
      "company.delete",
      "customer.create.dealer",
      "customer.create.subdealer",
      "customer.create.farmer",
      "customer.create.broker",
      "customer.edit",
      "customer.delete",
      "customer.view",
      "creditlimit.create",
      "creditlimit.edit",
      "creditlimit.delete",
      "creditlimit.view",
      "randomize",
      "data.products",
      "data.customers",
      "data.creditlimits",
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
      "menu.products",
      "sale.create",
      "sale.edit",
      "sale.view",
      "product.create",
      "product.update",
      "product.view",
      "data.products",
    ].map((key) => ({
      roleId: salesRole.id,
      permissionId: permissionMap[key].id,
      allow: true,
      dataAccess: key.startsWith("data") ? "VIEW_OWN" : null,
    })),
  });

  const [adminPassword, managerPassword, sellerPassword] = await Promise.all([
    hash("b@b.com", 12),
    hash("manager123", 12),
    hash("seller123", 12),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "Somsak Admin",
      email: "b@b.com",
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

}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
