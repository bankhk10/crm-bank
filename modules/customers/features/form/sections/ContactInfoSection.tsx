"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormInput, FormSelect } from "@/components/custom/form-components";
import { ContactList } from "../contact-list";
import { CustomerFormData } from "../../../types";

export function ContactInfoSection() {
  const { register, control, formState: { errors } } = useFormContext<CustomerFormData>();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลผู้ติดต่อ
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-5 mt-6">
        <Controller
          name="prefix"
          control={control}
          render={({ field }) => (
            <FormSelect
              label="คำนำหน้า"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "นาย", label: "นาย" },
                { value: "นาง", label: "นาง" },
                { value: "นางสาว", label: "นางสาว" },
              ]}
              placeholder="เลือกคำนำหน้า"
              groupLabel="คำนำหน้า"
              required
              error={errors.prefix?.message as string}
            />
          )}
        />

        <FormInput
          label="ชื่อ"
          required
          containerClassName="md:col-span-2"
          error={errors.firstName?.message as string}
          {...register("firstName")}
        />

        <FormInput
          label="นามสกุล"
          required
          containerClassName="md:col-span-2"
          error={errors.lastName?.message as string}
          {...register("lastName")}
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <FormInput
          label="เบอร์โทรศัพท์ (บุคคล)"
          type="number"
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          required
          error={errors.contactPhone?.message as string}
          {...register("contactPhone")}
        />
        <FormInput
          label="อีเมล (บุคคล)"
          type="email"
          error={errors.contactEmail?.message as string}
          {...register("contactEmail")}
        />
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">ผู้ติดต่อเพิ่มเติม</h4>
        <Controller
          name="contacts"
          control={control}
          render={({ field }) => (
            <ContactList
              value={(field.value || []).map((c: any) => ({
                firstName: c.firstName || "",
                lastName: c.lastName || "",
                phone: c.phone || "",
                email: c.email || ""
              }))}
              onChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
}
