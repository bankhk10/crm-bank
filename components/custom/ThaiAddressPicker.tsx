"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormCombobox } from "./FormCombobox";

type AddressValue = {
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
};

type Props = {
  value?: AddressValue;
  onChange?: (next: AddressValue) => void;
};

const labelTextClass = "text-base font-medium mx-2";
const inputTextClass = "mt-1 h-11 text-base placeholder:text-gray-500";

export default function ThaiAddressPicker({ value, onChange }: Props) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [province, setProvince] = useState<string | undefined>(value?.province);
  const [district, setDistrict] = useState<string | undefined>(value?.district);
  const [subdistrict, setSubdistrict] = useState<string | undefined>(
    value?.subdistrict,
  );
  const [postalCode, setPostalCode] = useState<string | undefined>(
    value?.postalCode,
  );

  // Store latest onChange callback
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
              postalCode: s.zip_code,
            })),
          })),
        }));
        setProvinces(normalized);
      } catch (e) {
        console.error("โหลดจังหวัดล้มเหลว", e);
      }
    })();
  }, []);

  const districts = useMemo(() => {
    const p = provinces.find((pp: any) => pp.name === province);
    return p ? p.districts : [];
  }, [province, provinces]);

  const subdistricts = useMemo(() => {
    const d = districts.find((dd: any) => dd.name === district);
    return d ? d.subdistricts : [];
  }, [district, districts]);

  // Track previous value to detect external changes
  const prevValueRef = useRef(value);

  // sync ค่าเมื่อ parent ส่งมาครั้งแรก หรือเมื่อมีการเปลี่ยนแปลงจาก parent
  useEffect(() => {
    if (!value) return;
    if (provinces.length === 0) return; // ⭐ สำคัญมาก

    if (value.province !== undefined) setProvince(value.province);
    if (value.district !== undefined) setDistrict(value.district);
    if (value.subdistrict !== undefined) setSubdistrict(value.subdistrict);
    if (value.postalCode !== undefined) setPostalCode(value.postalCode);

    prevValueRef.current = value;
  }, [value, provinces]);

  // อัพเดทค่า postalCode อัตโนมัติ และแจ้ง parent เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const p = provinces.find((pp: any) => pp.name === province);
    const d = p?.districts?.find((dd: any) => dd.name === district);
    const s = d?.subdistricts?.find((ss: any) => ss.name === subdistrict);
    const newPostalCode = s?.postalCode;

    // Update postal code if it changed
    if (newPostalCode !== postalCode) {
      setPostalCode(newPostalCode);
    }

    // Notify parent of changes
    const newValue = {
      province,
      district,
      subdistrict,
      postalCode: newPostalCode,
    };

    // Only call onChange if the value actually changed
    const hasChanged =
      newValue.province !== prevValueRef.current?.province ||
      newValue.district !== prevValueRef.current?.district ||
      newValue.subdistrict !== prevValueRef.current?.subdistrict ||
      newValue.postalCode !== prevValueRef.current?.postalCode;

    if (hasChanged && onChangeRef.current) {
      prevValueRef.current = newValue;
      onChangeRef.current(newValue);
    }
  }, [province, district, subdistrict, provinces, postalCode]);

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* จังหวัด */}
      <FormCombobox
        label="จังหวัด"
        value={province || ""}
        onChange={(v) => {
          setProvince(v || undefined);
          if (v !== province) {
            setDistrict(undefined);
            setSubdistrict(undefined);
          }
        }}
        options={provinces.map((p: any) => ({
          value: p.name,
          label: p.name,
        }))}
        placeholder="เลือกจังหวัด"
        searchPlaceholder="ค้นหาจังหวัด..."
        emptyText="ไม่พบจังหวัด"
        containerClassName="w-full"
      />

      {/* อำเภอ/เขต */}
      <FormCombobox
        label="อำเภอ/เขต"
        value={district || ""}
        onChange={(v) => {
          setDistrict(v || undefined);
          setSubdistrict(undefined);
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
      />

      {/* ตำบล/แขวง */}
      <FormCombobox
        label="ตำบล/แขวง"
        value={subdistrict || ""}
        onChange={(v) => setSubdistrict(v || undefined)}
        disabled={!district}
        options={subdistricts.map((s: any) => ({
          value: s.name,
          label: s.name,
        }))}
        placeholder={district ? "เลือกตำบล/แขวง" : "เลือกอำเภอก่อน"}
        searchPlaceholder="ค้นหาตำบล/แขวง..."
        emptyText="ไม่พบตำบล/แขวง"
        containerClassName="w-full"
      />

      {/* รหัสไปรษณีย์ */}
      <div className="w-full">
        <Label className={labelTextClass}>รหัสไปรษณีย์</Label>
        <Input
          value={postalCode ?? ""}
          readOnly
          disabled
          className={inputTextClass}
        />
      </div>
    </div>
  );
}
