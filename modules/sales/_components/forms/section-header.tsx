"use client";

/**
 * Section Header Component
 * Clean section header with light background for form sections
 */

import React from "react";

interface SectionHeaderProps {
    title: string;
    color?: "blue" | "purple" | "green" | "orange" | "pink" | "indigo" | "gray";
    children?: React.ReactNode;
    className?: string;
}

export function SectionHeader({
    title,
    children,
    className,
}: SectionHeaderProps) {
    return (
        <div
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 bg-gray-300 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl ${className || ""
                }`}
        >
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">
                {title}
            </h3>
            {children}
        </div>
    );
}

export default SectionHeader;
