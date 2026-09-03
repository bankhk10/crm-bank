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

interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface FormComboboxProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
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

const defaultLabelClass = "text-base font-medium mx-2";
const defaultTriggerClass = "mt-1 min-h-[44px] h-auto py-2 text-base w-full justify-between";

export function FormCombobox({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "เลือก",
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
}: FormComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => option.value === value || option.label === value
  );

  return (
    <div className={cn(containerClassName)}>
      <Label className={cn(defaultLabelClass, labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              defaultTriggerClass,
              triggerClassName,
              className,
              !value && "text-gray-500",
              "font-normal",
              error && "border-red-500 focus:ring-red-500 bg-red-50/10"
            )}
          >
            <span className="text-left flex-1 flex flex-col justify-center min-w-0">
              <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
              {showSubLabelInTrigger && selectedOption?.subLabel && (
                <span className="text-xs text-gray-500 truncate">{selectedOption.subLabel}</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} className="h-11" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option, index) => (
                  <CommandItem
                    key={`${option.value}-${index}`}
                    value={option.value}
                    keywords={[
                      option.label, 
                      option.label.replace(/\s+/g, ""),
                      ...(option.subLabel ? [option.subLabel, option.subLabel.replace(/\s+/g, "")] : [])
                    ]}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{option.label}</span>
                      {option.subLabel && (
                        <span className="text-xs text-gray-500 truncate">{option.subLabel}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
