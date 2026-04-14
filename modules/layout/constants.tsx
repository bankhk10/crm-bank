/**
 * Layout Constants
 * Navigation items configuration for sidebar
 */

import {
  LayoutDashboard,
  Users2,
  Building2,
  ShieldCheck,
  UserCog,
  ClipboardList,
  ClipboardPen,
  ChartPie,
  Package,
  TrendingUp,
  Target,
  Truck,
  BookOpen,
} from "lucide-react";
import type { SidebarNavItem } from "./types";

/**
 * Main navigation items for the sidebar
 */
export const navigationItems: SidebarNavItem[] = [
  {
    href: "/dashboard/manager",
    label: "แดชบอร์ด",
    permissionKey: "menu.dashboard.manager",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/dashboard/sales",
    label: "แดชบอร์ดของฉัน",
    permissionKey: "menu.dashboard.sales",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/show-product",
    label: "หน้าแรก",
    permissionKey: "menu.show_product",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/reports",
    label: "รายงาน",
    permissionKey: "menu.reports",
    icon: <ChartPie className="h-4 w-4" />,
  },
  {
    href: "/sales-forecast",
    label: "คาดการณ์ยอดขาย",
    permissionKey: "menu.sales_forecast",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    href: "/sales-targets",
    label: "ตั้งเป้าหมายยอดขาย",
    permissionKey: "menu.sales_targets",
    icon: <Target className="h-4 w-4" />,
  },
  {
    href: "/sales",
    label: "การขาย",
    permissionKey: "menu.sales",
    icon: <ClipboardPen className="h-4 w-4" />,
  },
  {
    href: "/fulfillment",
    label: "จัดการคำสั่งขาย",
    permissionKey: "menu.fulfillment",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    href: "/products",
    label: "สินค้า",
    permissionKey: "menu.products",
    icon: <Package className="h-4 w-4" />,
    children: [
      { href: "/products", label: "ข้อมูลสินค้า" },
      {
        href: "#attributes",
        label: "หมวดหมู่และคุณลักษณะ",
        children: [
          { href: "/products/plants", label: "พืช" },
          { href: "/products/groups", label: "กลุ่มสินค้า" },
          { href: "/products/trade-name-groups", label: "กลุ่มชื่อการค้า" },
          { href: "/products/categories", label: "หมวดสินค้า" },
          { href: "/products/units", label: "หน่วยนับ" },
          { href: "/products/brands", label: "แบรนด์" },
          { href: "/products/abc-types", label: "ประเภท (ABC Code)" },
        ],
      },
    ],
  },
  {
    href: "/customers",
    label: "ลูกค้า",
    permissionKey: "menu.customers",
    icon: <UserCog className="h-4 w-4" />,
    children: [
      { href: "/customers", label: "ข้อมูลลูกค้า" },
      { href: "/credit-limits", label: "จัดการวงเงินลูกค้า", permissionKey: "menu.credit_limits" },
      // { href: "/temporary-credit-limits", label: "วงเงินเครดิตชั่วคราว", permissionKey: "menu.temporary_credit_limits" },
    ],
  },
  {
    href: "/shipping-companies",
    label: "บริษัทขนส่ง",
    permissionKey: "menu.shipping-companies",
    icon: <Truck className="h-4 w-4" />,
  },
  {
    href: "/employee",
    label: "พนักงาน",
    permissionKey: "menu.employees",
    icon: <Users2 className="h-4 w-4" />,
  },
  {
    href: "/companies",
    label: "บริษัท",
    permissionKey: "menu.companies",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    href: "/rbac",
    label: "สิทธิ์",
    permissionKey: "rbac.manage",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    href: "https://docs.google.com/document/d/1Jo8RL9S1fwIqEJQc0xASSLnZp8ElkQ8J7G1T9NvGqkc/edit?usp=sharing",
    label: "คู่มือ",
    icon: <BookOpen className="h-4 w-4" />,
    target: "_blank",
  },
];
