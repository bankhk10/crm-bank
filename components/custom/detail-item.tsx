import React from "react";
import { cn } from "@/lib/utils";

export function DetailItem({
  icon,
  label,
  value,
  fullWidth = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 py-3 border-b border-gray-100 last:border-0",
        fullWidth && "col-span-full",
      )}
    >
      {icon && <div className="text-gray-400 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
        <dd className="text-base text-gray-900 font-medium wrap-break-word">
          {value || "-"}
        </dd>
      </div>
    </div>
  );
}
