"use client";

import React, { useState } from "react";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { generateRandomCompany } from "@/lib/random-fill/company";
import Can from "@/components/rbac/Can";
import RandomFillButton from "@/components/custom/random-fill-button";
import { FormInput, FormSelect } from "@/components/custom/form-components";
import FormActions from "@/components/custom/form-actions";
import type { CompanyPayload, SubmitResult } from "../_types/types";

interface Props {
  initial?: Partial<CompanyPayload>;
  onSubmit: (payload: CompanyPayload) => Promise<SubmitResult>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function CompanyForm({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel,
}: Props) {

  const [payload, setPayload] = useState<CompanyPayload>({
    name: initial.name ?? "",
    companyCode: initial.companyCode ?? "",
    shortName: initial.shortName ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    taxId: initial.taxId ?? "",
    addressLine: initial.addressLine ?? "",
    province: initial.province ?? "",
    district: initial.district ?? "",
    subdistrict: initial.subdistrict ?? "",
    postalCode: initial.postalCode ?? "",
    status: initial.status ?? "ACTIVE",
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
    if (loading) return;
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await onSubmit(payload);
      if (!res.success) {
        if (res.issues) {
          setFieldErrors(res.issues);
          setError(
            Object.values(res.issues).flat()[0] ?? res.error ?? "เกิดข้อผิดพลาด"
          );
        } else {
          setError(res.error ?? "เกิดข้อผิดพลาด");
        }
        setLoading(false);
      }
    } catch (error) {
      const err = error as Error;
      setError(err.message || String(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive font-medium p-4 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {/* General Info Section */}
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลบริษัท
      </h3>
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4 mt-6">
        <FormInput
          label="รหัสบริษัท"
          value={payload.companyCode ?? ""}
          onChange={(e) => {
            setPayload((p) => ({ ...p, companyCode: e.target.value }));
            clearFieldError("companyCode");
          }}
          error={fieldErrors.companyCode?.[0]}
        />

        <FormInput
          label="ชื่อบริษัท"
          value={payload.name}
          onChange={(e) => {
            setPayload((p) => ({ ...p, name: e.target.value }));
            clearFieldError("name");
          }}
          required
          error={fieldErrors.name?.[0]}
          containerClassName="md:col-span-2"
        />

        <FormInput
          label="ชื่อย่อบริษัท"
          value={payload.shortName ?? ""}
          onChange={(e) => {
            setPayload((p) => ({ ...p, shortName: e.target.value }));
            clearFieldError("shortName");
          }}
          error={fieldErrors.shortName?.[0]}
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <FormInput
          label="เลขประจำตัวผู้เสียภาษี"
          value={payload.taxId ?? ""}
          onChange={(e) => {
            setPayload((p) => ({ ...p, taxId: e.target.value }));
            clearFieldError("taxId");
          }}
          error={fieldErrors.taxId?.[0]}
          containerClassName="md:col-span-2"
        />

        <FormSelect
          label="สถานะ"
          value={payload.status ?? "ACTIVE"}
          onChange={(v) => {
            setPayload((p) => ({ ...p, status: v }));
            clearFieldError("status");
          }}
          options={[
            { value: "ACTIVE", label: "ใช้งาน" },
            { value: "INACTIVE", label: "ไม่ได้ใช้งาน" },
          ]}
          placeholder="เลือกสถานะ"
          groupLabel="สถานะ"
          error={fieldErrors.status?.[0]}
          containerClassName="md:col-span-2"
        />
      </div>

      {/* Contact Info Section */}
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลการติดต่อ
      </h3>
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
        <FormInput
          label="เบอร์โทรศัพท์"
          value={payload.phone ?? ""}
          onChange={(e) => {
            setPayload((p) => ({ ...p, phone: e.target.value }));
            clearFieldError("phone");
          }}
          error={fieldErrors.phone?.[0]}
        />

        <FormInput
          label="อีเมล"
          type="email"
          value={payload.email ?? ""}
          onChange={(e) => {
            setPayload((p) => ({ ...p, email: e.target.value }));
            clearFieldError("email");
          }}
          error={fieldErrors.email?.[0]}
        />
      </div>

      {/* Address Section */}
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ที่อยู่
      </h3>

      <FormInput
        label="ที่อยู่บริษัท (บ้านเลขที่ หมู่ ซอย ถนน)"
        value={payload.addressLine ?? ""}
        onChange={(e) => {
          setPayload((p) => ({ ...p, addressLine: e.target.value }));
          clearFieldError("addressLine");
        }}
        error={fieldErrors.addressLine?.[0]}
        containerClassName="mt-6"
      />

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

      {/* Action Buttons */}
      <FormActions
        loading={loading}
        onCancel={onCancel}
        submitLabel={submitLabel}
      />
    </form>
  );
}
