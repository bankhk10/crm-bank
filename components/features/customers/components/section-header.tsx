"use client";

import { cn } from "@/lib/utils";

/**
 * Section Header Props
 */
interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Section Header Component
 * Used for form sections and page sections
 */
export function SectionHeader({
  title,
  description,
  icon,
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-gray-200 pb-4 mb-6 dark:border-gray-700",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
