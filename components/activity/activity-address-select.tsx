"use client";

import React, { useState, useMemo } from "react";
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
import { ActivityInput } from "@/components/activity/activity-input";
import { cn } from "@/lib/utils";
import { useActivityAddresses } from "./hooks/use-activity-addresses";

export interface ActivityAddressValue {
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
}

export interface ActivityAddressErrors {
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
}

export interface ActivityAddressSelectProps {
  id?: string;
  levels?: "province" | "province-district" | "full";
  value?: string | ActivityAddressValue;
  onChange?: (value: any) => void;
  errors?: ActivityAddressErrors;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  provinceLabel?: string;
  districtLabel?: string;
  subdistrictLabel?: string;
  postalCodeLabel?: string;
  placeholder?: string;
  provincePlaceholder?: string;
  districtPlaceholder?: string;
  subdistrictPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
  gridClassName?: string;
}

interface ActivityComboboxProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  triggerClassName?: string;
  labelClassName?: string;
}

const defaultLabelClass = "block text-xs font-semibold text-slate-700 mb-1 mx-0";
const defaultTriggerClass =
  "h-9 min-h-[36px] py-1 px-3 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium w-full justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed";

/**
 * ActivityCombobox
 *
 * Internal lightweight combobox primitive dedicated to Activity Plan.
 * Built with Radix Popover and cmdk Command without dependency on FormCombobox.
 */
