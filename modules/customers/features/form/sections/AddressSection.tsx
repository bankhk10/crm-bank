"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormInput } from "@/components/custom/form-components";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { Button } from "@/components/ui/button";
import { ShippingAddressList } from "../shipping-address-list";
import { CustomerFormData } from "../../../types";

export function AddressSection() {
  const { register, control, getValues, setValue, formState: { errors } } = useFormContext<CustomerFormData>();

  const copyToBilling = () => {
    const values = getValues();
    setValue("billingAddressLine", values.addressLine || "", { shouldValidate: true });
    setValue("billingProvince", values.province || "", { shouldValidate: true });
    setValue("billingDistrict", values.district || "", { shouldValidate: true });
    setValue("billingSubdistrict", values.subdistrict || "", { shouldValidate: true });
    setValue("billingPostalCode", values.postalCode || "", { shouldValidate: true });
  };

  const copyToShipping = () => {
    const values = getValues();
    setValue("shippingAddressLine", values.addressLine || "", { shouldValidate: true });
    setValue("shippingProvince", values.province || "", { shouldValidate: true });
    setValue("shippingDistrict", values.district || "", { shouldValidate: true });
    setValue("shippingSubdistrict", values.subdistrict || "", { shouldValidate: true });
    setValue("shippingPostalCode", values.postalCode || "", { shouldValidate: true });
  };

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ที่อยู่บริษัท
      </h3>
      <FormInput
        label="ที่อยู่บริษัท (บ้านเลขที่ หมู่ ซอย ถนน)"
        placeholder="123/45 หมู่ 6"
        containerClassName="md:col-span-2 mt-6"
        error={errors.addressLine?.message as string}
        {...register("addressLine")}
      />

      <div className="md:col-span-2 mt-4">
        <Controller
          name="province" // We'll bind the picker to province but let it update multiple fields
          control={control}
          render={({ field }) => {
            const values = getValues();
            return (
              <ThaiAddressPicker
                value={{
                  province: values.province || "",
                  district: values.district || "",
                  subdistrict: values.subdistrict || "",
                  postalCode: values.postalCode || "",
                }}
                onChange={(next) => {
                  setValue("province", next.province || "", { shouldValidate: true });
                  setValue("district", next.district || "", { shouldValidate: true });
                  setValue("subdistrict", next.subdistrict || "", { shouldValidate: true });
                  setValue("postalCode", next.postalCode || "", { shouldValidate: true });
                }}
              />
            );
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-6 my-2 p-4 bg-gray-300 rounded-3xl">
        <h3 className="text-xl font-semibold text-gray-800">
          ที่อยู่วางบิล
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-sm bg-white hover:bg-gray-100 text-gray-700"
          onClick={copyToBilling}
        >
          คัดลอกจากที่อยู่บริษัท
        </Button>
      </div>

      <FormInput
        label="ที่อยู่วางบิล (บ้านเลขที่ หมู่ ซอย ถนน)"
        placeholder="123/45 หมู่ 6"
        containerClassName="md:col-span-2 mt-6"
        error={errors.billingAddressLine?.message as string}
        {...register("billingAddressLine")}
      />

      <div className="md:col-span-2 mt-4">
        <Controller
          name="billingProvince"
          control={control}
          render={() => {
            const values = getValues();
            return (
              <ThaiAddressPicker
                value={{
                  province: values.billingProvince || "",
                  district: values.billingDistrict || "",
                  subdistrict: values.billingSubdistrict || "",
                  postalCode: values.billingPostalCode || "",
                }}
                onChange={(next) => {
                  setValue("billingProvince", next.province || "", { shouldValidate: true });
                  setValue("billingDistrict", next.district || "", { shouldValidate: true });
                  setValue("billingSubdistrict", next.subdistrict || "", { shouldValidate: true });
                  setValue("billingPostalCode", next.postalCode || "", { shouldValidate: true });
                }}
              />
            );
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-6 my-2 p-4 bg-gray-300 rounded-3xl">
        <h3 className="text-xl font-semibold text-gray-800">
          ที่อยู่จัดส่งหลัก
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-sm bg-white hover:bg-gray-100 text-gray-700"
          onClick={copyToShipping}
        >
          คัดลอกจากที่อยู่บริษัท
        </Button>
      </div>

      <FormInput
        label="ที่อยู่จัดส่ง (บ้านเลขที่ หมู่ ซอย ถนน)"
        placeholder="123/45 หมู่ 6"
        containerClassName="md:col-span-2 mt-6"
        error={errors.shippingAddressLine?.message as string}
        {...register("shippingAddressLine")}
      />

      <div className="md:col-span-2 mt-4">
        <Controller
          name="shippingProvince"
          control={control}
          render={() => {
            const values = getValues();
            return (
              <ThaiAddressPicker
                value={{
                  province: values.shippingProvince || "",
                  district: values.shippingDistrict || "",
                  subdistrict: values.shippingSubdistrict || "",
                  postalCode: values.shippingPostalCode || "",
                }}
                onChange={(next) => {
                  setValue("shippingProvince", next.province || "", { shouldValidate: true });
                  setValue("shippingDistrict", next.district || "", { shouldValidate: true });
                  setValue("shippingSubdistrict", next.subdistrict || "", { shouldValidate: true });
                  setValue("shippingPostalCode", next.postalCode || "", { shouldValidate: true });
                }}
              />
            );
          }}
        />
      </div>

      <div className="md:col-span-4 mt-8">
        <h4 className="text-sm font-medium text-gray-700 mb-2">ที่อยู่จัดส่งเพิ่มเติม</h4>
        <Controller
          name="shippingAddresses"
          control={control}
          render={({ field }) => (
            <ShippingAddressList
              value={(field.value || []).map((a: any) => ({
                addressLine: a.addressLine || "",
                province: a.province || "",
                district: a.district || "",
                subdistrict: a.subdistrict || "",
                postalCode: a.postalCode || ""
              }))}
              onChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
}
