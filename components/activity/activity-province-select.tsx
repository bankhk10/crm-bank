"use client";

import React, { useMemo } from "react";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { ALL_THAI_PROVINCES } from "@/lib/province-region-mapping";
import { cn } from "@/lib/utils";

export interface ActivityProvinceSelectProps {
  id?: string;
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
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
}

const defaultOptions = ALL_THAI_PROVINCES.map((p) => ({
  value: p,
  label: p,
}));

/**
 * ActivityProvinceSelect
 *
 * Dedicated, mobile-first province selector for Activity Plans (TYPE_1, TYPE_2, TYPE_7A, etc.).
 * Standardized with Activity theme tokens (h-9 min-h-[36px], text-xs, emerald focus ring).
 */
export function ActivityProvinceSelect({
  id,
  label = "จังหวัด",
  value = "",
  onChange,
  options,
  placeholder = "เลือกจังหวัด",
  searchPlaceholder = "ค้นหาจังหวัด...",
  emptyText = "ไม่พบจังหวัด",
  disabled = false,
  required = false,
  error,
  className,
  triggerClassName,
  labelClassName,
  containerClassName,
}: ActivityProvinceSelectProps) {
  const provinceOptions = useMemo(() => {
    return options || defaultOptions;
  }, [options]);

  return (
    <FormCombobox
      id={id}
      label={label}
      labelClassName={cn(
        "block text-xs font-semibold text-slate-700 mb-1 mx-0",
        labelClassName
      )}
      triggerClassName={cn(
        "h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium",
        "focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
        "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed",
        triggerClassName,
        className
      )}
      containerClassName={containerClassName}
      value={value}
      onChange={onChange}
      options={provinceOptions}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      disabled={disabled}
      required={required}
      error={error}
    />
  );
}
