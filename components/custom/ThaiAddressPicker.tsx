"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    value?.subdistrict
  );
  const [postalCode, setPostalCode] = useState<string | undefined>(
    value?.postalCode
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

    // Ignore if parent sends all empty/undefined (this happens during re-renders)
    const allEmpty = !value.province && !value.district && !value.subdistrict && !value.postalCode;
    if (allEmpty) {
      return;
    }

    // Only update if value actually changed from parent (not from our own onChange call)
    const valueChanged =
      value.province !== prevValueRef.current?.province ||
      value.district !== prevValueRef.current?.district ||
      value.subdistrict !== prevValueRef.current?.subdistrict ||
      value.postalCode !== prevValueRef.current?.postalCode;

    if (valueChanged) {
      // Only update if the new value is defined
      if (value.province !== undefined) setProvince(value.province);
      if (value.district !== undefined) setDistrict(value.district);
      if (value.subdistrict !== undefined) setSubdistrict(value.subdistrict);
      if (value.postalCode !== undefined) setPostalCode(value.postalCode);

      prevValueRef.current = value;
    }
  }, [value]);

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
    const newValue = { province, district, subdistrict, postalCode: newPostalCode };

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
      <div className="w-full">
        <Label className={labelTextClass}>จังหวัด</Label>
        <Select
          value={province || ""}
          onValueChange={(v) => {
            setProvince(v || undefined);
            setDistrict(undefined);
            setSubdistrict(undefined);
          }}
        >
          <SelectTrigger className={`w-full font-normal ${inputTextClass}`}>
            <SelectValue placeholder="เลือกจังหวัด" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectGroup>
              <SelectLabel>จังหวัด</SelectLabel>
              {provinces.map((p: any) => (
                <SelectItem key={p.id} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* อำเภอ/เขต */}
      <div className="w-full">
        <Label className={labelTextClass}>อำเภอ/เขต</Label>
        <Select
          value={district || ""}
          onValueChange={(v) => {
            setDistrict(v || undefined);
            setSubdistrict(undefined);
          }}
          disabled={!province}
        >
          <SelectTrigger className={`w-full font-normal ${inputTextClass}`}>
            <SelectValue placeholder={province ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectGroup>
              <SelectLabel>อำเภอ/เขต</SelectLabel>
              {districts.map((d: any) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* ตำบล/แขวง */}
      <div className="w-full">
        <Label className={labelTextClass}>ตำบล/แขวง</Label>
        <Select
          value={subdistrict || ""}
          onValueChange={(v) => {
            setSubdistrict(v || undefined);
          }}
          disabled={!district}
        >
          <SelectTrigger className={`w-full font-normal ${inputTextClass}`}>
            <SelectValue placeholder={district ? "เลือกตำบล/แขวง" : "เลือกอำเภอก่อน"} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectGroup>
              <SelectLabel>ตำบล/แขวง</SelectLabel>
              {subdistricts.map((s: any) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

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
