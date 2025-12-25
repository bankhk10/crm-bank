import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Delete in correct order to avoid foreign key constraints
  await prisma.saleStatusHistory.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customerImage.deleteMany();
  await prisma.temporaryCreditLimit.deleteMany();
  await prisma.creditLimit.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productStockLot.deleteMany();
  await prisma.productPromotionItem.deleteMany();
  await prisma.productFreeItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
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

  // Create companies
  await prisma.company.createMany({
    data: [
      {
        companyCode: "IC",
        shortName: "IC",
        name: "บริษัท อินเตอร์ คร็อพ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "info@intercrop.co.th",
        phone: "0-2271-1001",
        taxId: "0105531048113",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
      {
        companyCode: "AI",
        shortName: "AI",
        name: "บริษัท แอ็กโฟรีแพ็กซ์อินดัสตรีส์ จำกัด",
        addressLine: "828 หมู่ 4 นิคมอุตสาหกรรมบางปู ซ.13B",
        email: "info@agforepax.co.th",
        phone: "02-709-3525",
        taxId: "0115537008016",
        province: "สมุทรปราการ",
        district: "เมืองสมุทรปราการ",
        subdistrict: "แพรกษา",
        postalCode: "10280",
        status: "ACTIVE",
      },
      {
        companyCode: "UP",
        shortName: "UP",
        name: "บริษัท ยูนิพรีมา จำกัด",
        addressLine: "831 หมู่ 4 นิคมอุตสาหกรรมบางปู ซ.13B",
        email: "info@uniprema.co.th",
        phone: "02-709-6841",
        taxId: "0105547144354",
        province: "สมุทรปราการ",
        district: "เมืองสมุทรปราการ",
        subdistrict: "แพรกษา",
        postalCode: "10280",
        status: "ACTIVE",
      },
      {
        companyCode: "AM",
        shortName: "AM",
        name: "บริษัท เอแม็กซ์ อินเตอร์ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "info@amax-inter.co.th",
        phone: "0",
        taxId: "0105554109810",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
      {
        companyCode: "BF",
        shortName: "BF",
        name: "บริษัท บีแฟค อินเตอร์ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "info@bfac-inter.co.th",
        phone: "0",
        taxId: "0105554109879",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
      {
        companyCode: "CP",
        shortName: "CP",
        name: "บริษัท ซีเพช อินเตอร์ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "info@cpech-inter.co.th",
        phone: "0",
        taxId: "0105554109828",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
      {
        companyCode: "CS",
        shortName: "CS",
        name: "บริษัท คร็อพ ซายน์ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "cs@cropsciences.co.th",
        phone: "02-618-4522",
        taxId: "0105542089762",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
    ],
  });

  const [sales] = await Promise.all([
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

  const adminPosition = await prisma.position.create({
    data: {
      name: "Admin",
      level: 99,
      isManagerial: true,
      departmentId: sales.id,
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "Administrator",
      slug: "administrator",
      description: "Full access to every module",
      isSystem: true,
    },
  });

  // Admin role - second highest permission level
  const adminRoleSecondary = await prisma.role.create({
    data: {
      name: "Admin",
      slug: "admin",
      description:
        "High-level access with most permissions except RBAC management",
      isSystem: true,
    },
  });

  const permissions = await prisma.$transaction([
    prisma.permission.create({
      data: {
        key: "menu.reports",
        name: "Reports menu",
        category: "MENU",
        menuPath: "/reports",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.sales",
        name: "Sales menu",
        category: "MENU",
        menuPath: "/reports/salesReport",
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
        key: "menu.fulfillment",
        name: "Fulfillment menu",
        category: "MENU",
        menuPath: "/fulfillment",
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
        key: "sale.manage_fulfillment",
        name: "Manage sale fulfillment",
        category: "ACTION",
        resource: "sale",
        action: "manage_fulfillment",
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
    prisma.permission.create({
      data: {
        key: "data.sales",
        name: "Sale data scope",
        category: "DATA",
        resource: "sale",
        defaultDataAccess: "VIEW_DEPARTMENT",
      },
    }),
    // New Permissions
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
        key: "employee.view",
        name: "View employee details",
        category: "ACTION",
        resource: "employee",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.delete",
        name: "Delete sale",
        category: "ACTION",
        resource: "sale",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.reject",
        name: "Reject sale",
        category: "ACTION",
        resource: "sale",
        action: "reject",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.approve",
        name: "Approve credit limit",
        category: "ACTION",
        resource: "creditlimit",
        action: "approve",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.reject",
        name: "Reject credit limit",
        category: "ACTION",
        resource: "creditlimit",
        action: "reject",
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

  const adminPassword = await hash("b@b.com", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Bank Admin",
      email: "b@b.com",
      password: adminPassword,
      departmentId: sales.id,
      positionId: adminPosition.id,
      userRoles: {
        create: { roleId: adminRole.id },
      },
    },
    include: { userRoles: true },
  });

  // --- Create Sales Representative and Manager Logic ---

  // 1. Create Positions
  const salesRepPosition = await prisma.position.create({
    data: {
      name: "พนักงานขาย",
      level: 1,
      departmentId: sales.id,
    },
  });

  const salesManagerPosition = await prisma.position.create({
    data: {
      name: "ผู้จัดการขาย",
      level: 3,
      isManagerial: true,
      departmentId: sales.id,
    },
  });

  // 2. Create Roles
  const salesRepRole = await prisma.role.create({
    data: {
      name: "พนักงานขาย",
      slug: "sales_employee",
      description: "พนักงานขาย",
    },
  });

  const salesManagerRole = await prisma.role.create({
    data: {
      name: "ผู้จัดการขาย",
      slug: "sales_manager",
      description: "ผู้จัดการขาย",
    },
  });

  // 3. Assign Permissions
  const p = (key: string) => permissionMap[key]?.id;

  // Sales Rep Permissions
  const salesRepConfig = [
    { key: "menu.products", access: undefined },
    { key: "product.view", access: "VIEW_ALL" },
    { key: "menu.sales", access: undefined },
    { key: "sale.create", access: "VIEW_OWN" },
    { key: "sale.edit", access: "VIEW_OWN" },
    { key: "sale.view", access: "VIEW_OWN" },
    { key: "sale.delete", access: "VIEW_OWN" },
    { key: "menu.customers", access: undefined },
    { key: "customer.create.dealer", access: undefined },
    { key: "customer.edit", access: "VIEW_OWN" },
    { key: "customer.view", access: "VIEW_ALL" },
    { key: "menu.temporary_credit_limits", access: undefined },
    { key: "temporary_creditlimit.create", access: "VIEW_OWN" },
    { key: "temporary_creditlimit.edit", access: "VIEW_OWN" },
    { key: "temporary_creditlimit.view", access: "VIEW_OWN" },
    { key: "temporary_creditlimit.delete", access: "VIEW_OWN" },
    { key: "employee.view", access: "VIEW_ALL" },
    { key: "data.sales", access: "VIEW_OWN" },
  ];

  await prisma.rolePermission.createMany({
    data: salesRepConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: salesRepRole.id,
        permissionId: p(item.key),
        allow: true,
        dataAccess:
          item.access === "VIEW_OWN" && item.key === "sale.view"
            ? "VIEW_ALL"
            : (item.access as any),
      })),
  });

  // Sales Manager Permissions
  const salesManagerConfig = [
    { key: "menu.dashboard", access: undefined },
    { key: "menu.products", access: undefined },
    { key: "product.view", access: "VIEW_ALL" },
    { key: "menu.sales", access: undefined },
    { key: "sale.create", access: "VIEW_OWN" },
    { key: "sale.edit", access: "VIEW_OWN" },
    { key: "sale.delete", access: "VIEW_OWN" },
    { key: "sale.view", access: "VIEW_ALL" },
    { key: "sale.approve", access: "VIEW_DEPARTMENT" },
    { key: "sale.reject", access: "VIEW_DEPARTMENT" },
    { key: "menu.employees", access: undefined },
    { key: "employee.view", access: "VIEW_DEPARTMENT" },
    { key: "menu.customers", access: undefined },
    { key: "customer.create.dealer", access: undefined },
    { key: "customer.create.subdealer", access: undefined },
    { key: "customer.create.farmer", access: undefined },
    { key: "customer.create.broker", access: undefined },
    { key: "customer.edit", access: "VIEW_ALL" },
    { key: "customer.view", access: "VIEW_ALL" },
    { key: "menu.credit_limits", access: undefined },
    { key: "creditlimit.create", access: "VIEW_OWN" },
    { key: "creditlimit.edit", access: "VIEW_OWN" },
    { key: "creditlimit.delete", access: "VIEW_OWN" },
    { key: "creditlimit.view", access: "VIEW_DEPARTMENT" },
    { key: "creditlimit.approve", access: "VIEW_DEPARTMENT" },
    { key: "creditlimit.reject", access: "VIEW_DEPARTMENT" },
    { key: "data.sales", access: "VIEW_DEPARTMENT" },
  ];

  await prisma.rolePermission.createMany({
    data: salesManagerConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: salesManagerRole.id,
        permissionId: p(item.key),
        allow: true,
        dataAccess: item.access as any,
      })),
  });

  // Admin Role Permissions (below Administrator, excludes RBAC management)
  const adminConfig = [
    { key: "menu.dashboard", access: undefined },
    { key: "menu.reports", access: undefined },
    { key: "menu.sales", access: undefined },
    { key: "menu.products", access: undefined },
    { key: "menu.customers", access: undefined },
    { key: "menu.credit_limits", access: undefined },
    { key: "menu.temporary_credit_limits", access: undefined },
    { key: "menu.fulfillment", access: undefined },
    { key: "menu.employees", access: undefined },
    { key: "menu.companies", access: undefined },
    // Sale permissions
    { key: "sale.create", access: "VIEW_ALL" },
    { key: "sale.edit", access: "VIEW_ALL" },
    { key: "sale.view", access: "VIEW_ALL" },
    { key: "sale.delete", access: "VIEW_ALL" },
    { key: "sale.approve", access: "VIEW_ALL" },
    { key: "sale.reject", access: "VIEW_ALL" },
    { key: "sale.confirm-payment", access: "VIEW_ALL" },
    { key: "sale.manage_fulfillment", access: "VIEW_ALL" },
    // Product permissions
    { key: "product.create", access: "VIEW_ALL" },
    { key: "product.update", access: "VIEW_ALL" },
    { key: "product.delete", access: "VIEW_ALL" },
    { key: "product.view", access: "VIEW_ALL" },
    { key: "product.manage", access: "VIEW_ALL" },
    // Customer permissions
    { key: "customer.create.dealer", access: "VIEW_ALL" },
    { key: "customer.create.subdealer", access: "VIEW_ALL" },
    { key: "customer.create.farmer", access: "VIEW_ALL" },
    { key: "customer.create.broker", access: "VIEW_ALL" },
    { key: "customer.edit", access: "VIEW_ALL" },
    { key: "customer.delete", access: "VIEW_ALL" },
    { key: "customer.view", access: "VIEW_ALL" },
    // Credit limit permissions
    { key: "creditlimit.create", access: "VIEW_ALL" },
    { key: "creditlimit.edit", access: "VIEW_ALL" },
    { key: "creditlimit.delete", access: "VIEW_ALL" },
    { key: "creditlimit.view", access: "VIEW_ALL" },
    { key: "creditlimit.approve", access: "VIEW_ALL" },
    { key: "creditlimit.reject", access: "VIEW_ALL" },
    // Temporary credit limit permissions
    { key: "temporary_creditlimit.create", access: "VIEW_ALL" },
    { key: "temporary_creditlimit.edit", access: "VIEW_ALL" },
    { key: "temporary_creditlimit.delete", access: "VIEW_ALL" },
    { key: "temporary_creditlimit.view", access: "VIEW_ALL" },
    { key: "temporary_creditlimit.approve", access: "VIEW_ALL" },
    { key: "temporary_creditlimit.reject", access: "VIEW_ALL" },
    // Company permissions
    { key: "company.create", access: "VIEW_ALL" },
    { key: "company.edit", access: "VIEW_ALL" },
    { key: "company.delete", access: "VIEW_ALL" },
    // Employee permissions
    { key: "employee.view", access: "VIEW_ALL" },
    { key: "employee.manage", access: "VIEW_ALL" },
    // Data scope permissions
    { key: "data.products", access: "VIEW_ALL" },
    { key: "data.employees", access: "VIEW_ALL" },
    { key: "data.customers", access: "VIEW_ALL" },
    { key: "data.creditlimits", access: "VIEW_ALL" },
    { key: "data.temporary_creditlimits", access: "VIEW_ALL" },
    { key: "data.sales", access: "VIEW_ALL" },
    // Note: rbac.manage is excluded to differentiate from Administrator
  ];

  await prisma.rolePermission.createMany({
    data: adminConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: adminRoleSecondary.id,
        permissionId: p(item.key),
        allow: true,
        dataAccess: item.access as any,
      })),
  });

  // 4. Create Users with Employee Profiles
  const userPassword = await hash("123456", 12);

  const salesUser = await prisma.user.create({
    data: {
      name: "Somchai Sales",
      email: "sales@bank.com",
      password: userPassword,
      departmentId: sales.id,
      positionId: salesRepPosition.id,
      userRoles: { create: { roleId: salesRepRole.id } },
    },
  });

  // Create Employee profile for sales user
  await prisma.employee.create({
    data: {
      name: "Somchai Sales",
      firstName: "สมชาย",
      lastName: "ขายดี",
      email: "sales@bank.com",
      employeeCode: "EMP001",
      userId: salesUser.id,
      departmentId: sales.id,
      positionId: salesRepPosition.id,
      status: "ACTIVE",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: "Mana Manager",
      email: "manager@bank.com",
      password: userPassword,
      departmentId: sales.id,
      positionId: salesManagerPosition.id,
      userRoles: { create: { roleId: salesManagerRole.id } },
    },
  });

  // Create Employee profile for manager user
  await prisma.employee.create({
    data: {
      name: "Mana Manager",
      firstName: "มานะ",
      lastName: "จัดการดี",
      email: "manager@bank.com",
      employeeCode: "EMP002",
      userId: managerUser.id,
      departmentId: sales.id,
      positionId: salesManagerPosition.id,
      status: "ACTIVE",
    },
  });

  // Create Admin user for testing
  const adminTestUser = await prisma.user.create({
    data: {
      name: "Admin Test",
      email: "admin@bank.com",
      password: userPassword,
      departmentId: sales.id,
      positionId: adminPosition.id,
      userRoles: { create: { roleId: adminRoleSecondary.id } },
    },
  });

  // Create Employee profile for admin test user
  await prisma.employee.create({
    data: {
      name: "Admin Test",
      firstName: "แอดมิน",
      lastName: "ทดสอบ",
      email: "admin@bank.com",
      employeeCode: "EMP003",
      userId: adminTestUser.id,
      departmentId: sales.id,
      positionId: adminPosition.id,
      status: "ACTIVE",
    },
  });

  // --- New Seed Data requested ---
  console.log("Seeding Customers...");

  // 1. Dealer with Credit Limit
  await prisma.customer.create({
    data: {
      customerCode: "CUST-D-001",
      customerType: "DEALER",
      name: "Dealer One Co., Ltd.",
      email: "dealer1@example.com",
      phone: "081-111-1111",
      status: "ACTIVE",
      creditLimits: {
        create: {
          limitAmount: 5000000,
          usedAmount: 0,
          availableAmount: 5000000,
          effectiveDate: new Date(),
          status: "ACTIVE",
        },
      },
    },
  });

  // 2. Subdealer
  await prisma.customer.create({
    data: {
      customerCode: "CUST-S-001",
      customerType: "SUBDEALER",
      name: "Subdealer Shop",
      email: "subdealer@example.com",
      phone: "082-222-2222",
      status: "ACTIVE",
      receiveFromDealer: "Dealer One Co., Ltd.",
    },
  });

  // 3. Farmer
  await prisma.customer.create({
    data: {
      customerCode: "CUST-F-001",
      customerType: "FARMER",
      name: "Somchai Farmer",
      email: "farmer@example.com",
      phone: "083-333-3333",
      status: "ACTIVE",
      addressLine: "123 Farm Village",
      province: "Chiang Mai",
    },
  });

  // 4. Broker
  await prisma.customer.create({
    data: {
      customerCode: "CUST-B-001",
      customerType: "BROKER",
      name: "Broker Agent",
      email: "broker@example.com",
      phone: "084-444-4444",
      status: "ACTIVE",
      serviceTypes: "Coordination",
    },
  });

  console.log("Seeding Products...");

  // Product 1
  await prisma.product.create({
    data: {
      productCode: "PROD-001",
      name: "Super Grow Fertilizer",
      commonName: "Fertilizer A",
      price: 450.0,
      promotionBudget: 50.0,
      status: "ACTIVE",
      stockLots: {
        create: [
          {
            lotNumber: "LOT-2024-001",
            quantity: 1000,
            importDate: new Date(),
          },
        ],
      },
      stock: {
        create: {
          physicalBalance: 1000,
          availableQuantity: 1000,
          reservedQuantity: 0,
        },
      },
      promotionItems: {
        create: [
          {
            name: "Buy 10 Get 1",
            quantity: 1,
            price: 0,
            notes: "Free item for bulk purchase",
          },
        ],
      },
      freeItems: {
        create: [
          {
            purchaseQty: 100,
            freeQty: 5,
            netPrice: 0,
            notes: "Bulk incentive",
          },
        ],
      },
    },
  });

  // Product 2
  await prisma.product.create({
    data: {
      productCode: "PROD-002",
      name: "Pesticide X",
      commonName: "Pesticide X",
      price: 1200.0,
      promotionBudget: 200.0,
      status: "ACTIVE",
      stockLots: {
        create: [
          {
            lotNumber: "LOT-2024-002",
            quantity: 500,
            importDate: new Date(),
          },
        ],
      },
      stock: {
        create: {
          physicalBalance: 500,
          availableQuantity: 500,
          reservedQuantity: 0,
        },
      },
      promotionItems: {
        create: [
          {
            name: "Seasonal Discount",
            quantity: 1,
            price: 1000.0,
            notes: "Discounted price",
          },
        ],
      },
      freeItems: {
        create: [
          {
            purchaseQty: 20,
            freeQty: 1,
            netPrice: 0,
            notes: "Small bulk incentive",
          },
        ],
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
