"use client";

import * as React from "react";

type Breakpoint = "md" | "lg" | "xl";

const BREAKPOINT_CLASSES: Record<
    Breakpoint,
    { mobileShow: string; desktopShow: string }
> = {
    md: {
        mobileShow: "block md:hidden",
        desktopShow: "hidden md:block",
    },
    lg: {
        mobileShow: "block lg:hidden",
        desktopShow: "hidden lg:block",
    },
    xl: {
        mobileShow: "block xl:hidden",
        desktopShow: "hidden xl:block",
    },
};

export interface ResponsiveDataViewProps {
    /** Table view (shown on desktop) */
    table: React.ReactNode;
    /** Card view (shown on mobile) */
    cards: React.ReactNode;
    /** Breakpoint at which to switch between cards and table (default: "xl") */
    breakpoint?: Breakpoint;
    /** Content shown above both views (e.g. toolbar, shared filters) */
    toolbar?: React.ReactNode;
    /** Custom class name for the wrapper */
    className?: string;
}

export function ResponsiveDataView({
    table,
    cards,
    breakpoint = "xl",
    toolbar,
    className,
}: ResponsiveDataViewProps) {
    const { mobileShow, desktopShow } = BREAKPOINT_CLASSES[breakpoint];

    return (
        <div className={`space-y-4 ${className ?? ""}`}>
            {toolbar}

            {/* Mobile/Tablet: card layout */}
            <div className={mobileShow}>{cards}</div>

            {/* Desktop: table layout */}
            <div className={desktopShow}>{table}</div>
        </div>
    );
}

export default ResponsiveDataView;
