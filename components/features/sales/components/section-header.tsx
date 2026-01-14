"use client";

/**
 * Section Header Component
 * Gradient header for form sections
 */

import React from "react";

interface SectionHeaderProps {
  title: string;
  color?: "blue" | "purple" | "green" | "orange" | "pink" | "indigo" | "gray";
  children?: React.ReactNode;
}

const colorClasses = {
  blue: "from-blue-600 to-blue-500",
  purple: "from-purple-600 to-purple-500",
  green: "from-green-600 to-green-500",
  orange: "from-orange-600 to-orange-500",
  pink: "from-pink-600 to-pink-500",
  indigo: "from-indigo-600 to-indigo-500",
  gray: "from-gray-500 to-gray-500",
};

export function SectionHeader({
  title,
  color = "blue",
  children,
}: SectionHeaderProps) {
  const gradientClass = colorClasses[color];

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 bg-gradient-to-r ${gradientClass} px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-md`}
    >
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default SectionHeader;
