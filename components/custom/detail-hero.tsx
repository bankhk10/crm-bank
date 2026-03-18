import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailHeroProps {
    /** Back link URL (e.g. "/employee") */
    backUrl: string;
    /** Back link label (e.g. "หน้ารายการพนักงาน") */
    backLabel?: string;
    /** Large title */
    title: string;
    /** Avatar icon or image */
    icon?: React.ReactNode;
    /** List of tags/badges to show below title */
    badges?: React.ReactNode;
    /** Action buttons (e.g., Edit, Delete) */
    actions?: React.ReactNode;
    /** Optional hex or Tailwind class for primary color (default: #B91C1C Red) */
    accentColor?: string;
    /** Optional secondary hex or Tailwind color (default: #111111 Dark) */
    backgroundColor?: string;
    /** Use custom children instead of title/badges */
    children?: React.ReactNode;
    className?: string;
}

export function DetailHero({
    backUrl,
    backLabel = "หน้ารายการ",
    title,
    icon,
    badges,
    actions,
    accentColor = "#B91C1C",
    backgroundColor = "#111111",
    children,
    className,
}: DetailHeroProps) {
    return (
        <div
            className={cn(
                "rounded-[1rem] sm:rounded-[2rem] mx-auto overflow-hidden shadow-2xl shadow-black/20",
                className
            )}
            style={{ backgroundColor: backgroundColor }}
        >
            <div className="px-4 sm:px-10 lg:px-12">
                {/* Breadcrumb row */}
                <div className="pt-6">
                    <Link
                        href={backUrl}
                        className="inline-flex items-center gap-2.5 h-10 px-6 text-xs font-semibold 
                                            bg-white/10 hover:bg-white/20 
                                            text-white border border-white/10 
                                            rounded-xl backdrop-blur-md
                                            transition-all active:scale-[0.98] group"
                    >
                        <div className="bg-white/10 group-hover:bg-[#B91C1C] rounded-full p-1 transition-colors">
                            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                        </div>
                        <span>กลับไป{backLabel}</span>
                    </Link>
                </div>

                {/* Identity row */}
                <div className="py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-6">
                        {/* Avatar */}
                        {icon && (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#B91C1C] to-[#991B1B] flex items-center justify-center shrink-0 shadow-lg shadow-red-900/20"
                                style={{ background: `linear-gradient(to bottom right, ${accentColor}, #00000040)` }}
                            >
                                <div className="text-white">
                                    {icon}
                                </div>
                            </div>
                        )}

                        <div>
                            {children ? children : (
                                <>
                                    <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                                        {title}
                                    </h1>
                                    {badges && (
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            {badges}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {actions && (
                        <div className="flex items-center gap-3 shrink-0">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
            {/* Bottom accent bar */}
            <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />
        </div>
    );
}

export default DetailHero;
