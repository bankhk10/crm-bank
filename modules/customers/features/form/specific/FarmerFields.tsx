"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { LocateFixed } from "lucide-react";
import { FormInput, FormSelect } from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { CustomerFormData, SelectOption } from "../../../types";

export function FarmerFields() {
  const { register, control, formState: { errors }, setValue } = useFormContext<CustomerFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "farmPlots",
  });

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

  const getPlotLocation = (index: number) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue(`farmPlots.${index}.latitude`, position.coords.latitude.toFixed(6), { shouldValidate: true });
        setValue(`farmPlots.${index}.longitude`, position.coords.longitude.toFixed(6), { shouldValidate: true });
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location");
      }
    );
  };

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลแปลงเกษตร
      </h3>

      {fields.map((field, idx) => (
        <div key={field.id} className="space-y-3 border border-gray-200 rounded-2xl p-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-700">แปลงที่ {idx + 1}</div>
            <div>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl px-3 py-1 h-auto text-sm"
                onClick={() => remove(idx)}
              >
                ลบแปลง
              </Button>
            </div>
          </div>
          <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
            <div className="md:col-span-2 flex items-end gap-2">
              <FormInput
                label="Latitude"
                type="number"
                containerClassName="flex-1"
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                {...register(`farmPlots.${idx}.latitude` as const)}
              />
              <FormInput
                label="Longitude"
                type="number"
                containerClassName="flex-1"
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                {...register(`farmPlots.${idx}.longitude` as const)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mb-1 shrink-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                onClick={() => getPlotLocation(idx)}
                title="ดึงพิกัดปัจจุบัน"
              >
                <LocateFixed className="h-4 w-4" />
              </Button>
            </div>
            <FormInput
              label="ขนาดพื้นที่เพาะปลูก (ไร่)"
              type="number"
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              {...register(`farmPlots.${idx}.areaRai` as const)}
            />
          </div>

          <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
            <FormInput
              label="ชนิดพืช"
              {...register(`farmPlots.${idx}.cropType` as const)}
            />
            <FormInput
              label="สายพันธุ์"
              {...register(`farmPlots.${idx}.variety` as const)}
            />
          </div>

          <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
            <FormInput
              label="ประเภทของดิน"
              {...register(`farmPlots.${idx}.soilType` as const)}
            />
            <FormInput
              label="แหล่งน้ำ"
              {...register(`farmPlots.${idx}.waterSource` as const)}
            />
          </div>
        </div>
      ))}

      <div className="text-center mt-4">
        <Button
          type="button"
          className="bg-blue-500 hover:bg-blue-700 text-white rounded-2xl px-4"
          onClick={() =>
            append({
              latitude: "",
              longitude: "",
              areaRai: "",
              cropType: "",
              variety: "",
              soilType: "",
              waterSource: "",
            })
          }
        >
          เพิ่มข้อมูลแปลงเกษตร
        </Button>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลอื่นๆ
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
          label="หมายเหตุทางธุรกิจ"
          containerClassName="md:col-span-2"
          error={errors.notes?.message as string}
          {...register("notes")}
        />
      </div>
    </div>
  );
}
