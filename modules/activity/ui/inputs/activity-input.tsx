"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ActivityInputProps
  extends React.ComponentProps<typeof Input> {}

/**
 * ActivityInput
 *
 * Dedicated mobile-first input component for the Activity Plans subsystem.
 * Built on top of shadcn Input with responsive touch targets, consistent font sizing,
 * border styling, and Activity-themed focus/disabled states.
 */
export const ActivityInput = React.forwardRef<
  HTMLInputElement,
  ActivityInputProps
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      className={cn(
        // Mobile-first standard Activity form styling
        "w-full h-9 min-h-[36px] px-3 py-1.5",
        "rounded-lg border border-slate-200 bg-white shadow-2xs",
        "text-xs text-slate-800 placeholder:text-slate-400 font-normal",
        "transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-offset-0 focus-visible:outline-none",
        "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
});

ActivityInput.displayName = "ActivityInput";
