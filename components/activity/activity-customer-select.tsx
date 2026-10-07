"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Store, Users, UserCheck } from "lucide-react";
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
import {
  useActivityCustomers,
  type ActivityCustomerType,
  type ActivityCustomerItem,
} from "./hooks/use-activity-customers";

export type { ActivityCustomerType, ActivityCustomerItem };

export interface ActivityCustomerSelectProps {
  id?: string;
  type?: ActivityCustomerType;
  province?: string | null;
  value?: string;
  valueKey?: "id" | "name";
  onChange: (value: string, customer?: ActivityCustomerItem) => void;
  customers?: ActivityCustomerItem[];
  label?: string;
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

  // Unregistered Farmer integration
  allowUnregistered?: boolean;
  isUnregistered?: boolean;
  onUnregisteredToggle?: (checked: boolean) => void;
  unregisteredName?: string;
  onUnregisteredNameChange?: (name: string) => void;
  unregisteredPhone?: string;
  onUnregisteredPhoneChange?: (phone: string) => void;
  unregisteredNameLabel?: string;
  unregisteredPhoneLabel?: string;
}

interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  item: ActivityCustomerItem;
}

const defaultLabelClass = "block text-xs font-semibold text-slate-700 mb-1 mx-0";
const defaultTriggerClass =
  "h-9 min-h-[36px] py-1 px-3 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium w-full justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed";

/**
 * ActivityCustomerSelect
 *
 * Dedicated customer selector component for Activity Plans supporting:
 * - FARMER (Province-gated with unregistered farmer toggle)
 * - STORE (Combined Dealer & Subdealer)
 * - DEALER (Main Dealer stores)
 * - SUBDEALER (Subdealer stores)
 * - BROKER (Coordinators & Contractors)
 */
