"use client";

import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import DatePicker from "@/components/custom/DatePicker";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { prefixOptions, responsibilityAreaOptions } from "./employee-options";
import type { Employee } from "@/types/Employee";

type EmployeeFormValues = Partial<Employee> & {
  prefix?: string;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  birthDate?: string;
  age?: number | string;
  position?: string;
  department?: string;
  company?: string;
  responsibilityArea?: string;
  addressLine?: string;
  status?: string;
  roleDefinitionId?: string;
  role?: string;
};

interface EmployeePersonalInfoSectionProps {
  formState: EmployeeFormValues;
  handleChange: (
    field: keyof EmployeeFormValues
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handlePhoneChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  address: {
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  };
  setAddress: React.Dispatch<
    React.SetStateAction<{
      province?: string;
      district?: string;
      subdistrict?: string;
      postalCode?: string;
    }>
  >;
  canEdit: boolean;
  calculatedAge: () => string;
  positionOptions: Array<{ value: string; label: string }>;
  departmentOptions: Array<{ value: string; label: string }>;
  companyOptions: Array<{ value: string; label: string }>;
  showValidation?: boolean;
}

export default function EmployeePersonalInfoSection({
  formState,
  handleChange,
  handlePhoneChange,
  address,
  setAddress,
  canEdit,
  calculatedAge,
  positionOptions,
  departmentOptions,
  companyOptions,
  showValidation,
}: EmployeePersonalInfoSectionProps) {
  const phoneDigits = formState.phone ? String(formState.phone).replace(/\D/g, "") : "";
  return (
    <>
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลพนักงาน
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-6">
        {/* แถว คำนำหน้า / ชื่อ / นามสกุล */}
        <div className="sm:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="sm:col-span-1">
              <FloatingLabelInput
                label="คำนำหน้า"
                type="select"
                options={prefixOptions}
                value={formState.prefix ?? ""}
                disabled={!canEdit}
                onChange={handleChange("prefix")}
              />
            </div>
            <div className="sm:col-span-2">
              <FloatingLabelInput
                label="ชื่อ"
                placeholder="เช่น สมชาย"
                value={formState.firstName ?? ""}
                disabled={!canEdit}
                onChange={handleChange("firstName")}
                error={!formState.firstName && canEdit && showValidation ? "กรุณากรอกชื่อ" : undefined}
              />
            </div>
            <div className="sm:col-span-2">
              <FloatingLabelInput
                label="นามสกุล"
                placeholder="เช่น ใจดี"
                value={formState.lastName ?? ""}
                disabled={!canEdit}
                onChange={handleChange("lastName")}
                error={!formState.lastName && canEdit && showValidation ? "กรุณากรอกนามสกุล" : undefined}
              />
            </div>
          </div>
        </div>
        {/* รหัสพนักงาน */}
        <div>
          <FloatingLabelInput
            label="รหัสพนักงาน"
            placeholder="เช่น EMP-0001"
            value={formState.employeeCode ?? ""}
            disabled={!canEdit}
            onChange={handleChange("employeeCode")}
          />
        </div>

        {/* เบอร์โทรศัพท์ */}
        <div>
          <FloatingLabelInput
            label="เบอร์โทรศัพท์"
            placeholder="0xx-xxx-xxxx"
            value={formState.phone ?? ""}
            disabled={!canEdit}
            onChange={handlePhoneChange}
            maxLength={10}
            error={
              formState.phone && showValidation && (phoneDigits.length < 9 || phoneDigits.length > 10)
                ? "กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง (9-10 หลัก)"
                : undefined
            }
          />
        </div>

        {/* วันเกิด */}
        <div>
          <DatePicker
            label="วันเกิด"
            value={formState.birthDate}
            onChange={(v) =>
              handleChange("birthDate")({
                target: { value: v },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            disabled={!canEdit}
            placeholder=""
          />
        </div>

        {/* อายุ (คำนวณ) */}
        <div>
          <FloatingLabelInput
            label="อายุ"
            value={calculatedAge()}
            disabled={true}
            onChange={() => {}}
          />
        </div>

        {/* ตำแหน่งงาน */}
        <div>
          <FloatingLabelInput
            label="ตำแหน่งงาน"
            type="select"
            options={positionOptions}
            value={formState.position ?? ""}
            disabled={!canEdit}
            onChange={handleChange("position")}
          />
        </div>

        {/* แผนก */}
        <div>
          <FloatingLabelInput
            label="แผนก"
            type="select"
            options={departmentOptions}
            value={formState.department ?? ""}
            disabled={!canEdit}
            onChange={handleChange("department")}
          />
        </div>

        {/* สังกัดบริษัท */}
        <div>
          <FloatingLabelInput
            label="สังกัดบริษัท"
            type="select"
            options={companyOptions}
            value={formState.company ?? ""}
            disabled={!canEdit}
            onChange={handleChange("company")}
          />
        </div>

        {/* เขตที่รับผิดชอบ */}
        <div>
          <FloatingLabelInput
            label="เขตที่รับผิดชอบ"
            type="select"
            options={responsibilityAreaOptions}
            value={formState.responsibilityArea ?? ""}
            disabled={!canEdit}
            onChange={handleChange("responsibilityArea")}
          />
        </div>

        {/* ที่อยู่ (บรรทัดแรก) */}
        <div className="sm:col-span-2">
          <FloatingLabelInput
            label="ที่อยู่ (บ้านเลขที่, ถนน, ฯลฯ)"
            placeholder="123/45 หมู่ 6 ต. ... อ. ..."
            value={formState.addressLine ?? ""}
            disabled={!canEdit}
            onChange={handleChange("addressLine")}
          />
        </div>

        {/* ที่อยู่ (Picker) */}
        <div className="sm:col-span-2">
          <ThaiAddressPicker
            value={address}
            onChange={(next) => setAddress(next)}
          />
        </div>
      </div>
    </>
  );
}