"use client";

import React, { useState } from "react";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import { statusOptions } from "./employee-options";
import { Eye, EyeOff } from "lucide-react";
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

interface EmployeeLoginInfoSectionProps {
  formState: EmployeeFormValues;
  handleChange: (
    field: keyof EmployeeFormValues
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  roles: Array<any>;
  canEdit: boolean;
  showValidation?: boolean;
}

export default function EmployeeLoginInfoSection({
  formState,
  handleChange,
  password,
  setPassword,
  roles,
  canEdit,
  showValidation,
}: EmployeeLoginInfoSectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl">
        ข้อมูลการเข้าสู่ระบบ
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-6">
        {/* อีเมล */}
        <div>
          <FloatingLabelInput
            label="อีเมลสำหรับเข้าสู่ระบบ"
            type="email"
            placeholder="jane@example.com"
            value={formState.email ?? ""}
            disabled={!canEdit}
            onChange={handleChange("email")}
            error={
              !formState.email && canEdit && showValidation
                ? "กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ"
                : undefined
            }
          />
        </div>

        {/* รหัสผ่าน */}
        <div>
          <FloatingLabelInput
            label="รหัสผ่าน"
            type={showPassword ? "text" : "password"}
            placeholder="รหัสผ่านสำหรับเข้าสู่ระบบ"
            value={password}
            disabled={!canEdit}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(event.target.value)
            }
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="inline-flex items-center justify-center rounded p-1 text-gray-600 hover:text-gray-900"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            }
            minLength={8}
            error={
              password && String(password).length > 0 && String(password).length < 8
                ? "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร"
                : !password && canEdit && showValidation
                ? "กรุณากรอกรหัสผ่านสำหรับเข้าสู่ระบบ"
                : undefined
            }
          />
        </div>

        {/* สิทธิ์การใช้งาน (Role Definition) */}
        <div>
          <FloatingLabelInput
            label="สิทธิ์การใช้งาน *"
            type="select"
            options={roles.map((r: any) => ({ value: r.id, label: r.name }))}
            value={formState.roleDefinitionId ?? ""}
            disabled={!canEdit || roles.length === 0}
            onChange={handleChange("roleDefinitionId")}
            error={
              !formState.roleDefinitionId && canEdit && showValidation
                ? "กรุณาเลือกสิทธิ์การใช้งาน"
                : undefined
            }
          />
        </div>

        {/* สถานะการทำงาน */}
        <div>
          <FloatingLabelInput
            label="สถานะการทำงาน"
            type="select"
            options={statusOptions}
            value={formState.status ?? "ACTIVE"}
            disabled={!canEdit}
            onChange={handleChange("status")}
          />
        </div>
      </div>
    </>
  );
}
