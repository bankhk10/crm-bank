"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import RandomFillButton from "@/components/custom/random-fill-button";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import DatePicker from "@/components/custom/DatePicker";
import { Eye, EyeOff } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import generateRandomEmployee from "@/lib/random-fill/employee";
import type { Employee } from "@/types/Employee.ts";
import {
  prefixOptions,
  responsibilityAreaOptions,
  statusOptions,
} from "./employee-options";
import { FormInput, FormSelect } from "@/components/custom/form-components";

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
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  status?: string;
  roleDefinitionId?: string;
  role?: string;
};

interface EmployeeFormProps {
  employeeId?: string;
  initial?: Partial<EmployeeFormValues>;
  onSubmit?: (payload: any) => Promise<{
    success: boolean;
    issues?: Record<string, string[]>;
    error?: string;
  }>;

  onCancel?: () => void;
  registerRandomize?: (fn: () => void) => void;
  hideBorder?: boolean;
}

type Option = { value: string; label: string };

export default function EmployeeForm({
  employeeId,
  initial,
  onSubmit,

  onCancel,
  registerRandomize,
}: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeFormValues>({
    status: "ACTIVE",
  });

  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<Array<any>>([]);
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Option[]>([]);
  const [positionOptions, setPositionOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const { allowed, isLoading } = usePermission("employee.manage");
  const canEdit = !isLoading && allowed;
  const permissionHint =
    "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อจัดการข้อมูลพนักงาน";

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev || !(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRoles() {
      try {
        const res = await fetch("/api/rbac/roles");
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

  // initialize values from `initial`
  useEffect(() => {
    if (!initial) return;
    const addr = (initial as any).address;
    setValues((prev) => ({
      ...prev,
      ...initial,
      province:
        addr?.province ??
        (initial as any).province ??
        (initial as any).provinceName ??
        prev.province,
      district:
        addr?.district ??
        (initial as any).district ??
        (initial as any).districtName ??
        prev.district,
      subdistrict:
        addr?.subdistrict ??
        (initial as any).subdistrict ??
        (initial as any).subDistrictName ??
        prev.subdistrict,
      postalCode:
        addr?.postalCode != null
          ? String(addr.postalCode)
          : (initial as any).postalCode != null
          ? String((initial as any).postalCode)
          : (initial as any).zipCode != null
          ? String((initial as any).zipCode)
          : prev.postalCode,
      status: (initial as any).status ?? prev.status ?? "ACTIVE",
    }));
  }, [initial]);

  // load companies / departments / positions for selects
  useEffect(() => {
    let mounted = true;

    async function loadReferences() {
      try {
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

  const handleChange = useCallback(
    (key: keyof EmployeeFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const v = (e.target as HTMLInputElement).value;
        setValues((prev) => ({ ...prev, [key]: v }));
        clearFieldError(String(key));
      },
    [clearFieldError]
  );

  const handleSelect = useCallback(
    (key: keyof EmployeeFormValues) => (v: string) => {
      // Don't update if trying to set empty string over existing value
      // This prevents Select from clearing values during re-renders
      setValues((prev) => {
        // Skip update if new value is empty and previous value exists
        if (v === "" && prev[key] && prev[key] !== "") {
          return { ...prev }; // Return new object with same values
        }

        return { ...prev, [key]: v };
      });
      clearFieldError(String(key));
    },
    [clearFieldError]
  );

  const handlePhoneChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = event.target.value.replace(/\D/g, "");
      if (numericValue.length <= 10) {
        setValues((prev) => ({ ...prev, phone: numericValue }));
      }
      clearFieldError("phone");
    },
    [clearFieldError]
  );

  const calculatedAge = useMemo(() => {
    if (typeof values.age === "number" && values.age >= 0) {
      return String(values.age);
    }
    if (values.birthDate) {
      try {
        return String(
          Math.floor(
            (Date.now() - new Date(values.birthDate).getTime()) /
              (1000 * 60 * 60 * 24 * 365.25)
          )
        );
      } catch (e) {
        return "";
      }
    }
    return "";
  }, [values.age, values.birthDate]);

  const handleRandomFill = useCallback(() => {
    if (!canEdit) return;
    const p = generateRandomEmployee();
    setValues((prev) => ({
      ...prev,
      prefix: p.prefix ?? prev.prefix,
      firstName: p.firstName ?? prev.firstName,
      lastName: p.lastName ?? prev.lastName,
      email: p.email ?? prev.email,
      phone: p.phone ?? prev.phone,
      birthDate: p.birthDate ?? prev.birthDate,
      employeeCode: p.employeeCode ?? prev.employeeCode,
      province: p.province ?? prev.province,
      district: p.district ?? prev.district,
      subdistrict: p.subdistrict ?? prev.subdistrict,
      postalCode: p.postalCode ?? prev.postalCode,
    }));
    setPassword(p.password ?? "");
    clearFieldError("firstName");
    clearFieldError("lastName");
    clearFieldError("email");
    clearFieldError("phone");
  }, [canEdit, clearFieldError]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string[]> = {};
    const pushErr = (field: string, msg: string) => {
      nextFieldErrors[field] = [msg];
    };

    if (!values.firstName) pushErr("firstName", "กรุณากรอกชื่อ");
    if (!values.lastName) pushErr("lastName", "กรุณากรอกนามสกุล");
    if (!values.email) pushErr("email", "กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ");
    const emailVal = String(values.email ?? "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailVal && !emailRegex.test(emailVal)) {
      pushErr("email", "รูปแบบอีเมลไม่ถูกต้อง");
    }

    if (password && password.length < 8 && password.length > 0) {
      pushErr("password", "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
    }
    if (!employeeId && !password) {
      pushErr("password", "กรุณากรอกรหัสผ่านสำหรับเข้าสู่ระบบ");
    }

    if (values.phone) {
      const phoneDigits = String(values.phone).replace(/\D/g, "");
      if (phoneDigits.length < 9 || phoneDigits.length > 10) {
        pushErr("phone", "กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง (9-10 หลัก)");
      }
    }

    if (!values.roleDefinitionId) {
      pushErr("roleDefinitionId", "กรุณาเลือกสิทธิ์การใช้งาน");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0][0]);
      setLoading(false);
      return;
    }

    const roleDefId = values.roleDefinitionId ?? undefined;
    const roleDefObj = roles.find((r) => r.id === roleDefId);

    const address = {
      province: values.province,
      district: values.district,
      subdistrict: values.subdistrict,
      postalCode: values.postalCode,
    };
    const hasAddress = Boolean(
      address.province ||
        address.district ||
        address.subdistrict ||
        address.postalCode
    );

    const payload: any = {
      employee: {
        prefix: values.prefix,
        firstName: values.firstName,
        lastName: values.lastName,
        employeeCode: values.employeeCode,
        phone: values.phone,
        birthDate: values.birthDate,
        positionId: values.position,
        departmentId: values.department,
        companyId: values.company,
        responsibilityArea: values.responsibilityArea,
        addressLine: values.addressLine,
        status: values.status ?? "ACTIVE",
        name: `${values.prefix ?? ""} ${values.firstName ?? ""} ${
          values.lastName ?? ""
        }`.trim(),
        email: emailVal || undefined,
        roleTitle: (values.roleDefinitionId && roleDefObj?.name) || undefined,
        ...(hasAddress ? { address } : {}),
      },
    };

    if (employeeId) {
      payload.user = {
        email: emailVal,
        roleId: roleDefId,
        ...(password ? { password: String(password) } : {}),
      };
    } else if (password) {
      payload.user = {
        email: emailVal,
        password: String(password),
        roleId: roleDefId,
      };
    }

    try {
      let res: Response | null = null;
      if (onSubmit) {
        const result = await onSubmit(payload);
        if (!result.success) {
          setError(
            result.error ??
              Object.values(result.issues ?? {})[0]?.[0] ??
              "Server error"
          );
          setFieldErrors(result.issues ?? {});
        } else {
          setSuccess("บันทึกเรียบร้อยแล้ว");
        }
      } else if (employeeId) {
        res = await fetch(`/api/employee/${employeeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.error || "Server error");
        } else {
          setSuccess("อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว");
        }
      } else {
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
          setValues({ status: "ACTIVE" });
          setPassword("");
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลส่วนตัว
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-6 mt-6">
        <FormInput
          label="รหัสพนักงาน"
          value={values.employeeCode ?? ""}
          onChange={handleChange("employeeCode")}
          disabled={!canEdit}
        />
        <FormSelect
          label="คำนำหน้า"
          value={values.prefix ?? ""}
          onChange={handleSelect("prefix")}
          options={prefixOptions.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          placeholder="เลือกคำนำหน้า"
          disabled={!canEdit}
        />

        <FormInput
          label="ชื่อ"
          value={values.firstName ?? ""}
          onChange={handleChange("firstName")}
          disabled={!canEdit}
          required
          error={fieldErrors.firstName?.[0]}
          containerClassName="md:col-span-2"
        />

        <FormInput
          label="นามสกุล"
          value={values.lastName ?? ""}
          onChange={handleChange("lastName")}
          disabled={!canEdit}
          required
          error={fieldErrors.lastName?.[0]}
          containerClassName="md:col-span-2"
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <FormInput
          label="เบอร์โทรศัพท์"
          value={values.phone ?? ""}
          onChange={handlePhoneChange}
          disabled={!canEdit}
          error={fieldErrors.phone?.[0]}
        />

        <div className="mt-0">
          <DatePicker
            label="วันเกิด"
            value={values.birthDate}
            onChange={(v) => {
              setValues((p) => ({ ...p, birthDate: v }));
              clearFieldError("birthDate");
            }}
            disabled={!canEdit}
            placeholder=""
          />
        </div>

        <FormInput
          label="อายุ"
          value={calculatedAge}
          disabled
          onChange={() => {}}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ที่อยู่
      </h3>

      <FormInput
        label="ที่อยู่ (บ้านเลขที่, ถนน, ฯลฯ)"
        placeholder="123/45 หมู่ 6"
        value={values.addressLine ?? ""}
        onChange={handleChange("addressLine")}
        disabled={!canEdit}
        containerClassName="md:col-span-2 mt-6"
      />

      <div className="md:col-span-2">
        <ThaiAddressPicker
          value={{
            province: values.province,
            district: values.district,
            subdistrict: values.subdistrict,
            postalCode: values.postalCode,
          }}
          onChange={(next) => {
            setValues((p) => ({ ...p, ...next }));
            clearFieldError("province");
            clearFieldError("district");
            clearFieldError("subdistrict");
            clearFieldError("postalCode");
          }}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลการทำงาน
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4 mt-6">
        <FormSelect
          label="ตำแหน่งงาน"
          value={values.position ?? ""}
          onChange={handleSelect("position")}
          options={positionOptions}
          placeholder="เลือกตำแหน่ง"
          disabled={!canEdit}
        />

        <FormSelect
          label="แผนก"
          value={values.department ?? ""}
          onChange={handleSelect("department")}
          options={departmentOptions}
          placeholder="เลือกแผนก"
          disabled={!canEdit}
        />

        <FormSelect
          label="สังกัดบริษัท"
          value={values.company ?? ""}
          onChange={handleSelect("company")}
          options={companyOptions}
          placeholder="เลือกบริษัท"
          disabled={!canEdit}
        />

        <FormSelect
          label="เขตที่รับผิดชอบ"
          value={values.responsibilityArea ?? ""}
          onChange={handleSelect("responsibilityArea")}
          options={responsibilityAreaOptions.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          placeholder="เลือกเขต"
          disabled={!canEdit}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลการเข้าสู่ระบบ
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
        <FormInput
          label="อีเมลสำหรับเข้าสู่ระบบ"
          type="email"
          value={values.email ?? ""}
          onChange={handleChange("email")}
          disabled={!canEdit}
          required
          error={fieldErrors.email?.[0]}
        />

        <FormInput
          label={
            employeeId ? "รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน"
          }
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError("password");
          }}
          placeholder={
            employeeId
              ? "เว้นว่างหากไม่ต้องการเปลี่ยน"
              : "รหัสผ่านสำหรับเข้าสู่ระบบ"
          }
          disabled={!canEdit}
          error={fieldErrors.password?.[0]}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
          rightIconInteractive
        />

        <FormSelect
          label="สิทธิ์การใช้งาน *"
          value={values.roleDefinitionId ?? ""}
          onChange={handleSelect("roleDefinitionId")}
          options={roles.map((r: any) => ({ value: r.id, label: r.name }))}
          placeholder="เลือกสิทธิ์การใช้งาน"
          disabled={!canEdit || roles.length === 0}
          error={fieldErrors.roleDefinitionId?.[0]}
        />

        <FormSelect
          label="สถานะการทำงาน"
          value={values.status ?? "ACTIVE"}
          onChange={handleSelect("status")}
          options={statusOptions.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
          placeholder="เลือกสถานะ"
          disabled={!canEdit}
        />
      </div>

      <div className="md:col-span-2 pt-6 border-t my-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {canEdit && (
            <RandomFillButton
              size="lg"
              className="w-44 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
              onClick={handleRandomFill}
            />
          )}

          {onCancel && (
            <Button
              size="lg"
              className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
              type="button"
              onClick={onCancel}
              disabled={loading}
            >
              ยกเลิก
            </Button>
          )}

          {canEdit && (
            <Button
              size="lg"
              className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
              type="submit"
              disabled={loading}
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
