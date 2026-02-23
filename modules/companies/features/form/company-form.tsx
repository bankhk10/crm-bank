"use client";

import React, { useState } from "react";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { FormInput, FormSelect } from "@/components/custom/form-components";
import FormActions from "@/components/custom/form-actions";
import type { SubmitResult } from "@/modules/companies/types/types";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, type CompanyFormValues } from "@/modules/companies/application/validations";

interface Props {
  initial?: Partial<CompanyFormValues>;
  onSubmit: (payload: CompanyFormValues) => Promise<SubmitResult>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function CompanyForm({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
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
    },
  });

  const [province, district, subdistrict, postalCode] = useWatch({
    control,
    name: ["province", "district", "subdistrict", "postalCode"]
  });

  async function handleFormSubmit(data: CompanyFormValues) {
    setError(null);
    try {
      const res = await onSubmit(data);
      if (!res.success) {
        if (res.issues) {
          setError(
            Object.values(res.issues).flat()[0] ?? res.error ?? "เกิดข้อผิดพลาด"
          );
        } else {
          setError(res.error ?? "เกิดข้อผิดพลาด");
        }
      }
    } catch (error) {
      const err = error as Error;
      setError(err.message || String(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
        <Controller
          control={control}
          name="companyCode"
          render={({ field }) => (
            <FormInput
              label="รหัสบริษัท"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.companyCode?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <FormInput
              label="ชื่อบริษัท"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              required
              error={errors.name?.message}
              containerClassName="md:col-span-2"
            />
          )}
        />

        <Controller
          control={control}
          name="shortName"
          render={({ field }) => (
            <FormInput
              label="ชื่อย่อบริษัท"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.shortName?.message}
            />
          )}
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <Controller
          control={control}
          name="taxId"
          render={({ field }) => (
            <FormInput
              label="เลขประจำตัวผู้เสียภาษี"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.taxId?.message}
              containerClassName="md:col-span-2"
            />
          )}
        />

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <FormSelect
              label="สถานะ"
              value={field.value ?? "ACTIVE"}
              onChange={field.onChange}
              options={[
                { value: "ACTIVE", label: "ใช้งาน" },
                { value: "INACTIVE", label: "ไม่ได้ใช้งาน" },
              ]}
              placeholder="เลือกสถานะ"
              groupLabel="สถานะ"
              error={errors.status?.message}
              containerClassName="md:col-span-2"
            />
          )}
        />
      </div>

      {/* Contact Info Section */}
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลการติดต่อ
      </h3>
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <FormInput
              label="เบอร์โทรศัพท์"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <FormInput
              label="อีเมล"
              type="email"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
            />
          )}
        />
      </div>

      {/* Address Section */}
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ที่อยู่
      </h3>

      <Controller
        control={control}
        name="addressLine"
        render={({ field }) => (
          <FormInput
            label="ที่อยู่บริษัท (บ้านเลขที่ หมู่ ซอย ถนน)"
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.addressLine?.message}
            containerClassName="mt-6"
          />
        )}
      />

      <div className="md:col-span-2">
        <ThaiAddressPicker
          value={{
            province: province ?? "",
            district: district ?? "",
            subdistrict: subdistrict ?? "",
            postalCode: postalCode ?? "",
          }}
          onChange={(next) => {
            if (next.province !== undefined) setValue("province", next.province, { shouldValidate: true });
            if (next.district !== undefined) setValue("district", next.district, { shouldValidate: true });
            if (next.subdistrict !== undefined) setValue("subdistrict", next.subdistrict, { shouldValidate: true });
            if (next.postalCode !== undefined) setValue("postalCode", next.postalCode, { shouldValidate: true });
          }}
        />
      </div>

      {/* Action Buttons */}
      <FormActions
        loading={isSubmitting}
        onCancel={onCancel}
        submitLabel={submitLabel}
      />
    </form>
  );
}
