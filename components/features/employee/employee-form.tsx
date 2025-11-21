"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { Employee } from "@/types/Employee.ts";
import EmployeePersonalInfoSection from "./EmployeePersonalInfoSection";
import EmployeeLoginInfoSection from "./EmployeeLoginInfoSection";
import EmployeeFormButtons from "./EmployeeFormButtons";
import generateRandomEmployee from "@/lib/random-fill/employee";

interface EmployeeFormProps {
  employeeId?: string;
  initial?: Partial<EmployeeFormValues>;
  onSubmit?: (
    payload: any
  ) => Promise<{
    success: boolean;
    issues?: Record<string, string[]>;
    error?: string;
  }>;
  hideBorder?: boolean;
  onCancel?: () => void;
  registerRandomize?: (fn: () => void) => void;
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
  addressLine?: string;
  status?: string;
  roleDefinitionId?: string;
  role?: string;
};

export default function EmployeeForm({
  employeeId,
  initial,
  onSubmit,
  hideBorder,
  onCancel,
  registerRandomize,
}: EmployeeFormProps) {
  const [formState, setFormState] = useState<EmployeeFormValues>({});
  const [password, setPassword] = useState<string>("");
  const [roles, setRoles] = useState<Array<any>>([]); // นี่คือ Role Definitions จาก API
  const [companyOptions, setCompanyOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [positionOptions, setPositionOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [address, setAddress] = useState<{
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
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

  // initialize from `initial` prop when provided
  useEffect(() => {
    if (!initial) return;
    setFormState((prev) => ({ ...prev, ...initial }));
  }, [initial]);

  // initialize address state when provided in `initial`
  useEffect(() => {
    if (!initial) return;
    const addr = (initial as any).address;
    if (addr && (addr.province || addr.district || addr.subdistrict || addr.postalCode !== undefined)) {
      setAddress({
        province: addr.province ?? undefined,
        district: addr.district ?? undefined,
        subdistrict: addr.subdistrict ?? undefined,
        postalCode: addr.postalCode !== undefined ? String(addr.postalCode) : undefined,
      });
      return;
    }

    // fallback: maybe the API returned flat fields
    const fallback = {
      province: (initial as any).province ?? undefined,
      district: (initial as any).district ?? undefined,
      subdistrict: (initial as any).subdistrict ?? undefined,
      postalCode:
        (initial as any).postalCode !== undefined
          ? String((initial as any).postalCode)
          : (initial as any).zipCode !== undefined
          ? String((initial as any).zipCode)
          : undefined,
    };

    if (fallback.province || fallback.district || fallback.subdistrict || fallback.postalCode) {
      setAddress(fallback);
    }
  }, [initial]);

  // load companies / departments / positions for selects (ids)
  useEffect(() => {
    let mounted = true;

    async function loadReferences() {
      try {
        // companies endpoint returns { companies, total, page, perPage }
        const cRes = await fetch(`/api/companies?perPage=100`);
        if (cRes.ok) {
          const d = await cRes.json();
          if (mounted && Array.isArray(d.companies)) {
            setCompanyOptions(
              d.companies.map((c: any) => ({ value: c.id, label: c.name }))
            );
          }
        }
      } catch (e) {
        // ignore
      }

      try {
        const dRes = await fetch(`/api/rbac/departments`);
        if (dRes.ok) {
          const dd = await dRes.json();
          if (mounted && Array.isArray(dd)) {
            setDepartmentOptions(
              dd.map((x: any) => ({ value: x.id, label: x.name }))
            );
          }
        }
      } catch (e) {
        // ignore
      }

      try {
        const pRes = await fetch(`/api/rbac/positions`);
        if (pRes.ok) {
          const pp = await pRes.json();
          if (mounted && Array.isArray(pp)) {
            setPositionOptions(
              pp.map((x: any) => ({ value: x.id, label: x.name }))
            );
          }
        }
      } catch (e) {
        // ignore
      }
    }

    loadReferences();

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

  const handleRandomFill = useCallback(() => {
    if (!canEdit) return;
    const p = generateRandomEmployee();
    setFormState((prev) => ({
      ...prev,
      prefix: p.prefix,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      birthDate: p.birthDate,
      employeeCode: p.employeeCode,
    }));
    setPassword(p.password ?? "");
    setAddress({
      province: p.province,
      district: p.district,
      subdistrict: p.subdistrict,
      postalCode: p.postalCode,
    });

    // if there are select options, pick random ones
    if (positionOptions && positionOptions.length) {
      const pos =
        positionOptions[Math.floor(Math.random() * positionOptions.length)];
      setFormState((prev) => ({ ...prev, position: pos.value }));
    }
    if (departmentOptions && departmentOptions.length) {
      const dep =
        departmentOptions[Math.floor(Math.random() * departmentOptions.length)];
      setFormState((prev) => ({ ...prev, department: dep.value }));
    }
    if (companyOptions && companyOptions.length) {
      const c =
        companyOptions[Math.floor(Math.random() * companyOptions.length)];
      setFormState((prev) => ({ ...prev, company: c.value }));
    }
  }, [canEdit, companyOptions, departmentOptions, positionOptions]);

  // If parent provided a register function, give them the randomizer
  useEffect(() => {
    if (!registerRandomize) return;
    registerRandomize(handleRandomFill);
    return () => {
      try {
        registerRandomize(() => {});
      } catch (e) {
        // ignore
      }
    };
  }, [registerRandomize, handleRandomFill]);

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
    // Trigger validation display for fields that should show errors on submit
    setShowValidation(true);
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Basic client-side validation before proceeding to server
      // We set showValidation to true above so inline field errors will appear as well.
      if (!formState.firstName) {
        setError("กรุณากรอกชื่อ");
        setLoading(false);
        return;
      }
      if (!formState.lastName) {
        setError("กรุณากรอกนามสกุล");
        setLoading(false);
        return;
      }
      if (!formState.email) {
        setError("กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ");
        setLoading(false);
        return;
      }
      // simple email format check
      const emailVal = String(formState.email ?? "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailVal && !emailRegex.test(emailVal)) {
        setError("รูปแบบอีเมลไม่ถูกต้อง");
        setLoading(false);
        return;
      }
      // password policy (only when provided)
      if (
        password &&
        String(password).length > 0 &&
        String(password).length < 8
      ) {
        setError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
        setLoading(false);
        return;
      }
      // Require password only for new employee creation (not for update)
      if (!employeeId && !password) {
        setError("กรุณากรอกรหัสผ่านสำหรับเข้าสู่ระบบ");
        setLoading(false);
        return;
      }
      // phone format check (if provided)
      if (formState.phone) {
        const phoneDigits = String(formState.phone).replace(/\D/g, "");
        if (phoneDigits.length < 9 || phoneDigits.length > 10) {
          setError("กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง (9-10 หลัก)");
          setLoading(false);
          return;
        }
      }

      // ค้นหา Role Definition (สิทธิ์การใช้งาน)
      // Validate required fields shown on submit
      if (!formState.roleDefinitionId) {
        setError("กรุณาเลือกสิทธิ์การใช้งาน");
        setLoading(false);
        return;
      }
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
          positionId: formState.position,
          departmentId: formState.department,
          companyId: formState.company,
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

      let res: Response | null = null;

      if (onSubmit) {
        const result = await onSubmit(payload);
        if (!result.success) {
          setError(
            result.error ??
              Object.values(result.issues ?? {})[0]?.[0] ??
              "Server error"
          );
        } else {
          setSuccess("บันทึกเรียบร้อยแล้ว");
        }
      } else if (employeeId) {
        // update existing employee - include user data if provided
        res = await fetch(`/api/employee/${employeeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload), // Send full payload including user
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.error || "Server error");
        } else {
          setSuccess("อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว");
        }
      } else {
        // create new employee + user
        res = await fetch("/api/rbac/employees/create-with-user", {
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
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white sm:rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-1">
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
          positionOptions={positionOptions}
          departmentOptions={departmentOptions}
          companyOptions={companyOptions}
          showValidation={showValidation}
        />

        <EmployeeLoginInfoSection
          formState={formState}
          handleChange={handleChange}
          password={password}
          setPassword={setPassword}
          roles={roles}
          canEdit={canEdit}
          showValidation={showValidation}
          employeeId={employeeId}
        />

        <EmployeeFormButtons
          canEdit={canEdit}
          loading={loading}
          employeeId={employeeId}
          permissionHint={permissionHint}
          onCancel={onCancel ?? (() => router.back())}
          hideBorder={hideBorder}
        />
      </form>
    </div>
  );
}
