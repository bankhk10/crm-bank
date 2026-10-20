"use client";

import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ActivityComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
}

export interface ActivityComboboxProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: ActivityComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  triggerClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
  showSubLabelInTrigger?: boolean;
}

/**
 * ActivityCombobox
 *
 * Dedicated mobile-first searchable select/combobox component for the Activity subsystem.
 * Encapsulates popover + search logic with consistent Activity styling, focus rings, and labels.
 */
export function ActivityCombobox({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "เลือก...",
  searchPlaceholder = "ค้นหา...",
  emptyText = "ไม่พบข้อมูล",
  disabled = false,
  required = false,
  error,
  className,
  triggerClassName,
  labelClassName,
  containerClassName,
  showSubLabelInTrigger = false,
}: ActivityComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => option.value === value || option.label === value,
  );

  return (
    <div className={cn("w-full space-y-1", containerClassName)}>
      {label && (
        <Label
          htmlFor={id}
          className={cn(
            "block text-xs font-semibold text-slate-700",
            labelClassName,
          )}
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full h-9 min-h-[36px] px-3 py-1.5",
              "rounded-lg border border-slate-200 bg-white shadow-2xs",
              "text-xs font-normal justify-between text-left",
              "transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-offset-0 focus-visible:outline-none",
              "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed",
              !value && "text-slate-400",
              error && "border-rose-400 focus:ring-rose-400 bg-rose-50/20",
              triggerClassName,
              className,
            )}
          >
            <span className="text-left flex-1 flex flex-col justify-center min-w-0">
              <span className="truncate">
                {selectedOption ? selectedOption.label : value || placeholder}
              </span>
              {showSubLabelInTrigger && selectedOption?.subLabel && (
                <span className="text-[10px] text-slate-400 truncate">
                  {selectedOption.subLabel}
                </span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 z-50 rounded-xl shadow-lg border border-slate-200 bg-white"
          align="start"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command className="rounded-xl">
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9 text-xs"
            />
            <CommandList className="max-h-[260px] p-1">
              <CommandEmpty className="py-4 text-center text-xs text-slate-400">
                {emptyText}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option, index) => (
                  <CommandItem
                    key={`${option.value}-${index}`}
                    value={option.value}
                    keywords={[
                      option.label,
                      option.label.replace(/\s+/g, ""),
                      ...(option.subLabel
                        ? [option.subLabel, option.subLabel.replace(/\s+/g, "")]
                        : []),
                    ]}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className="text-xs py-2 px-2.5 rounded-lg cursor-pointer aria-selected:bg-emerald-50 aria-selected:text-emerald-900"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5 shrink-0 text-emerald-600",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate font-medium text-slate-800">
                        {option.label}
                      </span>
                      {option.subLabel && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {option.subLabel}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
