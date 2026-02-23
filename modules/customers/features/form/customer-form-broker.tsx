"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import DatePicker from "@/components/custom/DatePicker";
import { Button } from "@/components/ui/button";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/custom/form-components";
import RandomFillButton from "@/components/custom/random-fill-button";
import { X, Save } from "lucide-react";
import { useRandomFill } from "@/hooks/use-random-fill";

import type {
  CustomerFormProps,
  CustomerPayload,
  SubmitResult,
  SelectOption,
} from "../../types";
import { ShippingAddressList } from "./shipping-address-list";
import { ContactList } from "./contact-list";

type Props = Omit<CustomerFormProps, "customerType">;

export default function CustomerFormBroker({
  initial = {},
  onSubmit,
  onCancel,
  onSuccess,
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
    shippingAddresses: (initial as any).shippingAddresses ?? [],
    contacts: (initial as any).contacts ?? [],
  });

  const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generatingCode, setGeneratingCode] = useState(false);

  // Random fill - ใช้ dynamic import เพื่อ tree-shake ใน production
  const randomFillGenerator = useCallback(async () => {
    const { generateRandomBroker } = await import("@/lib/random-fill/broker");
    return generateRandomBroker();
  }, []);

  const handleRandomFillGenerated = useCallback((rnd: any) => {
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
      chemicalQtyPerCycle: rnd.chemicalQtyPerCycle ?? p.chemicalQtyPerCycle,
      regularShops: rnd.regularShops ?? p.regularShops,
      serviceTypes: rnd.serviceTypes ?? p.serviceTypes,
      usedBrands: rnd.usedBrands ?? p.usedBrands,
      notes: rnd.notes ?? p.notes,
    }));
    setFieldErrors({});
  }, []);

  const {
    isEnabled: isRandomFillEnabled,
    isGenerating: isRandomFillGenerating,
    triggerRandomFill,
  } = useRandomFill({
    generator: randomFillGenerator,
    onGenerated: handleRandomFillGenerated,
  });

  // Auto-generate customer code on mount for new customers
  useEffect(() => {
    async function generateCustomerCode() {
      // Only generate for new customers (no initial.customerCode)
      if (initial.customerCode) return;

      setGeneratingCode(true);
      try {
        const res = await fetch(`/api/customers/generate-code?type=BROKER`);
        const json = await res.json();
        if (json.customerCode) {
          setValues((p: any) => ({ ...p, customerCode: json.customerCode }));
        }
      } catch (err) {
        console.error("Failed to generate customer code:", err);
      } finally {
        setGeneratingCode(false);
      }
    }

    generateCustomerCode();
  }, [initial.customerCode]);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const { getEmployeesAction } = await import("@/modules/employee/server/actions");
        const res = await getEmployeesAction();
        const emps = (res.employees || []).map((e: any) => ({
          value: e.id,
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
    if (loading) return;
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const nextFieldErrors: Record<string, string[]> = {};
    const pushErr = (field: string, msg: string) => {
      nextFieldErrors[field] = [msg];
    };

    // customerCode is auto-generated, no validation needed
    if (!values.prefix) {
      pushErr("prefix", "กรุณาเลือกคำนำหน้า");
    }
    if (!values.firstName?.trim()) {
      pushErr("firstName", "กรุณากรอกชื่อ");
    }
    if (!values.lastName?.trim()) {
      pushErr("lastName", "กรุณากรอกนามสกุล");
    }
    if (!values.phone?.trim()) {
      pushErr("phone", "กรุณากรอกเบอร์โทรศัพท์");
    }
    if (!values.responsibleEmployeeId) {
      pushErr("responsibleEmployeeId", "กรุณาเลือกพนักงานที่รับผิดชอบ");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0][0]);
      setLoading(false);
      return;
    }

    const payload: CustomerPayload & any = {
      customerCode: values.customerCode ?? "",
      customerType: "BROKER",
      name: `${values.prefix ? `${values.prefix} ` : ""}${values.firstName ?? ""
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
      contactPerson: `${values.firstName ?? ""} ${values.lastName ?? ""
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
      shippingAddresses: values.shippingAddresses,
      contacts: values.contacts,
    } as any;

    try {
      const res: SubmitResult = await onSubmit(payload);
      if (!res.success) {
        if (res.issues) {
          setFieldErrors(res.issues);
          setError(
            Object.values(res.issues).flat()[0] ??
            res.error ??
            "เกิดข้อผิดพลาด",
          );
        } else {
          setError(res.error ?? "เกิดข้อผิดพลาด");
        }
        setLoading(false);
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      setError(String(err));
      setLoading(false);
    }
  }

  function calculatedAge() {
    try {
      if (!values.birthDate) return "";
      const age = Math.floor(
        (Date.now() - new Date(values.birthDate).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25),
      );
      return String(age);
    } catch (err) {
      return "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลบุคคล
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-5 mt-6">
        <FormInput
          label="รหัสลูกค้า (สร้างอัตโนมัติ)"
          value={values.customerCode || (generatingCode ? "กำลังสร้างรหัส..." : "")}
          onChange={() => { }}
          disabled={true}
          placeholder="รหัสจะถูกสร้างอัตโนมัติ"
        />

        <FormSelect
          label="คำนำหน้า"
          value={values.prefix}
          onChange={(v) => {
            setValues((p: any) => ({ ...p, prefix: v }));
            clearFieldError("prefix");
          }}
          options={[
            { value: "นาย", label: "นาย" },
            { value: "นาง", label: "นาง" },
            { value: "นางสาว", label: "นางสาว" },
          ]}
          placeholder="เลือกคำนำหน้า"
          groupLabel="คำนำหน้า"
          required
          error={fieldErrors.prefix?.[0]}
        />

        <FormInput
          label="ชื่อ"
          value={values.firstName}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, firstName: e.target.value }));
            clearFieldError("firstName");
          }}
          required
          error={fieldErrors.firstName?.[0]}
          containerClassName="md:col-span-2"
        />

        <FormInput
          label="นามสกุล"
          value={values.lastName}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, lastName: e.target.value }));
            clearFieldError("lastName");
          }}
          required
          error={fieldErrors.lastName?.[0]}
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <FormInput
          label="เบอร์โทรศัพท์ (บุคคล)"
          type="number"
          value={values.phone}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, phone: e.target.value }));
            clearFieldError("phone");
          }}
          required
          error={fieldErrors.phone?.[0]}
        />
        <FormInput
          label="E-mail (บุคคล)"
          type="email"
          value={values.email}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, email: e.target.value }));
            clearFieldError("email");
          }}
          error={fieldErrors.email?.[0]}
        />

        <div>
          <DatePicker
            label="วันเกิด"
            value={values.birthDate}
            onChange={(v) => setValues((p: any) => ({ ...p, birthDate: v }))}
            placeholder=""
          />
        </div>

        <FormInput
          label="อายุ"
          value={calculatedAge()}
          disabled={true}
          onChange={() => { }}
        />
      </div>

      <div className="md:col-span-4 mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลผู้ติดต่อเพิ่มเติม</h4>
        <ContactList
          value={values.contacts}
          onChange={(val) => setValues((p: any) => ({ ...p, contacts: val }))}
        />
      </div>

      <FormInput
        label="ที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน)"
        placeholder="123/45 หมู่ 6"
        value={values.addressLine}
        onChange={(e) => {
          setValues((p: any) => ({ ...p, addressLine: e.target.value }));
          clearFieldError("addressLine");
        }}
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
            setValues((p: any) => ({ ...p, ...next }));
            clearFieldError("province");
            clearFieldError("district");
            clearFieldError("subdistrict");
            clearFieldError("postalCode");
          }}
        />
      </div>

      <div className="md:col-span-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">ที่อยู่จัดส่งเพิ่มเติม</h4>
        <ShippingAddressList
          value={values.shippingAddresses}
          onChange={(val) => setValues((p: any) => ({ ...p, shippingAddresses: val }))}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูล Broker
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3 mt-6">
        <FormInput
          label="พืชหลัก"
          value={values.cropTypes}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, cropTypes: e.target.value }))
          }
        />
        <FormInput
          label="ปริมาณผลผลิตปัจจุบัน"
          value={values.currentYield}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, currentYield: e.target.value }))
          }
        />
        <FormInput
          label="จำนวนเกษตรกรในเครือ"
          type="number"
          value={values.farmerCount}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, farmerCount: e.target.value }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <FormInput
          label="จำนวนแปลง"
          type="number"
          value={values.plotCount}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, plotCount: e.target.value }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
        <FormInput
          label="ขนาดพื้นที่รวม (ไร่)"
          type="number"
          value={values.totalAreaRai}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, totalAreaRai: e.target.value }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
        <FormInput
          label="รอบปลูกต่อปี"
          type="number"
          value={values.harvestPerYear}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, harvestPerYear: e.target.value }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <FormInput
          label="เครดิตให้เกษตรกร (วัน)"
          type="number"
          value={values.creditDays}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, creditDays: e.target.value }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
        <FormInput
          label="มูลค่าสารเคมี/รอบ (บาท)"
          type="number"
          value={values.chemicalValuePerCycle}
          onChange={(e) =>
            setValues((p: any) => ({
              ...p,
              chemicalValuePerCycle: e.target.value,
            }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
        <FormInput
          label="ปริมาณสารเคมี/รอบ"
          value={values.chemicalQtyPerCycle}
          onChange={(e) =>
            setValues((p: any) => ({
              ...p,
              chemicalQtyPerCycle: e.target.value,
            }))
          }
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <FormInput
          label="ร้านค้าประจำ"
          value={values.regularShops}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, regularShops: e.target.value }))
          }
        />
        <FormInput
          label="ประเภทบริการที่ให้"
          value={values.serviceTypes}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, serviceTypes: e.target.value }))
          }
        />
        <FormInput
          label="ยี่ห้อที่ใช้"
          value={values.usedBrands}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, usedBrands: e.target.value }))
          }
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลอื่นๆ
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3 mt-6">
        <FormSelect
          label="พนักงานที่รับผิดชอบ"
          value={values.responsibleEmployeeId ?? ""}
          onChange={(v) => {
            setValues((p: any) => ({ ...p, responsibleEmployeeId: v || "" }));
            clearFieldError("responsibleEmployeeId");
          }}
          options={employeeOptions}
          placeholder="เลือกพนักงาน"
          groupLabel="พนักงาน"
          required
          error={fieldErrors.responsibleEmployeeId?.[0]}
        />
      </div>

      <FormTextarea
        label="หมายเหตุ"
        value={values.notes}
        onChange={(e) => {
          setValues((p: any) => ({ ...p, notes: e.target.value }));
          clearFieldError("notes");
        }}
        rows={3}
      />

      {/* Action Buttons */}
      <div className="sm:pt-2 mt-8 sm:mt-8 space-y-6">
        <div className="flex justify-center flex-col-reverse sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-6">
          <Button
            size="lg"
            className="flex-1 sm:flex-none sm:w-32 bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
            type="button"
            onClick={() => {
              try {
                if (onCancel) onCancel();
              } catch (e) {
                /* ignore */
              }
              router.push("/customers");
            }}
            disabled={loading}
          >
            <X className="h-4 w-4" />
            ยกเลิก
          </Button>
          <Button
            size="lg"
            className="flex-1 sm:flex-none sm:w-32 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              "กำลังบันทึก..."
            ) : (
              <>
                <Save className="h-4 w-4" />
                บันทึก
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="w-full h-12 sm:hidden"></div>

      {/* Random Fill Button - แสดงเฉพาะ development */}
      {isRandomFillEnabled && (
        <div className="w-full sm:w-auto flex justify-center mt-4">
          <RandomFillButton
            size="lg"
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border-0 transition-colors"
            onClick={triggerRandomFill}
            disabled={loading}
            isGenerating={isRandomFillGenerating}
            variant="secondary"
          />
        </div>
      )}
    </form>
  );
}
