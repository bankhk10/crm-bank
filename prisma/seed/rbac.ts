import {
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@prisma/client";

// ============================================================================
// Permission Groups - Hierarchical Structure
// แต่ละโมดูลจะมี menu, actions, data แยกชัดเจน
// ============================================================================

type PermissionDef = {
  key: string;
  name: string;
  resource: string; // Mandatory Grouping Field
  category?: "MENU" | "ACTION" | "DATA";
  menuPath?: string;
  action?: string;
  defaultDataAccess?: DataAccessLevel;
  defaultEditAccess?: EditAccessLevel;
  defaultDeleteAccess?: DeleteAccessLevel;
};

type PermissionGroup = {
  menu?: PermissionDef;
  actions?: PermissionDef[];
  data?: PermissionDef;
  subMenus?: PermissionDef[];
};

const permissionGroups: Record<string, PermissionGroup> = {
  // ─────────────────────────────────────────────
  // 📊 Dashboard
  // ─────────────────────────────────────────────
  dashboard: {
    menu: {
      key: "menu.dashboard.admin",
      name: "เมนูแดชบอร์ดผู้บริหาร",
      resource: "dashboard",
      menuPath: "/dashboard/admin",
    },
    subMenus: [
      {
        key: "menu.dashboard.manager",
        name: "แดชบอร์ดผู้จัดการ",
        resource: "dashboard",
        menuPath: "/dashboard/manager",
      },
      {
        key: "menu.dashboard.sales",
        name: "แดชบอร์ดพนักงานฝ่ายขาย",
        resource: "dashboard",
        menuPath: "/dashboard/sales",
      },
      {
        key: "menu.show_product",
        name: "หน้าแรก",
        resource: "show_product",
        menuPath: "/show-product",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 📈 Reports (รายงาน)
  // ─────────────────────────────────────────────
  reports: {
    menu: {
      key: "menu.reports",
      name: "เมนูรายงาน",
      resource: "report",
      menuPath: "/reports",
    },
    data: {
      key: "data.reports",
      name: "ขอบเขตข้อมูลรายงาน",
      resource: "report",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_NONE,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_NONE,
    },
    subMenus: [
      {
        key: "menu.sales",
        name: "เมนูการขาย",
        resource: "sale",
        menuPath: "/reports/salesReport",
      },
      {
        key: "report.time_sales",
        name: "รายงานยอดขายตามเวลา",
        resource: "report",
        menuPath: "/reports/time-sales",
      },
      {
        key: "report.product_sales",
        name: "รายงานตามสินค้า",
        resource: "report",
        menuPath: "/reports/product-sales",
      },
      {
        key: "report.product_group_sales",
        name: "รายงานตามกลุ่มสินค้า",
        resource: "report",
        menuPath: "/reports/product-group-sales",
      },
      {
        key: "report.customer_sales",
        name: "รายงานตามลูกค้า",
        resource: "report",
        menuPath: "/reports/customer-sales",
      },
      {
        key: "report.salesperson",
        name: "รายงานตามพนักงานขาย",
        resource: "report",
        menuPath: "/reports/salesperson",
      },
      {
        key: "report.sales_forecast",
        name: "รายงานการขายเทียบคาดการณ์ยอดขาย",
        resource: "report",
        menuPath: "/reports/sales-forecast",
      },
      {
        key: "report.executive_dashboard",
        name: "รายงานภาพรวมผู้บริหาร",
        resource: "report",
        menuPath: "/reports/dashboard",
      },
    ],
    actions: [
      {
        key: "report.export",
        name: "ส่งออกรายงาน",
        resource: "report",
        action: "export",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 📥 Exports (การส่งออกข้อมูล)
  // ─────────────────────────────────────────────
  exports: {
    menu: {
      key: "menu.exports",
      name: "เมนูส่งออกข้อมูล",
      resource: "export",
      menuPath: "/exports",
    },
    actions: [
      {
        key: "export.sales_admin",
        name: "ส่งออกข้อมูลการขาย (ธุรการขาย)",
        resource: "export",
        action: "export",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 🛒 Sales (การขาย)
  // ─────────────────────────────────────────────
  sales: {
    menu: {
      key: "menu.sales",
      name: "เมนูการขาย",
      resource: "sale",
      menuPath: "/reports/salesReport",
    },
    actions: [
      {
        key: "sale.create",
        name: "สร้างใบขาย",
        resource: "sale",
        action: "create",
      },
      {
        key: "sale.edit",
        name: "แก้ไขใบขาย",
        resource: "sale",
        action: "edit",
      },
      {
        key: "sale.view",
        name: "ดูรายละเอียดใบขาย",
        resource: "sale",
        action: "view",
      },
      {
        key: "sale.delete",
        name: "ลบใบขาย",
        resource: "sale",
        action: "delete",
      },
      {
        key: "sale.approve",
        name: "อนุมัติใบขาย",
        resource: "sale",
        action: "approve",
      },
      {
        key: "sale.confirm-payment",
        name: "ยืนยันการชำระเงิน",
        resource: "sale",
        action: "confirm_payment",
      },
    ],
    data: {
      key: "data.sales",
      name: "ขอบเขตข้อมูลการขาย",
      resource: "sale",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_OWN,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
    },
  },

  // ─────────────────────────────────────────────
  // 🚚 Fulfillment (จัดส่งสินค้า)
  // ─────────────────────────────────────────────
  fulfillment: {
    menu: {
      key: "menu.fulfillment",
      name: "เมนูจัดส่งสินค้า",
      resource: "fulfillment",
      menuPath: "/fulfillment",
    },
  },

  // ─────────────────────────────────────────────
  // 📦 Products (สินค้า)
  // ─────────────────────────────────────────────
  products: {
    menu: {
      key: "menu.products",
      name: "เมนูสินค้า",
      resource: "product",
      menuPath: "/products",
    },
    actions: [
      {
        key: "product.create",
        name: "สร้างสินค้า",
        resource: "product",
        action: "create",
      },
      {
        key: "product.edit",
        name: "แก้ไขสินค้า",
        resource: "product",
        action: "edit",
      },
      {
        key: "product.delete",
        name: "ลบสินค้า",
        resource: "product",
        action: "delete",
      },
      {
        key: "product.view",
        name: "ดูรายละเอียดสินค้า",
        resource: "product",
        action: "view",
      },
      {
        key: "product.manage",
        name: "จัดการสินค้า (ราคา, สต็อก, โปรโมชั่น)",
        resource: "product",
        action: "manage",
      },
      {
        key: "product.stock.view",
        name: "ดูสต็อกสินค้า (ทั้งหมด, จอง, คงเหลือ)",
        resource: "product",
        action: "stock_view",
      },
      {
        key: "product.export",
        name: "ส่งออกสินค้า",
        resource: "product",
        action: "export",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 👥 Customers (ลูกค้า)
  // ─────────────────────────────────────────────
  customers: {
    menu: {
      key: "menu.customers",
      name: "เมนูลูกค้า",
      resource: "customer",
      menuPath: "/customers",
    },
    actions: [
      {
        key: "customer.create.dealer",
        name: "สร้างลูกค้าตัวแทนจำหน่าย",
        resource: "customer",
        action: "create",
      },
      {
        key: "customer.create.subdealer",
        name: "สร้างลูกค้าตัวแทนจำหน่ายย่อย",
        resource: "customer",
        action: "create",
      },
      {
        key: "customer.create.farmer",
        name: "สร้างลูกค้าเกษตรกร",
        resource: "customer",
        action: "create",
      },
      {
        key: "customer.create.broker",
        name: "สร้างลูกค้านายหน้า",
        resource: "customer",
        action: "create",
      },
      {
        key: "customer.edit.dealer",
        name: "แก้ไขลูกค้าตัวแทนจำหน่าย",
        resource: "customer",
        action: "edit",
      },
      {
        key: "customer.edit.subdealer",
        name: "แก้ไขลูกค้าตัวแทนจำหน่ายย่อย",
        resource: "customer",
        action: "edit",
      },
      {
        key: "customer.edit.farmer",
        name: "แก้ไขลูกค้าเกษตรกร",
        resource: "customer",
        action: "edit",
      },
      {
        key: "customer.edit.broker",
        name: "แก้ไขลูกค้านายหน้า",
        resource: "customer",
        action: "edit",
      },
      {
        key: "customer.delete.dealer",
        name: "ลบลูกค้าตัวแทนจำหน่าย",
        resource: "customer",
        action: "delete",
      },
      {
        key: "customer.delete.subdealer",
        name: "ลบลูกค้าตัวแทนจำหน่ายย่อย",
        resource: "customer",
        action: "delete",
      },
      {
        key: "customer.delete.farmer",
        name: "ลบลูกค้าเกษตรกร",
        resource: "customer",
        action: "delete",
      },
      {
        key: "customer.delete.broker",
        name: "ลบลูกค้านายหน้า",
        resource: "customer",
        action: "delete",
      },
      {
        key: "customer.view.dealer",
        name: "ดูรายละเอียดลูกค้าตัวแทนจำหน่าย",
        resource: "customer",
        action: "view",
      },
      {
        key: "customer.view.subdealer",
        name: "ดูรายละเอียดลูกค้าตัวแทนจำหน่ายย่อย",
        resource: "customer",
        action: "view",
      },
      {
        key: "customer.view.farmer",
        name: "ดูรายละเอียดลูกค้าเกษตรกร",
        resource: "customer",
        action: "view",
      },
      {
        key: "customer.view.broker",
        name: "ดูรายละเอียดลูกค้านายหน้า",
        resource: "customer",
        action: "view",
      },
      {
        key: "customer.export",
        name: "ส่งออกข้อมูลลูกค้า",
        resource: "customer",
        action: "export",
      },
    ],
    data: {
      key: "data.customers",
      name: "ขอบเขตข้อมูลลูกค้า",
      resource: "customer",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_OWN,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
    },
  },

  // ─────────────────────────────────────────────
  // 🏢 Companies (บริษัท)
  // ─────────────────────────────────────────────
  companies: {
    menu: {
      key: "menu.companies",
      name: "เมนูบริษัท",
      resource: "company",
      menuPath: "/companies",
    },
    actions: [
      {
        key: "company.view",
        name: "ดูรายละเอียดบริษัท",
        resource: "company",
        action: "view",
      },
      {
        key: "company.create",
        name: "สร้างบริษัท",
        resource: "company",
        action: "create",
      },
      {
        key: "company.edit",
        name: "แก้ไขบริษัท",
        resource: "company",
        action: "edit",
      },
      {
        key: "company.delete",
        name: "ลบบริษัท",
        resource: "company",
        action: "delete",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 💳 Credit Limits (วงเงินเครดิต)
  // ─────────────────────────────────────────────
  creditLimits: {
    menu: {
      key: "menu.credit_limits",
      name: "เมนูวงเงินเครดิต",
      resource: "creditlimit",
      menuPath: "/credit-limits",
    },
    actions: [
      {
        key: "creditlimit.create",
        name: "สร้างวงเงินเครดิต",
        resource: "creditlimit",
        action: "create",
      },
      {
        key: "creditlimit.edit",
        name: "แก้ไขวงเงินเครดิต",
        resource: "creditlimit",
        action: "edit",
      },
    ],
    data: {
      key: "data.creditlimits",
      name: "ขอบเขตข้อมูลวงเงินเครดิต",
      resource: "creditlimit",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_OWN,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
    },
  },

  // ─────────────────────────────────────────────
  // 💳 Temporary Credit Limits (วงเงินเครดิตชั่วคราว)
  // ─────────────────────────────────────────────
  temporaryCreditLimits: {
    menu: {
      key: "menu.temporary_credit_limits",
      name: "เมนูวงเงินเครดิตชั่วคราว",
      resource: "temporary_creditlimit",
      menuPath: "/temporary-credit-limits",
    },
    actions: [
      {
        key: "temporary_creditlimit.create",
        name: "สร้างวงเงินเครดิตชั่วคราว",
        resource: "temporary_creditlimit",
        action: "create",
      },
      {
        key: "temporary_creditlimit.edit",
        name: "แก้ไขวงเงินเครดิตชั่วคราว",
        resource: "temporary_creditlimit",
        action: "edit",
      },
      {
        key: "temporary_creditlimit.delete",
        name: "ลบวงเงินเครดิตชั่วคราว",
        resource: "temporary_creditlimit",
        action: "delete",
      },
      {
        key: "temporary_creditlimit.view",
        name: "ดูรายละเอียดวงเงินเครดิตชั่วคราว",
        resource: "temporary_creditlimit",
        action: "view",
      },
      {
        key: "temporary_creditlimit.approve",
        name: "อนุมัติวงเงินเครดิตชั่วคราว",
        resource: "temporary_creditlimit",
        action: "approve",
      },
    ],
    data: {
      key: "data.temporary_creditlimits",
      name: "ขอบเขตข้อมูลวงเงินเครดิตชั่วคราว",
      resource: "temporary_creditlimit",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_OWN,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
    },
  },

  // ─────────────────────────────────────────────
  // 👨‍💼 Employees (พนักงาน)
  // ─────────────────────────────────────────────
  employees: {
    menu: {
      key: "menu.employees",
      name: "เมนูพนักงาน",
      resource: "employee",
      menuPath: "/employee",
    },
    actions: [
      {
        key: "employee.create",
        name: "สร้างพนักงาน",
        resource: "employee",
        action: "create",
      },
      {
        key: "employee.edit",
        name: "แก้ไขพนักงาน",
        resource: "employee",
        action: "edit",
      },
      {
        key: "employee.delete",
        name: "ลบพนักงาน",
        resource: "employee",
        action: "delete",
      },
      {
        key: "employee.view",
        name: "ดูรายละเอียดพนักงาน",
        resource: "employee",
        action: "view",
      },
    ],
    data: {
      key: "data.employees",
      name: "ขอบเขตข้อมูลพนักงาน",
      resource: "employee",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_OWN,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
    },
  },

  // ─────────────────────────────────────────────
  // 🔐 RBAC (จัดการสิทธิ์)
  // ─────────────────────────────────────────────
  rbac: {
    menu: {
      key: "menu.rbac",
      name: "เมนูจัดการสิทธิ์",
      resource: "rbac",
      menuPath: "/rbac",
    },
    actions: [
      {
        key: "rbac.manage",
        name: "จัดการสิทธิ์ผู้ใช้",
        resource: "rbac",
        action: "manage",
      },
      {
        key: "rbac.role.create",
        name: "สร้าง Role",
        resource: "rbac",
        action: "role_create",
      },
      {
        key: "rbac.role.edit",
        name: "แก้ไข Role",
        resource: "rbac",
        action: "role_edit",
      },
      {
        key: "rbac.role.delete",
        name: "ลบ Role",
        resource: "rbac",
        action: "role_delete",
      },
      {
        key: "rbac.permission.assign",
        name: "กำหนด Permission ให้ Role",
        resource: "rbac",
        action: "permission_assign",
      },
      {
        key: "rbac.user.override",
        name: "Override สิทธิ์ผู้ใช้",
        resource: "rbac",
        action: "user_override",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 📢 Announcements (ประกาศ)
  // ─────────────────────────────────────────────
  announcements: {
    menu: {
      key: "menu.announcements",
      name: "เมนูจัดการ Popup",
      resource: "announcement",
      menuPath: "/admin/login-announcements",
    },
    actions: [
      {
        key: "announcement.manage",
        name: "จัดการ Popup หลัง Login",
        resource: "announcement",
        action: "manage",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // ⚙️ Admin / System (ตั้งค่าระบบ)
  // ─────────────────────────────────────────────
  admin: {
    menu: {
      key: "menu.admin",
      name: "เมนูตั้งค่าระบบ",
      resource: "system",
      menuPath: "/admin",
    },
    actions: [
      {
        key: "system.audit_log",
        name: "ดู Audit Log",
        resource: "system",
        action: "audit_log",
      },
      {
        key: "system.security_log",
        name: "ดู Security Log",
        resource: "system",
        action: "security_log",
      },
      {
        key: "system.settings",
        name: "ตั้งค่าระบบ",
        resource: "system",
        action: "settings",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 📊 Sales Forecast (คาดการณ์ยอดขาย)
  // ─────────────────────────────────────────────
  salesForecast: {
    menu: {
      key: "menu.sales_forecast",
      name: "เมนูการคาดการณ์ยอดขาย",
      resource: "sales_forecast",
      menuPath: "/sales-forecast",
    },
  },

  // ─────────────────────────────────────────────
  // 🎯 Sales Targets (เป้าหมายยอดขาย)
  // ─────────────────────────────────────────────
  salesTargets: {
    menu: {
      key: "menu.sales_targets",
      name: "เมนูตั้งเป้าหมายยอดขาย",
      resource: "sales_target",
      menuPath: "/sales-targets",
    },
    actions: [
      {
        key: "sales_target.view",
        name: "ดูเป้าหมายยอดขาย",
        resource: "sales_target",
        action: "view",
      },
      {
        key: "sales_target.create",
        name: "สร้างเป้าหมายยอดขาย",
        resource: "sales_target",
        action: "create",
      },
      {
        key: "sales_target.edit",
        name: "แก้ไขเป้าหมายยอดขาย",
        resource: "sales_target",
        action: "edit",
      },
      {
        key: "sales_target.delete",
        name: "ลบเป้าหมายยอดขาย",
        resource: "sales_target",
        action: "delete",
      },
    ],
    data: {
      key: "data.sales_targets",
      name: "ขอบเขตข้อมูลเป้าหมายยอดขาย",
      resource: "sales_target",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_OWN,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
    },
  },

  // ─────────────────────────────────────────────
  // 🚛 Shipping Companies (บริษัทขนส่ง)
  // ─────────────────────────────────────────────
  shippingCompanies: {
    menu: {
      key: "menu.shipping-companies",
      name: "เมนูบริษัทขนส่ง",
      resource: "shipping-company",
      menuPath: "/shipping-companies",
    },
    actions: [
      {
        key: "shipping-company.create",
        name: "สร้างบริษัทขนส่ง",
        resource: "shipping-company",
        action: "create",
      },
      {
        key: "shipping-company.edit",
        name: "แก้ไขบริษัทขนส่ง",
        resource: "shipping-company",
        action: "edit",
      },
      {
        key: "shipping-company.delete",
        name: "ลบบริษัทขนส่ง",
        resource: "shipping-company",
        action: "delete",
      },
    ],
  },
  testActivity: {
    menu: {
      key: "menu.test_activity",
      name: "เมนูทดสอบกิจกรรม",
      resource: "test_activity",
      menuPath: "/test-activity",
    },
    subMenus: [
      {
        key: "menu.test_activity.reports",
        name: "รายงานกิจกรรม",
        resource: "test_activity",
        menuPath: "/test-activity/reports",
      },
      {
        key: "menu.test_activity.trip_plan",
        name: "รายงานแผนการออกปฏิบัติงาน (Trip Plan)",
        resource: "test_activity",
        menuPath: "/test-activity/trip-plan",
      },
      {
        key: "menu.test_activity.activity_report",
        name: "รายงานผลการดำเนินกิจกรรม (Activity Report)",
        resource: "test_activity",
        menuPath: "/test-activity/activity-report",
      },
      {
        key: "menu.test_activity.budget_report",
        name: "รายงานงบประมาณ (Budget Report)",
        resource: "test_activity",
        menuPath: "/test-activity/budget-report",
      },
      {
        key: "menu.test_activity.customer_report",
        name: "รายงานลูกค้า (Customer Report)",
        resource: "test_activity",
        menuPath: "/test-activity/customer-report",
      },
    ],
  },
};

// ============================================================================
// Helper: Flatten permissionGroups → Prisma-compatible permission data
// ============================================================================

interface PrismaPermissionData {
  key: string;
  name: string;
  category: "MENU" | "ACTION" | "DATA";
  menuPath?: string;
  resource: string;
  action?: string;
  defaultDataAccess?: DataAccessLevel;
  defaultEditAccess?: EditAccessLevel;
  defaultDeleteAccess?: DeleteAccessLevel;
}

function flattenPermissionGroups(
  groups: Record<string, PermissionGroup>,
): PrismaPermissionData[] {
  const result: PrismaPermissionData[] = [];
  const seen = new Set<string>();

  for (const [, group] of Object.entries(groups)) {
    // Menu permission
    if (group.menu && !seen.has(group.menu.key)) {
      seen.add(group.menu.key);
      result.push({
        key: group.menu.key,
        name: group.menu.name,
        category: "MENU",
        resource: group.menu.resource,
        menuPath: group.menu.menuPath,
      });
    }

    // Sub-menu permissions (reports sub-pages, etc.)
    if (group.subMenus) {
      for (const sub of group.subMenus) {
        if (!seen.has(sub.key)) {
          seen.add(sub.key);
          result.push({
            key: sub.key,
            name: sub.name,
            category: "MENU",
            resource: sub.resource,
            menuPath: sub.menuPath,
          });
        }
      }
    }

    // Action permissions
    if (group.actions) {
      for (const act of group.actions) {
        if (!seen.has(act.key)) {
          seen.add(act.key);
          result.push({
            key: act.key,
            name: act.name,
            category: "ACTION",
            resource: act.resource,
            action: act.action,
          });
        }
      }
    }

    // Data scope permission
    if (group.data && !seen.has(group.data.key)) {
      seen.add(group.data.key);
      result.push({
        key: group.data.key,
        name: group.data.name,
        category: "DATA",
        resource: group.data.resource,
        defaultDataAccess: group.data.defaultDataAccess,
        defaultEditAccess: group.data.defaultEditAccess,
        defaultDeleteAccess: group.data.defaultDeleteAccess,
      });
    }
  }

  return result;
}

// ============================================================================
// Seed Function
// ============================================================================

export async function seedRBAC(prisma: PrismaClient) {
  console.log("🔐 Seeding RBAC (Roles, Permissions, RolePermissions)...");

  // Rename deprecated keys
  const renames = { "product.update": "product.edit" };
  for (const [oldKey, newKey] of Object.entries(renames)) {
    try {
      const oldPerm = await prisma.permission.findUnique({
        where: { key: oldKey },
      });
      if (oldPerm) {
        const newPerm = await prisma.permission.findUnique({
          where: { key: newKey },
        });
        if (!newPerm) {
          await prisma.permission.update({
            where: { key: oldKey },
            data: { key: newKey },
          });
          console.log(`♻️  Renamed permission: ${oldKey} -> ${newKey}`);
        } else {
          await prisma.permission.delete({ where: { key: oldKey } });
        }
      }
    } catch {}
  }

  // Flatten all permission groups
  const allPermissionDefs = flattenPermissionGroups(permissionGroups);

  // Check if RBAC has already been seeded
  const existingAdminRole = await prisma.role.findUnique({
    where: { slug: "administrator" },
  });

  if (existingAdminRole) {
    console.log("🔐 RBAC already seeded, updating permissions...");

    let createdCount = 0;
    let updatedCount = 0;

    for (const perm of allPermissionDefs) {
      const existing = await prisma.permission.findUnique({
        where: { key: perm.key },
      });

      if (!existing) {
        const created = await prisma.permission.create({ data: perm });
        // Assign to administrator role with full access
        await prisma.rolePermission.create({
          data: {
            roleId: existingAdminRole.id,
            permissionId: created.id,
            allow: true,
            dataAccess: DataAccessLevel.VIEW_ALL,
            editAccess:
              perm.category === "DATA" ? EditAccessLevel.EDIT_ALL : null,
            deleteAccess:
              perm.category === "DATA" ? DeleteAccessLevel.DELETE_ALL : null,
          },
        });
        createdCount++;
        console.log(`  ✅ Created permission: ${perm.key}`);
      } else {
        // Update permission details if changed
        if (
          existing.resource !== perm.resource ||
          existing.action !== (perm.action ?? null) ||
          existing.name !== perm.name ||
          existing.menuPath !== (perm.menuPath ?? null)
        ) {
          const changes: string[] = [];
          if (existing.name !== perm.name) {
            changes.push(`name: "${existing.name}" -> "${perm.name}"`);
          }
          if (existing.resource !== perm.resource) {
            changes.push(
              `resource: "${existing.resource}" -> "${perm.resource}"`,
            );
          }
          if (existing.action !== (perm.action ?? null)) {
            changes.push(
              `action: "${existing.action}" -> "${perm.action ?? null}"`,
            );
          }
          if (existing.menuPath !== (perm.menuPath ?? null)) {
            changes.push(
              `menuPath: "${existing.menuPath}" -> "${perm.menuPath ?? null}"`,
            );
          }

          await prisma.permission.update({
            where: { id: existing.id },
            data: {
              resource: perm.resource,
              action: perm.action ?? null,
              name: perm.name,
              menuPath: perm.menuPath ?? null,
            },
          });
          updatedCount++;
          console.log(
            `  ✅ Updated permission: ${perm.key} (${changes.join(", ")})`,
          );
        }
      }
    }

    console.log(
      `  ✅ Sync complete: Created ${createdCount}, Updated ${updatedCount} permissions.`,
    );
    if (createdCount === 0 && updatedCount === 0) {
      console.log("  ✅ All permissions up to date.");
    }
    return;
  }

  // ──────────────────────────────────────────────────────────────
  // Create Roles
  // ──────────────────────────────────────────────────────────────

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
      name: "พนักงานฝ่ายขาย",
      slug: "sales_employee",
      description: "พนักงานฝ่ายขาย",
    },
  });

  const salesManagerRole = await prisma.role.create({
    data: {
      name: "ผู้จัดการฝ่ายขาย",
      slug: "sales_manager",
      description: "ผู้จัดการฝ่ายขาย",
    },
  });

  const ceoRole = await prisma.role.create({
    data: {
      name: "ผู้บริหาร",
      slug: "ceo",
      description:
        "ผู้บริหารสูงสุด - สิทธิ์ดูข้อมูลทั้งหมด (Read-only Executive Access)",
      isSystem: true,
    },
  });

  const salesAdminRole = await prisma.role.create({
    data: {
      name: "ธุรการขาย",
      slug: "sales_admin",
      description: "ธุรการขาย - จัดการการจัดส่งสินค้าและงานเอกสารฝ่ายขาย",
    },
  });

  // ──────────────────────────────────────────────────────────────
  // Create Permissions (from hierarchical groups)
  // ──────────────────────────────────────────────────────────────

  await prisma.$transaction(
    allPermissionDefs.map((perm) => prisma.permission.create({ data: perm })),
  );

  // Fetch all permissions to map IDs
  const permissions = await prisma.permission.findMany();
  const permissionMap = Object.fromEntries(
    permissions.map((permission) => [permission.key, permission]),
  );

  const p = (key: string) => permissionMap[key]?.id;

  // ──────────────────────────────────────────────────────────────
  // Assign ALL permissions to Administrator
  // ──────────────────────────────────────────────────────────────

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
        dataAccess: DataAccessLevel.VIEW_ALL,
        // Add edit and delete access for DATA permissions
        editAccess: isDataPermission ? EditAccessLevel.EDIT_ALL : null,
        deleteAccess: isDataPermission ? DeleteAccessLevel.DELETE_ALL : null,
      };
    }),
  });

  // ──────────────────────────────────────────────────────────────
  // Sales Rep (พนักงานฝ่ายขาย) Permissions
  // ──────────────────────────────────────────────────────────────

  const salesRepConfig = [
    { key: "menu.dashboard.sales" },
    { key: "menu.products" },
    { key: "product.view", dataAccess: "VIEW_ALL" },
    { key: "menu.sales" },
    { key: "sale.create" },
    { key: "sale.edit" },
    { key: "sale.view" },
    { key: "sale.delete" },
    { key: "menu.customers" },
    { key: "customer.edit.subdealer" },
    { key: "customer.edit.farmer" },
    { key: "customer.edit.broker" },
    { key: "customer.view.dealer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.subdealer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.farmer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.broker", dataAccess: "VIEW_ALL" },
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
    {
      key: "menu.sales_targets",
    },
    {
      key: "data.sales_targets",
      dataAccess: "VIEW_OWN",
      editAccess: "EDIT_OWN",
      deleteAccess: "DELETE_OWN",
    },
    { key: "sales_target.create" },
    { key: "sales_target.edit" },
    { key: "sales_target.view" },
    { key: "sales_target.delete" },
    { key: "menu.test_activity" },
    { key: "menu.test_activity.trip_plan" },
    { key: "menu.test_activity.activity_report" },
    { key: "menu.test_activity.budget_report" },
    { key: "menu.test_activity.customer_report" },
  ];

  await prisma.rolePermission.createMany({
    data: salesRepConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: salesRepRole.id,
        permissionId: p(item.key)!,
        allow: true,
        dataAccess: (item.dataAccess as DataAccessLevel) ?? null,
        editAccess: (item.editAccess as EditAccessLevel) ?? null,
        deleteAccess: (item.deleteAccess as DeleteAccessLevel) ?? null,
      })),
  });

  // ──────────────────────────────────────────────────────────────
  // Sales Manager (ผู้จัดการฝ่ายขาย) Permissions
  // ──────────────────────────────────────────────────────────────

  const salesManagerConfig = [
    { key: "menu.products" },
    { key: "product.view", dataAccess: "VIEW_ALL" },
    { key: "menu.sales" },
    { key: "sale.create" },
    { key: "sale.edit" },
    { key: "sale.delete" },
    { key: "sale.view" },
    { key: "sale.approve" },
    { key: "menu.customers" },
    { key: "customer.create.dealer" },
    { key: "customer.create.subdealer" },
    { key: "customer.create.farmer" },
    { key: "customer.create.broker" },
    { key: "customer.edit.dealer" },
    { key: "customer.edit.subdealer" },
    { key: "customer.edit.farmer" },
    { key: "customer.edit.broker" },
    { key: "customer.view.dealer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.subdealer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.farmer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.broker", dataAccess: "VIEW_ALL" },
    { key: "menu.credit_limits" },
    { key: "creditlimit.edit" },
    // DATA permission - can view department but only edit/delete own
    {
      key: "data.sales",
      dataAccess: "VIEW_TEAM",
      editAccess: "EDIT_OWN",
      deleteAccess: "DELETE_OWN",
    },
    { key: "menu.reports" },
    { key: "report.time_sales" },
    { key: "report.product_sales" },
    { key: "report.customer_sales" },
    { key: "report.salesperson" },
    { key: "report.sales_forecast" },
    { key: "report.executive_dashboard" },
    { key: "menu.temporary_credit_limits" },
    { key: "temporary_creditlimit.create" },
    { key: "menu.dashboard.manager" },
    { key: "menu.dashboard.sales" },
    { key: "temporary_creditlimit.edit" },
    { key: "temporary_creditlimit.view" },
    { key: "temporary_creditlimit.delete" },
    { key: "temporary_creditlimit.approve" },
    { key: "stock.view" },
    { key: "sales_target.view" },
    {
      key: "data.customers",
      dataAccess: "VIEW_DEPARTMENT",
      editAccess: "EDIT_OWN",
      deleteAccess: "DELETE_OWN",
    },
    { key: "report.product_group_sales" },
    { key: "menu.sales_forecast" },
    { key: "menu.sales_targets" },
    {
      key: "data.sales_targets",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    { key: "sales_target.delete" },
    { key: "sales_target.edit" },
    { key: "sales_target.create" },
    { key: "menu.test_activity" },
    { key: "menu.test_activity.trip_plan" },
    { key: "menu.test_activity.activity_report" },
    { key: "menu.test_activity.budget_report" },
    { key: "menu.test_activity.customer_report" },
  ];

  await prisma.rolePermission.createMany({
    data: salesManagerConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: salesManagerRole.id,
        permissionId: p(item.key)!,
        allow: true,
        dataAccess: (item.dataAccess as DataAccessLevel) ?? null,
        editAccess: (item.editAccess as EditAccessLevel) ?? null,
        deleteAccess: (item.deleteAccess as DeleteAccessLevel) ?? null,
      })),
  });

  // ──────────────────────────────────────────────────────────────
  // Admin (Secondary) Permissions
  // ──────────────────────────────────────────────────────────────

  const adminConfig = [
    { key: "menu.dashboard.admin" },
    { key: "menu.dashboard.manager" },
    { key: "menu.dashboard.sales" },
    { key: "menu.show_product" },
    { key: "data.reports", dataAccess: DataAccessLevel.VIEW_ALL },
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
    { key: "report.sales_forecast" },
    { key: "report.executive_dashboard" },
    // Sale permissions
    { key: "sale.create" },
    { key: "sale.edit" },
    { key: "sale.view" },
    { key: "sale.delete" },
    { key: "sale.approve" },
    { key: "sale.confirm-payment" },
    // Product permissions
    { key: "product.create" },
    { key: "product.edit" },
    { key: "product.delete" },
    { key: "product.view" },
    { key: "product.manage" },
    // Customer permissions
    { key: "customer.create.dealer" },
    { key: "customer.create.subdealer" },
    { key: "customer.create.farmer" },
    { key: "customer.create.broker" },
    { key: "customer.edit.dealer" },
    { key: "customer.edit.subdealer" },
    { key: "customer.edit.farmer" },
    { key: "customer.edit.broker" },
    { key: "customer.delete.dealer" },
    { key: "customer.delete.subdealer" },
    { key: "customer.delete.farmer" },
    { key: "customer.delete.broker" },
    { key: "customer.view.dealer" },
    { key: "customer.view.subdealer" },
    { key: "customer.view.farmer" },
    { key: "customer.view.broker" },
    // Credit limit permissions
    { key: "creditlimit.edit" },
    // Temporary credit limit permissions
    { key: "temporary_creditlimit.create" },
    { key: "temporary_creditlimit.edit" },
    { key: "temporary_creditlimit.delete" },
    { key: "temporary_creditlimit.view" },
    { key: "temporary_creditlimit.approve" },
    // Company permissions
    { key: "company.create" },
    { key: "company.edit" },
    { key: "company.delete" },
    // Employee permissions
    { key: "employee.view", dataAccess: "VIEW_ALL" },
    // Data scope permissions - Admin can view/edit/delete all

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
    { key: "menu.notifications" },
    { key: "report.export" },
    { key: "product.export" },
    { key: "customer.export" },
    { key: "employee.create" },
    { key: "employee.delete" },
    { key: "company.view" },
    { key: "sales_target.view" },
    { key: "sales_target.create" },
    { key: "sales_target.edit" },
    { key: "sales_target.delete" },
    { key: "stock.view" },
    { key: "stock.adjust" },
    { key: "stock.lot.manage" },
    { key: "system.audit_log" },
    { key: "system.security_log" },
    { key: "menu.announcements" },
    { key: "announcement.manage" },

    {
      key: "data.sales_targets",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    { key: "menu.test_activity" },
    { key: "menu.test_activity.trip_plan" },
    { key: "menu.test_activity.activity_report" },
    { key: "menu.test_activity.budget_report" },
    { key: "menu.test_activity.customer_report" },
    // Note: rbac.manage, menu.rbac, menu.admin, system.settings are excluded to differentiate from Administrator
  ];

  await prisma.rolePermission.createMany({
    data: adminConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: adminRoleSecondary.id,
        permissionId: p(item.key)!,
        allow: true,
        dataAccess: (item.dataAccess as DataAccessLevel) ?? null,
        editAccess: (item.editAccess as EditAccessLevel) ?? null,
        deleteAccess: (item.deleteAccess as DeleteAccessLevel) ?? null,
      })),
  });

  // ──────────────────────────────────────────────────────────────
  // CEO (ผู้บริหาร) Permissions - Read-only Executive Access
  // ──────────────────────────────────────────────────────────────

  const ceoConfig = [
    // Menu permissions - access to view all areas
    { key: "menu.dashboard.admin" },
    { key: "menu.reports" },
    { key: "menu.sales" },
    { key: "menu.products" },
    { key: "menu.customers" },
    { key: "menu.employees" },
    { key: "menu.companies" },
    { key: "menu.credit_limits" },
    { key: "menu.temporary_credit_limits" },
    { key: "menu.fulfillment" },
    { key: "menu.sales_forecast" },
    { key: "menu.sales_targets" },
    { key: "menu.notifications" },
    // Report permissions - view all reports
    { key: "report.time_sales" },
    { key: "report.product_sales" },
    { key: "report.product_group_sales" },
    { key: "report.customer_sales" },
    { key: "report.salesperson" },
    { key: "report.sales_forecast" },
    { key: "report.executive_dashboard" },
    { key: "report.export" },
    // View permissions - read-only access
    { key: "sale.view", dataAccess: "VIEW_ALL" },
    { key: "product.view", dataAccess: "VIEW_ALL" },
    { key: "customer.view.dealer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.subdealer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.farmer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.broker", dataAccess: "VIEW_ALL" },
    { key: "temporary_creditlimit.view", dataAccess: "VIEW_ALL" },
    { key: "employee.view", dataAccess: "VIEW_ALL" },
    { key: "company.view", dataAccess: "VIEW_ALL" },
    { key: "sales_target.view", dataAccess: "VIEW_ALL" },
    { key: "stock.view", dataAccess: "VIEW_ALL" },
    { key: "system.audit_log" },
    { key: "system.security_log" },

    {
      key: "data.employees",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_NONE",
      deleteAccess: "DELETE_NONE",
    },
    {
      key: "data.customers",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_NONE",
      deleteAccess: "DELETE_NONE",
    },
    {
      key: "data.creditlimits",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_NONE",
      deleteAccess: "DELETE_NONE",
    },
    {
      key: "data.temporary_creditlimits",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_NONE",
      deleteAccess: "DELETE_NONE",
    },
    {
      key: "data.sales",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_NONE",
      deleteAccess: "DELETE_NONE",
    },

    {
      key: "data.sales_targets",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_NONE",
      deleteAccess: "DELETE_NONE",
    },
    { key: "menu.test_activity" },
    { key: "menu.test_activity.trip_plan" },
    { key: "menu.test_activity.activity_report" },
    { key: "menu.test_activity.budget_report" },
    { key: "menu.test_activity.customer_report" },
  ];

  await prisma.rolePermission.createMany({
    data: ceoConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: ceoRole.id,
        permissionId: p(item.key)!,
        allow: true,
        dataAccess: (item.dataAccess as DataAccessLevel) ?? null,
        editAccess: (item.editAccess as EditAccessLevel) ?? null,
        deleteAccess: (item.deleteAccess as DeleteAccessLevel) ?? null,
      })),
  });

  // ──────────────────────────────────────────────────────────────
  // Sales Admin (ธุรการขาย) Permissions - Fulfillment management
  // ──────────────────────────────────────────────────────────────

  const salesAdminConfig = [
    // Menu permissions
    { key: "menu.sales" },
    { key: "menu.fulfillment" },
    { key: "menu.customers" },
    { key: "menu.products" },
    // Sale permissions - view and manage fulfillment
    {
      key: "sale.create",
    },
    { key: "sale.view", dataAccess: "VIEW_ALL" },
    // Product permissions - view only
    { key: "product.view", dataAccess: "VIEW_ALL" },
    { key: "product.create" },
    { key: "product.edit" },
    { key: "product.delete" },
    { key: "product.manage" },
    // Customer permissions - view only
    { key: "customer.view.dealer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.subdealer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.farmer", dataAccess: "VIEW_ALL" },
    { key: "customer.view.broker", dataAccess: "VIEW_ALL" },
    // Stock permissions
    { key: "stock.view" },
    { key: "customer.create.dealer" },
    { key: "customer.create.subdealer" },
    { key: "customer.create.farmer" },
    { key: "customer.create.broker" },
    { key: "customer.edit.dealer" },
    { key: "customer.edit.subdealer" },
    { key: "customer.edit.farmer" },
    { key: "customer.edit.broker" },
    { key: "customer.delete.dealer" },
    { key: "customer.delete.subdealer" },
    { key: "customer.delete.farmer" },
    { key: "customer.delete.broker" },
    { key: "menu.temporary_credit_limits" },
    { key: "temporary_creditlimit.create" },
    { key: "temporary_creditlimit.edit" },
    { key: "temporary_creditlimit.view" },
    { key: "temporary_creditlimit.delete" },
    { key: "menu.credit_limits" },
    { key: "creditlimit.edit" },
    // DATA permissions
    {
      key: "data.sales",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_OWN",
      deleteAccess: "DELETE_OWN",
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
      key: "data.stock",
      dataAccess: "VIEW_ALL",
      editAccess: "EDIT_ALL",
      deleteAccess: "DELETE_ALL",
    },
    { key: "menu.show_product" },
    { key: "menu.test_activity" },
    { key: "menu.test_activity.trip_plan" },
    { key: "menu.test_activity.activity_report" },
    { key: "menu.test_activity.budget_report" },
    { key: "menu.test_activity.customer_report" },
  ];

  await prisma.rolePermission.createMany({
    data: salesAdminConfig
      .filter((item) => p(item.key))
      .map((item) => ({
        roleId: salesAdminRole.id,
        permissionId: p(item.key)!,
        allow: true,
        dataAccess: (item.dataAccess as DataAccessLevel) ?? null,
        editAccess: (item.editAccess as EditAccessLevel) ?? null,
        deleteAccess: (item.deleteAccess as DeleteAccessLevel) ?? null,
      })),
  });

  console.log("✅ RBAC seeded.");
}
