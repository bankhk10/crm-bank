"use client";

import React, { useId } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ActivitySelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ActivitySelectProps {
  id?: string;
  name?: string;
  label?: string;
  labelClassName?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: Array<ActivitySelectOption | string>;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "default";
}

const defaultLabelClass = "block text-xs font-semibold text-slate-700 mb-1 mx-0";

/**
 * ActivitySelect
 *
 * Dedicated styled Select dropdown component for Activity Plan forms.
 * Built with Radix UI Select with emerald theme, smooth transitions,
 * and robust error and disabled state handling.
 */
export function ActivitySelect({
  id: customId,
  name,
  label,
  labelClassName,
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder = "เลือก...",
  disabled = false,
  readonly = false,
  required = false,
  error,
  className,
  triggerClassName,
  size = "default",
}: ActivitySelectProps) {
  const generatedId = useId();
  const id = customId || generatedId;

  // Normalize options array
  const normalizedOptions: ActivitySelectOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const isInteractive = !disabled && !readonly;

  return (
    <div className={cn("w-full space-y-1", className)}>
      {label && (
        <Label htmlFor={id} className={cn(defaultLabelClass, labelClassName)}>
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </Label>
      )}

      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={(val) => {
          if (isInteractive && onChange) {
            onChange(val);
          }
        }}
        disabled={!isInteractive}
        name={name}
      >
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5",
            size === "sm" ? "h-8 min-h-[32px] text-xs" : "h-9 min-h-[36px] text-xs",
            "font-medium text-slate-800 shadow-2xs transition-all duration-150 outline-none",
            "hover:border-slate-300",
            "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
            !value && "text-slate-400 font-normal",
            error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/10",
            (!isInteractive) &&
              "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed hover:border-slate-200 select-none",
            triggerClassName
          )}
        >
          <span className="truncate text-left flex-1 min-w-0">
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 opacity-70 transition-transform duration-200" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            align="start"
            sideOffset={4}
            className={cn(
              "relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-lg",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
              "w-(--radix-select-trigger-width)"
            )}
          >
            <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1 text-slate-400">
              <ChevronUp className="h-4 w-4" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1">
              {normalizedOptions.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-700 outline-none transition-colors",
                    "hover:bg-emerald-50 hover:text-emerald-900 focus:bg-emerald-50 focus:text-emerald-900",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                    "data-[state=checked]:font-semibold data-[state=checked]:text-emerald-900 data-[state=checked]:bg-emerald-50/70"
                  )}
                >
                  <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1 text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && <p className="text-[11px] text-rose-500 font-medium pt-0.5">{error}</p>}
    </div>
  );
}

