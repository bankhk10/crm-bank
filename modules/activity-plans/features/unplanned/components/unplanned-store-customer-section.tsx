"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Store, User, MapPin, Phone, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormCombobox } from "@/components/custom/FormCombobox";

interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  province?: string | null;
  district?: string | null;
  address?: string | null;
  phone?: string | null;
  customerType?: string | null;
}

interface UnplannedStoreCustomerSectionProps {
  workTypeCode: string;
  customers: CustomerOption[];
  selectedCustomerId: string;
  onSelectCustomer: (customer: CustomerOption | null) => void;
  // Unregistered farmer (TYPE_1)
  isUnregisteredFarmer: boolean;
  onToggleUnregisteredFarmer: (val: boolean) => void;
  unregisteredFarmerName: string;
  onChangeUnregisteredFarmerName: (val: string) => void;
  unregisteredFarmerPhone: string;
  onChangeUnregisteredFarmerPhone: (val: string) => void;
  // Location
  province: string;
  onChangeProvince: (val: string) => void;
  district: string;
  onChangeDistrict: (val: string) => void;
  location: string;
  onChangeLocation: (val: string) => void;
  // Purpose & Notes
  visitPurpose: string;
  onChangeVisitPurpose: (val: string) => void;
  disabled?: boolean;
}

export function UnplannedStoreCustomerSection({
  workTypeCode,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  isUnregisteredFarmer,
  onToggleUnregisteredFarmer,
  unregisteredFarmerName,
  onChangeUnregisteredFarmerName,
  unregisteredFarmerPhone,
  onChangeUnregisteredFarmerPhone,
  province,
  onChangeProvince,
  district,
  onChangeDistrict,
  location,
  onChangeLocation,
  visitPurpose,
  onChangeVisitPurpose,
  disabled = false,
}: UnplannedStoreCustomerSectionProps) {
  const [provincesData, setProvincesData] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAddresses() {
      try {
        const res = await fetch("/api/thai-addresses");
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && Array.isArray(json)) {
          const normalized = json.map((p: any) => ({
            id: p.id,
            name: p.name_th,
            districts: (p.districts || []).map((d: any) => ({
              id: d.id,
              name: d.name_th,
            })),
          }));
          setProvincesData(normalized);
        }
      } catch (err) {
        console.error("Failed to load thai addresses:", err);
      }
    }
    loadAddresses();
    return () => {
      isMounted = false;
    };
  }, []);

  const provinceOptions = useMemo(() => {
    return provincesData.map((p) => ({
      value: p.name,
      label: p.name,
    }));
  }, [provincesData]);

  const districtOptions = useMemo(() => {
    const matched = provincesData.find((p) => p.name === province);
    if (!matched) return [];
    return matched.districts.map((d: any) => ({
      value: d.name,
      label: d.name,
    }));
  }, [provincesData, province]);

  const customerComboboxOptions = useMemo(() => {
    return customers.map((c) => {
      const parts = [c.customerCode, c.province].filter(Boolean);
      return {
        value: c.id,
        label: c.name,
        subLabel: parts.length > 0 ? parts.join(" • ") : undefined,
      };
    });
  }, [customers]);

  const handleCustomerChange = (customerId: string) => {
    const found = customers.find((c) => c.id === customerId) || null;
    onSelectCustomer(found);
    if (found) {
      if (found.province && !province) {
        onChangeProvince(found.province);
      }
      if (found.district && !district) {
        onChangeDistrict(found.district);
      }
    }
  };

  const isType1 = workTypeCode === "TYPE_1";

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Store className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            ข้อมูลลูกค้า / สถานที่ปฏิบัติงาน
          </h3>
          <p className="text-xs text-slate-500">
            ระบุร้านค้า เกษตรกร หรือสถานที่ที่ไปปฏิบัติงานจริง
          </p>
        </div>
      </div>

      {/* Customer Selection */}
      <div className="space-y-4">
        {isType1 && (
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <Checkbox
              id="unregistered-farmer"
              checked={isUnregisteredFarmer}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onToggleUnregisteredFarmer(Boolean(checked))
              }
            />
            <label
              htmlFor="unregistered-farmer"
              className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer select-none"
            >
              เกษตรกรทั่วไป (ยังไม่ได้ลงทะเบียนในระบบ)
            </label>
          </div>
        )}

        {isType1 && isUnregisteredFarmer ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                ชื่อ-นามสกุล เกษตรกร <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="เช่น นายสมชาย ใจดี"
                value={unregisteredFarmerName}
                disabled={disabled}
                onChange={(e) => onChangeUnregisteredFarmerName(e.target.value)}
                className="bg-white text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                เบอร์โทรศัพท์
              </Label>
              <Input
                placeholder="เช่น 0812345678"
                value={unregisteredFarmerPhone}
                disabled={disabled}
                onChange={(e) => onChangeUnregisteredFarmerPhone(e.target.value)}
                className="bg-white text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <FormCombobox
              label="เลือกร้านค้า / Key Farmer จากฐานข้อมูล *"
              placeholder="ค้นหาชื่อร้านค้า หรือรหัสลูกค้า..."
              value={selectedCustomerId}
              options={customerComboboxOptions}
              disabled={disabled}
              onChange={handleCustomerChange}
              labelClassName="text-xs font-semibold text-slate-700 mb-1"
              triggerClassName="bg-white border-slate-200 text-sm h-10"
            />
          </div>
        )}
      </div>

      {/* Location Details: Province, District, Landmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            จังหวัด <span className="text-red-500">*</span>
          </Label>
          <FormCombobox
            label=""
            placeholder="เลือกจังหวัด"
            value={province}
            options={provinceOptions}
            disabled={disabled}
            onChange={(val) => {
              onChangeProvince(val);
              onChangeDistrict("");
            }}
            triggerClassName="bg-white border-slate-200 text-sm h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            อำเภอ / เขต
          </Label>
          <FormCombobox
            label=""
            placeholder="เลือกอำเภอ"
            value={district}
            options={districtOptions}
            disabled={disabled || !province}
            onChange={onChangeDistrict}
            triggerClassName="bg-white border-slate-200 text-sm h-10"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label className="text-xs font-semibold text-slate-700">
            สถานที่ / จุดสังเกต
          </Label>
          <Input
            placeholder="เช่น แปลงหลังหมู่บ้าน, สาขาย่อยตลาดสด"
            value={location}
            disabled={disabled}
            onChange={(e) => onChangeLocation(e.target.value)}
            className="bg-white text-sm h-10"
          />
        </div>
      </div>

      {/* Purpose / Objective */}
      <div className="space-y-1.5 pt-1">
        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          วัตถุประสงค์ / รายละเอียดกิจกรรมนอกแผน
        </Label>
        <Textarea
          placeholder="ระบุเหตุผลหรือวัตถุประสงค์ที่ต้องดำเนินกิจกรรมนอกแผนงานนี้..."
          rows={2}
          value={visitPurpose}
          disabled={disabled}
          onChange={(e) => onChangeVisitPurpose(e.target.value)}
          className="bg-white text-sm resize-none"
        />
      </div>
    </div>
  );
}
