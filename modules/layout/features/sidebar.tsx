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
    Home,
} from "lucide-react";
import Divider from "@/components/ui/divider";
import {
    getDefaultRouteForRoles,
    isAdministrator,
    isManager,
} from "@/modules/rbac/application/authorization";
import type { SidebarChildItem, SidebarNavItem, SidebarProps } from "../types";
import { navigationItems } from "../constants";
import { filterNavItems, isRouteActive, isChildActive } from "../ui/navigation-utils";

// Reusable recursive menu item component
const SidebarMenuItem = ({
    item,
    pathname,
    onClose,
    nested = false,
}: {
    item: SidebarChildItem;
    pathname: string;
    onClose?: () => void;
    nested?: boolean;
}) => {
    const hasChildren = item.children && item.children.length > 0;
    // If it has children, check if any child is active to determine default open state
    const active = isChildActive(item, pathname);

    // Local state for toggling children
    // Should default to open if a child is active
    const [isOpen, setIsOpen] = useState(active);

    // Update isOpen when pathname changes if it becomes active
    useEffect(() => {
        if (active) setIsOpen(true);
    }, [active]);

    if (hasChildren) {
        return (
            <div className="mb-1">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex w-full items-center justify-between rounded px-4 py-2 transition text-white/80 hover:text-white hover:bg-white/5 ${nested ? "pl-8" : "pl-4"
                        } ${active ? "text-white font-medium" : ""}`}
                >
                    <span>{item.label}</span>
                    {isOpen ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronRight className="h-3 w-3" />
                    )}
                </button>
                {isOpen && (
                    <div className="mt-1">
                        {item.children!.map((child, index) => (
                            <SidebarMenuItem
                                key={`${child.href}-${index}`}
                                item={child}
                                pathname={pathname}
                                onClose={onClose}
                                nested={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Leaf node
    const isSelfActive = isRouteActive(item.href, pathname);

    return (
        <Link
            href={item.href}
            className={`flex items-center justify-between rounded px-4 py-2 transition ${isSelfActive
                ? "font-semibold text-white"
                : "text-white/80 hover:text-white"
                } ${nested ? "pl-8" : "pl-4"}`}
            onClick={() => onClose?.()}
        >
            <span className={nested ? "pl-4" : ""}>{item.label}</span>
            {isSelfActive && (
                <span className="ml-2 h-2 w-2 rounded-full bg-white shrink-0" />
            )}
        </Link>
    );
};

export default function Sidebar({
    permissionKeys,
    roles,
    className,
    onClose,
}: SidebarProps) {
    const pathname = usePathname();

    const items = useMemo(() => {
        const navs = filterNavItems(navigationItems, permissionKeys);

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
    }, [permissionKeys, roles]);

    // Main sidebar 'accordion' logic for top-level items
    const [openKey, setOpenKey] = useState<string | null>(() => {
        const parent = items.find((item) => isChildActive(item, pathname));
        return parent?.href ?? null;
    });

    const isActive = (href: string) => isRouteActive(href, pathname);

    // Keep openKey in sync
    useEffect(() => {
        const parent = items.find((item) => isChildActive(item, pathname));
        setOpenKey(parent?.href ?? null);
    }, [pathname, items]);

    return (
        <aside
            className={`relative flex h-full w-64 shrink-0 flex-col overflow-y-auto bg-[#b92626] text-white ${className ?? ""
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

                    // Special handling for fulfillment
                    if (pathname.includes("/fulfillment")) {
                        if (item.href === "/sales") isItemActive = false;
                        if (item.href === "/fulfillment") isItemActive = true;
                    }

                    const hasChildren = item.children && item.children.length > 0;
                    const activeParent = hasChildren
                        ? isChildActive(item, pathname) || isItemActive
                        : isItemActive;

                    if (hasChildren) {
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
                                    <div className="mx-2 mb-1 bg-[#991b1b] rounded-lg pt-1 pb-1">
                                        {item.children!.map((child, index) => (
                                            <SidebarMenuItem
                                                key={`${child.href}-${index}`}
                                                item={child}
                                                pathname={pathname}
                                                onClose={onClose}
                                            />
                                        ))}
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
