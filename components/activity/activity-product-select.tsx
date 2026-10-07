"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Package } from "lucide-react";
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

export interface ActivityProductItem {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
  categoryId?: string | null;
  status?: string | null;
  [key: string]: any;
}

export type ActivityProductUnitFilter = "all" | "box" | string;

export interface ActivityProductSelectProps {
  id?: string;
  value?: string;
  valueKey?: "id" | "name";
  onChange: (value: string, product?: ActivityProductItem) => void;
  products?: ActivityProductItem[];

  // Filtering
  unitFilter?: ActivityProductUnitFilter;
  excludeValues?: string[];
  categoryId?: string;

  // Labels & Display
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  subLabelType?: "code" | "unit" | "price" | "auto" | "none";

  // States & styles
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  triggerClassName?: string;
  containerClassName?: string;
}

interface ProductComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  item: ActivityProductItem;
}

const defaultLabelClass = "block text-xs font-semibold text-slate-700 mb-1 mx-0";
const defaultTriggerClass =
  "h-9 min-h-[36px] py-1 px-3 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium w-full justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed";

/**
 * ActivityProductSelect
 *
 * Dedicated product selector component for Activity Plans supporting:
 * - Search by product name and productCode
 * - Binding by name (default) or by id (`valueKey="id"`)
 * - Unit filtering (e.g. "box" with automatic fallback)
 * - Exclusion filtering (for multi-selection tags)
 * - Category filtering
 * - Passing full product object back in onChange
 */
export function ActivityProductSelect({
  id,
  value = "",
  valueKey = "name",
  onChange,
  products = [],
  unitFilter = "all",
  excludeValues = [],
  categoryId,
  label,
  labelClassName,
  placeholder = "เลือกสินค้า...",
  searchPlaceholder = "ค้นหาชื่อ หรือรหัสสินค้า...",
  emptyText = "ไม่พบสินค้า",
  subLabelType = "auto",
  disabled = false,
  required = false,
  error,
  className,
  triggerClassName,
  containerClassName,
}: ActivityProductSelectProps) {
  const [open, setOpen] = useState(false);

  // 1. Filter raw products list
  const filteredProducts = useMemo(() => {
    let list = products || [];

    // Filter by category if specified
    if (categoryId) {
      list = list.filter((p) => p.categoryId === categoryId);
    }

    // Filter by unit
    if (unitFilter === "box") {
      const boxList = list.filter(
        (p) => !p.unit || p.unit.trim() === "กล่อง"
      );
      if (boxList.length > 0) {
        list = boxList;
      }
    } else if (unitFilter && unitFilter !== "all") {
      list = list.filter((p) => p.unit === unitFilter);
    }

    // Filter by excludeValues
    if (excludeValues && excludeValues.length > 0) {
      const excludeSet = new Set(excludeValues);
      list = list.filter((p) => {
        const primaryVal = valueKey === "id" ? p.id : p.name;
        return (
          !excludeSet.has(primaryVal) &&
          !excludeSet.has(p.id) &&
          !excludeSet.has(p.name)
        );
      });
    }

    return list;
  }, [products, categoryId, unitFilter, excludeValues, valueKey]);

  // 2. Format options
  const formattedOptions: ProductComboboxOption[] = useMemo(() => {
    const list: ProductComboboxOption[] = filteredProducts.map((p) => {
      const optionVal = valueKey === "id" ? p.id : p.name;

      let subLabel: string | undefined = undefined;
      if (subLabelType === "code") {
        subLabel = p.productCode ? `รหัส: ${p.productCode}` : undefined;
      } else if (subLabelType === "unit") {
        subLabel = p.unit
          ? `หน่วย: ${p.unit}`
          : p.productCode
            ? `รหัส: ${p.productCode}`
            : undefined;
      } else if (subLabelType === "price") {
        subLabel =
          p.price != null ? `฿${p.price.toLocaleString()}` : undefined;
      } else if (subLabelType === "auto") {
        if (p.productCode) {
          subLabel = p.productCode;
        } else if (p.unit) {
          subLabel = `หน่วย: ${p.unit}`;
        }
      }

      return {
        value: optionVal,
        label: p.name,
        subLabel,
        item: p,
      };
    });

    // If current value is not in filtered list, preserve it
    if (value && !list.some((o) => o.value === value)) {
      const matched = (products || []).find((p) =>
        valueKey === "id" ? p.id === value : p.name === value || p.id === value
      );
      if (matched) {
        const optionVal = valueKey === "id" ? matched.id : matched.name;
        list.unshift({
          value: optionVal,
          label: matched.name,
          subLabel: matched.productCode || undefined,
          item: matched,
        });
      }
    }

    return list;
  }, [filteredProducts, valueKey, subLabelType, value, products]);

  // 3. Find selected option
  const selectedOption = useMemo(() => {
    if (!value) return undefined;
    return formattedOptions.find(
      (opt) =>
        opt.value === value ||
        (valueKey === "name" && opt.item.name === value) ||
        (valueKey === "id" && opt.item.id === value)
    );
  }, [formattedOptions, value, valueKey]);

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <Label className={cn(defaultLabelClass, labelClassName)}>
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              defaultTriggerClass,
              triggerClassName,
              className,
              !value && "text-slate-400 font-normal",
              error && "border-rose-500 focus:ring-rose-500 bg-rose-50/10"
            )}
          >
            <span className="truncate text-left flex-1 min-w-0">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 z-50 rounded-xl shadow-lg border border-slate-200"
          align="start"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command className="rounded-xl">
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9 text-xs"
            />
            <CommandList className="max-h-[260px] text-xs">
              <CommandEmpty className="p-3 text-center text-xs text-slate-400">
                {emptyText}
              </CommandEmpty>
              <CommandGroup>
                {formattedOptions.map((option, index) => {
                  const isSelected =
                    value === option.value ||
                    (valueKey === "name" && option.item.name === value) ||
                    (valueKey === "id" && option.item.id === value);

                  return (
                    <CommandItem
                      key={`${option.value}-${index}`}
                      value={option.value}
                      keywords={[
                        option.label,
                        option.label.replace(/\s+/g, ""),
                        ...(option.item.productCode
                          ? [
                              option.item.productCode,
                              option.item.productCode.replace(/\s+/g, ""),
                            ]
                          : []),
                        ...(option.item.unit ? [option.item.unit] : []),
                      ]}
                      onSelect={() => {
                        const chosenVal = option.value;
                        onChange(chosenVal, option.item);
                        setOpen(false);
                      }}
                      className="text-xs py-1.5 px-2.5 cursor-pointer aria-selected:bg-emerald-50 aria-selected:text-emerald-900"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5 shrink-0 text-emerald-600",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate font-medium">
                          {option.label}
                        </span>
                        {option.subLabel && (
                          <span className="text-[11px] text-slate-400 truncate">
                            {option.subLabel}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ActivityProductSelect;
