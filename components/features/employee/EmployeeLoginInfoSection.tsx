"use client";

import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import { statusOptions } from "./employee-options";
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
}

export default function EmployeeLoginInfoSection({
  formState,
  handleChange,
  password,
  setPassword,
  roles,
  canEdit,
}: EmployeeLoginInfoSectionProps) {
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
          />
        </div>

        {/* รหัสผ่าน */}
        <div>
          <FloatingLabelInput
            label="รหัสผ่าน"
            type="password"
            placeholder="รหัสผ่านสำหรับเข้าสู่ระบบ"
            value={password}
            disabled={!canEdit}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(event.target.value)
            }
          />
        </div>

        {/* สิทธิ์การใช้งาน (Role Definition) */}
        <div>
          <FloatingLabelInput
            label="สิทธิ์การใช้งาน"
            type="select"
            options={roles.map((r: any) => ({ value: r.id, label: r.name }))}
            value={formState.roleDefinitionId ?? ""}
            disabled={!canEdit || roles.length === 0}
            onChange={handleChange("roleDefinitionId")}
          />
        </div>

        {/* สถานะการทำงาน */}
        <div>
          <FloatingLabelInput
            label="สถานะการทำงาน"
            type="select"
            options={statusOptions}
            value={formState.status ?? ""}
            disabled={!canEdit}
            onChange={handleChange("status")}
          />
        </div>
      </div>
    </>
  );
}