function ActivityCombobox({
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
}: ActivityComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value || opt.label === value);
  }, [options, value]);

  return (
    <div className="w-full">
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
                {options.map((option, index) => (
                  <CommandItem
                    key={`${option.value}-${index}`}
                    value={option.value}
                    keywords={[option.label, option.label.replace(/\s+/g, "")]}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className="text-xs py-1.5 px-2.5 cursor-pointer aria-selected:bg-emerald-50 aria-selected:text-emerald-900"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5 shrink-0 text-emerald-600",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate flex-1">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

/**
 * ActivityAddressSelect
 *
 * Consolidated, mobile-first address and province selector for Activity Plans.
 * Supports 3 levels:
 * - "province": Single province dropdown (supports string value or object value)
 * - "province-district": 2-level cascading selector (Province + District)
 * - "full": 4-level cascading selector (Province + District + Subdistrict + PostalCode)
 */
export function ActivityAddressSelect({
  id,
  levels = "province",
  value,
  onChange,
  errors,
  error,
  disabled = false,
  required = false,
  label,
  provinceLabel = "จังหวัด",
  districtLabel = "อำเภอ / เขต",
  subdistrictLabel = "ตำบล / แขวง",
  postalCodeLabel = "รหัสไปรษณีย์",
  placeholder,
  provincePlaceholder = "เลือกจังหวัด",
  districtPlaceholder = "เลือกอำเภอ / เขต",
  subdistrictPlaceholder = "เลือกตำบล / แขวง",
  className,
  triggerClassName,
  labelClassName,
  containerClassName,
  gridClassName,
}: ActivityAddressSelectProps) {
  const {
    provinces,
    getDistricts,
    getSubdistricts,
    getPostalCode,
    isLoading,
  } = useActivityAddresses();

  // Normalize string vs object value
  const isSingleProvinceMode = levels === "province";
  const safeAddressValue: ActivityAddressValue = useMemo(() => {
    if (typeof value === "string") {
      return { province: value };
    }
    return value || {};
  }, [value]);

  const {
    province = "",
    district = "",
    subdistrict = "",
    postalCode = "",
  } = safeAddressValue;

  const districtOptions = useMemo(() => {
    if (isSingleProvinceMode) return [];
    return getDistricts(province);
  }, [isSingleProvinceMode, province, getDistricts]);

  const subdistrictOptions = useMemo(() => {
    if (levels !== "full") return [];
    return getSubdistricts(province, district).map((s) => ({
      value: s.value,
      label: s.label,
    }));
  }, [levels, province, district, getSubdistricts]);

  // Handle Province Change
  const handleProvinceChange = (newProvince: string) => {
    if (isSingleProvinceMode) {
      if (typeof value === "string" || value === undefined) {
        onChange?.(newProvince);
      } else {
        onChange?.({
          province: newProvince || undefined,
          district: undefined,
          subdistrict: undefined,
          postalCode: undefined,
        });
      }
      return;
    }

    onChange?.({
      province: newProvince || undefined,
      district: undefined,
      subdistrict: undefined,
      postalCode: undefined,
    });
  };

  // Handle District Change
  const handleDistrictChange = (newDistrict: string) => {
    onChange?.({
      ...safeAddressValue,
      district: newDistrict || undefined,
      subdistrict: undefined,
      postalCode: undefined,
    });
  };

  // Handle Subdistrict Change
  const handleSubdistrictChange = (newSubdistrict: string) => {
    const code = getPostalCode(province, district, newSubdistrict);
    onChange?.({
      ...safeAddressValue,
      subdistrict: newSubdistrict || undefined,
      postalCode: code || undefined,
    });
  };

  // Single Province Mode: Render clean single dropdown
  if (isSingleProvinceMode) {
    const provinceError = error || errors?.province;
    return (
      <div className={containerClassName}>
        <ActivityCombobox
          id={id}
          label={label || provinceLabel}
          labelClassName={labelClassName}
          triggerClassName={triggerClassName || className}
          value={province}
          onChange={handleProvinceChange}
          options={provinces}
          placeholder={
            isLoading
              ? "กำลังโหลดจังหวัด..."
              : placeholder || provincePlaceholder
          }
          searchPlaceholder="ค้นหาจังหวัด..."
          emptyText="ไม่พบจังหวัด"
          disabled={disabled || isLoading}
          required={required}
          error={provinceError}
        />
      </div>
    );
  }

  const isFull = levels === "full";

  // Multi-level Mode: Render cascading Grid
  return (
    <div className={cn("space-y-3", containerClassName)}>
      <div
        className={cn(
          "grid gap-3",
          isFull
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2",
          gridClassName
        )}
      >
        {/* 1. จังหวัด (Province) */}
        <div>
          <ActivityCombobox
            id={id ? `${id}-province` : undefined}
            label={provinceLabel}
            labelClassName={labelClassName}
            triggerClassName={triggerClassName}
            value={province}
            onChange={handleProvinceChange}
            options={provinces}
            placeholder={
              isLoading ? "กำลังโหลดจังหวัด..." : provincePlaceholder
            }
            searchPlaceholder="ค้นหาจังหวัด..."
            emptyText="ไม่พบจังหวัด"
            disabled={disabled || isLoading}
            required={required}
            error={errors?.province || error}
          />
        </div>

        {/* 2. อำเภอ / เขต (District) */}
        <div>
          <ActivityCombobox
            id={id ? `${id}-district` : undefined}
            label={districtLabel}
            labelClassName={labelClassName}
            triggerClassName={triggerClassName}
            value={district}
            onChange={handleDistrictChange}
            options={districtOptions}
            placeholder={
              !province
                ? "กรุณาเลือกจังหวัดก่อน"
                : districtPlaceholder
            }
            searchPlaceholder="ค้นหาอำเภอ..."
            emptyText={
              !province ? "กรุณาเลือกจังหวัดก่อน" : "ไม่พบอำเภอ"
            }
            disabled={disabled || !province || isLoading}
            required={required}
            error={errors?.district}
          />
        </div>

        {/* 3. ตำบล / แขวง (Subdistrict) - Full mode only */}
        {isFull && (
          <div>
            <ActivityCombobox
              id={id ? `${id}-subdistrict` : undefined}
              label={subdistrictLabel}
              labelClassName={labelClassName}
              triggerClassName={triggerClassName}
              value={subdistrict}
              onChange={handleSubdistrictChange}
              options={subdistrictOptions}
              placeholder={
                !district
                  ? "กรุณาเลือกอำเภอก่อน"
                  : subdistrictPlaceholder
              }
              searchPlaceholder="ค้นหาตำบล..."
              emptyText={
                !district ? "กรุณาเลือกอำเภอก่อน" : "ไม่พบตำบล"
              }
              disabled={disabled || !district || isLoading}
              required={required}
              error={errors?.subdistrict}
            />
          </div>
        )}

        {/* 4. รหัสไปรษณีย์ (Postal Code) - Full mode only */}
        {isFull && (
          <div>
            <Label className={cn(defaultLabelClass, labelClassName)}>
              {postalCodeLabel}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </Label>
            <ActivityInput
              type="text"
              value={postalCode}
              readOnly
              disabled
              placeholder="รหัสไปรษณีย์"
              className={cn(
                "bg-slate-100 text-slate-600 cursor-not-allowed select-none",
                errors?.postalCode && "border-rose-500 bg-rose-50/10"
              )}
            />
            {errors?.postalCode && (
              <p className="text-xs text-rose-600 mt-1">{errors.postalCode}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
