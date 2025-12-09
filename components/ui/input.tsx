import { forwardRef } from "react";
import type { InputHTMLAttributes, WheelEventHandler } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", readOnly, disabled, onWheel, ...props }, ref) => {
    const handleWheel: WheelEventHandler<HTMLInputElement> = (e) => {
      if (type === "number") {
        // blur to avoid changing the numeric value via mouse wheel
        e.currentTarget.blur();
      }
      if (onWheel) onWheel(e as any);
    };

    return (
      <input
        ref={ref}
        type={type}
        readOnly={readOnly}
        disabled={disabled}
        onWheel={handleWheel}
        className={cn(
          "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
          readOnly || disabled ? "bg-gray-100" : "bg-white",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
