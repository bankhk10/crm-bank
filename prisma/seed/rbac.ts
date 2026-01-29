import { PrismaClient } from "@prisma/client";

export async function seedRBAC(prisma: PrismaClient) {
  console.log("🔐 Seeding RBAC (Roles, Permissions, RolePermissions)...");

  // Create Roles
  const adminRole = await prisma.role.create({
    data: {
      name: "Administrator",
      slug: "administrator",
      description: "Full access to every module",
      isSystem: true,
    },
  });

  const adminRoleSecondary = await prisma.role.create({
    data: {
      name: "Admin",
      slug: "admin",
      description:
        "High-level access with most permissions except RBAC management",
      isSystem: true,
    },
  });

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

  // Create Permissions
  await prisma.$transaction([
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

  // Fetch all permissions to map IDs
  const permissions = await prisma.permission.findMany();
  const permissionMap = Object.fromEntries(
    permissions.map((permission) => [permission.key, permission]),
  );

  const p = (key: string) => permissionMap[key]?.id;

  // Assign ALL permissions to Administrator
  const allowAll = permissions.map((permission) => ({
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

  // Sales Rep Permissions
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
        permissionId: p(item.key)!,
        allow: true,
        // @ts-ignore - Dynamic string alignment with enum
        dataAccess: item.dataAccess ?? null,
        // @ts-ignore
        editAccess: item.editAccess ?? null,
        // @ts-ignore
        deleteAccess: item.deleteAccess ?? null,
      })),
  });

  // Sales Manager Permissions
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
        permissionId: p(item.key)!,
        allow: true,
        // @ts-ignore
        dataAccess: item.dataAccess ?? null,
        // @ts-ignore
        editAccess: item.editAccess ?? null,
        // @ts-ignore
        deleteAccess: item.deleteAccess ?? null,
      })),
  });

  // Admin Role Secondary Permissions
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
        permissionId: p(item.key)!,
        allow: true,
        // @ts-ignore
        dataAccess: item.dataAccess ?? null,
        // @ts-ignore
        editAccess: item.editAccess ?? null,
        // @ts-ignore
        deleteAccess: item.deleteAccess ?? null,
      })),
  });

  console.log("✅ RBAC seeded.");
}
