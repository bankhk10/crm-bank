"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { LocateFixed, Loader2 } from "lucide-react";
import { FormInput } from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { CustomerFormData } from "../../../types";

export function BasicInfoSection() {
  const { register, control, setValue, formState: { errors } } = useFormContext<CustomerFormData>();
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude.toFixed(6), { shouldValidate: true });
        setValue("longitude", position.coords.longitude.toFixed(6), { shouldValidate: true });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลบริษัท
      </h3>
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4 mt-6">
        <FormInput
          label="รหัสลูกค้า"
          required
          placeholder=""
          error={errors.customerCode?.message as string}
          {...register("customerCode")}
        />

        <FormInput
          label="ชื่อร้านค้า"
          required
          containerClassName="md:col-span-2"
          error={errors.name?.message as string}
          {...register("name")}
        />

        <FormInput
          label="เลขประจำตัวผู้เสียภาษี"
          error={errors.taxId?.message as string}
          {...register("taxId")}
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <FormInput
          label="เบอร์โทรศัพท์ (บริษัท)"
          type="number"
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          error={errors.phone?.message as string}
          {...register("phone")}
        />
        <FormInput
          label="E-mail (บริษัท)"
          type="email"
          error={errors.email?.message as string}
          {...register("email")}
        />

        <div className="md:col-span-2 flex items-end gap-2">
          <FormInput
            label="latitude (ละติจูด)"
            type="number"
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            containerClassName="flex-1"
            error={errors.latitude?.message as string}
            {...register("latitude")}
          />

          <FormInput
            label="longitude (ลองจิจูด)"
            type="number"
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            containerClassName="flex-1"
            error={errors.longitude?.message as string}
            {...register("longitude")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mb-1 shrink-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
            onClick={getCurrentLocation}
            title="ดึงพิกัดปัจจุบัน"
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
