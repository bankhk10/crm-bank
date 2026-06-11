"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormInput, FormSelect } from "@/components/custom/form-components";
import { CustomerFormData, SelectOption } from "../../../types";

export function DealerFields() {
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
        ข้อมูลเพิ่มเติมสำหรับ Dealer
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
          label="คะแนนความสัมพันธ์ (Relationship Score)"
          type="number"
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          error={errors.relationshipScore?.message as string}
          {...register("relationshipScore")}
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
