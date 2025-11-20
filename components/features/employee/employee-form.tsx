"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { Employee } from "@/types/Employee.ts";
import EmployeePersonalInfoSection from "./EmployeePersonalInfoSection";
import EmployeeLoginInfoSection from "./EmployeeLoginInfoSection";
import EmployeeFormButtons from "./EmployeeFormButtons";

interface EmployeeFormProps {
  employeeId?: string;
}

// ขยาย Type ของ formState เพื่อรองรับฟิลด์ทั้งหมดจาก code1
// ในการใช้งานจริง ควรอ้างอิงจาก Type `Employee` ของคุณ
type EmployeeFormValues = Partial<Employee> & {
  prefix?: string;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  birthDate?: string; // ใช้ string (YYYY-MM-DD) สำหรับ input type="date"
  age?: number | string;
  position?: string;
  department?: string;
  company?: string;
  responsibilityArea?: string;
  addressLine?: string; // ที่อยู่ (บรรทัดแรก)
  status?: string;
  roleDefinitionId?: string; // สำหรับ "สิทธิ์การใช้งาน"
  role?: string; // Role เดิมใน code2 (อาจซ้ำซ้อนกับ roleDefinitionId)
};

export default function EmployeeForm({ employeeId }: EmployeeFormProps) {
  const [formState, setFormState] = useState<EmployeeFormValues>({});
  const [password, setPassword] = useState<string>("");
  const [roles, setRoles] = useState<Array<any>>([]); // นี่คือ Role Definitions จาก API
  const [address, setAddress] = useState<{
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { allowed, isLoading } = usePermission("employee.manage");
  const canEdit = !isLoading && allowed;
  const permissionHint =
    "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อจัดการข้อมูลพนักงาน";
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function loadRoles() {
      try {
        const res = await fetch("/api/rbac/roles"); // นี่คือ "สิทธิ์การใช้งาน" (Role Definitions)
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setRoles(data);
      } catch (e) {
        // ignore
      }
    }

    loadRoles();

    return () => {
      mounted = false;
    };
  }, []);

  // ฟังก์ชัน Handle Change แบบทั่วไป
  const handleChange =
    (field: keyof EmployeeFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = event.target.value.replace(/\D/g, "");
    if (numericValue.length <= 10) {
      setFormState((prev) => ({ ...prev, phone: numericValue }));
    }
  };

  // ฟังก์ชันคำนวณอายุ (จาก code1)
  const calculatedAge = () => {
    if (typeof formState.age === "number" && formState.age >= 0) {
      return String(formState.age);
    }
    if (formState.birthDate) {
      try {
        return String(
          Math.floor(
            (Date.now() - new Date(formState.birthDate).getTime()) /
              (1000 * 60 * 60 * 24 * 365.25)
          )
        );
      } catch (e) {
        return "";
      }
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // ค้นหา Role Definition (สิทธิ์การใช้งาน)
      const roleDefId = formState.roleDefinitionId ?? undefined;
      const roleDefObj = roles.find((r) => r.id === roleDefId);

      const payload: any = {
        employee: {
          // รวมฟิลด์ทั้งหมดจาก formState
          prefix: formState.prefix,
          firstName: formState.firstName,
          lastName: formState.lastName,
          employeeCode: formState.employeeCode,
          phone: formState.phone,
          birthDate: formState.birthDate,
          position: formState.position,
          department: formState.department,
          company: formState.company,
          responsibilityArea: formState.responsibilityArea,
          addressLine: formState.addressLine, // ที่อยู่บรรทัดแรก
          status: formState.status,

          // ข้อมูลจาก code2 เดิม
          name: `${formState.prefix ?? ""} ${formState.firstName ?? ""} ${
            formState.lastName ?? ""
          }`.trim(), // สร้างชื่อเต็ม
          email: String(formState.email ?? "").trim() || undefined,

          // ข้อมูล Role/Address
          roleTitle:
            (formState.roleDefinitionId && roleDefObj?.name) || undefined, // ชื่่อสิทธิ์
          address:
            address &&
            (address.province ||
              address.district ||
              address.subdistrict ||
              address.postalCode)
              ? address
              : undefined,
        },
      };

      if (password) {
        payload.user = {
          email: String(formState.email ?? "").trim(),
          password: String(password),
          roleId: roleDefId, // ID สิทธิ์การใช้งาน
        };
      }

      const res = await fetch("/api/rbac/employees/create-with-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Server error");
      } else {
        setSuccess("สร้างพนักงานเรียบร้อยแล้ว");
        setFormState({});
        setPassword("");
        setAddress({});
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm sm:rounded-lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-1">
        <div className="text-center">
          <h5 className="font-semibold text-3xl my-5 border-b pb-6">
            เพิ่มข้อมูลพนักงานใหม่
          </h5>
        </div>
        {(!canEdit || error || success) && (
          <div>
            {!canEdit && (
              <Alert variant="destructive">
                <AlertDescription>{permissionHint}</AlertDescription>
              </Alert>
            )}
            {error && (
              <div className="mt-3">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
            {success && (
              <div className="mt-3">
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}

        <EmployeePersonalInfoSection
          formState={formState}
          handleChange={handleChange}
          handlePhoneChange={handlePhoneChange}
          address={address}
          setAddress={setAddress}
          canEdit={canEdit}
          calculatedAge={calculatedAge}
        />

        <EmployeeLoginInfoSection
          formState={formState}
          handleChange={handleChange}
          password={password}
          setPassword={setPassword}
          roles={roles}
          canEdit={canEdit}
        />

        <EmployeeFormButtons
          canEdit={canEdit}
          loading={loading}
          employeeId={employeeId}
          permissionHint={permissionHint}
          onCancel={() => router.back()}
        />
      </form>
    </div>
  );
}
