"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormCombobox } from "./FormCombobox";

type AddressValue = {
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
};

type AddressErrors = {
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
};

type Props = {
  value?: AddressValue;
  onChange?: (next: AddressValue) => void;
  errors?: AddressErrors;
  required?: boolean;
};

const labelTextClass = "text-base font-medium mx-2";
const inputTextClass = "mt-1 h-11 text-base placeholder:text-gray-500";

export default function ThaiAddressPicker({ value, onChange, errors, required }: Props) {
  const [provinces, setProvinces] = useState<any[]>([]);

  // โหลดข้อมูลจังหวัด
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/thai-addresses");
        if (!res.ok) return;
        const json = await res.json();
        const normalized = (json as any[]).map((p) => ({
          id: p.id,
          name: p.name_th,
          districts: (p.districts || []).map((d: any) => ({
            id: d.id,
            name: d.name_th,
            subdistricts: (d.sub_districts || []).map((s: any) => ({
              id: s.id,
              name: s.name_th,
              postalCode: String(s.zip_code),
            })),
          })),
        }));
        setProvinces(normalized);
      } catch (e) {
        console.error("โหลดจังหวัดล้มเหลว", e);
      }
    })();
  }, []);

  // Safe access to value props
  const safeValue = value || {};
  const { province, district, subdistrict, postalCode } = safeValue;

  const districts = useMemo(() => {
    const p = provinces.find((pp: any) => pp.name === province);
    return p ? p.districts : [];
  }, [province, provinces]);

  const subdistricts = useMemo(() => {
    const d = districts.find((dd: any) => dd.name === district);
    return d ? d.subdistricts : [];
  }, [district, districts]);

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* จังหวัด */}
      <FormCombobox
        label="จังหวัด"
        value={province || ""}
        onChange={(v) => {
          onChange?.({
            ...safeValue,
            province: v || undefined,
            district: undefined,
            subdistrict: undefined,
            postalCode: undefined,
          });
        }}
        options={provinces.map((p: any) => ({
          value: p.name,
          label: p.name,
        }))}
        placeholder="เลือกจังหวัด"
        searchPlaceholder="ค้นหาจังหวัด..."
        emptyText="ไม่พบจังหวัด"
        containerClassName="w-full"
        required={required}
        error={errors?.province}
      />

      {/* อำเภอ/เขต */}
      <FormCombobox
        label="อำเภอ/เขต"
        value={district || ""}
        onChange={(v) => {
          onChange?.({
            ...safeValue,
            district: v || undefined,
            subdistrict: undefined,
            postalCode: undefined,
          });
        }}
        disabled={!province}
        options={districts.map((d: any) => ({
          value: d.name,
          label: d.name,
        }))}
        placeholder={province ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"}
        searchPlaceholder="ค้นหาอำเภอ/เขต..."
        emptyText="ไม่พบอำเภอ/เขต"
        containerClassName="w-full"
        required={required}
        error={errors?.district}
      />

      {/* ตำบล/แขวง */}
      <FormCombobox
        label="ตำบล/แขวง"
        value={subdistrict || ""}
        onChange={(v) => {
          const selectedSubdistrict = subdistricts.find(
            (s: any) => s.name === v,
          );
          onChange?.({
            ...safeValue,
            subdistrict: v || undefined,
            postalCode: selectedSubdistrict?.postalCode,
          });
        }}
        disabled={!district}
        options={subdistricts.map((s: any) => ({
          value: s.name,
          label: s.name,
        }))}
        placeholder={district ? "เลือกตำบล/แขวง" : "เลือกอำเภอก่อน"}
        searchPlaceholder="ค้นหาตำบล/แขวง..."
        emptyText="ไม่พบตำบล/แขวง"
        containerClassName="w-full"
        required={required}
        error={errors?.subdistrict}
      />

      {/* รหัสไปรษณีย์ */}
      <div className="w-full">
        <Label className={labelTextClass}>
          รหัสไปรษณีย์
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          value={postalCode ?? ""}
          readOnly
          disabled
          className={inputTextClass}
        />
        {errors?.postalCode && (
          <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>
        )}
      </div>
    </div>
  );
}
