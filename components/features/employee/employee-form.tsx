"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { Employee } from "@/types/Employee.ts";
import generateRandomEmployee from "@/lib/random-fill/employee";

import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import DatePicker from "@/components/custom/DatePicker";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { prefixOptions, responsibilityAreaOptions, statusOptions } from "./employee-options";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function EmployeePersonalInfoSection({
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
  employeeId?: string; // Add this to know if we're editing
}

function EmployeeLoginInfoSection({
  formState,
  handleChange,
  password,
  setPassword,
  roles,
  canEdit,
  showValidation,
  employeeId,
}: EmployeeLoginInfoSectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
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
            label={employeeId ? "รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน"}
            type={showPassword ? "text" : "password"}
            placeholder={employeeId ? "เว้นว่างหากไม่ต้องการเปลี่ยน" : "รหัสผ่านสำหรับเข้าสู่ระบบ"}
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
              password &&
              String(password).length > 0 &&
              String(password).length < 8
                ? "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร"
                : !employeeId && !password && canEdit && showValidation
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

interface EmployeeFormButtonsProps {
  canEdit: boolean;
  loading: boolean;
  employeeId?: string;
  permissionHint: string;
  onCancel: () => void;
  hideBorder?: boolean;
}

function EmployeeFormButtons({
  canEdit,
  loading,
  employeeId,
  permissionHint,
  onCancel,
  hideBorder,
}: EmployeeFormButtonsProps) {
  return (
    <div className={`md:col-span-2 mt-8 ${hideBorder ? "my-2" : "border-t my-2"}`}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          size="lg"
          className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
          type="button"
          onClick={onCancel}
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
          {loading
            ? "กำลังบันทึก..."
            : employeeId
            ? "บันทึก"
            : "บันทึก"}
        </Button>
      </div>
    </div>
  );
}

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

  // initialize from `initial` prop when provided
  useEffect(() => {
    if (!initial) return;
    setFormState((prev) => ({ ...prev, ...initial }));
  }, [initial]);

  // initialize address state when provided in `initial`
  useEffect(() => {
    if (!initial) return;
    const addr = (initial as any).address;
    if (
      addr &&
      (addr.province ||
        addr.district ||
        addr.subdistrict ||
        addr.postalCode !== undefined)
    ) {
      setAddress({
        province: addr.province ?? undefined,
        district: addr.district ?? undefined,
        subdistrict: addr.subdistrict ?? undefined,
        postalCode:
          addr.postalCode !== undefined ? String(addr.postalCode) : undefined,
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

    if (
      fallback.province ||
      fallback.district ||
      fallback.subdistrict ||
      fallback.postalCode
    ) {
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
    setShowValidation(true);
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
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
      const emailVal = String(formState.email ?? "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailVal && !emailRegex.test(emailVal)) {
        setError("รูปแบบอีเมลไม่ถูกต้อง");
        setLoading(false);
        return;
      }
      if (
        password &&
        String(password).length > 0 &&
        String(password).length < 8
      ) {
        setError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
        setLoading(false);
        return;
      }
      if (!employeeId && !password) {
        setError("กรุณากรอกรหัสผ่านสำหรับเข้าสู่ระบบ");
        setLoading(false);
        return;
      }
      if (formState.phone) {
        const phoneDigits = String(formState.phone).replace(/\D/g, "");
        if (phoneDigits.length < 9 || phoneDigits.length > 10) {
          setError("กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง (9-10 หลัก)");
          setLoading(false);
          return;
        }
      }

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
      if (employeeId) {
        payload.user = {
          email: String(formState.email ?? "").trim(),
          roleId: roleDefId,
          ...(password ? { password: String(password) } : {}),
        };
      } else if (password) {
        payload.user = {
          email: String(formState.email ?? "").trim(),
          password: String(password),
          roleId: roleDefId,
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
