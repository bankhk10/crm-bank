"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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

  // อัพเดทค่า postalCode อัตโนมัติ เมื่อเลือกที่อยู่ หรือเมื่อข้อมูลจังหวัดถูกโหลด
  useEffect(() => {
    const p = provinces.find((pp: any) => pp.name === province);
    const d = p?.districts?.find((dd: any) => dd.name === district);
    const s = d?.subdistricts?.find((ss: any) => ss.name === subdistrict);
    setPostalCode(s?.postalCode);

    if (onChange) {
      onChange({ province, district, subdistrict, postalCode: s?.postalCode });
    }
  }, [province, district, subdistrict, provinces]);

  // sync ค่าเมื่อ parent ส่งมา
  useEffect(() => {
    if (!value) return;
    if (value.province !== undefined) setProvince(value.province);
    if (value.district !== undefined) setDistrict(value.district);
    if (value.subdistrict !== undefined) setSubdistrict(value.subdistrict);
    if (value.postalCode !== undefined) setPostalCode(value.postalCode);
  }, [value]);

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="w-full">
        <Label className="mx-2 mt-2 text-sm font-bold text-gray-900">
          จังหวัด
        </Label>
        <Select
          value={province ?? ""}
          onValueChange={(v) => {
            setProvince(v || undefined);
            setDistrict(undefined);
            setSubdistrict(undefined);
          }}
        >
          <SelectTrigger className="mt-1 text-base">
            <SelectValue placeholder="เลือกจังหวัด" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p: any) => (
              <SelectItem key={p.id} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Label className="mx-2 mt-2 text-sm font-bold text-gray-900">
          อำเภอ/เขต
        </Label>
        <Select
          value={district ?? ""}
          onValueChange={(v) => {
            setDistrict(v || undefined);
            setSubdistrict(undefined);
          }}
          disabled={!province}
        >
          <SelectTrigger className="mt-1 text-base">
            <SelectValue
              placeholder={
                province ? "เลือกอำเภอ/เขต" : "กรุณาเลือกจังหวัดก่อน"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d: any) => (
              <SelectItem key={d.id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Label className="mx-2 mt-2 text-sm font-bold text-gray-900">
          ตำบล
        </Label>
        <Select
          value={subdistrict ?? ""}
          onValueChange={(v) => {
            setSubdistrict(v || undefined);
          }}
          disabled={!district}
        >
          <SelectTrigger className="mt-1 text-base">
            <SelectValue
              placeholder={district ? "เลือกตำบล" : "กรุณาเลือกอำเภอก่อน"}
            />
          </SelectTrigger>
          <SelectContent>
            {subdistricts.map((s: any) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Label className="mx-2 mt-2 text-sm font-bold text-gray-900">
          รหัสไปรษณีย์
        </Label>
        <Input
          value={postalCode ?? ""}
          readOnly
          disabled
          className="mt-1 text-base !h-11"
        />
      </div>
    </div>
  );
}
