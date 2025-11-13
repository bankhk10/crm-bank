"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Fragment } from "react";
import type { Role } from "@prisma/client";
import { ChevronDown, ChevronRight, LayoutDashboard, Users2, Building2 } from "lucide-react";

interface SidebarChildItem {
  href: string;
  label: string;
}

interface SidebarNavItem {
  href: string;
  label: string;
  roles: Role[];
  icon?: React.ReactNode;
  children?: SidebarChildItem[];
}

// Exported for reuse in mobile navbar drawer
export const navigationItems: SidebarNavItem[] = [
  {
    href: "/dashboard",
    label: "รายงาน",
    roles: ["ADMIN", "MANAGER", "USER"],
    icon: <LayoutDashboard className="h-4 w-4" />,
    children: [
      { href: "/dashboard/aggregateReport", label: "ภาพรวม" },
      { href: "/dashboard/salesReport", label: "การขาย" },
      { href: "/dashboard/activityReport", label: "กิจกรรม" }
    ]
  },
  {
    href: "/employee",
    label: "พนักงาน",
    roles: ["ADMIN", "MANAGER"],
    icon: <Users2 className="h-4 w-4" />
  },
  {
    href: "/companies",
    label: "บริษัท",
    roles: ["ADMIN", "MANAGER"],
    icon: <Building2 className="h-4 w-4" />
  }
];

interface SidebarProps {
  role: Role;
  className?: string;
}

export default function Sidebar({ role, className }: SidebarProps) {
  const pathname = usePathname();

  const items = navigationItems.filter((item) => item.roles.includes(role));
  const [openKey, setOpenKey] = useState<string | null>(() => {
    const parent = items.find((item) => item.children?.some((c) => pathname.startsWith(c.href)));
    return parent?.href ?? null;
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={
        "hidden w-64 shrink-0 bg-[#b92626] text-white md:block " + (className ? className : "")
      }
    >
      <div className="px-6 py-5 text-xl font-semibold">Control Center</div>
      <nav className="space-y-1 px-2 pb-6 text-sm">
        {items.map((item) => {
          const activeParent = item.children
            ? item.children.some((c) => isActive(c.href)) || isActive(item.href)
            : isActive(item.href);

          if (item.children && item.children.length > 0) {
            const open = openKey === item.href;
            return (
              <Fragment key={item.href}>
                <button
                  type="button"
                  onClick={() => setOpenKey((k) => (k === item.href ? null : item.href))}
                  className={
                    "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition " +
                    (activeParent ? "bg-[#991b1b]" : "hover:bg-[#991b1b]")
                  }
                >
                  <span className="text-white/90">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {open ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {open && (
                  <div className="mx-2 mb-1 rounded-md bg-[#991b1b] p-1">
                    {item.children.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={
                            "flex items-center justify-between rounded px-3 py-2 text-[13px] transition " +
                            (childActive
                              ? "bg-[#7f1515] text-white"
                              : "text-white/80 hover:bg-[#7f1515]")
                          }
                        >
                          <span>{child.label}</span>
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
                "flex items-center gap-2 rounded-md px-3 py-2 transition " +
                (activeParent ? "bg-[#991b1b]" : "hover:bg-[#991b1b]")
              }
            >
              <span className="text-white/90">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
