"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Popover states
  const [openProvince, setOpenProvince] = useState(false);
  const [openDistrict, setOpenDistrict] = useState(false);
  const [openSubdistrict, setOpenSubdistrict] = useState(false);

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
      {/* จังหวัด */}
      <div className="w-full">
        <Label className={labelTextClass}>
          จังหวัด
        </Label>
        <Popover open={openProvince} onOpenChange={setOpenProvince}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openProvince}
              className={`w-full justify-between font-normal ${inputTextClass}`}
            >
              {province || "เลือกจังหวัด"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="ค้นหาจังหวัด..." />
              <CommandList>
                <CommandEmpty>ไม่พบจังหวัด</CommandEmpty>
                <CommandGroup>
                  {provinces.map((p: any) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={(currentValue) => {
                        setProvince(currentValue === province ? undefined : currentValue);
                        setDistrict(undefined);
                        setSubdistrict(undefined);
                        setOpenProvince(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          province === p.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {p.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* อำเภอ/เขต */}
      <div className="w-full">
        <Label className={labelTextClass}>
          อำเภอ/เขต
        </Label>
        <Popover open={openDistrict} onOpenChange={setOpenDistrict}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openDistrict}
              disabled={!province}
              className={`w-full justify-between font-normal ${inputTextClass}`}
            >
              {district || (province ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="ค้นหาอำเภอ/เขต..." />
              <CommandList>
                <CommandEmpty>ไม่พบอำเภอ/เขต</CommandEmpty>
                <CommandGroup>
                  {districts.map((d: any) => (
                    <CommandItem
                      key={d.id}
                      value={d.name}
                      onSelect={(currentValue) => {
                        setDistrict(currentValue === district ? undefined : currentValue);
                        setSubdistrict(undefined);
                        setOpenDistrict(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          district === d.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {d.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* ตำบล/แขวง */}
      <div className="w-full">
        <Label className={labelTextClass}>
          ตำบล/แขวง
        </Label>
        <Popover open={openSubdistrict} onOpenChange={setOpenSubdistrict}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSubdistrict}
              disabled={!district}
              className={`w-full justify-between font-normal ${inputTextClass}`}
            >
              {subdistrict || (district ? "เลือกตำบล/แขวง" : "เลือกอำเภอก่อน")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="ค้นหาตำบล/แขวง..." />
              <CommandList>
                <CommandEmpty>ไม่พบตำบล/แขวง</CommandEmpty>
                <CommandGroup>
                  {subdistricts.map((s: any) => (
                    <CommandItem
                      key={s.id}
                      value={s.name}
                      onSelect={(currentValue) => {
                        setSubdistrict(currentValue === subdistrict ? undefined : currentValue);
                        setOpenSubdistrict(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          subdistrict === s.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {s.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* รหัสไปรษณีย์ */}
      <div className="w-full">
        <Label className={labelTextClass}>
          รหัสไปรษณีย์
        </Label>
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
