"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormInput, FormSelect } from "@/components/custom/form-components";
import { CustomerFormData, SelectOption } from "../../../types";

export function BrokerFields() {
  const { register, control, formState: { errors } } = useFormContext<CustomerFormData>();
  const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const { getEmployeesAction } = await import("@/modules/employee/server/actions");
        const res = await getEmployeesAction({ perPage: 1000 });
        const emps = (res.employees || []).map((e: any) => ({
          value: e.id,
          label: e.name,
        }));
        setEmployeeOptions(emps);
      } catch (err) {
        // ignore
      }
    }
    fetchEmployees();
  }, []);

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลเพิ่มเติมสำหรับ Broker
      </h3>
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
        <Controller
          name="responsibleEmployeeId"
          control={control}
          render={({ field }) => (
            <FormSelect
              label="พนักงานที่ดูแลรับผิดชอบ"
              value={field.value || ""}
              onChange={field.onChange}
              options={employeeOptions}
              required
              error={errors.responsibleEmployeeId?.message as string}
            />
          )}
        />
        
        <FormInput
          label="ชนิดพืชที่ปลูก"
          error={errors.cropTypes?.message as string}
          {...register("cropTypes")}
        />
        <FormInput
          label="ผลผลิตปัจจุบัน"
          error={errors.currentYield?.message as string}
          {...register("currentYield")}
        />
        <FormInput
          label="จำนวนเกษตรกร"
          error={errors.farmerCount?.message as string}
          {...register("farmerCount")}
        />
        <FormInput
          label="จำนวนแปลงปลูก"
          error={errors.plotCount?.message as string}
          {...register("plotCount")}
        />
        <FormInput
          label="พื้นที่รวม (ไร่)"
          error={errors.totalAreaRai?.message as string}
          {...register("totalAreaRai")}
        />
        <FormInput
          label="รอบการเก็บเกี่ยวต่อปี"
          error={errors.harvestPerYear?.message as string}
          {...register("harvestPerYear")}
        />
        <FormInput
          label="เครดิต (วัน)"
          error={errors.creditDays?.message as string}
          {...register("creditDays")}
        />
        <FormInput
          label="มูลค่าการใช้สารเคมี/รอบ"
          error={errors.chemicalValuePerCycle?.message as string}
          {...register("chemicalValuePerCycle")}
        />
        <FormInput
          label="ปริมาณการใช้สารเคมี/รอบ"
          error={errors.chemicalQtyPerCycle?.message as string}
          {...register("chemicalQtyPerCycle")}
        />
        <FormInput
          label="ร้านค้าประจำ"
          error={errors.regularShops?.message as string}
          {...register("regularShops")}
        />
        <FormInput
          label="ประเภทบริการที่รับ"
          error={errors.serviceTypes?.message as string}
          {...register("serviceTypes")}
        />
        <FormInput
          label="แบรนด์สินค้าที่ใช้"
          error={errors.usedBrands?.message as string}
          {...register("usedBrands")}
        />
        <FormInput
          label="หมายเหตุทางธุรกิจ"
          containerClassName="md:col-span-2"
          error={errors.notes?.message as string}
          {...register("notes")}
        />
      </div>
    </div>
  );
}
