"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ActivityTextareaProps
  extends React.ComponentProps<typeof Textarea> {
  label?: string;
  labelClassName?: string;
  required?: boolean;
}

/**
 * ActivityTextarea
 *
 * Dedicated mobile-first textarea component for the Activity subsystem.
 * Built on top of shadcn Textarea with responsive styling, consistent font sizing,
 * border styling, and Activity-themed focus/disabled states.
 */
export const ActivityTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ActivityTextareaProps
>(({ className, label, labelClassName, required, id, ...props }, ref) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "block text-xs font-semibold text-slate-700",
            labelClassName,
          )}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <Textarea
        ref={ref}
        id={id}
        className={cn(
          // Mobile-first standard Activity form textarea styling
          "w-full min-h-[72px] p-2.5 sm:p-3",
          "rounded-xl border border-slate-200 bg-white shadow-2xs",
          "text-xs text-slate-800 placeholder:text-slate-400 font-normal leading-relaxed resize-y",
          "transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-offset-0 focus-visible:outline-none",
          "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    </div>
  );
});

ActivityTextarea.displayName = "ActivityTextarea";
