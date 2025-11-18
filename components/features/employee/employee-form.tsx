"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import DatePicker from "@/components/custom/DatePicker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { Employee } from "@/types/companies"; // สมมติว่า Type นี้รองรับฟิลด์ใหม่ๆ
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";

// --- เพิ่มตัวเลือก (Options) จาก code1 ---
const prefixOptions = [
  { value: "นาย", label: "นาย" },
  { value: "นาง", label: "นาง" },
  { value: "นางสาว", label: "นางสาว" },
];

const statusOptions = [
  { value: "ACTIVE", label: "ปฏิบัติงาน" },
  { value: "ON_LEAVE", label: "ลาพัก" },
  { value: "INACTIVE", label: "ออกจากงาน" },
];

// หมายเหตุ: คุณอาจต้องนำเข้า DEPARTMENTS จาก lib ของคุณ
const departmentOptions = [
  "การตลาด",
  "ขาย",
  "บัญชี",
  "บุคคล",
  "IT",
  "ฝ่ายผลิต",
  "จัดส่ง",
  "บริการลูกค้า",
  "บริหาร",
  "อื่นๆ",
].map((d) => ({ value: d, label: d }));

const positionOptions = [
  { value: "ผู้บริหารระดับสูง", label: "ผู้บริหารระดับสูง" },
  { value: "ผู้จัดการ", label: "ผู้จัดการ" },
  { value: "หัวหน้างาน", label: "หัวหน้างาน" },
  { value: "พนักงานปฏิบัติการ", label: "พนักงานปฏิบัติการ" },
];

const companyOptions = [
  {
    value: "บริษัท อินเตอร์ คร็อพ จำกัด",
    label: "บริษัท อินเตอร์ คร็อพ จำกัด",
  },
  {
    value: "บริษัท แอ็กโฟรีแพ็กซ์ อินดัสตรีส์ จำกัด",
    label: "บริษัท แอ็กโฟรีแพ็กซ์ อินดัสตรีส์ จำกัด",
  },
  { value: "บริษัท ยูนิพรีมา จำกัด", label: "บริษัท ยูนิพรีมา จำกัด" },
  {
    value: "บริษัท เอแม็กซ์ อินเตอร์ จำกัด",
    label: "บริษัท เอแม็กซ์ อินเตอร์ จำกัด",
  },
  {
    value: "บริษัท บีแฟค อินเตอร์ จำกัด",
    label: "บริษัท บีแฟค อินเตอร์ จำกัด",
  },
  {
    value: "บริษัท ซีเพซ อินเตอร์ จำกัด",
    label: "บริษัท ซีเพซ อินเตอร์ จำกัด",
  },
  { value: "บริษัท คร็อพ ซายน์ จำกัด", label: "บริษัท คร็อพ ซายน์ จำกัด" },
];

const responsibilityAreaOptions = [
  { value: "ภาคเหนือ", label: "ภาคเหนือ" },
  { value: "ภาคตะวันออกเฉียงเหนือ", label: "ภาคตะวันออกเฉียงเหนือ" },
  { value: "ภาคตะวันตก", label: "ภาคตะวันตก" },
  { value: "ภาคกลาง", label: "ภาคกลาง" },
  { value: "ภาคใต้", label: "ภาคใต้" },
];
// --- สิ้นสุดการเพิ่มตัวเลือก ---

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
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

        {/* --- Section: ข้อมูลพนักงาน --- */}
        <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl">
          ข้อมูลพนักงาน
        </h3>

        {/* Grid */}
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
                />
              </div>
              <div className="sm:col-span-2">
                <FloatingLabelInput
                  label="นามสกุล"
                  placeholder="เช่น ใจดี"
                  value={formState.lastName ?? ""}
                  disabled={!canEdit}
                  onChange={handleChange("lastName")}
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

          {/* เบอร์โทรศัพท์ (ปรับปรุงจาก code2 เดิม) */}
          <div>
            <FloatingLabelInput
              label="เบอร์โทรศัพท์"
              placeholder="0xx-xxx-xxxx"
              value={formState.phone ?? ""}
              disabled={!canEdit}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const numericValue = event.target.value.replace(/\D/g, "");
                if (numericValue.length <= 10) {
                  setFormState((prev) => ({ ...prev, phone: numericValue }));
                }
              }}
              maxLength={10}
            />
          </div>

          {/* วันเกิด */}
          <div>
            <DatePicker
              label="วันเกิด"
              value={formState.birthDate}
              onChange={(v) => setFormState((prev) => ({ ...prev, birthDate: v }))}
              disabled={!canEdit}
              placeholder="เลือกวันเกิด"
            />
          </div>

          {/* อายุ (คำนวณ) */}
          <div>
            <FloatingLabelInput
              label="อายุ"
              value={calculatedAge()}
              disabled={true} // ReadOnly
              onChange={() => {}} // No-op
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

        {/* --- Section: ข้อมูลการเข้าสู่ระบบ --- */}
        <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl">
          ข้อมูลการเข้าสู่ระบบ
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <p className="mt-1 text-xs text-muted-foreground">
              {employeeId
                ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน"
                : "จำเป็นต้องกรอกสำหรับสร้างพนักงานใหม่"}
            </p>
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

        {/* Buttons (เหมือนเดิม) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            disabled={!canEdit}
            title={!canEdit ? permissionHint : undefined}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canEdit || loading}
            title={!canEdit ? permissionHint : undefined}
          >
            {loading
              ? "Saving..."
              : employeeId
              ? "Save changes"
              : "Create employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}
