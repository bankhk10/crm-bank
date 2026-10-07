import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    variant?: "primary" | "dark" | "default";
    /** Hex color or Tailwind class for primary variant (e.g., "#B91C1C") */
    accentColor?: string;
    color?: string;
    children?: React.ReactNode;
    className?: string;
}

export function SectionHeader({
    icon,
    title,
    variant = "primary",
    accentColor = "#B91C1C",
    children,
    className,
}: SectionHeaderProps) {
    const isDark = variant === "dark";
    
    return (
        <div
            className={cn(
                "px-6 py-4 flex items-center justify-between gap-4 border-b",
                isDark ? "bg-[#111111] border-black" : "bg-[#B91C1C] border-[#991B1B]",
                className
            )}
            style={!isDark && accentColor !== "#B91C1C" ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
        >
            <div className="flex items-center gap-2.5">
                {icon && <span className="text-white/70">{icon}</span>}
                <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}

export default SectionHeader;
