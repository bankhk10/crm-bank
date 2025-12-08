"use client";

import React, { useState } from "react";
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
import DatePicker from "@/components/custom/DatePicker";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { Button } from "@/components/ui/button";
import { CustomerFormProps, CustomerPayload, SubmitResult } from "./customer-form-types";

type Props = Omit<CustomerFormProps, "customerType">;

export default function CustomerFormSubdealer({ initial = {}, onSubmit, onCancel, submitLabel = "บันทึก" }: Props) {
  const [payload, setPayload] = useState<CustomerPayload>({
    customerCode: initial.customerCode ?? "",
    customerType: "SUBDEALER",
    name: initial.name ?? "",
    prefix: initial.prefix ?? "",
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    taxId: initial.taxId ?? "",
    addressLine: initial.addressLine ?? "",
    province: initial.province ?? "",
    district: initial.district ?? "",
    subdistrict: initial.subdistrict ?? "",
    postalCode: initial.postalCode ?? "",
    billingAddressLine: (initial as any).billingAddressLine ?? "",
    billingProvince: (initial as any).billingProvince ?? "",
    billingDistrict: (initial as any).billingDistrict ?? "",
    billingSubdistrict: (initial as any).billingSubdistrict ?? "",
    billingPostalCode: (initial as any).billingPostalCode ?? "",
    shippingAddressLine: (initial as any).shippingAddressLine ?? "",
    shippingProvince: (initial as any).shippingProvince ?? "",
    shippingDistrict: (initial as any).shippingDistrict ?? "",
    shippingSubdistrict: (initial as any).shippingSubdistrict ?? "",
    shippingPostalCode: (initial as any).shippingPostalCode ?? "",
    status: initial.status ?? "ACTIVE",
    contactPerson: initial.contactPerson ?? "",
    contactPhone: initial.contactPhone ?? "",
    contactEmail: initial.contactEmail ?? "",
    notes: initial.notes ?? "",
    birthDate: initial.birthDate ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev || !(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await onSubmit(payload);
      if (!res.success) {
        if (res.issues) {
          setFieldErrors(res.issues);
          setError(Object.values(res.issues).flat()[0] ?? res.error ?? "เกิดข้อผิดพลาด");
        } else {
          setError(res.error ?? "เกิดข้อผิดพลาด");
        }
      }
    } catch (err: any) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-1">
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        <div>
          <Label className="mx-2 mt-2 text-base">รหัสลูกค้า</Label>
          <Input
            value={payload.customerCode}
            onChange={(e) => {
              setPayload((p) => ({ ...p, customerCode: e.target.value }));
              clearFieldError("customerCode");
            }}
            required
            className="mt-1 text-base h-11"
          />
          {fieldErrors.customerCode?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.customerCode[0]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-3 mt-4 text-gray-700">ข้อมูลทั่วไป</h3>
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">คำนำหน้า</Label>
          <Select
            value={payload.prefix}
            onValueChange={(v) => {
              setPayload((p) => ({ ...p, prefix: v }));
              clearFieldError("prefix");
            }}
          >
            <SelectTrigger className="mt-1 text-base h-11">
              <SelectValue placeholder="เลือกคำนำหน้า" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>คำนำหน้า</SelectLabel>
                <SelectItem value="นาย">นาย</SelectItem>
                <SelectItem value="นาง">นาง</SelectItem>
                <SelectItem value="นางสาว">นางสาว</SelectItem>
                <SelectItem value="บริษัท">บริษัท</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {fieldErrors.prefix?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.prefix[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">ชื่อลูกค้า/บริษัท</Label>
          <Input
            value={payload.name}
            onChange={(e) => {
              setPayload((p) => ({ ...p, name: e.target.value }));
              clearFieldError("name");
            }}
            required
            className="mt-1 text-base h-11"
          />
          {fieldErrors.name?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">ชื่อ</Label>
          <Input
            value={payload.firstName}
            onChange={(e) => {
              setPayload((p) => ({ ...p, firstName: e.target.value }));
              clearFieldError("firstName");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.firstName?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.firstName[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">นามสกุล</Label>
          <Input
            value={payload.lastName}
            onChange={(e) => {
              setPayload((p) => ({ ...p, lastName: e.target.value }));
              clearFieldError("lastName");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.lastName?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.lastName[0]}</p>
          )}
        </div>

        <div>
          <DatePicker
            label="วันเกิด"
            value={payload.birthDate}
            onChange={(v) => {
              setPayload((p) => ({ ...p, birthDate: v }));
              clearFieldError("birthDate");
            }}
            placeholder=""
          />
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">อีเมล</Label>
          <Input
            type="email"
            value={payload.email}
            onChange={(e) => {
              setPayload((p) => ({ ...p, email: e.target.value }));
              clearFieldError("email");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.email?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">โทรศัพท์</Label>
          <Input
            value={payload.phone}
            onChange={(e) => {
              setPayload((p) => ({ ...p, phone: e.target.value }));
              clearFieldError("phone");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.phone?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.phone[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">เลขประจำตัวผู้เสียภาษี</Label>
          <Input
            value={payload.taxId}
            onChange={(e) => {
              setPayload((p) => ({ ...p, taxId: e.target.value }));
              clearFieldError("taxId");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.taxId?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.taxId[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">สถานะ</Label>
          <Select
            value={payload.status}
            onValueChange={(v) => {
              setPayload((p) => ({ ...p, status: v }));
              clearFieldError("status");
            }}
          >
            <SelectTrigger className="mt-1 text-base h-11">
              <SelectValue placeholder="เลือกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>สถานะ</SelectLabel>
                <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
                <SelectItem value="INACTIVE">ไม่ได้ใช้งาน</SelectItem>
                <SelectItem value="SUSPENDED">ระงับ</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {fieldErrors.status?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.status[0]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-3 mt-4 text-gray-700">ที่อยู่</h3>
        </div>

        <div className="md:col-span-2">
          <Label className="mx-2 mt-2 text-base">ที่อยู่</Label>
          <Input
            value={payload.addressLine}
            onChange={(e) => {
              setPayload((p) => ({ ...p, addressLine: e.target.value }));
              clearFieldError("addressLine");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.addressLine?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.addressLine[0]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <ThaiAddressPicker
            value={{
              province: payload.province,
              district: payload.district,
              subdistrict: payload.subdistrict,
              postalCode: payload.postalCode,
            }}
            onChange={(next) => {
              setPayload((p) => ({ ...p, ...next }));
              clearFieldError("province");
              clearFieldError("district");
              clearFieldError("subdistrict");
              clearFieldError("postalCode");
            }}
          />
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-3 mt-4 text-gray-700">ที่อยู่วางบิล</h3>
        </div>

        <div className="md:col-span-2">
          <Label className="mx-2 mt-2 text-base">ที่อยู่วางบิล</Label>
          <Input
            value={(payload as any).billingAddressLine}
            onChange={(e) => {
              setPayload((p) => ({ ...p, billingAddressLine: e.target.value } as any));
              clearFieldError("billingAddressLine");
            }}
            className="mt-1 text-base h-11"
          />
        </div>

        <div className="md:col-span-2">
          <ThaiAddressPicker
            value={{
              province: (payload as any).billingProvince,
              district: (payload as any).billingDistrict,
              subdistrict: (payload as any).billingSubdistrict,
              postalCode: (payload as any).billingPostalCode,
            }}
            onChange={(next) => {
              setPayload((p) => ({ ...p, billingProvince: next.province, billingDistrict: next.district, billingSubdistrict: next.subdistrict, billingPostalCode: next.postalCode } as any));
              clearFieldError("billingProvince");
              clearFieldError("billingDistrict");
              clearFieldError("billingSubdistrict");
              clearFieldError("billingPostalCode");
            }}
          />
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-3 mt-4 text-gray-700">ที่อยู่จัดส่ง</h3>
        </div>

        <div className="md:col-span-2">
          <Label className="mx-2 mt-2 text-base">ที่อยู่จัดส่ง</Label>
          <Input
            value={(payload as any).shippingAddressLine}
            onChange={(e) => {
              setPayload((p) => ({ ...p, shippingAddressLine: e.target.value } as any));
              clearFieldError("shippingAddressLine");
            }}
            className="mt-1 text-base h-11"
          />
        </div>

        <div className="md:col-span-2">
          <ThaiAddressPicker
            value={{
              province: (payload as any).shippingProvince,
              district: (payload as any).shippingDistrict,
              subdistrict: (payload as any).shippingSubdistrict,
              postalCode: (payload as any).shippingPostalCode,
            }}
            onChange={(next) => {
              setPayload((p) => ({ ...p, shippingProvince: next.province, shippingDistrict: next.district, shippingSubdistrict: next.subdistrict, shippingPostalCode: next.postalCode } as any));
              clearFieldError("shippingProvince");
              clearFieldError("shippingDistrict");
              clearFieldError("shippingSubdistrict");
              clearFieldError("shippingPostalCode");
            }}
          />
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-3 mt-4 text-gray-700">ผู้ติดต่อ</h3>
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">ชื่อผู้ติดต่อ</Label>
          <Input
            value={payload.contactPerson}
            onChange={(e) => {
              setPayload((p) => ({ ...p, contactPerson: e.target.value }));
              clearFieldError("contactPerson");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.contactPerson?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.contactPerson[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">โทรศัพท์ผู้ติดต่อ</Label>
          <Input
            value={payload.contactPhone}
            onChange={(e) => {
              setPayload((p) => ({ ...p, contactPhone: e.target.value }));
              clearFieldError("contactPhone");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.contactPhone?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.contactPhone[0]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label className="mx-2 mt-2 text-base">อีเมลผู้ติดต่อ</Label>
          <Input
            type="email"
            value={payload.contactEmail}
            onChange={(e) => {
              setPayload((p) => ({ ...p, contactEmail: e.target.value }));
              clearFieldError("contactEmail");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.contactEmail?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.contactEmail[0]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label className="mx-2 mt-2 text-base">หมายเหตุ</Label>
          <Input
            value={payload.notes}
            onChange={(e) => {
              setPayload((p) => ({ ...p, notes: e.target.value }));
              clearFieldError("notes");
            }}
            className="mt-1 text-base h-11"
          />
          {fieldErrors.notes?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.notes[0]}</p>
          )}
        </div>

        <div className="md:col-span-2 pt-6 border-t my-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
              type="button"
              onClick={onCancel}
            >
              ยกเลิก
            </Button>
            <Button
              size="lg"
              className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
              type="submit"
              disabled={loading}
            >
              {loading ? "กำลังบันทึก..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
