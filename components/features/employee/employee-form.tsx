"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  hideBorder?: boolean;
  onCancel?: () => void;
  registerRandomize?: (fn: () => void) => void;
}

type Option = { value: string; label: string };

const labelTextClass = "mx-2 mt-2 text-sm font-bold text-gray-900";
const inputTextClass = "mt-1 h-11 text-base placeholder:text-gray-500";

export default function EmployeeForm({
  employeeId,
  initial,
  onSubmit,
  hideBorder,
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
  const router = useRouter();

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
    (key: keyof EmployeeFormValues) =>
      (v: string) => {
        setValues((prev) => ({ ...prev, [key]: v }));
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
      address.province || address.district || address.subdistrict || address.postalCode
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
    <div className="bg-white sm:rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          ข้อมูลพนักงาน
        </h3>

        <div className="grid gap-x-4 gap-y-3 md:grid-cols-5 mt-6">
          <div>
            <Label className={labelTextClass}>คำนำหน้า</Label>
            <Select
              value={values.prefix ?? ""}
              onValueChange={handleSelect("prefix")}
              disabled={!canEdit}
            >
              <SelectTrigger className={inputTextClass}>
                <SelectValue placeholder="เลือกคำนำหน้า" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>คำนำหน้า</SelectLabel>
                  {prefixOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label className={labelTextClass}>ชื่อ</Label>
            <Input
              value={values.firstName ?? ""}
              onChange={handleChange("firstName")}
              disabled={!canEdit}
              required
              className={inputTextClass}
            />
            {fieldErrors.firstName?.[0] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.firstName[0]}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label className={labelTextClass}>นามสกุล</Label>
            <Input
              value={values.lastName ?? ""}
              onChange={handleChange("lastName")}
              disabled={!canEdit}
              required
              className={inputTextClass}
            />
            {fieldErrors.lastName?.[0] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.lastName[0]}</p>
            )}
          </div>
        </div>

        <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
          <div>
            <Label className={labelTextClass}>รหัสพนักงาน</Label>
            <Input
              value={values.employeeCode ?? ""}
              onChange={handleChange("employeeCode")}
              disabled={!canEdit}
              className={inputTextClass}
            />
          </div>

          <div>
            <Label className={labelTextClass}>เบอร์โทรศัพท์</Label>
            <Input
              value={values.phone ?? ""}
              onChange={handlePhoneChange}
              disabled={!canEdit}
              className={inputTextClass}
            />
            {fieldErrors.phone?.[0] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.phone[0]}</p>
            )}
          </div>

          <div className="mt-2">
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

          <div>
            <Label className={labelTextClass}>อายุ</Label>
            <Input value={calculatedAge} disabled className={inputTextClass} />
          </div>
        </div>

        <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
          <div>
            <Label className={labelTextClass}>ตำแหน่งงาน</Label>
            <Select
              value={values.position ?? ""}
              onValueChange={handleSelect("position")}
              disabled={!canEdit}
            >
              <SelectTrigger className={inputTextClass}>
                <SelectValue placeholder="เลือกตำแหน่ง" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>ตำแหน่ง</SelectLabel>
                  {positionOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={labelTextClass}>แผนก</Label>
            <Select
              value={values.department ?? ""}
              onValueChange={handleSelect("department")}
              disabled={!canEdit}
            >
              <SelectTrigger className={inputTextClass}>
                <SelectValue placeholder="เลือกแผนก" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>แผนก</SelectLabel>
                  {departmentOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={labelTextClass}>สังกัดบริษัท</Label>
            <Select
              value={values.company ?? ""}
              onValueChange={handleSelect("company")}
              disabled={!canEdit}
            >
              <SelectTrigger className={inputTextClass}>
                <SelectValue placeholder="เลือกบริษัท" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>บริษัท</SelectLabel>
                  {companyOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={labelTextClass}>เขตที่รับผิดชอบ</Label>
            <Select
              value={values.responsibilityArea ?? ""}
              onValueChange={handleSelect("responsibilityArea")}
              disabled={!canEdit}
            >
              <SelectTrigger className={inputTextClass}>
                <SelectValue placeholder="เลือกเขต" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>เขต</SelectLabel>
                  {responsibilityAreaOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="md:col-span-2 mt-2">
          <Label className={labelTextClass}>ที่อยู่ (บ้านเลขที่, ถนน, ฯลฯ)</Label>
          <Input
            placeholder="123/45 หมู่ 6"
            value={values.addressLine ?? ""}
            onChange={handleChange("addressLine")}
            disabled={!canEdit}
            className={inputTextClass}
          />
        </div>

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
          ข้อมูลการเข้าสู่ระบบ
        </h3>

        <div className="grid gap-x-4 gap-y-3 md:grid-cols-3 mt-6">
          <div>
            <Label className={labelTextClass}>อีเมลสำหรับเข้าสู่ระบบ</Label>
            <Input
              type="email"
              value={values.email ?? ""}
              onChange={handleChange("email")}
              disabled={!canEdit}
              required
              className={inputTextClass}
            />
            {fieldErrors.email?.[0] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div>
            <Label className={labelTextClass}>
              {employeeId
                ? "รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)"
                : "รหัสผ่าน"}
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                disabled={!canEdit}
                placeholder={
                  employeeId ? "เว้นว่างหากไม่ต้องการเปลี่ยน" : "รหัสผ่านสำหรับเข้าสู่ระบบ"
                }
                className={`${inputTextClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-600 hover:text-gray-900"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password?.[0] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.password[0]}</p>
            )}
          </div>

          <div>
            <Label className={labelTextClass}>สิทธิ์การใช้งาน *</Label>
            <Select
              value={values.roleDefinitionId ?? ""}
              onValueChange={handleSelect("roleDefinitionId")}
              disabled={!canEdit || roles.length === 0}
            >
              <SelectTrigger className={inputTextClass}>
                <SelectValue placeholder="เลือกสิทธิ์การใช้งาน" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>สิทธิ์</SelectLabel>
                  {roles.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {fieldErrors.roleDefinitionId?.[0] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.roleDefinitionId[0]}</p>
            )}
          </div>
        </div>

        <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
          <div>
            <Label className={labelTextClass}>สถานะการทำงาน</Label>
            <Select
              value={values.status ?? "ACTIVE"}
              onValueChange={handleSelect("status")}
              disabled={!canEdit}
            >
              <SelectTrigger className={inputTextClass}>
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>สถานะ</SelectLabel>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={`md:col-span-2 pt-6 ${hideBorder ? "my-2" : "border-t my-2"}`}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-44 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
              type="button"
              onClick={handleRandomFill}
              disabled={!canEdit}
              title={!canEdit ? permissionHint : undefined}
            >
              กรอกข้อมูลสุ่ม
            </Button>
            <Button
              size="lg"
              className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
              type="button"
              onClick={onCancel ?? (() => router.back())}
              disabled={!canEdit}
              title={!canEdit ? permissionHint : undefined}
            >
              ยกเลิก
            </Button>
            <Button
              size="lg"
              className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
              type="submit"
              disabled={!canEdit || loading}
              title={!canEdit ? permissionHint : undefined}
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
