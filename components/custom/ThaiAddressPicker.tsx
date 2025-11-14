"use client";

import React, { useEffect, useMemo, useState } from "react";
import FloatingLabelInput from "@/components/custom/FloatingLabelInput";

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
  const [subdistrict, setSubdistrict] = useState<string | undefined>(value?.subdistrict);
  const [postalCode, setPostalCode] = useState<string | undefined>(value?.postalCode);

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
        <FloatingLabelInput
          label="จังหวัด"
          type="select"
          options={provinces.map((p: any) => ({ value: p.name, label: p.name }))}
          value={province ?? ""}
          placeholder="-- เลือกจังหวัด --"
          searchable
          onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
            const v = (e.target as HTMLInputElement).value;
            setProvince(v || undefined);
            setDistrict(undefined);
            setSubdistrict(undefined);
          }}
        />
      </div>

      <div className="w-full">
        <FloatingLabelInput
          label="อำเภอ/เขต"
          type="select"
          options={districts.map((d: any) => ({ value: d.name, label: d.name }))}
          value={district ?? ""}
          placeholder={province ? "-- เลือกอำเภอ --" : "เลือกจังหวัดก่อน"}
          disabled={!province}
          searchable
          onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
            const v = (e.target as HTMLInputElement).value;
            setDistrict(v || undefined);
            setSubdistrict(undefined);
          }}
        />
      </div>

      <div className="w-full">
        <FloatingLabelInput
          label="ตำบล"
          type="select"
          options={subdistricts.map((s: any) => ({ value: s.name, label: s.name }))}
          value={subdistrict ?? ""}
          placeholder={district ? "-- เลือกตำบล --" : "เลือกอำเภอก่อน"}
          disabled={!district}
          searchable
          onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
            const v = (e.target as HTMLInputElement).value;
            setSubdistrict(v || undefined);
          }}
        />
      </div>

      <div className="w-full">
        <FloatingLabelInput
          label="รหัสไปรษณีย์"
          type="text"
          value={postalCode ?? ""}
          readOnly
          disabled
        />
      </div>
    </div>
  );
}