export function ActivityCustomerSelect({
  id,
  type = "STORE",
  province,
  value = "",
  valueKey = "id",
  onChange,
  customers = [],
  label,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  required = false,
  error,
  className,
  triggerClassName,
  labelClassName,
  containerClassName,
  allowUnregistered = false,
  isUnregistered = false,
  onUnregisteredToggle,
  unregisteredName = "",
  onUnregisteredNameChange,
  unregisteredPhone = "",
  onUnregisteredPhoneChange,
  unregisteredNameLabel = "ชื่อ - สกุล เกษตรกร",
  unregisteredPhoneLabel = "เบอร์โทรศัพท์",
}: ActivityCustomerSelectProps) {
  const [open, setOpen] = useState(false);

  const {
    storeOptions,
    dealerOptions,
    subdealerOptions,
    brokerOptions,
    getFarmersForProvince,
    loadingFarmers,
    loadingStores,
  } = useActivityCustomers({
    selectedProvince: province,
    customers,
  });

  // Source list according to requested type
  const rawCustomerList = useMemo(() => {
    switch (type) {
      case "FARMER":
        return getFarmersForProvince(province);
      case "DEALER":
        return dealerOptions;
      case "SUBDEALER":
        return subdealerOptions;
      case "BROKER":
        return brokerOptions;
      case "STORE":
      default:
        return storeOptions;
    }
  }, [
    type,
    province,
    getFarmersForProvince,
    dealerOptions,
    subdealerOptions,
    brokerOptions,
    storeOptions,
  ]);

  // Format options with badges/labels
  const formattedOptions: ComboboxOption[] = useMemo(() => {
    const list: ComboboxOption[] = rawCustomerList.map((c) => {
      let displayLabel = c.name;
      let subLabel: string | undefined = undefined;

      if (type === "FARMER") {
        displayLabel = `${c.name}${c.customerCode ? ` (${c.customerCode})` : ""}`;
      } else {
        const typeLabel =
          c.customerType === "DEALER"
            ? "ตัวแทนจำหน่าย"
            : c.customerType === "SUBDEALER"
              ? "ร้านค้าย่อย"
              : c.customerType === "BROKER"
                ? "นายหน้า"
                : "";
        const provInfo = c.province ? ` - จ.${c.province}` : "";
        displayLabel = `${c.name}${typeLabel ? ` (${typeLabel})` : ""}${provInfo}`;
        subLabel = c.customerCode ? `รหัส: ${c.customerCode}` : undefined;
      }

      const optionVal = valueKey === "name" ? c.name : c.id;

      return {
        value: optionVal,
        label: displayLabel,
        subLabel,
        item: c,
      };
    });

    // Preserve selected customer option even if not in current filtered list
    if (value && !list.some((o) => o.value === value)) {
      const matched = (customers || []).find(
        (c) => (valueKey === "name" ? c.name === value : c.id === value)
      );
      if (matched) {
        const typeLabel =
          matched.customerType === "DEALER"
            ? "ตัวแทนจำหน่าย"
            : matched.customerType === "SUBDEALER"
              ? "ร้านค้าย่อย"
              : "";
        list.push({
          value,
          label: `${matched.name}${typeLabel ? ` (${typeLabel})` : ""}${matched.province ? ` - จ.${matched.province}` : ""}`,
          item: matched,
        });
      }
    }

    return list;
  }, [rawCustomerList, type, valueKey, value, customers]);

  const selectedOption = useMemo(() => {
    return formattedOptions.find(
      (opt) => opt.value === value || opt.label === value || opt.item.id === value
    );
  }, [formattedOptions, value]);

  // Dynamic default label & placeholder
  const effectiveLabel = useMemo(() => {
    if (label !== undefined) return label;
    switch (type) {
      case "FARMER":
        return "เกษตรกร";
      case "DEALER":
        return "ร้านค้า Dealer";
      case "SUBDEALER":
        return "ร้านค้า Subdealer";
      case "BROKER":
        return "นายหน้า";
      case "STORE":
      default:
        return "ร้านค้า (ตัวแทนจำหน่าย / ร้านค้าย่อย)";
    }
  }, [label, type]);

  const effectivePlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    if (type === "FARMER" && !province) {
      return "กรุณาเลือกจังหวัดก่อน";
    }
    if (type === "FARMER" && loadingFarmers) {
      return "กำลังโหลดรายชื่อเกษตรกร...";
    }
    if (type !== "FARMER" && loadingStores) {
      return "กำลังโหลดรายชื่อร้านค้า...";
    }
    switch (type) {
      case "FARMER":
        return "เลือกเกษตรกร (Customer Master)";
      case "DEALER":
        return "เลือกร้านค้า Dealer...";
      case "SUBDEALER":
        return "เลือกร้านค้า Subdealer...";
      case "BROKER":
        return "เลือกนายหน้า...";
      case "STORE":
      default:
        return "เลือกร้านค้า (Customer Master)";
    }
  }, [placeholder, type, province, loadingFarmers, loadingStores]);

  const effectiveEmptyText = useMemo(() => {
    if (emptyText) return emptyText;
    if (type === "FARMER" && !province) {
      return "กรุณาเลือกจังหวัดก่อน";
    }
    switch (type) {
      case "FARMER":
        return "ไม่พบเกษตรกรในจังหวัดนี้";
      case "DEALER":
        return "ไม่พบร้านค้า Dealer ในระบบ";
      case "SUBDEALER":
        return "ไม่พบร้านค้า Subdealer ในระบบ";
      case "BROKER":
        return "ไม่พบนายหน้าในระบบ";
      case "STORE":
      default:
        return "ไม่พบร้านค้าในระบบ";
    }
  }, [emptyText, type, province]);

  const isFarmerModeDisabled = type === "FARMER" && !province;
  const isInputDisabled = disabled || isFarmerModeDisabled || (type === "FARMER" && loadingFarmers);

  return (
    <div className={cn("space-y-3", containerClassName)}>
      {/* 1. Customer Dropdown (when registered or non-farmer) */}
      {!isUnregistered && (
        <div className="w-full">
          {effectiveLabel && (
            <Label className={cn(defaultLabelClass, labelClassName)}>
              {effectiveLabel}
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
                disabled={isInputDisabled}
                className={cn(
                  defaultTriggerClass,
                  triggerClassName,
                  className,
                  !value && "text-slate-400 font-normal",
                  error && "border-rose-500 focus:ring-rose-500 bg-rose-50/10"
                )}
              >
                <span className="truncate text-left flex-1 min-w-0">
                  {selectedOption ? selectedOption.label : effectivePlaceholder}
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
                  placeholder={
                    searchPlaceholder ||
                    (type === "FARMER"
                      ? "ค้นหาชื่อ หรือรหัสเกษตรกร..."
                      : "ค้นหาชื่อร้านค้า หรือรหัส...")
                  }
                  className="h-9 text-xs"
                />
                <CommandList className="max-h-[260px] text-xs">
                  <CommandEmpty className="p-3 text-center text-xs text-slate-400">
                    {effectiveEmptyText}
                  </CommandEmpty>
                  <CommandGroup>
                    {formattedOptions.map((option, index) => (
                      <CommandItem
                        key={`${option.value}-${index}`}
                        value={option.value}
                        keywords={[
                          option.label,
                          option.label.replace(/\s+/g, ""),
                          option.item.name,
                          ...(option.item.customerCode
                            ? [option.item.customerCode]
                            : []),
                        ]}
                        onSelect={(currentValue) => {
                          const nextVal = currentValue === value ? "" : currentValue;
                          const chosen = formattedOptions.find(
                            (o) => o.value === nextVal
                          );
                          onChange(nextVal, chosen?.item);
                          setOpen(false);
                        }}
                        className="text-xs py-1.5 px-2.5 cursor-pointer aria-selected:bg-emerald-50 aria-selected:text-emerald-900"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5 shrink-0 text-emerald-600",
                            value === option.value
                              ? "opacity-100"
                              : "opacity-0"
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
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        </div>
      )}

      {/* 2. Unregistered Farmer Toggle */}
      {allowUnregistered && (
        <div className="flex items-center gap-2 pt-0.5">
          <input
            type="checkbox"
            id={id ? `unregistered-toggle-${id}` : "unregistered-toggle"}
            checked={Boolean(isUnregistered)}
            onChange={(e) => onUnregisteredToggle?.(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
          />
          <label
            htmlFor={id ? `unregistered-toggle-${id}` : "unregistered-toggle"}
            className="text-xs font-medium text-slate-700 cursor-pointer select-none"
          >
            ไม่มีเกษตรกรในระบบ{" "}
            <span className="text-[11px] text-slate-500 font-normal">
              (กรอกชื่อและเบอร์โทรศัพท์โดยไม่ผูกกับ Master Data)
            </span>
          </label>
        </div>
      )}

      {/* 3. Unregistered Farmer Fields */}
      {allowUnregistered && isUnregistered && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {unregisteredNameLabel} <span className="text-rose-500">*</span>
            </label>
            <ActivityInput
              type="text"
              value={unregisteredName}
              onChange={(e) => onUnregisteredNameChange?.(e.target.value)}
              disabled={disabled}
              placeholder="ระบุชื่อ - สกุล เกษตรกร..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {unregisteredPhoneLabel}
            </label>
            <ActivityInput
              type="tel"
              value={unregisteredPhone}
              onChange={(e) => onUnregisteredPhoneChange?.(e.target.value)}
              disabled={disabled}
              placeholder="เช่น 0812345678"
              maxLength={12}
            />
          </div>
        </div>
      )}
    </div>
  );
}
