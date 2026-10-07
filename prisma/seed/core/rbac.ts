import {
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@prisma/client";

// ============================================================================
// Permission Groups - Hierarchical Structure
// แต่ละโมดูลจะมี menu, actions, data แยกชัดเจน (Sync ตรงกับ Production Database 100%)
// ============================================================================

type PermissionDef = {
  key: string;
  name: string;
  resource: string;
  category?: "MENU" | "ACTION" | "DATA";
  menuPath?: string | null;
  action?: string | null;
  defaultDataAccess?: DataAccessLevel | null;
  defaultEditAccess?: EditAccessLevel | null;
  defaultDeleteAccess?: DeleteAccessLevel | null;
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
      {
        key: "menu.show_product.edit",
        name: "จัดการรูปสินค้าหน้าแรก",
        resource: "",
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
        defaultDataAccess: DataAccessLevel.VIEW_ALL,
      },
    ],
    actions: [
      {
        key: "report.export",
        name: "ส่งออกรายงาน",
        resource: "report",
        action: "export",
      },
      {
        key: "report.kpi.total_sales",
        name: "ดู KpiCard ยอดขาย",
        resource: "report",
        action: "view",
      },
      {
        key: "report.kpi.invoice",
        name: "ดู KpiCard ผลรวม Invoice",
        resource: "report",
        action: "view",
      },
      {
        key: "report.kpi.sales_note",
        name: "ดู KpiCard ผลรวม Sales Note",
        resource: "report",
        action: "view",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 💰 Sales & Sales Targets (การขายและเป้าหมาย)
  // ─────────────────────────────────────────────
  sales: {
    data: {
        key: "data.sales",
        name: "ขอบเขตข้อมูลการขาย",
        resource: "sale",
        defaultDataAccess: DataAccessLevel.VIEW_OWN,
        defaultEditAccess: EditAccessLevel.EDIT_OWN,
        defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
      },
    subMenus: [
      {
        key: "menu.sales_forecast",
        name: "เมนูการคาดการณ์ยอดขาย",
        resource: "sales_forecast",
        menuPath: "/sales-forecast",
      },
      {
        key: "menu.sales_targets",
        name: "เมนูตั้งเป้าหมายยอดขาย",
        resource: "sales_target",
        menuPath: "/sales-targets",
      },
    ],
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
        key: "sale.delete",
        name: "ลบใบขาย",
        resource: "sale",
        action: "delete",
      },
      {
        key: "sale.view",
        name: "ดูรายละเอียดใบขาย",
        resource: "sale",
        action: "view",
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
        key: "sales_target.view",
        name: "ดูเป้าหมายยอดขาย",
        resource: "sales_target",
        action: "view",
      },
      {
        key: "sales_target.delete",
        name: "ลบเป้าหมายยอดขาย",
        resource: "sales_target",
        action: "delete",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 🎯 Sales Target Data Scope
  // ─────────────────────────────────────────────
  salesTargetData: {
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
  // 📦 Fulfillment (การจัดส่ง)
  // ─────────────────────────────────────────────
  fulfillment: {
    menu: {
        key: "menu.fulfillment",
        name: "เมนูจัดส่งสินค้า",
        resource: "fulfillment",
        menuPath: "/fulfillment",
      },
    actions: [
    ],
  },

  // ─────────────────────────────────────────────
  // 🧴 Products & Stock (สินค้าและสต็อก)
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
        key: "product.export",
        name: "ส่งออกสินค้า",
        resource: "product",
        action: "export",
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
        key: "product.approve",
        name: "อนุมัติสินค้า",
        resource: "product",
      },
      {
        key: "product.copy",
        name: "คัดลอกสินค้า",
        resource: "product",
        menuPath: "product/copy",
        defaultDataAccess: DataAccessLevel.VIEW_ALL,
      },
      {
        key: "stock.lot.manage",
        name: "เพิ่มสต็อก",
        resource: "product",
        menuPath: "/products",
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
    data: {
        key: "data.customers",
        name: "ขอบเขตข้อมูลลูกค้า",
        resource: "customer",
        defaultDataAccess: DataAccessLevel.VIEW_OWN,
        defaultEditAccess: EditAccessLevel.EDIT_OWN,
        defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
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
    data: {
        key: "data.creditlimits",
        name: "ขอบเขตข้อมูลวงเงินเครดิต",
        resource: "creditlimit",
        defaultDataAccess: DataAccessLevel.VIEW_OWN,
        defaultEditAccess: EditAccessLevel.EDIT_OWN,
        defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
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
  },

  // ─────────────────────────────────────────────
  // ⏱️ Temporary Credit Limits (วงเงินชั่วคราว)
  // ─────────────────────────────────────────────
  temporaryCreditLimits: {
    menu: {
        key: "menu.temporary_credit_limits",
        name: "เมนูวงเงินเครดิตชั่วคราว",
        resource: "temporary_creditlimit",
        menuPath: "/temporary-credit-limits",
      },
    data: {
        key: "data.temporary_creditlimits",
        name: "ขอบเขตข้อมูลวงเงินเครดิตชั่วคราว",
        resource: "temporary_creditlimit",
        defaultDataAccess: DataAccessLevel.VIEW_OWN,
        defaultEditAccess: EditAccessLevel.EDIT_OWN,
        defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
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
  },

  // ─────────────────────────────────────────────
  // 🚚 Shipping Companies (บริษัทขนส่ง)
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

  // ─────────────────────────────────────────────
  // 👔 Employees (พนักงาน)
  // ─────────────────────────────────────────────
  employees: {
    menu: {
        key: "menu.employees",
        name: "เมนูพนักงาน",
        resource: "employee",
        menuPath: "/employee",
      },
    data: {
        key: "data.employees",
        name: "ขอบเขตข้อมูลพนักงาน",
        resource: "employee",
        defaultDataAccess: DataAccessLevel.VIEW_OWN,
        defaultEditAccess: EditAccessLevel.EDIT_OWN,
        defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
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
      {
        key: "company.view",
        name: "ดูรายละเอียดบริษัท",
        resource: "company",
        action: "view",
      },
    ],
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
        key: "rbac.permission.assign",
        name: "กำหนด Permission ให้ Role",
        resource: "rbac",
        action: "permission_assign",
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
  // ⚙️ System (ระบบ)
  // ─────────────────────────────────────────────
  system: {
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
  // 📤 Exports (ส่งออกข้อมูล)
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
  // 📋 Activity Plans (แผนงานกิจกรรม / Trip Plan)
  // ─────────────────────────────────────────────
  activityPlans: {
    menu: {
      key: "menu.activity_plans",
      name: "เมนูแผนงาน (Trip Plan)",
      resource: "activity_plan",
      menuPath: "/activity-plans",
    },
    actions: [
      {
        key: "activity.view",
        name: "ดูรายละเอียดแผนงาน",
        resource: "activity_plan",
        action: "view",
      },
      {
        key: "activity.create",
        name: "สร้างแผนงาน",
        resource: "activity_plan",
        action: "create",
      },
      {
        key: "activity.edit",
        name: "แก้ไขแผนงาน",
        resource: "activity_plan",
        action: "edit",
      },
      {
        key: "activity.delete",
        name: "ลบแผนงาน",
        resource: "activity_plan",
        action: "delete",
      },
      {
        key: "activity.approve",
        name: "อนุมัติแผนงาน",
        resource: "activity_plan",
        action: "approve",
      },
      {
        key: "activity.manage",
        name: "จัดการแผนงานทั้งหมด (ผู้ดูแล)",
        resource: "activity_plan",
        action: "manage",
      },
    ],
    data: {
      key: "data.activity_plans",
      name: "ขอบเขตข้อมูลแผนงาน",
      resource: "activity_plan",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_OWN,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
    },
  },

  // ─────────────────────────────────────────────
  // 🎁 Promotional Materials (สื่อส่งเสริมการขาย)
  // ─────────────────────────────────────────────
  promotionalMaterials: {
    menu: {
      key: "menu.promotional_materials",
      name: "เมนูสื่อส่งเสริมการขาย",
      resource: "promotional_material",
      menuPath: "/activity-plans/promotional-materials",
    },
    actions: [
      {
        key: "promotional_material.view",
        name: "ดูสื่อส่งเสริมการขาย",
        resource: "promotional_material",
        action: "view",
      },
      {
        key: "promotional_material.create",
        name: "สร้างสื่อส่งเสริมการขาย",
        resource: "promotional_material",
        action: "create",
      },
      {
        key: "promotional_material.edit",
        name: "แก้ไขสื่อส่งเสริมการขาย",
        resource: "promotional_material",
        action: "edit",
      },
      {
        key: "promotional_material.delete",
        name: "ลบสื่อส่งเสริมการขาย",
        resource: "promotional_material",
        action: "delete",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 🧪 Test Activity (เมนูทดสอบกิจกรรม)
  // ─────────────────────────────────────────────
  testActivity: {
    menu: {
        key: "menu.test_activity",
        name: "เมนูทดสอบกิจกรรม",
        resource: "test_activity",
        menuPath: "/test-activity",
      },
    subMenus: [
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
      {
        key: "menu.test_activity.reports",
        name: "รายงานกิจกรรม",
        resource: "test_activity",
        menuPath: "/test-activity/reports",
      },
    ],
  },
};

// Flatten helper
function flattenPermissionGroups(
  groups: Record<string, PermissionGroup>,
): Array<{
  key: string;
  name: string;
  category: "MENU" | "ACTION" | "DATA";
  resource: string;
  action?: string | null;
  menuPath?: string | null;
  defaultDataAccess?: DataAccessLevel | null;
  defaultEditAccess?: EditAccessLevel | null;
  defaultDeleteAccess?: DeleteAccessLevel | null;
}> {
  const result: Array<{
    key: string;
    name: string;
    category: "MENU" | "ACTION" | "DATA";
    resource: string;
    action?: string | null;
    menuPath?: string | null;
    defaultDataAccess?: DataAccessLevel | null;
    defaultEditAccess?: EditAccessLevel | null;
    defaultDeleteAccess?: DeleteAccessLevel | null;
  }> = [];

  const seen = new Set<string>();

  for (const group of Object.values(groups)) {
    // Menu permission
    if (group.menu && !seen.has(group.menu.key)) {
      seen.add(group.menu.key);
      result.push({
        key: group.menu.key,
        name: group.menu.name,
        category: "MENU",
        resource: group.menu.resource,
        menuPath: group.menu.menuPath ?? null,
        action: group.menu.action ?? null,
        defaultDataAccess: group.menu.defaultDataAccess ?? null,
        defaultEditAccess: group.menu.defaultEditAccess ?? null,
        defaultDeleteAccess: group.menu.defaultDeleteAccess ?? null,
      });
    }

    // Sub-menu permissions
    if (group.subMenus) {
      for (const sub of group.subMenus) {
        if (!seen.has(sub.key)) {
          seen.add(sub.key);
          result.push({
            key: sub.key,
            name: sub.name,
            category: "MENU",
            resource: sub.resource,
            menuPath: sub.menuPath ?? null,
            action: sub.action ?? null,
            defaultDataAccess: sub.defaultDataAccess ?? null,
            defaultEditAccess: sub.defaultEditAccess ?? null,
            defaultDeleteAccess: sub.defaultDeleteAccess ?? null,
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
            action: act.action ?? null,
            menuPath: act.menuPath ?? null,
            defaultDataAccess: act.defaultDataAccess ?? null,
            defaultEditAccess: act.defaultEditAccess ?? null,
            defaultDeleteAccess: act.defaultDeleteAccess ?? null,
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
        menuPath: group.data.menuPath ?? null,
        action: group.data.action ?? null,
        defaultDataAccess: group.data.defaultDataAccess ?? null,
        defaultEditAccess: group.data.defaultEditAccess ?? null,
        defaultDeleteAccess: group.data.defaultDeleteAccess ?? null,
      });
    }
  }

  return result;
}

// ============================================================================
// Role Configs (Mapping ตรงกับ Production Database 100%)
// ============================================================================

type RolePermItem = {
  key: string;
  dataAccess?: DataAccessLevel | null;
  editAccess?: EditAccessLevel | null;
  deleteAccess?: DeleteAccessLevel | null;
};

// 1. Admin (Secondary) Permissions - 85 permissions in DB
const adminConfig: RolePermItem[] = [
  { key: "announcement.manage" },
  { key: "company.create" },
  { key: "company.delete" },
  { key: "company.edit" },
  { key: "company.view" },
  { key: "creditlimit.edit" },
  { key: "customer.create.broker" },
  { key: "customer.create.dealer" },
  { key: "customer.create.farmer" },
  { key: "customer.create.subdealer" },
  { key: "customer.delete.broker" },
  { key: "customer.delete.dealer" },
  { key: "customer.delete.farmer" },
  { key: "customer.delete.subdealer" },
  { key: "customer.edit.broker" },
  { key: "customer.edit.dealer" },
  { key: "customer.edit.farmer" },
  { key: "customer.edit.subdealer" },
  { key: "customer.export" },
  { key: "customer.view.broker" },
  { key: "customer.view.dealer" },
  { key: "customer.view.farmer" },
  { key: "customer.view.subdealer" },
  { key: "data.creditlimits", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.customers", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.employees", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.reports", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "data.sales", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.sales_targets", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.temporary_creditlimits", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "employee.create" },
  { key: "employee.delete" },
  { key: "employee.edit" },
  { key: "employee.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "export.sales_admin" },
  { key: "menu.announcements" },
  { key: "menu.companies" },
  { key: "menu.credit_limits" },
  { key: "menu.customers" },
  { key: "menu.dashboard.admin" },
  { key: "menu.dashboard.manager" },
  { key: "menu.employees" },
  { key: "menu.exports" },
  { key: "menu.fulfillment" },
  { key: "menu.products" },
  { key: "menu.reports" },
  { key: "menu.sales" },
  { key: "menu.sales_forecast" },
  { key: "menu.sales_targets" },
  { key: "menu.shipping-companies" },
  { key: "menu.show_product" },
  { key: "menu.temporary_credit_limits" },
  { key: "product.create" },
  { key: "product.delete" },
  { key: "product.edit" },
  { key: "product.export" },
  { key: "product.manage" },
  { key: "product.view" },
  { key: "report.customer_sales" },
  { key: "report.executive_dashboard" },
  { key: "report.export" },
  { key: "report.product_group_sales" },
  { key: "report.product_sales" },
  { key: "report.salesperson" },
  { key: "sale.approve" },
  { key: "sale.confirm-payment" },
  { key: "sale.create" },
  { key: "sale.delete" },
  { key: "sale.edit" },
  { key: "sales_target.create" },
  { key: "sales_target.delete" },
  { key: "sales_target.edit" },
  { key: "sales_target.view" },
  { key: "sale.view" },
  { key: "shipping-company.create" },
  { key: "shipping-company.delete" },
  { key: "shipping-company.edit" },
  { key: "stock.lot.manage" },
  { key: "system.audit_log" },
  { key: "system.security_log" },
  { key: "temporary_creditlimit.approve" },
  { key: "temporary_creditlimit.create" },
  { key: "temporary_creditlimit.delete" },
  { key: "temporary_creditlimit.edit" },
  { key: "temporary_creditlimit.view" },
];

// 2. Administrator Permissions - 110 permissions in DB
const administratorConfig: RolePermItem[] = [
  { key: "announcement.manage" },
  { key: "company.create", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "company.delete", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "company.edit", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "company.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "creditlimit.create", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "creditlimit.edit", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.create.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.create.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.create.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.create.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.delete.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.delete.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.delete.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.delete.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.edit.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.edit.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.edit.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.edit.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.export", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "data.creditlimits", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.customers", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.employees", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.reports", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.sales", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.sales_targets", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.temporary_creditlimits", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "employee.create", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "employee.delete", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "employee.edit", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "employee.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "export.sales_admin", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.admin", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.announcements" },
  { key: "menu.companies", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.credit_limits", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.customers", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.dashboard.admin", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.dashboard.manager", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.dashboard.sales" },
  { key: "menu.employees", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.exports", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.fulfillment", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.products", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.rbac", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.reports", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.sales", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.sales_forecast", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.sales_targets", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.shipping-companies", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.show_product", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.show_product.edit" },
  { key: "menu.temporary_credit_limits", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.test_activity", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.test_activity.activity_report", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.test_activity.budget_report", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.test_activity.customer_report", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.test_activity.reports", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.test_activity.trip_plan", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "product.approve" },
  { key: "product.copy" },
  { key: "product.create", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "product.delete", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "product.edit", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "product.export", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "product.manage", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "product.stock.view" },
  { key: "product.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "rbac.manage", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "rbac.permission.assign", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "rbac.role.create", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "rbac.role.delete", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "rbac.role.edit", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "rbac.user.override", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.customer_sales", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.executive_dashboard" },
  { key: "report.export", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.kpi.invoice", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.kpi.sales_note", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.kpi.total_sales", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.product_group_sales", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.product_sales", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.sales_forecast" },
  { key: "report.salesperson", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sale.approve", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sale.confirm-payment", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sale.create", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sale.delete", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sale.edit", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sales_target.create", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sales_target.delete", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sales_target.edit", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sales_target.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sale.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "shipping-company.create", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "shipping-company.delete", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "shipping-company.edit", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "stock.lot.manage" },
  { key: "system.audit_log", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "system.security_log", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "system.settings", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "temporary_creditlimit.approve", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "temporary_creditlimit.create", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "temporary_creditlimit.delete", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "temporary_creditlimit.edit", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "temporary_creditlimit.view", dataAccess: DataAccessLevel.VIEW_ALL },
];

// 3. CEO (ผู้บริหาร) Permissions - 38 permissions in DB
const ceoConfig: RolePermItem[] = [
  { key: "company.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "data.creditlimits", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_NONE, deleteAccess: DeleteAccessLevel.DELETE_NONE },
  { key: "data.customers", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_NONE, deleteAccess: DeleteAccessLevel.DELETE_NONE },
  { key: "data.employees", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_NONE, deleteAccess: DeleteAccessLevel.DELETE_NONE },
  { key: "data.sales", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_NONE, deleteAccess: DeleteAccessLevel.DELETE_NONE },
  { key: "data.sales_targets", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_NONE, deleteAccess: DeleteAccessLevel.DELETE_NONE },
  { key: "data.temporary_creditlimits", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_NONE, deleteAccess: DeleteAccessLevel.DELETE_NONE },
  { key: "employee.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.companies" },
  { key: "menu.credit_limits" },
  { key: "menu.customers" },
  { key: "menu.dashboard.admin" },
  { key: "menu.employees" },
  { key: "menu.fulfillment" },
  { key: "menu.products" },
  { key: "menu.reports" },
  { key: "menu.sales" },
  { key: "menu.sales_forecast" },
  { key: "menu.sales_targets" },
  { key: "menu.temporary_credit_limits" },
  { key: "product.stock.view" },
  { key: "product.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.customer_sales" },
  { key: "report.executive_dashboard" },
  { key: "report.export" },
  { key: "report.product_group_sales" },
  { key: "report.product_sales" },
  { key: "report.sales_forecast" },
  { key: "report.salesperson" },
  { key: "sales_target.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "sale.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "system.audit_log" },
  { key: "system.security_log" },
  { key: "temporary_creditlimit.view", dataAccess: DataAccessLevel.VIEW_ALL },
];

// 4. Marketing Employee (พนักงานการตลาด) Permissions - 6 permissions in DB
const employeeMkConfig: RolePermItem[] = [
  { key: "menu.products" },
  { key: "product.create" },
  { key: "product.delete" },
  { key: "product.edit" },
  { key: "product.export" },
  { key: "product.view" },
];

// 5. Marketing Manager (ผู้จัดการแผนกการตลาด) Permissions - 39 permissions in DB
const marketingManagerConfig: RolePermItem[] = [
  { key: "announcement.manage" },
  { key: "company.view" },
  { key: "customer.create.farmer" },
  { key: "customer.edit.broker" },
  { key: "customer.edit.farmer" },
  { key: "customer.edit.subdealer" },
  { key: "customer.view.broker" },
  { key: "customer.view.dealer" },
  { key: "customer.view.farmer" },
  { key: "customer.view.subdealer" },
  { key: "data.customers", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "data.reports", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "data.sales", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "data.sales_targets", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "employee.view" },
  { key: "export.sales_admin" },
  { key: "menu.announcements" },
  { key: "menu.companies" },
  { key: "menu.customers" },
  { key: "menu.dashboard.manager" },
  { key: "menu.employees" },
  { key: "menu.exports" },
  { key: "menu.products" },
  { key: "menu.reports" },
  { key: "menu.sales" },
  { key: "menu.sales_forecast" },
  { key: "menu.sales_targets" },
  { key: "menu.show_product" },
  { key: "product.edit" },
  { key: "product.stock.view" },
  { key: "product.view" },
  { key: "report.customer_sales" },
  { key: "report.executive_dashboard" },
  { key: "report.product_group_sales" },
  { key: "report.product_sales" },
  { key: "report.sales_forecast" },
  { key: "report.salesperson" },
  { key: "sales_target.view" },
  { key: "sale.view" },
];

// 6. Sales Admin (ธุรการขาย) Permissions - 65 permissions in DB
const salesAdminConfig: RolePermItem[] = [
  { key: "creditlimit.create" },
  { key: "creditlimit.edit" },
  { key: "customer.create.broker" },
  { key: "customer.create.dealer" },
  { key: "customer.create.farmer" },
  { key: "customer.create.subdealer" },
  { key: "customer.delete.broker" },
  { key: "customer.delete.dealer" },
  { key: "customer.delete.farmer" },
  { key: "customer.delete.subdealer" },
  { key: "customer.edit.broker" },
  { key: "customer.edit.dealer" },
  { key: "customer.edit.farmer" },
  { key: "customer.edit.subdealer" },
  { key: "customer.view.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "data.creditlimits", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.customers", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.sales", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.sales_targets", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "data.temporary_creditlimits", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "export.sales_admin" },
  { key: "menu.credit_limits" },
  { key: "menu.customers" },
  { key: "menu.exports" },
  { key: "menu.fulfillment" },
  { key: "menu.products" },
  { key: "menu.reports" },
  { key: "menu.sales" },
  { key: "menu.shipping-companies" },
  { key: "menu.temporary_credit_limits" },
  { key: "product.copy" },
  { key: "product.create" },
  { key: "product.delete" },
  { key: "product.edit" },
  { key: "product.export" },
  { key: "product.manage" },
  { key: "product.stock.view" },
  { key: "product.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.customer_sales" },
  { key: "report.executive_dashboard" },
  { key: "report.kpi.invoice" },
  { key: "report.kpi.sales_note" },
  { key: "report.kpi.total_sales" },
  { key: "report.product_group_sales" },
  { key: "report.product_sales" },
  { key: "report.sales_forecast" },
  { key: "report.salesperson" },
  { key: "sale.create" },
  { key: "sale.edit" },
  { key: "sales_target.create" },
  { key: "sales_target.delete" },
  { key: "sales_target.edit" },
  { key: "sales_target.view" },
  { key: "sale.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "shipping-company.create" },
  { key: "shipping-company.delete" },
  { key: "shipping-company.edit" },
  { key: "stock.lot.manage" },
  { key: "temporary_creditlimit.create" },
  { key: "temporary_creditlimit.delete" },
  { key: "temporary_creditlimit.edit" },
  { key: "temporary_creditlimit.view" },
];

// 7. Sales Employee (พนักงานฝ่ายขาย) Permissions - 42 permissions in DB
const salesEmployeeConfig: RolePermItem[] = [
  { key: "customer.create.broker" },
  { key: "customer.create.farmer" },
  { key: "customer.create.subdealer" },
  { key: "customer.edit.broker" },
  { key: "customer.edit.farmer" },
  { key: "customer.edit.subdealer" },
  { key: "customer.view.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "data.customers", dataAccess: DataAccessLevel.VIEW_OWN, editAccess: EditAccessLevel.EDIT_OWN, deleteAccess: DeleteAccessLevel.DELETE_NONE },
  { key: "data.reports" },
  { key: "data.sales", dataAccess: DataAccessLevel.VIEW_OWN, editAccess: EditAccessLevel.EDIT_OWN, deleteAccess: DeleteAccessLevel.DELETE_OWN },
  { key: "data.sales_targets", dataAccess: DataAccessLevel.VIEW_OWN, editAccess: EditAccessLevel.EDIT_OWN, deleteAccess: DeleteAccessLevel.DELETE_OWN },
  { key: "data.temporary_creditlimits", dataAccess: DataAccessLevel.VIEW_OWN, editAccess: EditAccessLevel.EDIT_OWN, deleteAccess: DeleteAccessLevel.DELETE_OWN },
  { key: "employee.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.customers" },
  { key: "menu.dashboard.sales" },
  { key: "menu.products" },
  { key: "menu.reports" },
  { key: "menu.sales" },
  { key: "menu.sales_targets" },
  { key: "menu.temporary_credit_limits" },
  { key: "product.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.customer_sales" },
  { key: "report.kpi.invoice" },
  { key: "report.kpi.sales_note" },
  { key: "report.product_group_sales" },
  { key: "report.product_sales" },
  { key: "report.salesperson" },
  { key: "sale.create" },
  { key: "sale.delete" },
  { key: "sale.edit" },
  { key: "sales_target.create" },
  { key: "sales_target.delete" },
  { key: "sales_target.edit" },
  { key: "sales_target.view" },
  { key: "sale.view" },
  { key: "temporary_creditlimit.create" },
  { key: "temporary_creditlimit.delete" },
  { key: "temporary_creditlimit.edit" },
  { key: "temporary_creditlimit.view" },
];

// 8. Sales Manager (ผู้จัดการแผนกบริหารงานขาย) Permissions - 45 permissions in DB
const salesManagerConfig: RolePermItem[] = [
  { key: "creditlimit.edit" },
  { key: "customer.create.broker" },
  { key: "customer.create.dealer" },
  { key: "customer.create.farmer" },
  { key: "customer.create.subdealer" },
  { key: "customer.edit.broker" },
  { key: "customer.edit.dealer" },
  { key: "customer.edit.farmer" },
  { key: "customer.edit.subdealer" },
  { key: "customer.view.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "data.customers", dataAccess: DataAccessLevel.VIEW_DEPARTMENT, editAccess: EditAccessLevel.EDIT_OWN, deleteAccess: DeleteAccessLevel.DELETE_OWN },
  { key: "data.sales", dataAccess: DataAccessLevel.VIEW_TEAM, editAccess: EditAccessLevel.EDIT_OWN, deleteAccess: DeleteAccessLevel.DELETE_OWN },
  { key: "data.sales_targets", dataAccess: DataAccessLevel.VIEW_ALL, editAccess: EditAccessLevel.EDIT_ALL, deleteAccess: DeleteAccessLevel.DELETE_ALL },
  { key: "menu.customers" },
  { key: "menu.dashboard.manager" },
  { key: "menu.products" },
  { key: "menu.reports" },
  { key: "menu.sales" },
  { key: "menu.sales_forecast" },
  { key: "menu.sales_targets" },
  { key: "menu.temporary_credit_limits" },
  { key: "product.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "report.customer_sales" },
  { key: "report.executive_dashboard" },
  { key: "report.product_group_sales" },
  { key: "report.product_sales" },
  { key: "report.sales_forecast" },
  { key: "report.salesperson" },
  { key: "sale.approve" },
  { key: "sale.create" },
  { key: "sale.delete" },
  { key: "sale.edit" },
  { key: "sales_target.create" },
  { key: "sales_target.delete" },
  { key: "sales_target.edit" },
  { key: "sales_target.view" },
  { key: "sale.view" },
  { key: "temporary_creditlimit.approve" },
  { key: "temporary_creditlimit.create" },
  { key: "temporary_creditlimit.delete" },
  { key: "temporary_creditlimit.edit" },
  { key: "temporary_creditlimit.view" },
];

// 9. Activity Plan User (ผู้ใช้งานแผนงาน) - 7 permissions
const activityPlanUserConfig: RolePermItem[] = [
  { key: "activity.create" },
  { key: "activity.delete" },
  { key: "activity.edit" },
  { key: "activity.view" },
  { key: "data.activity_plans", dataAccess: DataAccessLevel.VIEW_OWN },
  { key: "menu.activity_plans" },
  { key: "promotional_material.view" },
];

// 10. Activity Plan Approver (ผู้อนุมัติแผนงาน) - 5 permissions
const activityPlanApproverConfig: RolePermItem[] = [
  { key: "activity.approve" },
  { key: "activity.view" },
  { key: "data.activity_plans", dataAccess: DataAccessLevel.VIEW_TEAM },
  { key: "menu.activity_plans" },
  { key: "promotional_material.view" },
];

// 11. Activity Plan Admin (ผู้ดูแลแผนงานและสื่อส่งเสริมการขาย) - 13 permissions
const activityPlanAdminConfig: RolePermItem[] = [
  { key: "activity.approve" },
  { key: "activity.create" },
  { key: "activity.delete" },
  { key: "activity.edit" },
  { key: "activity.manage" },
  { key: "activity.view" },
  { key: "data.activity_plans", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "menu.activity_plans" },
  { key: "menu.promotional_materials" },
  { key: "promotional_material.create" },
  { key: "promotional_material.delete" },
  { key: "promotional_material.edit" },
  { key: "promotional_material.view" },
];

// Role Definitions Metadata (ตรงกับ Production Database 100%)
const roleDefinitions = [
  {
    name: "Administrator",
    slug: "administrator",
    description: "Full access to every module",
    isSystem: true,
    isActive: true,
    config: administratorConfig,
  },
  {
    name: "Admin",
    slug: "admin",
    description: "High-level access with most permissions except RBAC management",
    isSystem: true,
    isActive: true,
    config: adminConfig,
  },
  {
    name: "ผู้บริหาร",
    slug: "ceo",
    description: "ผู้บริหารสูงสุด - สิทธิ์ดูข้อมูลทั้งหมด (Read-only Executive Access)",
    isSystem: true,
    isActive: true,
    config: ceoConfig,
  },
  {
    name: "พนักงานการตลาด",
    slug: "employee_mk",
    description: "",
    isSystem: false,
    isActive: true,
    config: employeeMkConfig,
  },
  {
    name: "ผู้จัดการแผนกการตลาด",
    slug: "marketing_manager",
    description: "ดูรายละเอียดต่างๆ",
    isSystem: false,
    isActive: true,
    config: marketingManagerConfig,
  },
  {
    name: "ธุรการขาย",
    slug: "sales_admin",
    description: "ธุรการขาย - จัดการการจัดส่งสินค้าและงานเอกสารฝ่ายขาย",
    isSystem: false,
    isActive: true,
    config: salesAdminConfig,
  },
  {
    name: "พนักงานฝ่ายขาย",
    slug: "sales_employee",
    description: "พนักงานฝ่ายขาย",
    isSystem: false,
    isActive: true,
    config: salesEmployeeConfig,
  },
  {
    name: "ผู้จัดการแผนกบริหารงานขาย",
    slug: "sales_manager",
    description: "ผู้จัดการแผนกบริหารงานขาย",
    isSystem: false,
    isActive: true,
    config: salesManagerConfig,
  },
  {
    name: "ผู้ใช้งานแผนงาน",
    slug: "activity_plan_user",
    description: "ผู้ใช้งานแผนงาน (Trip Plan User) - สร้าง แก้ไข ลบ และส่งแผนงานของตนเอง",
    isSystem: false,
    isActive: true,
    config: activityPlanUserConfig,
  },
  {
    name: "ผู้อนุมัติแผนงาน",
    slug: "activity_plan_approver",
    description: "ผู้อนุมัติแผนงาน (Trip Plan Approver) - ตรวจสอบและอนุมัติตามสายงานและงบประมาณ",
    isSystem: false,
    isActive: true,
    config: activityPlanApproverConfig,
  },
  {
    name: "ผู้ดูแลแผนงานและสื่อส่งเสริมการขาย",
    slug: "activity_plan_admin",
    description: "ผู้ดูแลแผนงานและสื่อส่งเสริมการขาย (Activity Plan Admin) - จัดการแผนงานทั้งหมดและสื่อส่งเสริมการขาย",
    isSystem: false,
    isActive: true,
    config: activityPlanAdminConfig,
  },
];

// ============================================================================
// Seed Function (Idempotent, Safe & Non-Destructive)
// ============================================================================

export async function seedRBAC(prisma: PrismaClient) {
  console.log("🔐 Seeding RBAC (Roles, Permissions, RolePermissions)...");

  // Flatten all permission groups
  const allPermissionDefs = flattenPermissionGroups(permissionGroups);

  // 1. Sync / Upsert Permissions
  let createdPermCount = 0;
  let updatedPermCount = 0;

  for (const perm of allPermissionDefs) {
    const existing = await prisma.permission.findUnique({
      where: { key: perm.key },
    });

    if (!existing) {
      await prisma.permission.create({ data: perm });
      createdPermCount++;
    } else {
      if (
        existing.name !== perm.name ||
        existing.resource !== perm.resource ||
        existing.action !== (perm.action ?? null) ||
        existing.menuPath !== (perm.menuPath ?? null) ||
        existing.defaultDataAccess !== (perm.defaultDataAccess ?? null) ||
        existing.defaultEditAccess !== (perm.defaultEditAccess ?? null) ||
        existing.defaultDeleteAccess !== (perm.defaultDeleteAccess ?? null)
      ) {
        await prisma.permission.update({
          where: { key: perm.key },
          data: {
            name: perm.name,
            resource: perm.resource,
            action: perm.action ?? null,
            menuPath: perm.menuPath ?? null,
            defaultDataAccess: perm.defaultDataAccess ?? null,
            defaultEditAccess: perm.defaultEditAccess ?? null,
            defaultDeleteAccess: perm.defaultDeleteAccess ?? null,
          },
        });
        updatedPermCount++;
      }
    }
  }

  // 2. Fetch all permissions map
  const permissions = await prisma.permission.findMany({
    where: { deletedAt: null },
  });
  const permissionMap = new Map(permissions.map((p) => [p.key, p.id]));

  // 3. Sync Roles and RolePermissions
  for (const roleDef of roleDefinitions) {
    let role = await prisma.role.findUnique({
      where: { slug: roleDef.slug },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleDef.name,
          slug: roleDef.slug,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
          isActive: roleDef.isActive,
        },
      });
    } else {
      if (
        role.name !== roleDef.name ||
        role.description !== roleDef.description ||
        role.isSystem !== roleDef.isSystem ||
        role.isActive !== roleDef.isActive
      ) {
        role = await prisma.role.update({
          where: { id: role.id },
          data: {
            name: roleDef.name,
            description: roleDef.description,
            isSystem: roleDef.isSystem,
            isActive: roleDef.isActive,
          },
        });
      }
    }

    // Upsert role permissions
    for (const item of roleDef.config) {
      const permId = permissionMap.get(item.key);
      if (!permId) continue;

      const existingRolePerm = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permId,
          },
        },
      });

      if (!existingRolePerm) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permId,
            allow: true,
            dataAccess: (item.dataAccess as DataAccessLevel) ?? null,
            editAccess: (item.editAccess as EditAccessLevel) ?? null,
            deleteAccess: (item.deleteAccess as DeleteAccessLevel) ?? null,
          },
        });
      } else {
        if (
          existingRolePerm.dataAccess !== (item.dataAccess ?? null) ||
          existingRolePerm.editAccess !== (item.editAccess ?? null) ||
          existingRolePerm.deleteAccess !== (item.deleteAccess ?? null)
        ) {
          await prisma.rolePermission.update({
            where: { id: existingRolePerm.id },
            data: {
              dataAccess: (item.dataAccess as DataAccessLevel) ?? null,
              editAccess: (item.editAccess as EditAccessLevel) ?? null,
              deleteAccess: (item.deleteAccess as DeleteAccessLevel) ?? null,
            },
          });
        }
      }
    }
  }

  console.log(
    `✅ RBAC sync complete: Created ${createdPermCount}, Updated ${updatedPermCount} permissions.`,
  );
}
