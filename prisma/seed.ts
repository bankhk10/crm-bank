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
        shortName: "UP",
        name: "บริษัท ยูนิพรีมา จำกัด",
        addressLine: "831 หมู่ 4 นิคมอุตสาหกรรมบางปู ซ.13B ",
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

  const [, , , , opsAnalyst] = await Promise.all([
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

  const adminRole = await prisma.role.create({
    data: {
      name: "Administrator",
      slug: "administrator",
      description: "Full access to every module",
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

  const adminPassword = await hash("b@b.com", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Bank Admin",
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
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
