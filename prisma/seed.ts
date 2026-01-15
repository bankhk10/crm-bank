import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../src/infrastructure/database/prisma";

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
  ]);

  const permissionMap = Object.fromEntries(
    permissions.map((permission) => [permission.key, permission])
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

  // Helper type for permission config
  type PermissionConfig = {
    key: string;
    dataAccess?: string;
    editAccess?: string;
    deleteAccess?: string;
  };

  // Sales Rep Permissions - can only edit/delete their own records
  const salesRepConfig: PermissionConfig[] = [
    { key: "menu.products" },
    { key: "product.view", dataAccess: "VIEW_ALL" },
    { key: "menu.sales" },
    { key: "sale.create" },
    { key: "sale.edit" },
    { key: "sale.view" },
    { key: "sale.delete" },
    { key: "menu.customers" },
    { key: "customer.create.dealer" },
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
  ];

  await prisma.rolePermission.createMany({
    data: salesRepConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: salesRepRole.id,
        permissionId: p(item.key),
        allow: true,
        dataAccess: (item.dataAccess as any) ?? null,
        editAccess: (item.editAccess as any) ?? null,
        deleteAccess: (item.deleteAccess as any) ?? null,
      })),
  });

  // Sales Manager Permissions - can view department but only edit/delete own
  const salesManagerConfig: PermissionConfig[] = [
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
  ];

  await prisma.rolePermission.createMany({
    data: salesManagerConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: salesManagerRole.id,
        permissionId: p(item.key),
        allow: true,
        dataAccess: (item.dataAccess as any) ?? null,
        editAccess: (item.editAccess as any) ?? null,
        deleteAccess: (item.deleteAccess as any) ?? null,
      })),
  });

  // Admin Role Permissions (below Administrator, excludes RBAC management)
  const adminConfig: PermissionConfig[] = [
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
    // Note: rbac.manage is excluded to differentiate from Administrator
  ];

  await prisma.rolePermission.createMany({
    data: adminConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: adminRoleSecondary.id,
        permissionId: p(item.key),
        allow: true,
        dataAccess: (item.dataAccess as any) ?? null,
        editAccess: (item.editAccess as any) ?? null,
        deleteAccess: (item.deleteAccess as any) ?? null,
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
