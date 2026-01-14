"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  useState,
  useEffect,
  useMemo,
  Fragment,
  isValidElement,
  cloneElement,
} from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Users2,
  Building2,
  ShieldCheck,
  PackageSearch,
  UserCog,
  Home,
  FileChartPie,
  ClipboardList,
  ClipboardPen,
} from "lucide-react";
import Divider from "@/components/ui/divider";
import type { SessionPermission } from "@/types/next-auth";
import {
  getDefaultRouteForRoles,
  isAdministrator,
  isManager,
} from "@/src/core/rbac";

interface SidebarChildItem {
  href: string;
  label: string;
}

interface SidebarNavItem {
  href: string;
  label: string;
  permissionKey: string;
  icon?: React.ReactNode;
  children?: SidebarChildItem[];
}

// Exported for reuse in mobile navbar drawer
export const navigationItems: SidebarNavItem[] = [
  {
    href: "/reports",
    label: "รายงาน",
    permissionKey: "menu.reports",
    icon: <FileChartPie className="h-4 w-4" />,
    children: [
      // { href: "/reports/aggregateReport", label: "ภาพรวม" },
      { href: "/reports/salesReport", label: "การขาย" },
      { href: "/reports/activityReport", label: "กิจกรรม" },
    ],
  },
  {
    href: "/products",
    label: "สินค้า",
    permissionKey: "menu.products",
    icon: <PackageSearch className="h-4 w-4" />,
  },
  {
    href: "/sales",
    label: "การขาย",
    permissionKey: "menu.sales",
    icon: <ClipboardPen className="h-4 w-4" />,
  },
  {
    href: "/fulfillment",
    label: "จัดการคำสั่งซื้อ",
    permissionKey: "menu.fulfillment",
    icon: <ClipboardList className="h-4 w-4" />,
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
    href: "/customers",
    label: "ลูกค้า",
    permissionKey: "menu.customers",
    icon: <UserCog className="h-4 w-4" />,
    children: [
      { href: "/customers", label: "ข้อมูลลูกค้า" },
      { href: "/credit-limits", label: "จัดการวงเงิน" },
      { href: "/temporary-credit-limits", label: "วงเงินเครดิตชั่วคราว" },
    ],
  },
  {
    href: "/rbac",
    label: "สิทธิ์",
    permissionKey: "rbac.manage",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
];

interface SidebarProps {
  permissions: Record<string, SessionPermission>;
  roles: string[];
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({
  permissions,
  roles,
  className,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const items = useMemo(() => {
    const navs = navigationItems.filter(
      (item) => permissions[item.permissionKey]?.allow
    );

    const dashboardHref = getDefaultRouteForRoles(roles);
    const isDashboard = isAdministrator(roles) || isManager(roles);
    const dashboardLabel = isDashboard ? "แดชบอร์ด" : "หน้าแรก";
    const DashboardIcon = isDashboard ? LayoutDashboard : Home;

    const mainDashboardItem: SidebarNavItem = {
      href: dashboardHref,
      label: dashboardLabel,
      permissionKey: "common.dashboard",
      icon: <DashboardIcon className="h-4 w-4" />,
    };

    return [mainDashboardItem, ...navs];
  }, [permissions, roles]);
  const [openKey, setOpenKey] = useState<string | null>(() => {
    const parent = items.find((item) =>
      item.children?.some((c) => pathname.startsWith(c.href))
    );
    return parent?.href ?? null;
  });

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Keep openKey in sync with the current pathname so parent menus
  // close when navigating away from their children.
  useEffect(() => {
    const parent = items.find((item) =>
      item.children?.some((c) => pathname.startsWith(c.href))
    );
    setOpenKey(parent?.href ?? null);
  }, [pathname, items]);

  return (
    <aside
      className={`relative flex h-full w-64 shrink-0 flex-col overflow-y-auto bg-[#b92626] text-white ${
        className ?? ""
      }`}
    >
      {/* Mobile close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="md:hidden absolute top-3 right-3 p-2 rounded-lg text-white hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="px-12 py-5">
        <Link href="/" className="block w-full">
          <Image
            src="/images/logo.png"
            alt="MoveCRM"
            width={160}
            height={36}
            className="object-contain"
          />
        </Link>
      </div>
      <Divider className="border-white/20 mb-2" />
      <nav className="space-y-1 px-2 pb-6 text-sm md:text-base mt-8">
        {items.map((item) => {
          let isItemActive = isActive(item.href);

          // Special handling: if we are in a fulfillment sub-route (even under sales),
          // we want the Fulfillment menu to be active, not Sales.
          if (pathname.includes("/fulfillment")) {
            if (item.href === "/sales") isItemActive = false;
            // Only set fulfillment active if it matches the item href exactly or logic dictates
            if (item.href === "/fulfillment") isItemActive = true;
          }

          const activeParent = item.children
            ? item.children.some((c) => isActive(c.href)) || isItemActive
            : isItemActive;

          if (item.children && item.children.length > 0) {
            const open = openKey === item.href;
            return (
              <Fragment key={item.href}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenKey((k) => (k === item.href ? null : item.href))
                  }
                  className={
                    "group flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left transition " +
                    (activeParent
                      ? "bg-[#991b1b] rounded-xl font-semibold text-white"
                      : "hover:bg-[#991b1b]")
                  }
                >
                  <span className="text-white/90">
                    {item.icon && isValidElement(item.icon)
                      ? cloneElement(item.icon as React.ReactElement)
                      : item.icon}
                  </span>
                  <span className="flex-1 pl-1">{item.label}</span>
                  {open ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {open && (
                  <div className="mx-2 mb-1 bg-[#991b1b] rounded-lg">
                    {item.children.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={
                            "flex items-center justify-between rounded px-4 py-2 transition " +
                            (childActive
                              ? "font-semibold text-white"
                              : "text-white/80")
                          }
                          onClick={() => onClose?.()}
                        >
                          <span className="pl-4">{child.label}</span>
                          {childActive && (
                            <span className="ml-2 h-2 w-2 rounded-full bg-white" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Fragment>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex items-center gap-2 rounded-lg px-4 py-3 transition " +
                (activeParent
                  ? "bg-[#991b1b] rounded-xl font-semibold text-white"
                  : "hover:bg-[#991b1b]")
              }
              onClick={() => onClose?.()}
            >
              <span className="text-white/90">
                {item.icon && isValidElement(item.icon)
                  ? cloneElement(item.icon as React.ReactElement)
                  : item.icon}
              </span>
              <span className="pl-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <footer className="mt-auto px-6 text-left text-sm text-white/80 pb-4">
        <p>Copyright 2025 รุ่น 1.0.0</p>
      </footer>
    </aside>
  );
}
