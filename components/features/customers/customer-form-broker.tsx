"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import {
  CustomerFormProps,
  CustomerPayload,
  SubmitResult,
} from "./customer-form-types";
import generateRandomBroker from "@/lib/random-fill/broker";

type Props = Omit<CustomerFormProps, "customerType">;

type Option = { id: string; label: string };

const labelTextClass = "mx-2 mt-2 text-sm font-bold text-gray-900";
const inputTextClass = "mt-1 h-11 text-base placeholder:text-gray-500";

export default function CustomerFormBroker({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = "เพิ่มลูกค้า",
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState<any>({
    id: (initial as any).id ?? "",
    customerCode: initial.customerCode ?? "",
    prefix: initial.prefix ?? "",
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    birthDate: (initial as any).birthDate ?? "",
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    addressLine: initial.addressLine ?? "",
    province: initial.province ?? "",
    district: initial.district ?? "",
    subdistrict: initial.subdistrict ?? "",
    postalCode: initial.postalCode ?? "",
    cropTypes: (initial as any).cropTypes ?? "",
    currentYield: (initial as any).currentYield ?? "",
    farmerCount: (initial as any).farmerCount ?? "",
    plotCount: (initial as any).plotCount ?? "",
    totalAreaRai: (initial as any).totalAreaRai ?? "",
    harvestPerYear: (initial as any).harvestPerYear ?? "",
    creditDays: (initial as any).creditDays ?? "",
    chemicalValuePerCycle: (initial as any).chemicalValuePerCycle ?? "",
    chemicalQtyPerCycle: (initial as any).chemicalQtyPerCycle ?? "",
    regularShops: (initial as any).regularShops ?? "",
    serviceTypes: (initial as any).serviceTypes ?? "",
    usedBrands: (initial as any).usedBrands ?? "",
    responsibleEmployeeId: (initial as any).responsibleEmployeeId ?? "",
    notes: initial.notes ?? "",
  });

  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const fetchNextCustomerCode = async () => {
    try {
      const res = await fetch(`/api/customers/next-code`);
      const json = await res.json();
      if (res.ok && json.nextCode) return json.nextCode as string;
    } catch (err) {
      // ignore fallback below
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!initial?.customerCode && !values.customerCode) {
        const next = await fetchNextCustomerCode();
        if (mounted) {
          if (next) setValues((p: any) => ({ ...p, customerCode: next }));
          else
            setValues((p: any) => ({
              ...p,
              customerCode: `C${String(Date.now()).slice(-5)}`,
            }));
        }
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch(`/api/employee`)
          .then((r) => r.json())
          .catch(() => ({ employees: [] }));
        const emps = (res.employees || []).map((e: any) => ({
          id: e.id,
          label: e.name,
        }));
        setEmployeeOptions(emps);
      } catch (err) {
        // ignore
      }
    }

    fetchEmployees();
  }, []);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev || !(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const payload: CustomerPayload & any = {
      customerCode: values.customerCode ?? "",
      customerType: "BROKER",
      name: `${values.prefix ? `${values.prefix} ` : ""}${
        values.firstName ?? ""
      } ${values.lastName ?? ""}`.trim(),
      prefix: values.prefix ?? "",
      firstName: values.firstName ?? "",
      lastName: values.lastName ?? "",
      birthDate: values.birthDate || undefined,
      email: values.email ?? "",
      phone: values.phone ?? "",
      addressLine: values.addressLine ?? "",
      province: values.province ?? "",
      district: values.district ?? "",
      subdistrict: values.subdistrict ?? "",
      postalCode: values.postalCode != null ? String(values.postalCode) : "",
      contactPerson: `${values.firstName ?? ""} ${
        values.lastName ?? ""
      }`.trim(),
      contactPhone: values.phone ?? "",
      contactEmail: values.email ?? "",
      notes: values.notes ?? "",
      cropTypes: values.cropTypes ?? "",
      currentYield: values.currentYield ?? "",
      farmerCount: values.farmerCount ?? "",
      plotCount: values.plotCount ?? "",
      totalAreaRai: values.totalAreaRai ?? "",
      harvestPerYear: values.harvestPerYear ?? "",
      creditDays: values.creditDays ?? "",
      chemicalValuePerCycle: values.chemicalValuePerCycle ?? "",
      chemicalQtyPerCycle: values.chemicalQtyPerCycle ?? "",
      regularShops: values.regularShops ?? "",
      serviceTypes: values.serviceTypes ?? "",
      usedBrands: values.usedBrands ?? "",
      ...(values.responsibleEmployeeId
        ? { responsibleEmployeeId: values.responsibleEmployeeId }
        : {}),
    } as any;

    try {
      const res: SubmitResult = await onSubmit(payload);
      if (!res.success) {
        if (res.issues) {
          setFieldErrors(res.issues);
          setError(
            Object.values(res.issues).flat()[0] ?? res.error ?? "เกิดข้อผิดพลาด"
          );
        } else {
          setError(res.error ?? "เกิดข้อผิดพลาด");
        }
      }
    } catch (err: any) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function calculatedAge() {
    try {
      if (!values.birthDate) return "";
      const age = Math.floor(
        (Date.now() - new Date(values.birthDate).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      );
      return String(age);
    } catch (err) {
      return "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลบุคคล
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4 mt-6">
        <div>
          <Label className={labelTextClass}>รหัสลูกค้า</Label>
          <Input
            value={values.customerCode}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, customerCode: e.target.value }));
              clearFieldError("customerCode");
            }}
            readOnly
            disabled
            className={inputTextClass}
          />
          {fieldErrors.customerCode?.[0] && (
            <p className="text-xs text-red-600 mt-1">
              {fieldErrors.customerCode[0]}
            </p>
          )}
        </div>

        <div>
          <Label className={labelTextClass}>คำนำหน้า *</Label>
          <Select
            value={values.prefix}
            onValueChange={(v) => {
              setValues((p: any) => ({ ...p, prefix: v }));
              clearFieldError("prefix");
            }}
          >
            <SelectTrigger className={inputTextClass}>
              <SelectValue placeholder="เลือกคำนำหน้า" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>คำนำหน้า</SelectLabel>
                <SelectItem value="นาย">นาย</SelectItem>
                <SelectItem value="นาง">นาง</SelectItem>
                <SelectItem value="นางสาว">นางสาว</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {fieldErrors.prefix?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.prefix[0]}</p>
          )}
        </div>

        <div>
          <Label className={labelTextClass}>ชื่อ *</Label>
          <Input
            value={values.firstName}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, firstName: e.target.value }));
              clearFieldError("firstName");
            }}
            required
            className={inputTextClass}
          />
          {fieldErrors.firstName?.[0] && (
            <p className="text-xs text-red-600 mt-1">
              {fieldErrors.firstName[0]}
            </p>
          )}
        </div>

        <div>
          <Label className={labelTextClass}>นามสกุล *</Label>
          <Input
            value={values.lastName}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, lastName: e.target.value }));
              clearFieldError("lastName");
            }}
            required
            className={inputTextClass}
          />
          {fieldErrors.lastName?.[0] && (
            <p className="text-xs text-red-600 mt-1">
              {fieldErrors.lastName[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <div>
          <Label className={labelTextClass}>เบอร์โทรศัพท์ (บุคคล) *</Label>
          <Input
            value={values.phone}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, phone: e.target.value }));
              clearFieldError("phone");
            }}
            required
            className={inputTextClass}
          />
          {fieldErrors.phone?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.phone[0]}</p>
          )}
        </div>
        <div>
          <Label className={labelTextClass}>E-mail (บุคคล)</Label>
          <Input
            type="email"
            value={values.email}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, email: e.target.value }));
              clearFieldError("email");
            }}
            className={inputTextClass}
          />
          {fieldErrors.email?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="mt-2">
          <DatePicker
            label="วันเกิด"
            value={values.birthDate}
            onChange={(v) => setValues((p: any) => ({ ...p, birthDate: v }))}
            placeholder=""
          />
        </div>

        <div>
          <Label className={labelTextClass}>อายุ</Label>
          <Input
            value={calculatedAge()}
            disabled={true}
            onChange={() => {}}
            className={inputTextClass}
          />
        </div>
      </div>

      <div className="md:col-span-2 mt-6">
        <Label className={labelTextClass}>
          ที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน)
        </Label>
        <Input
          placeholder="123/45 หมู่ 6"
          value={values.addressLine}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, addressLine: e.target.value }));
            clearFieldError("addressLine");
          }}
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
            setValues((p: any) => ({ ...p, ...next }));
            clearFieldError("province");
            clearFieldError("district");
            clearFieldError("subdistrict");
            clearFieldError("postalCode");
          }}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูล Broker
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3 mt-6">
        <div>
          <Label className={labelTextClass}>พืชหลัก (Crop Types)</Label>
          <Input
            value={values.cropTypes}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, cropTypes: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
        <div>
          <Label className={labelTextClass}>ปริมาณผลผลิตปัจจุบัน</Label>
          <Input
            value={values.currentYield}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, currentYield: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
        <div>
          <Label className={labelTextClass}>จำนวนเกษตรกรในเครือ</Label>
          <Input
            type="number"
            value={values.farmerCount}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, farmerCount: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <Label className={labelTextClass}>จำนวนแปลง</Label>
          <Input
            type="number"
            value={values.plotCount}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, plotCount: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
        <div>
          <Label className={labelTextClass}>ขนาดพื้นที่รวม (ไร่)</Label>
          <Input
            type="number"
            value={values.totalAreaRai}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, totalAreaRai: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
        <div>
          <Label className={labelTextClass}>รอบปลูกต่อปี</Label>
          <Input
            type="number"
            value={values.harvestPerYear}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, harvestPerYear: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <Label className={labelTextClass}>เครดิตให้เกษตรกร (วัน)</Label>
          <Input
            type="number"
            value={values.creditDays}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, creditDays: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
        <div>
          <Label className={labelTextClass}>มูลค่าสารเคมี/รอบ (บาท)</Label>
          <Input
            type="number"
            value={values.chemicalValuePerCycle}
            onChange={(e) =>
              setValues((p: any) => ({
                ...p,
                chemicalValuePerCycle: e.target.value,
              }))
            }
            className={inputTextClass}
          />
        </div>
        <div>
          <Label className={labelTextClass}>ปริมาณสารเคมี/รอบ</Label>
          <Input
            value={values.chemicalQtyPerCycle}
            onChange={(e) =>
              setValues((p: any) => ({
                ...p,
                chemicalQtyPerCycle: e.target.value,
              }))
            }
            className={inputTextClass}
          />
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <Label className={labelTextClass}>ร้านค้าประจำ</Label>
          <Input
            value={values.regularShops}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, regularShops: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
        <div>
          <Label className={labelTextClass}>ประเภทบริการที่ให้</Label>
          <Input
            value={values.serviceTypes}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, serviceTypes: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
        <div>
          <Label className={labelTextClass}>ยี่ห้อที่ใช้</Label>
          <Input
            value={values.usedBrands}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, usedBrands: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลอื่นๆ
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <Label className={labelTextClass}>พนักงานที่รับผิดชอบ</Label>
          <Select
            value={values.responsibleEmployeeId ?? ""}
            onValueChange={(v) => {
              setValues((p: any) => ({ ...p, responsibleEmployeeId: v || "" }));
              clearFieldError("responsibleEmployeeId");
            }}
          >
            <SelectTrigger className={inputTextClass}>
              <SelectValue placeholder="เลือกพนักงาน" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>พนักงาน</SelectLabel>
                {employeeOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className={`${labelTextClass} mb-2`}>หมายเหตุ</Label>
        <textarea
          value={values.notes}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, notes: e.target.value }));
            clearFieldError("notes");
          }}
          className="w-full border rounded-xl px-3 py-2 text-base text-gray-700 placeholder:text-gray-400"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="md:col-span-2 pt-6 border-t my-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            className="w-44 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
            type="button"
            onClick={() => {
              const rnd = generateRandomBroker();
              setValues((p: any) => ({
                ...p,
                prefix: rnd.prefix ?? p.prefix,
                firstName: rnd.firstName ?? p.firstName,
                lastName: rnd.lastName ?? p.lastName,
                birthDate: rnd.birthDate ?? p.birthDate,
                phone: rnd.phone ?? p.phone,
                email: rnd.email ?? p.email,
                addressLine: rnd.addressLine ?? p.addressLine,
                province: rnd.province ?? p.province,
                district: rnd.district ?? p.district,
                subdistrict: rnd.subdistrict ?? p.subdistrict,
                postalCode: rnd.postalCode ?? p.postalCode,
                cropTypes: rnd.cropTypes ?? p.cropTypes,
                currentYield: rnd.currentYield ?? p.currentYield,
                farmerCount: rnd.farmerCount ?? p.farmerCount,
                plotCount: rnd.plotCount ?? p.plotCount,
                totalAreaRai: rnd.totalAreaRai ?? p.totalAreaRai,
                harvestPerYear: rnd.harvestPerYear ?? p.harvestPerYear,
                creditDays: rnd.creditDays ?? p.creditDays,
                chemicalValuePerCycle:
                  rnd.chemicalValuePerCycle ?? p.chemicalValuePerCycle,
                chemicalQtyPerCycle:
                  rnd.chemicalQtyPerCycle ?? p.chemicalQtyPerCycle,
                regularShops: rnd.regularShops ?? p.regularShops,
                serviceTypes: rnd.serviceTypes ?? p.serviceTypes,
                usedBrands: rnd.usedBrands ?? p.usedBrands,
                notes: rnd.notes ?? p.notes,
              }));
              setFieldErrors({});
            }}
          >
            กรอกข้อมูลสุ่ม
          </Button>
          <Button
            size="lg"
            className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
            type="button"
            onClick={() => {
              try {
                if (onCancel) onCancel();
              } catch (e) {
                /* ignore */
              }
              router.push("/customers");
            }}
          >
            ย้อนกลับ
          </Button>
          <Button
            size="lg"
            className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
            type="submit"
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
