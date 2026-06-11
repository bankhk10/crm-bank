"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormInput, FormSelect } from "@/components/custom/form-components";
import { CustomerFormData, SelectOption } from "../../../types";

const RELATIONSHIP_SCORE_OPTIONS: SelectOption[] = [
  { value: "5", label: "5 - ดีเยี่ยม" },
  { value: "4", label: "4 - ดี" },
  { value: "3", label: "3 - ปานกลาง" },
  { value: "2", label: "2 - แย่" },
  { value: "1", label: "1 - แย่มาก" },
];

export function SubDealerFields() {
  const { register, control, formState: { errors } } = useFormContext<CustomerFormData>();
  const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([]);
  const [dealerOptions, setDealerOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const { getEmployeesAction } = await import("@/modules/employee/server/actions");
        const resEmp = await getEmployeesAction({ perPage: 1000 });
        setEmployeeOptions((resEmp.employees || []).map((e: any) => ({
          value: e.id,
          label: e.name,
        })));

        const resDealer = await fetch(`/api/customers?type=DEALER&perPage=1000`);
        const dealerJson = await resDealer.json();
        setDealerOptions((dealerJson.customers || []).map((c: any) => ({
          value: c.id,
          label: `${c.customerCode} - ${c.name}`,
        })));
      } catch (err) {
        // ignore
      }
    }
    fetchOptions();
  }, []);

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลเพิ่มเติมสำหรับ Sub-Dealer
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
        
        <Controller
          name="parentDealerId"
          control={control}
          render={({ field }) => (
            <FormSelect
              label="Dealer ต้นสังกัด"
              value={field.value || ""}
              onChange={field.onChange}
              options={dealerOptions}
              error={errors.parentDealerId?.message as string}
            />
          )}
        />

        <Controller
          name="relationshipScore"
          control={control}
          render={({ field }) => (
            <FormSelect
              label="คะแนนความสัมพันธ์ (Relationship Score)"
              value={field.value ? String(field.value) : ""}
              onChange={field.onChange}
              options={RELATIONSHIP_SCORE_OPTIONS}
              error={errors.relationshipScore?.message as string}
            />
          )}
        />

        <FormInput
          label="รับของจาก Dealer (ระบุชื่อร้านถ้ามี)"
          error={errors.receiveFromDealer?.message as string}
          {...register("receiveFromDealer")}
        />

        <FormInput
          label="คู่แข่งหลัก"
          error={errors.mainCompetitor?.message as string}
          {...register("mainCompetitor")}
        />

        <FormInput
          label="พื้นที่ปลูกพืช"
          error={errors.areaCrops?.message as string}
          {...register("areaCrops")}
        />

        <FormInput
          label="ยอดซื้อเฉลี่ยต่อเดือน"
          error={errors.averageMonthlyPurchase?.message as string}
          {...register("averageMonthlyPurchase")}
        />

        <FormInput
          label="ประเภทพื้นที่"
          error={errors.areaType?.message as string}
          {...register("areaType")}
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
