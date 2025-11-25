"use client";

import React, { useState } from "react";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import DatePicker from "@/components/custom/DatePicker";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { Button } from "@/components/ui/button";
import { CustomerFormProps, CustomerPayload, SubmitResult } from "./customer-form-types";

type Props = Omit<CustomerFormProps, "customerType">;

export default function CustomerFormFarmer({ initial = {}, onSubmit, onCancel, submitLabel = "บันทึก" }: Props) {
  const [payload, setPayload] = useState<CustomerPayload>({
    customerCode: initial.customerCode ?? "",
    customerType: "FARMER",
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
          <FloatingLabelInput
            label="รหัสลูกค้า"
            value={payload.customerCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, customerCode: e.target.value }));
              clearFieldError("customerCode");
            }}
            required
            error={fieldErrors.customerCode?.[0]}
          />
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-3 mt-4 text-gray-700">ข้อมูลทั่วไป</h3>
        </div>

        <div>
          <FloatingLabelInput
            label="คำนำหน้า"
            type="select"
            options={[
              { value: "", label: "เลือกคำนำหน้า" },
              { value: "นาย", label: "นาย" },
              { value: "นาง", label: "นาง" },
              { value: "นางสาว", label: "นางสาว" },
              { value: "บริษัท", label: "บริษัท" },
            ]}
            value={payload.prefix}
            onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
              setPayload((p) => ({ ...p, prefix: e.target.value }));
              clearFieldError("prefix");
            }}
            error={fieldErrors.prefix?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="ชื่อลูกค้า/บริษัท"
            value={payload.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, name: e.target.value }));
              clearFieldError("name");
            }}
            required
            error={fieldErrors.name?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="ชื่อ"
            value={payload.firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, firstName: e.target.value }));
              clearFieldError("firstName");
            }}
            error={fieldErrors.firstName?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="นามสกุล"
            value={payload.lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, lastName: e.target.value }));
              clearFieldError("lastName");
            }}
            error={fieldErrors.lastName?.[0]}
          />
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
          <FloatingLabelInput
            label="อีเมล"
            type="email"
            value={payload.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, email: e.target.value }));
              clearFieldError("email");
            }}
            error={fieldErrors.email?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="โทรศัพท์"
            value={payload.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, phone: e.target.value }));
              clearFieldError("phone");
            }}
            error={fieldErrors.phone?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="เลขประจำตัวผู้เสียภาษี"
            value={payload.taxId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, taxId: e.target.value }));
              clearFieldError("taxId");
            }}
            error={fieldErrors.taxId?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="สถานะ"
            type="select"
            options={[
              { value: "ACTIVE", label: "ใช้งาน" },
              { value: "INACTIVE", label: "ไม่ได้ใช้งาน" },
              { value: "SUSPENDED", label: "ระงับ" },
            ]}
            value={payload.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
              setPayload((p) => ({ ...p, status: e.target.value }));
              clearFieldError("status");
            }}
            error={fieldErrors.status?.[0]}
          />
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-3 mt-4 text-gray-700">ที่อยู่</h3>
        </div>

        <div className="md:col-span-2">
          <FloatingLabelInput
            label="ที่อยู่"
            value={payload.addressLine}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, addressLine: e.target.value }));
              clearFieldError("addressLine");
            }}
            error={fieldErrors.addressLine?.[0]}
          />
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
          <h3 className="text-lg font-semibold mb-3 mt-4 text-gray-700">ผู้ติดต่อ</h3>
        </div>

        <div>
          <FloatingLabelInput
            label="ชื่อผู้ติดต่อ"
            value={payload.contactPerson}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, contactPerson: e.target.value }));
              clearFieldError("contactPerson");
            }}
            error={fieldErrors.contactPerson?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="โทรศัพท์ผู้ติดต่อ"
            value={payload.contactPhone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, contactPhone: e.target.value }));
              clearFieldError("contactPhone");
            }}
            error={fieldErrors.contactPhone?.[0]}
          />
        </div>

        <div className="md:col-span-2">
          <FloatingLabelInput
            label="อีเมลผู้ติดต่อ"
            type="email"
            value={payload.contactEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, contactEmail: e.target.value }));
              clearFieldError("contactEmail");
            }}
            error={fieldErrors.contactEmail?.[0]}
          />
        </div>

        <div className="md:col-span-2">
          <FloatingLabelInput
            label="หมายเหตุ"
            value={payload.notes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, notes: e.target.value }));
              clearFieldError("notes");
            }}
            error={fieldErrors.notes?.[0]}
          />
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
