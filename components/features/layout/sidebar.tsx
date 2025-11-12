import Link from "next/link";
import type { Role } from "@prisma/client";

interface SidebarNavItem {
  href: string;
  label: string;
  roles: Role[];
}

const navigationItems: SidebarNavItem[] = [
  {
    href: "/dashboard/aggregateReport",
    label: "Dashboard",
    roles: ["ADMIN", "MANAGER", "USER"]
  },
  {
    href: "/employee",
    label: "Employees",
    roles: ["ADMIN", "MANAGER"]
  },
  {
    href: "/companies",
    label: "Companies",
    roles: ["ADMIN", "MANAGER"]
  }
];

interface SidebarProps {
  role: Role;
}

export default function Sidebar({ role }: SidebarProps) {
  const items = navigationItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 md:block">
      <div className="mb-6 text-xl font-semibold">Control Center</div>
      <nav className="space-y-2 text-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            className="block rounded px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
