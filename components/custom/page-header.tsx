"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
    /** Lucide icon component */
    icon?: LucideIcon;
    /** CSS class for the icon (e.g. "text-orange-600") */
    iconClassName?: string;
    /** Page title */
    title: string;
    /** Optional description shown below the title */
    description?: string;
    /** Optional action buttons (right-aligned on desktop) */
    actions?: React.ReactNode;
    /** Center the header (default: true for backward compat) */
    center?: boolean;
    /** Custom class name */
    className?: string;
}

export function PageHeader({
    icon: Icon,
    iconClassName = "text-blue-600",
    title,
    description,
    actions,
    center = true,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={`mb-6 ${center
                    ? "flex flex-col items-center gap-4"
                    : "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                } ${className ?? ""}`}
        >
            <div
                className={`flex items-center gap-3 ${center ? "" : ""}`}
            >
                {Icon && <Icon className={`w-9 h-9 ${iconClassName}`} />}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

export default PageHeader;
