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
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();

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
        key: "menu.sales_forecasts",
        name: "Sales Forecasts menu",
        category: "MENU",
        menuPath: "/sales-forecasts",
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
      "menu.sales_forecasts",
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
      "menu.sales_forecasts",
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

  // สร้าง Employee สำหรับ users
  const adminEmployee = await prisma.employee.create({
    data: {
      name: admin.name,
      email: admin.email,
      userId: admin.id,
      departmentId: admin.departmentId,
      positionId: admin.positionId,
      status: "ACTIVE",
      employeeCode: "EMP001",
    },
  });

  const managerEmployee = await prisma.employee.create({
    data: {
      name: manager.name,
      email: manager.email,
      userId: manager.id,
      departmentId: manager.departmentId,
      positionId: manager.positionId,
      status: "ACTIVE",
      employeeCode: "EMP002",
    },
  });

  const sellerEmployee = await prisma.employee.create({
    data: {
      name: seller.name,
      email: seller.email,
      userId: seller.id,
      departmentId: seller.departmentId,
      positionId: seller.positionId,
      status: "ACTIVE",
      employeeCode: "EMP003",
    },
  });

  console.log("✅ สร้าง Employee สำหรับ users เรียบร้อย");

  // Employee seed data removed per request.
  // Company seed data removed per request.

  // สร้างบริษัทใหม่ 2 บริษัท
  const company1 = await prisma.company.create({
    data: {
      name: "บริษัท เกษตรสยาม จำกัด",
      shortName: "เกษตรสยาม",
      email: "info@kasetsiam.co.th",
      phone: "02-123-4567",
      taxId: "0105558123456",
      addressLine: "123 ถนนพหลโยธิน",
      province: "กรุงเทพมหานคร",
      district: "จตุจักร",
      subdistrict: "ลาดยาว",
      postalCode: "10900",
      status: "ACTIVE",
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "บริษัท ไทยการเกษตร อินเตอร์เนชั่นแนล จำกัด",
      shortName: "ไทยการเกษตร",
      email: "contact@thaiagri.com",
      phone: "02-987-6543",
      taxId: "0105559876543",
      addressLine: "456 ถนนงามวงศ์วาน",
      province: "นนทบุรี",
      district: "บางกรวย",
      subdistrict: "บางกรวย",
      postalCode: "11130",
      status: "ACTIVE",
    },
  });

  console.log("✅ สร้างบริษัทใหม่ 2 บริษัท:", company1.name, company2.name);

  // สร้างสินค้าใหม่ 2 รายการ
  const product1 = await prisma.product.create({
    data: {
      productCode: "P-2024-001",
      name: "ปุ๋ยยูเรีย 46-0-0",
      commonName: "ปุ๋ยยูเรีย",
      unit: "กระสอบ",
      productGroup: "ปุ๋ยเคมี",
      brand: "เกษตรไทย",
      packageSize: "50 กก.",
      packageSizePerBox: "1",
      status: "ACTIVE",
      usedForPlants: ["ข้าว", "อ้อย", "ข้าวโพด"],
      salesPoint: "ปุ๋ยไนโตรเจนสูง เหมาะสำหรับพืชใบ",
      properties: "ไนโตรเจน 46%, ละลายน้ำได้ดี",
      price: 850.00,
      promotionBudget: 50.00,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      productCode: "P-2024-002",
      name: "ปุ๋ยสูตร 15-15-15",
      commonName: "ปุ๋ยสูตรสมดุล",
      unit: "กระสอบ",
      productGroup: "ปุ๋ยเคมี",
      brand: "เกษตรไทย",
      packageSize: "50 กก.",
      packageSizePerBox: "1",
      status: "ACTIVE",
      usedForPlants: ["ข้าว", "พืชผัก", "ไม้ผล"],
      salesPoint: "ปุ๋ยสูตรสมดุล เหมาะกับพืชทุกชนิด",
      properties: "N-P-K สมดุล 15-15-15",
      price: 950.00,
      promotionBudget: 75.00,
    },
  });

  console.log("✅ สร้างสินค้าใหม่ 2 รายการ:", product1.name, product2.name);

  // สร้างลูกค้าใหม่ 2 ราย
  const customer1 = await prisma.customer.create({
    data: {
      customerCode: "CUS-2024-001",
      customerType: "DEALER",
      name: "ร้านเกษตรกรรมพัฒนา",
      prefix: "นาย",
      firstName: "สมชาย",
      lastName: "ใจดี",
      birthDate: new Date("1980-05-15"),
      email: "somchai@kasettikorn.com",
      phone: "081-234-5678",
      taxId: "1234567890123",
      addressLine: "99 หมู่ 5 ถนนสุขุมวิท",
      province: "ชลบุรี",
      district: "บางละมุง",
      subdistrict: "หนองปรือ",
      postalCode: "20150",
      status: "ACTIVE",
      contactPerson: "นายสมชาย ใจดี",
      contactPhone: "081-234-5678",
      contactEmail: "somchai@kasettikorn.com",
      notes: "ลูกค้า DEALER ระดับใหญ่ ครอบคลุมพื้นที่จังหวัดชลบุรี",
      latitude: "13.0217",
      longitude: "100.9253",
      relationshipScore: 85,
      responsibleEmployeeId: sellerEmployee.id,
      createdById: seller.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerCode: "CUS-2024-002",
      customerType: "SUBDEALER",
      name: "ร้านเกษตรบ้านสวน",
      prefix: "นาง",
      firstName: "มาลี",
      lastName: "รักษ์สวน",
      birthDate: new Date("1975-08-20"),
      email: "malee@bansuankaset.com",
      phone: "089-876-5432",
      taxId: "9876543210987",
      addressLine: "77 หมู่ 3",
      province: "ปทุมธานี",
      district: "ลำลูกกา",
      subdistrict: "ลาดสวาย",
      postalCode: "12150",
      status: "ACTIVE",
      contactPerson: "นางมาลี รักษ์สวน",
      contactPhone: "089-876-5432",
      contactEmail: "malee@bansuankaset.com",
      notes: "ลูกค้า SUBDEALER พื้นที่ปทุมธานี มีฐานลูกค้าเกษตรกรดี",
      latitude: "14.0505",
      longitude: "100.7163",
      relationshipScore: 75,
      parentDealerId: customer1.id,
      responsibleEmployeeId: sellerEmployee.id,
      createdById: manager.id,
    },
  });

  console.log("✅ สร้างลูกค้าใหม่ 2 ราย:", customer1.name, customer2.name);

  console.log("\n🎉 Seed ข้อมูลเรียบร้อยแล้ว!");
  console.log("📊 สรุปข้อมูลที่สร้าง:");
  console.log(`  - บริษัท: ${company1.name}, ${company2.name}`);
  console.log(`  - สินค้า: ${product1.name}, ${product2.name}`);
  console.log(`  - ลูกค้า: ${customer1.name}, ${customer2.name}`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
