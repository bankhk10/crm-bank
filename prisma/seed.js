require("dotenv/config");
const path = require("path");
const { hash } = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");

const { PrismaClient } = require("@prisma/client");

// Create Prisma client with pg adapter
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed process...");
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
  await prisma.plant.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.productGroupMaster.deleteMany();
  await prisma.chemicalGroup.deleteMany();
  await prisma.productCategory.deleteMany();

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

  // Create departments
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

  // Create permissions
  const permissions = await prisma.$transaction([
    prisma.permission.create({
      data: {
        key: "menu.reports",
        name: "เมนูรายงาน",
        category: "MENU",
        menuPath: "/reports",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.sales",
        name: "เมนูการขาย",
        category: "MENU",
        menuPath: "/reports/salesReport",
      },
    }),

    prisma.permission.create({
      data: {
        key: "menu.employees",
        name: "เมนูพนักงาน",
        category: "MENU",
        menuPath: "/employee",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.companies",
        name: "เมนูบริษัท",
        category: "MENU",
        menuPath: "/companies",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.customers",
        name: "เมนูลูกค้า",
        category: "MENU",
        menuPath: "/customers",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.credit_limits",
        name: "เมนูวงเงินสินเชื่อ",
        category: "MENU",
        menuPath: "/credit-limits",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.fulfillment",
        name: "เมนูจัดส่งสินค้า",
        category: "MENU",
        menuPath: "/fulfillment",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.temporary_credit_limits",
        name: "เมนูวงเงินสินเชื่อชั่วคราว",
        category: "MENU",
        menuPath: "/temporary-credit-limits",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.products",
        name: "เมนูสินค้า",
        category: "MENU",
        menuPath: "/products",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.create",
        name: "สร้างใบขาย",
        category: "ACTION",
        resource: "sale",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.edit",
        name: "แก้ไขใบขาย",
        category: "ACTION",
        resource: "sale",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.view",
        name: "ดูรายละเอียดใบขาย",
        category: "ACTION",
        resource: "sale",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.approve",
        name: "อนุมัติใบขาย",
        category: "ACTION",
        resource: "sale",
        action: "approve",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.confirm-payment",
        name: "ยืนยันการชำระเงิน",
        category: "ACTION",
        resource: "sale",
        action: "confirm_payment",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.manage_fulfillment",
        name: "จัดการการจัดส่งสินค้า",
        category: "ACTION",
        resource: "sale",
        action: "manage_fulfillment",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.create",
        name: "สร้างสินค้า",
        category: "ACTION",
        resource: "product",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.update",
        name: "แก้ไขสินค้า",
        category: "ACTION",
        resource: "product",
        action: "update",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.delete",
        name: "ลบสินค้า",
        category: "ACTION",
        resource: "product",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.view",
        name: "ดูรายละเอียดสินค้า",
        category: "ACTION",
        resource: "product",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.manage",
        name: "จัดการสินค้า (ราคา, สต็อก, โปรโมชั่น)",
        category: "ACTION",
        resource: "product",
        action: "manage",
      },
    }),
    prisma.permission.create({
      data: {
        key: "company.create",
        name: "สร้างบริษัท",
        category: "ACTION",
        resource: "company",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "company.edit",
        name: "แก้ไขบริษัท",
        category: "ACTION",
        resource: "company",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "company.delete",
        name: "ลบบริษัท",
        category: "ACTION",
        resource: "company",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.create.dealer",
        name: "สร้างลูกค้าตัวแทนจำหน่าย",
        category: "ACTION",
        resource: "customer",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.create.subdealer",
        name: "สร้างลูกค้าตัวแทนจำหน่ายย่อย",
        category: "ACTION",
        resource: "customer",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.create.farmer",
        name: "สร้างลูกค้าเกษตรกร",
        category: "ACTION",
        resource: "customer",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.create.broker",
        name: "สร้างลูกค้านายหน้า",
        category: "ACTION",
        resource: "customer",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.edit",
        name: "แก้ไขลูกค้า",
        category: "ACTION",
        resource: "customer",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.delete",
        name: "ลบลูกค้า",
        category: "ACTION",
        resource: "customer",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.view",
        name: "ดูรายละเอียดลูกค้า",
        category: "ACTION",
        resource: "customer",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.create",
        name: "สร้างวงเงินสินเชื่อ",
        category: "ACTION",
        resource: "creditlimit",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.edit",
        name: "แก้ไขวงเงินสินเชื่อ",
        category: "ACTION",
        resource: "creditlimit",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.delete",
        name: "ลบวงเงินสินเชื่อ",
        category: "ACTION",
        resource: "creditlimit",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.view",
        name: "ดูรายละเอียดวงเงินสินเชื่อ",
        category: "ACTION",
        resource: "creditlimit",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.create",
        name: "สร้างวงเงินสินเชื่อชั่วคราว",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.edit",
        name: "แก้ไขวงเงินสินเชื่อชั่วคราว",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.delete",
        name: "ลบวงเงินสินเชื่อชั่วคราว",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.view",
        name: "ดูรายละเอียดวงเงินสินเชื่อชั่วคราว",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.approve",
        name: "อนุมัติวงเงินสินเชื่อชั่วคราว",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "approve",
      },
    }),
    prisma.permission.create({
      data: {
        key: "temporary_creditlimit.reject",
        name: "ปฏิเสธวงเงินสินเชื่อชั่วคราว",
        category: "ACTION",
        resource: "temporary_creditlimit",
        action: "reject",
      },
    }),
    prisma.permission.create({
      data: {
        key: "randomize",
        name: "สุ่มข้อมูล",
        category: "ACTION",
        action: "randomize",
      },
    }),

    prisma.permission.create({
      data: {
        key: "employee.manage",
        name: "จัดการพนักงาน",
        category: "ACTION",
        resource: "employee",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "rbac.manage",
        name: "จัดการสิทธิ์ผู้ใช้",
        category: "ACTION",
        resource: "rbac",
        action: "manage",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.products",
        name: "ขอบเขตข้อมูลสินค้า",
        category: "DATA",
        resource: "product",
        defaultDataAccess: "VIEW_DEPARTMENT",
        defaultEditAccess: "EDIT_OWN",
        defaultDeleteAccess: "DELETE_OWN",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.employees",
        name: "ขอบเขตข้อมูลพนักงาน",
        category: "DATA",
        resource: "employee",
        defaultDataAccess: "VIEW_DEPARTMENT",
        defaultEditAccess: "EDIT_OWN",
        defaultDeleteAccess: "DELETE_OWN",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.customers",
        name: "ขอบเขตข้อมูลลูกค้า",
        category: "DATA",
        resource: "customer",
        defaultDataAccess: "VIEW_DEPARTMENT",
        defaultEditAccess: "EDIT_OWN",
        defaultDeleteAccess: "DELETE_OWN",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.creditlimits",
        name: "ขอบเขตข้อมูลวงเงินสินเชื่อ",
        category: "DATA",
        resource: "creditlimit",
        defaultDataAccess: "VIEW_DEPARTMENT",
        defaultEditAccess: "EDIT_OWN",
        defaultDeleteAccess: "DELETE_OWN",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.temporary_creditlimits",
        name: "ขอบเขตข้อมูลวงเงินสินเชื่อชั่วคราว",
        category: "DATA",
        resource: "temporary_creditlimit",
        defaultDataAccess: "VIEW_DEPARTMENT",
        defaultEditAccess: "EDIT_OWN",
        defaultDeleteAccess: "DELETE_OWN",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.sales",
        name: "ขอบเขตข้อมูลการขาย",
        category: "DATA",
        resource: "sale",
        defaultDataAccess: "VIEW_DEPARTMENT",
        defaultEditAccess: "EDIT_OWN",
        defaultDeleteAccess: "DELETE_OWN",
      },
    }),
    // New Permissions
    prisma.permission.create({
      data: {
        key: "menu.dashboard",
        name: "เมนูแดชบอร์ด",
        category: "MENU",
        menuPath: "/dashboard",
      },
    }),
    prisma.permission.create({
      data: {
        key: "employee.view",
        name: "ดูรายละเอียดพนักงาน",
        category: "ACTION",
        resource: "employee",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.delete",
        name: "ลบใบขาย",
        category: "ACTION",
        resource: "sale",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.reject",
        name: "ปฏิเสธใบขาย",
        category: "ACTION",
        resource: "sale",
        action: "reject",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.approve",
        name: "อนุมัติวงเงินสินเชื่อ",
        category: "ACTION",
        resource: "creditlimit",
        action: "approve",
      },
    }),
    prisma.permission.create({
      data: {
        key: "creditlimit.reject",
        name: "ปฏิเสธวงเงินสินเชื่อ",
        category: "ACTION",
        resource: "creditlimit",
        action: "reject",
      },
    }),
    // New Menu Permissions
    prisma.permission.create({
      data: {
        key: "menu.sales_forecast",
        name: "เมนูการคาดการณ์ยอดขาย",
        category: "MENU",
        menuPath: "/sales-forecast",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.sales_targets",
        name: "เมนูตั้งเป้าหมายยอดขาย",
        category: "MENU",
        menuPath: "/sales-targets",
      },
    }),
    // Report Permissions
    prisma.permission.create({
      data: {
        key: "report.time_sales",
        name: "รายงานยอดขายตามเวลา",
        category: "MENU",
        menuPath: "/reports/time-sales",
      },
    }),
    prisma.permission.create({
      data: {
        key: "report.product_sales",
        name: "รายงานตามสินค้า",
        category: "MENU",
        menuPath: "/reports/product-sales",
      },
    }),
    prisma.permission.create({
      data: {
        key: "report.product_group_sales",
        name: "รายงานตามกลุ่มสินค้า",
        category: "MENU",
        menuPath: "/reports/product-group-sales",
      },
    }),
    prisma.permission.create({
      data: {
        key: "report.customer_sales",
        name: "รายงานตามลูกค้า",
        category: "MENU",
        menuPath: "/reports/customer-sales",
      },
    }),
    prisma.permission.create({
      data: {
        key: "report.salesperson",
        name: "รายงานตามพนักงานขาย",
        category: "MENU",
        menuPath: "/reports/salesperson",
      },
    }),
    // ======================================
    // NEW PERMISSIONS - Added 2026-01-28
    // ======================================

    // Menu Permissions - Additional
    prisma.permission.create({
      data: {
        key: "menu.rbac",
        name: "เมนูจัดการสิทธิ์",
        category: "MENU",
        menuPath: "/rbac",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.admin",
        name: "เมนูตั้งค่าระบบ",
        category: "MENU",
        menuPath: "/admin",
      },
    }),
    prisma.permission.create({
      data: {
        key: "menu.notifications",
        name: "เมนูแจ้งเตือน",
        category: "MENU",
        menuPath: "/notifications",
      },
    }),

    // Report Permissions - Additional
    prisma.permission.create({
      data: {
        key: "report.export",
        name: "ส่งออกรายงาน",
        category: "ACTION",
        resource: "report",
        action: "export",
      },
    }),

    // Sale Permissions - Additional
    prisma.permission.create({
      data: {
        key: "sale.cancel",
        name: "ยกเลิกใบขาย",
        category: "ACTION",
        resource: "sale",
        action: "cancel",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sale.update_delivery",
        name: "แก้ไขวันส่ง",
        category: "ACTION",
        resource: "sale",
        action: "update_delivery",
      },
    }),

    // Product Permissions - Additional
    prisma.permission.create({
      data: {
        key: "product.import",
        name: "นำเข้าสินค้า",
        category: "ACTION",
        resource: "product",
        action: "import",
      },
    }),
    prisma.permission.create({
      data: {
        key: "product.export",
        name: "ส่งออกสินค้า",
        category: "ACTION",
        resource: "product",
        action: "export",
      },
    }),

    // Customer Permissions - Additional
    prisma.permission.create({
      data: {
        key: "customer.import",
        name: "นำเข้าข้อมูลลูกค้า",
        category: "ACTION",
        resource: "customer",
        action: "import",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.export",
        name: "ส่งออกข้อมูลลูกค้า",
        category: "ACTION",
        resource: "customer",
        action: "export",
      },
    }),
    prisma.permission.create({
      data: {
        key: "customer.assign",
        name: "กำหนดพนักงานดูแลลูกค้า",
        category: "ACTION",
        resource: "customer",
        action: "assign",
      },
    }),

    // Employee Permissions - Additional
    prisma.permission.create({
      data: {
        key: "employee.create",
        name: "สร้างพนักงาน",
        category: "ACTION",
        resource: "employee",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "employee.delete",
        name: "ลบพนักงาน",
        category: "ACTION",
        resource: "employee",
        action: "delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "employee.assign_manager",
        name: "กำหนดหัวหน้าพนักงาน",
        category: "ACTION",
        resource: "employee",
        action: "assign_manager",
      },
    }),

    // Company Permissions - Additional
    prisma.permission.create({
      data: {
        key: "company.view",
        name: "ดูรายละเอียดบริษัท",
        category: "ACTION",
        resource: "company",
        action: "view",
      },
    }),

    // RBAC Management Permissions
    prisma.permission.create({
      data: {
        key: "rbac.role.create",
        name: "สร้าง Role",
        category: "ACTION",
        resource: "rbac",
        action: "role_create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "rbac.role.edit",
        name: "แก้ไข Role",
        category: "ACTION",
        resource: "rbac",
        action: "role_edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "rbac.role.delete",
        name: "ลบ Role",
        category: "ACTION",
        resource: "rbac",
        action: "role_delete",
      },
    }),
    prisma.permission.create({
      data: {
        key: "rbac.permission.assign",
        name: "กำหนด Permission ให้ Role",
        category: "ACTION",
        resource: "rbac",
        action: "permission_assign",
      },
    }),
    prisma.permission.create({
      data: {
        key: "rbac.user.override",
        name: "Override สิทธิ์ผู้ใช้",
        category: "ACTION",
        resource: "rbac",
        action: "user_override",
      },
    }),

    // Sales Target Permissions
    prisma.permission.create({
      data: {
        key: "sales_target.view",
        name: "ดูเป้าหมายยอดขาย",
        category: "ACTION",
        resource: "sales_target",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sales_target.create",
        name: "สร้างเป้าหมายยอดขาย",
        category: "ACTION",
        resource: "sales_target",
        action: "create",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sales_target.edit",
        name: "แก้ไขเป้าหมายยอดขาย",
        category: "ACTION",
        resource: "sales_target",
        action: "edit",
      },
    }),
    prisma.permission.create({
      data: {
        key: "sales_target.delete",
        name: "ลบเป้าหมายยอดขาย",
        category: "ACTION",
        resource: "sales_target",
        action: "delete",
      },
    }),

    // Stock/Inventory Permissions
    prisma.permission.create({
      data: {
        key: "stock.view",
        name: "ดูสต็อกสินค้า",
        category: "ACTION",
        resource: "stock",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "stock.adjust",
        name: "ปรับปรุงสต็อก",
        category: "ACTION",
        resource: "stock",
        action: "adjust",
      },
    }),
    prisma.permission.create({
      data: {
        key: "stock.lot.manage",
        name: "จัดการ LOT สินค้า",
        category: "ACTION",
        resource: "stock",
        action: "lot_manage",
      },
    }),

    // Notification Permissions
    prisma.permission.create({
      data: {
        key: "notification.view",
        name: "ดูการแจ้งเตือน",
        category: "ACTION",
        resource: "notification",
        action: "view",
      },
    }),
    prisma.permission.create({
      data: {
        key: "notification.manage",
        name: "จัดการการแจ้งเตือน",
        category: "ACTION",
        resource: "notification",
        action: "manage",
      },
    }),

    // System Permissions
    prisma.permission.create({
      data: {
        key: "system.audit_log",
        name: "ดู Audit Log",
        category: "ACTION",
        resource: "system",
        action: "audit_log",
      },
    }),
    prisma.permission.create({
      data: {
        key: "system.security_log",
        name: "ดู Security Log",
        category: "ACTION",
        resource: "system",
        action: "security_log",
      },
    }),
    prisma.permission.create({
      data: {
        key: "system.settings",
        name: "ตั้งค่าระบบ",
        category: "ACTION",
        resource: "system",
        action: "settings",
      },
    }),

    // DATA Permissions - Additional
    prisma.permission.create({
      data: {
        key: "data.companies",
        name: "ขอบเขตข้อมูลบริษัท",
        category: "DATA",
        resource: "company",
        defaultDataAccess: "VIEW_ALL",
        defaultEditAccess: "EDIT_OWN",
        defaultDeleteAccess: "DELETE_OWN",
      },
    }),
    prisma.permission.create({
      data: {
        key: "data.sales_targets",
        name: "ขอบเขตข้อมูลเป้าหมายยอดขาย",
        category: "DATA",
        resource: "sales_target",
        defaultDataAccess: "VIEW_DEPARTMENT",
        defaultEditAccess: "EDIT_OWN",
        defaultDeleteAccess: "DELETE_OWN",
      },
    }),
  ]);

  const permissionMap = Object.fromEntries(
    permissions.map((permission) => [permission.key, permission]),
  );

  const allowAll = Object.values(permissionMap).map((permission) => ({
    permissionId: permission.id,
  }));

  await prisma.rolePermission.createMany({
    data: allowAll.map((entry) => {
      const perm = permissions.find((p) => p.id === entry.permissionId);
      const isDataPermission = perm?.category === "DATA";
      return {
        permissionId: entry.permissionId,
        roleId: adminRole.id,
        allow: true,
        dataAccess: "VIEW_ALL",
        // Add edit and delete access for DATA permissions
        editAccess: isDataPermission ? "EDIT_ALL" : null,
        deleteAccess: isDataPermission ? "DELETE_ALL" : null,
      };
    }),
  });

  const adminPassword = await hash("b@b.com", 12);

  await prisma.user.create({
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
  const p = (key) => permissionMap[key]?.id;

  // Sales Rep Permissions - can only edit/delete their own records
  const salesRepConfig = [
    { key: "menu.products" },
    { key: "product.view", dataAccess: "VIEW_ALL" },
    { key: "menu.sales" },
    { key: "sale.create" },
    { key: "sale.edit" },
    { key: "sale.view" },
    { key: "sale.delete" },
    { key: "menu.customers" },
    { key: "customer.edit" },
    { key: "customer.view", dataAccess: "VIEW_ALL" },
    { key: "menu.temporary_credit_limits" },
    { key: "temporary_creditlimit.create" },
    { key: "temporary_creditlimit.edit" },
    { key: "temporary_creditlimit.view" },
    { key: "temporary_creditlimit.delete" },
    { key: "employee.view", dataAccess: "VIEW_ALL" },
    // DATA permission with view/edit/delete scopes
    {
      key: "data.sales",
      dataAccess: "VIEW_OWN",
      editAccess: "EDIT_OWN",
      deleteAccess: "DELETE_OWN",
    },
    // New permissions added 2026-01-28
    { key: "notification.view" },
    { key: "stock.view" },
    { key: "customer.create.subdealer" },
    { key: "customer.create.farmer" },
    { key: "customer.create.broker" },
    {
      key: "data.customers",
      dataAccess: "VIEW_OWN",
      editAccess: "EDIT_OWN",
      deleteAccess: "DELETE_NONE",
    },
    {
      key: "data.temporary_creditlimits",
      dataAccess: "VIEW_OWN",
      editAccess: "EDIT_OWN",
      deleteAccess: "DELETE_OWN",
    },
  ];

  await prisma.rolePermission.createMany({
    data: salesRepConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: salesRepRole.id,
        permissionId: p(item.key),
        allow: true,
        dataAccess: item.dataAccess ?? null,
        editAccess: item.editAccess ?? null,
        deleteAccess: item.deleteAccess ?? null,
      })),
  });

  // Sales Manager Permissions - can view department but only edit/delete own
  const salesManagerConfig = [
    { key: "menu.dashboard" },
    { key: "menu.products" },
    { key: "product.view", dataAccess: "VIEW_ALL" },
    { key: "menu.sales" },
    { key: "sale.create" },
    { key: "sale.edit" },
    { key: "sale.delete" },
    { key: "sale.view" },
    { key: "sale.approve" },
    { key: "sale.reject" },
    { key: "menu.employees" },
    { key: "employee.view", dataAccess: "VIEW_DEPARTMENT" },
    { key: "menu.customers" },
    { key: "customer.create.dealer" },
    { key: "customer.create.subdealer" },
    { key: "customer.create.farmer" },
    { key: "customer.create.broker" },
    { key: "customer.edit" },
    { key: "customer.view", dataAccess: "VIEW_ALL" },
    { key: "menu.credit_limits" },
    { key: "creditlimit.create" },
    { key: "creditlimit.edit" },
    { key: "creditlimit.delete" },
    { key: "creditlimit.view", dataAccess: "VIEW_DEPARTMENT" },
    { key: "creditlimit.approve" },
    { key: "creditlimit.reject" },
    // DATA permission - can view department but only edit/delete own
    {
      key: "data.sales",
      dataAccess: "VIEW_DEPARTMENT",
      editAccess: "EDIT_OWN",
      deleteAccess: "DELETE_OWN",
    },
    // New permissions added 2026-01-28
    { key: "menu.reports" },
    { key: "report.time_sales" },
    { key: "report.product_sales" },
    { key: "report.customer_sales" },
    { key: "report.salesperson" },
    { key: "menu.temporary_credit_limits" },
    { key: "temporary_creditlimit.create" },
    { key: "temporary_creditlimit.edit" },
    { key: "temporary_creditlimit.view" },
    { key: "temporary_creditlimit.delete" },
    { key: "temporary_creditlimit.approve" },
    { key: "temporary_creditlimit.reject" },
    { key: "sale.cancel" },
    { key: "customer.assign" },
    { key: "employee.manage" },
    { key: "stock.view" },
    { key: "notification.view" },
    { key: "sales_target.view" },
    {
      key: "data.customers",
      dataAccess: "VIEW_DEPARTMENT",
      editAccess: "EDIT_OWN",
      deleteAccess: "DELETE_OWN",
    },
  ];

  await prisma.rolePermission.createMany({
    data: salesManagerConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: salesManagerRole.id,
        permissionId: p(item.key),
        allow: true,
        dataAccess: item.dataAccess ?? null,
        editAccess: item.editAccess ?? null,
        deleteAccess: item.deleteAccess ?? null,
      })),
  });

  // Admin Role Permissions (below Administrator, excludes RBAC management)
  const adminConfig = [
    { key: "menu.dashboard" },
    { key: "menu.reports" },
    { key: "menu.sales" },
    { key: "menu.products" },
    { key: "menu.customers" },
    { key: "menu.credit_limits" },
    { key: "menu.temporary_credit_limits" },
    { key: "menu.fulfillment" },
    { key: "menu.employees" },
    { key: "menu.companies" },
    { key: "menu.sales_forecast" },
    { key: "menu.sales_targets" },
    // Report permissions
    { key: "report.time_sales" },
    { key: "report.product_sales" },
    { key: "report.product_group_sales" },
    { key: "report.customer_sales" },
    { key: "report.salesperson" },
    // Sale permissions
    { key: "sale.create" },
    { key: "sale.edit" },
    { key: "sale.view" },
    { key: "sale.delete" },
    { key: "sale.approve" },
    { key: "sale.reject" },
    { key: "sale.confirm-payment" },
    { key: "sale.manage_fulfillment" },
    // Product permissions
    { key: "product.create" },
    { key: "product.update" },
    { key: "product.delete" },
    { key: "product.view" },
    { key: "product.manage" },
    // Customer permissions
    { key: "customer.create.dealer" },
    { key: "customer.create.subdealer" },
    { key: "customer.create.farmer" },
    { key: "customer.create.broker" },
    { key: "customer.edit" },
    { key: "customer.delete" },
    { key: "customer.view" },
    // Credit limit permissions
    { key: "creditlimit.create" },
    { key: "creditlimit.edit" },
    { key: "creditlimit.delete" },
    { key: "creditlimit.view" },
    { key: "creditlimit.approve" },
    { key: "creditlimit.reject" },
    // Temporary credit limit permissions
    { key: "temporary_creditlimit.create" },
    { key: "temporary_creditlimit.edit" },
    { key: "temporary_creditlimit.delete" },
    { key: "temporary_creditlimit.view" },
    { key: "temporary_creditlimit.approve" },
    { key: "temporary_creditlimit.reject" },
    // Company permissions
    { key: "company.create" },
    { key: "company.edit" },
    { key: "company.delete" },
    // Employee permissions
    { key: "employee.view", dataAccess: "VIEW_ALL" },
    { key: "employee.manage" },
    // Data scope permissions - Admin can view/edit/delete all
    {
      key: "data.products",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    {
      key: "data.employees",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    {
      key: "data.customers",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    {
      key: "data.creditlimits",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    {
      key: "data.temporary_creditlimits",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    {
      key: "data.sales",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    // New permissions added 2026-01-28
    { key: "menu.notifications" },
    { key: "report.export" },
    { key: "sale.cancel" },
    { key: "sale.update_delivery" },
    { key: "product.import" },
    { key: "product.export" },
    { key: "customer.import" },
    { key: "customer.export" },
    { key: "customer.assign" },
    { key: "employee.create" },
    { key: "employee.delete" },
    { key: "employee.assign_manager" },
    { key: "company.view" },
    { key: "sales_target.view" },
    { key: "sales_target.create" },
    { key: "sales_target.edit" },
    { key: "sales_target.delete" },
    { key: "stock.view" },
    { key: "stock.adjust" },
    { key: "stock.lot.manage" },
    { key: "notification.view" },
    { key: "notification.manage" },
    { key: "system.audit_log" },
    { key: "system.security_log" },
    {
      key: "data.companies",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    {
      key: "data.sales_targets",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    // Note: rbac.manage, menu.rbac, menu.admin, system.settings are excluded to differentiate from Administrator
  ];

  await prisma.rolePermission.createMany({
    data: adminConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: adminRoleSecondary.id,
        permissionId: p(item.key),
        allow: true,
        dataAccess: item.dataAccess ?? null,
        editAccess: item.editAccess ?? null,
        deleteAccess: item.deleteAccess ?? null,
      })),
  });

  // Create Units
  await prisma.unit.createMany({
    data: [
      { code: "BOT", description: "ขวด" },
      { code: "BOX", description: "กล่อง" },
      { code: "CTN", description: "ลัง" },
      { code: "DRUM", description: "ถัง" },
      { code: "GAL", description: "แกลลอน" },
      { code: "GM", description: "กรัม" },
      { code: "INNERBOX", description: "กล่องใน" },
      { code: "JAR", description: "กระปุก" },
      { code: "KG", description: "กิโลกรัม" },
      { code: "LTR", description: "ลิตร" },
      { code: "PCS", description: "ชิ้น" },
      { code: "ROLL", description: "ม้วน" },
      { code: "SACK", description: "กระสอบ" },
      { code: "SBOX", description: "กล่องใน" },
      { code: "SET", description: "ชุด" },
      { code: "STAL", description: "ซอง" },
    ],
  });

  // Create Categories
  const cat1 = await prisma.productCategory.create({
    data: { code: "INS", description: "ยาฆ่าแมลง" },
  });
  const cat2 = await prisma.productCategory.create({
    data: { code: "SUP", description: "ยาบำรุง" },
  });

  // Create Product Groups A, B, C, D
  await prisma.productGroupMaster.createMany({
    data: [
      {
        code: "A",
        description: "กลุ่มสินค้า A - ยาฆ่าแมลง",
        categoryId: cat1.id,
      },
      {
        code: "B",
        description: "กลุ่มสินค้า B - ยาฆ่าเชื้อรา",
        categoryId: cat1.id,
      },
      {
        code: "C",
        description: "กลุ่มสินค้า C - ยาฆ่าวัชพืช",
        categoryId: cat1.id,
      },
      {
        code: "D",
        description: "กลุ่มสินค้า D - ยาบำรุงพืช",
        categoryId: cat2.id,
      },
    ],
  });

  // Create Chemical Groups
  await prisma.chemicalGroup.createMany({
    data: [
      {
        code: "ACE",
        name: "ACETOCHLOR : Herbicide",
      },
      {
        code: "ACT",
        name: "ACETAMIPRID : Insecticide",
      },
      {
        code: "AGN",
        name: "AGNIQUE : Adjuvant",
      },
      {
        code: "ALA",
        name: "ALACHLOR : Herbicide",
      },
      {
        code: "AME",
        name: "AMETRYN : Herbicide",
      },
      {
        code: "AMI",
        name: "AMITRAZ : Acaricide",
      },
      {
        code: "AMN",
        name: "AMINO / CHELANT : Plant Nutrient",
      },
      {
        code: "ATR",
        name: "ATRAZINE : Herbicide",
      },
      {
        code: "BAC",
        name: "BACILLUS THURINGIENSIS KURSTAKI",
      },
      { code: "BB5", name: "BB-5 : Adjuvant" },
      {
        code: "BIS",
        name: "BISPYRIBAC-SODIUM : Herbicide",
      },
      {
        code: "BPR",
        name: "BUTACHLOR + PROPANIL : Herbicide",
      },
      {
        code: "BUP",
        name: "BUPROFEZIN : Insecticide",
      },
      {
        code: "BUT",
        name: "BUTACHLOR : Herbicide",
      },
      {
        code: "CAB",
        name: "CALCIUM BORON : Plant Nutrient",
      },
      {
        code: "CAR",
        name: "CARBENDAZIM : Fungicide",
      },
      {
        code: "CBR",
        name: "CARBARYL : Insecticide",
      },
      {
        code: "CHC",
        name: "CHLORPYRIFOS + CYPERMETHRIN : Insecticide",
      },
      {
        code: "CHL",
        name: "CHLORPYRIFOS : Insecticide",
      },
      {
        code: "CPR",
        name: "CLOMAZONE + PROPANIL : Herbicide",
      },
      {
        code: "CYP",
        name: "CYPERMETHRIN : Insecticide",
      },
      {
        code: "CYR",
        name: "CYPERMETHRIN + PROFENOFOS : Insecticide",
      },
      {
        code: "DAZ",
        name: "DIFENOCONAZOLE + AZOXYSTROBIN : Fungicide",
      },
      {
        code: "DEE",
        name: "DEEORNIC (SODIUM COMPLEX) : PLG",
      },
      {
        code: "DIP",
        name: "DIFENOCONAZOLE + PROPICONAZOLE : Fungicide",
      },
      {
        code: "DIU",
        name: "DIURON : Herbicide",
      },
      {
        code: "EMA",
        name: "EMAMECTIN : Insecticide",
      },
      { code: "ETH", name: "ETHEPHON : PGR" },
      {
        code: "ETI",
        name: "ETHION : Insecticide",
      },
      {
        code: "FDMP",
        name: "DIMETHOMORPH + PYRACLOSTROBIN : Fungicide",
      },
      {
        code: "FEN",
        name: "FENOBUCARB : Insecticide",
      },
      {
        code: "FFAZ",
        name: "AZOXYSTROBIN : Fungicide",
      },
      {
        code: "FIP",
        name: "FIPRONIL : Insecticide",
      },
      {
        code: "FISO",
        name: "ISOPROTHIOLANE : Fungicide",
      },
      {
        code: "FOM",
        name: "FOMESAFEN : Herbicide",
      },
      {
        code: "FOS",
        name: "FOSETYL ALUMINIUM : Fungicide",
      },
      {
        code: "FPHA",
        name: "PHOSPHONIC ACID : Fungicide",
      },
      {
        code: "FPRM",
        name: "PROPAMOCARB + METALAXYL : Fungicide",
      },
      {
        code: "FPRY",
        name: "PROCYMIDONE : Fungicide",
      },
      {
        code: "FTRC",
        name: "TRICYCLAZOLE : Fungicide",
      },
      {
        code: "GIB",
        name: "GIBBERELLIC ACID : PGR",
      },
      {
        code: "GLU",
        name: "GLUFOSINATE : Herbicide",
      },
      {
        code: "GLY",
        name: "GLYPHOSATE : Herbicide",
      },
      {
        code: "HFEO",
        name: "FENOXAPROP-P-ETHYL : Herbicide",
      },
      {
        code: "HFLU",
        name: "FLUMIOXAZIN : Herbicide",
      },
      {
        code: "HPIM",
        name: "PENDIMETHALIN + IMAZAPIC : Herbicide",
      },
      {
        code: "HSME",
        name: "S-METOLACHLOR : Herbicide",
      },
      {
        code: "HTRL",
        name: "TRICLOPYR : Herbicide",
      },
      {
        code: "ICHO",
        name: "CHLORFENAPYR : Insecticide",
      },
      {
        code: "IDIF",
        name: "DIFLUBENZURON : Insecticide",
      },
      {
        code: "ILAM",
        name: "LAMBDA-CYHALOTHRIN : Insecticide",
      },
      {
        code: "IMA",
        name: "IMAZAPIC : Herbicide",
      },
      {
        code: "IMI",
        name: "IMIDACLOPRID : Insecticide",
      },
      {
        code: "INE",
        name: "INDOXACARB + EMAMECTIN : Insecticide",
      },
      {
        code: "ISPI",
        name: "SPIROMESIFEN : Insecticide",
      },
      {
        code: "MAC",
        name: "MANCOZEB + CARBENDAZIM : Fungicide",
      },
      {
        code: "MAN",
        name: "MANCOZEB : Fungicide",
      },
      {
        code: "MES",
        name: "METSULFURON-METHYL : Herbicide",
      },
      {
        code: "MET",
        name: "METHOMYL : Insecticide",
      },
      {
        code: "MTL",
        name: "METALAXYL : Fungicide",
      },
      {
        code: "NIC",
        name: "NICLOSAMIDE-OLAMINE : Insecticide",
      },
      { code: "OTH", name: "OTHER (อื่นๆ)" },
      { code: "PAC", name: "PACLOBUTRAZOL : PGR" },
      {
        code: "PAR",
        name: "PARAQUAT : Herbicide",
      },
      {
        code: "PEN",
        name: "PENDIMETHALIN : Herbicide",
      },
      {
        code: "PIR",
        name: "PIRIMIPHOS-METHYL : Insecticide",
      },
      {
        code: "PPN",
        name: "PROPINEB : Fungicide",
      },
      {
        code: "PRC",
        name: "PROCHLORAZ : Fungicide",
      },
      {
        code: "PRE",
        name: "PRETILACHLOR : Herbicide",
      },
      {
        code: "PRF",
        name: "PROFENOFOS : Insecticide",
      },
      {
        code: "PRI",
        name: "PROPICONAZOLE : Fungicide",
      },
      {
        code: "PYI",
        name: "PYRIDABEN : Acaricide",
      },
      {
        code: "PYM",
        name: "PYMETROZINE : Insecticide",
      },
      {
        code: "PYR",
        name: "PYRAZOSULFURON : Herbicide",
      },
      {
        code: "QUI",
        name: "QUIZALOFOP-P-TEFURYL : Herbicide",
      },
      {
        code: "SEA",
        name: "SEARIDE : SEAWEED",
      },
      {
        code: "SEP",
        name: "SEAPLANT : SEAWEED",
      },
      { code: "SEW", name: "SEAWEED" },
      {
        code: "SLVS",
        name: "EMULANT LVS : SURFACTANT",
      },
      {
        code: "SUL",
        name: "SULPHUR : Fungicide",
      },
      {
        code: "TER",
        name: "TERASORB FOLIAR / 4 MACRO : Plant Nutrient",
      },
      { code: "THI", name: "THIOUREA : PGR" },
      {
        code: "TRI",
        name: "TRIAZOPHOS : Insecticide",
      },
      {
        code: "VAL",
        name: "VALIDAMYCIN : Fungicide",
      },
    ],
  });

  // Create Brands
  await prisma.brand.createMany({
    data: [{ code: "cropsciences", description: "Crop Science" }],
  });

  // Create Plants
  await prisma.plant.createMany({
    data: [
      { code: "RICE", name: "ข้าว", abbreviation: "RIC", group: "พืชไร่" },
      { code: "CORN", name: "ข้าวโพด", abbreviation: "CRN", group: "พืชไร่" },
      {
        code: "CASSAVA",
        name: "มันสำปะหลัง",
        abbreviation: "CAS",
        group: "พืชไร่",
      },
      { code: "SUGARCANE", name: "อ้อย", abbreviation: "SUG", group: "พืชไร่" },
      {
        code: "SOYBEAN",
        name: "ถั่วเหลือง",
        abbreviation: "SOY",
        group: "พืชไร่",
      },
      {
        code: "PEANUT",
        name: "ถั่วลิสง",
        abbreviation: "PEA",
        group: "พืชไร่",
      },
      {
        code: "SUNFLOWER",
        name: "ทานตะวัน",
        abbreviation: "SUN",
        group: "พืชไร่",
      },
      { code: "COTTON", name: "ฝ้าย", abbreviation: "COT", group: "พืชไร่" },
      { code: "SESAME", name: "งา", abbreviation: "SES", group: "พืชไร่" },
      {
        code: "SORGHUM",
        name: "ข้าวฟ่าง",
        abbreviation: "SOR",
        group: "พืชไร่",
      },
      {
        code: "MUNGBEAN",
        name: "ถั่วเขียว",
        abbreviation: "MUN",
        group: "พืชไร่",
      },
      { code: "CHILI", name: "พริก", abbreviation: "CHL", group: "พืชไร่" },
    ],
  });
}

main()
  .then(() => {
    console.log("✅ Seeding completed successfully!");
  })
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
