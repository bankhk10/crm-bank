"use client";

import React, { useMemo } from "react";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { ActivityInput } from "@/components/activity/activity-input";
import { Label } from "@/components/ui/label";
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

export interface ActivityAddressPickerProps {
  value?: ActivityAddressValue;
  onChange?: (next: ActivityAddressValue) => void;
  errors?: ActivityAddressErrors;
  disabled?: boolean;
  required?: boolean;
  levels?: "province-district" | "full";
  provinceLabel?: string;
  districtLabel?: string;
  subdistrictLabel?: string;
  postalCodeLabel?: string;
  provincePlaceholder?: string;
  districtPlaceholder?: string;
  subdistrictPlaceholder?: string;
  containerClassName?: string;
  gridClassName?: string;
}

const defaultLabelClass = "block text-xs font-semibold text-slate-700 mb-1 mx-0";
const defaultTriggerClass =
  "h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";

/**
 * ActivityAddressPicker
 *
 * Dedicated cascading address picker for Activity Plans (Location & Team, Meeting Venue, etc.).
 * Supports 2 levels ("province-district") or 4 levels ("full") with automatic cascading reset.
 */
export function ActivityAddressPicker({
  value,
  onChange,
  errors,
  disabled = false,
  required = false,
  levels = "province-district",
  provinceLabel = "จังหวัด",
  districtLabel = "อำเภอ / เขต",
  subdistrictLabel = "ตำบล / แขวง",
  postalCodeLabel = "รหัสไปรษณีย์",
  provincePlaceholder = "เลือกจังหวัด",
  districtPlaceholder = "เลือกอำเภอ / เขต",
  subdistrictPlaceholder = "เลือกตำบล / แขวง",
  containerClassName,
  gridClassName,
}: ActivityAddressPickerProps) {
  const {
    provinces,
    getDistricts,
    getSubdistricts,
    getPostalCode,
    isLoading,
  } = useActivityAddresses();

  const safeValue = value || {};
  const { province = "", district = "", subdistrict = "", postalCode = "" } = safeValue;

  const districtOptions = useMemo(() => {
    return getDistricts(province);
  }, [province, getDistricts]);

  const subdistrictOptions = useMemo(() => {
    return getSubdistricts(province, district).map((s) => ({
      value: s.value,
      label: s.label,
    }));
  }, [province, district, getSubdistricts]);

  const handleProvinceChange = (newProvince: string) => {
    onChange?.({
      province: newProvince || undefined,
      district: undefined,
      subdistrict: undefined,
      postalCode: undefined,
    });
  };

  const handleDistrictChange = (newDistrict: string) => {
    onChange?.({
      ...safeValue,
      district: newDistrict || undefined,
      subdistrict: undefined,
      postalCode: undefined,
    });
  };

  const handleSubdistrictChange = (newSubdistrict: string) => {
    const code = getPostalCode(province, district, newSubdistrict);
    onChange?.({
      ...safeValue,
      subdistrict: newSubdistrict || undefined,
      postalCode: code || undefined,
    });
  };

  const isFull = levels === "full";

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
          <FormCombobox
            label={provinceLabel}
            labelClassName={defaultLabelClass}
            triggerClassName={defaultTriggerClass}
            value={province}
            onChange={handleProvinceChange}
            options={provinces}
            placeholder={isLoading ? "กำลังโหลด..." : provincePlaceholder}
            searchPlaceholder="ค้นหาจังหวัด..."
            emptyText="ไม่พบจังหวัด"
            disabled={disabled || isLoading}
            required={required}
            error={errors?.province}
          />
        </div>

        {/* 2. อำเภอ / เขต (District) */}
        <div>
          <FormCombobox
            label={districtLabel}
            labelClassName={defaultLabelClass}
            triggerClassName={defaultTriggerClass}
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
              !province
                ? "กรุณาเลือกจังหวัดก่อน"
                : "ไม่พบอำเภอ"
            }
            disabled={disabled || !province || isLoading}
            required={required}
            error={errors?.district}
          />
        </div>

        {/* 3. ตำบล / แขวง (Subdistrict) - Optional for full mode */}
        {isFull && (
          <div>
            <FormCombobox
              label={subdistrictLabel}
              labelClassName={defaultLabelClass}
              triggerClassName={defaultTriggerClass}
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
                !district
                  ? "กรุณาเลือกอำเภอก่อน"
                  : "ไม่พบตำบล"
              }
              disabled={disabled || !district || isLoading}
              required={required}
              error={errors?.subdistrict}
            />
          </div>
        )}

        {/* 4. รหัสไปรษณีย์ (Postal Code) - Optional for full mode */}
        {isFull && (
          <div>
            <Label className={defaultLabelClass}>
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
