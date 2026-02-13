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
import { LocateFixed, X, Save } from "lucide-react";
import { useRandomFill } from "@/hooks/use-random-fill";

// Local feature imports - use types from centralized types.ts
import type {
  CustomerFormProps,
  CustomerPayload,
  SubmitResult,
  SelectOption,
  FarmPlot,
} from "../../_types/types";

type Props = Omit<CustomerFormProps, "customerType">;

export default function CustomerFormFarmer({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = "เพิ่มลูกค้า",
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
    responsibleEmployeeId: (initial as any).responsibleEmployeeId ?? "",
    farmPlots: (initial as any).farmPlots ?? [
      {
        latitude: "",
        longitude: "",
        areaRai: "",
        cropType: "",
        variety: "",
        soilType: "",
        waterSource: "",
      },
    ],
    notes: initial.notes ?? "",
  });

  const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generatingCode, setGeneratingCode] = useState(false);

  // Random fill - ใช้ dynamic import เพื่อ tree-shake ใน production
  const randomFillGenerator = useCallback(async () => {
    const { generateRandomFarmer } = await import("@/lib/random-fill/farmer");
    return generateRandomFarmer();
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
      farmPlots: rnd.farmPlots ?? p.farmPlots,
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
        const res = await fetch(`/api/customers/generate-code?type=FARMER`);
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
        const res = await fetch(`/api/employee`)
          .then((r) => r.json())
          .catch(() => ({ employees: [] }));
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

  function removePlot(index: number) {
    setValues((prev: any) => {
      const nextPlots = [...(prev.farmPlots || [])];
      nextPlots.splice(index, 1);
      return { ...prev, farmPlots: nextPlots };
    });
  }

  function handlePlotChange(idx: number, key: keyof FarmPlot, value: string) {
    setValues((prev: any) => {
      const nextPlots = [...(prev.farmPlots || [])];
      nextPlots[idx] = { ...nextPlots[idx], [key]: value };
      return { ...prev, farmPlots: nextPlots };
    });
  }

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
      customerType: "FARMER",
      name: `${values.prefix ? `${values.prefix} ` : ""}${values.firstName ?? ""
        } ${values.lastName ?? ""}`.trim(),
      prefix: values.prefix ?? "",
      firstName: values.firstName ?? "",
      lastName: values.lastName ?? "",
      birthDate: values.birthDate || undefined,
      phone: values.phone ?? "",
      email: values.email ?? "",
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
      ...(values.responsibleEmployeeId
        ? { responsibleEmployeeId: values.responsibleEmployeeId }
        : {}),
      farmPlots: (values.farmPlots || []).map((p: FarmPlot) => ({
        ...(p.latitude ? { latitude: p.latitude } : {}),
        ...(p.longitude ? { longitude: p.longitude } : {}),
        ...(p.areaRai ? { areaRai: p.areaRai } : {}),
        ...(p.cropType ? { cropType: p.cropType } : {}),
        ...(p.variety ? { variety: p.variety } : {}),
        ...(p.soilType ? { soilType: p.soilType } : {}),
        ...(p.waterSource ? { waterSource: p.waterSource } : {}),
      })),
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

  const getPlotLocation = (index: number) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePlotChange(
          index,
          "latitude",
          position.coords.latitude.toFixed(6),
        );
        handlePlotChange(
          index,
          "longitude",
          position.coords.longitude.toFixed(6),
        );
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location");
      },
    );
  };

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
          value={values.phone}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, phone: e.target.value }));
            clearFieldError("phone");
          }}
          required
          error={fieldErrors.phone?.[0]}
          type="number"
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
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลแปลงเกษตร
      </h3>

      {(values.farmPlots || []).map((plot: FarmPlot, idx: number) => (
        <div
          key={idx}
          className="space-y-3 border border-gray-200 rounded-2xl p-4 mt-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-700">
              แปลงที่ {idx + 1}
            </div>
            <div>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl px-3 py-1"
                onClick={() => removePlot(idx)}
              >
                ลบแปลง
              </Button>
            </div>
          </div>
          <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
            <div className="md:col-span-2 flex items-end gap-2">
              <FormInput
                label="Latitude"
                type="number"
                value={plot.latitude ?? ""}
                onChange={(e) =>
                  handlePlotChange(idx, "latitude", e.target.value)
                }
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                containerClassName="flex-1"
              />
              <FormInput
                label="Longitude"
                type="number"
                value={plot.longitude ?? ""}
                onChange={(e) =>
                  handlePlotChange(idx, "longitude", e.target.value)
                }
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                containerClassName="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mb-1 shrink-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                onClick={() => getPlotLocation(idx)}
                title="ดึงพิกัดปัจจุบัน"
              >
                <LocateFixed className="h-4 w-4" />
              </Button>
            </div>
            <FormInput
              label="ขนาดพื้นที่เพาะปลูก (ไร่)"
              type="number"
              value={plot.areaRai ?? ""}
              onChange={(e) => handlePlotChange(idx, "areaRai", e.target.value)}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            />
          </div>

          <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
            <FormInput
              label="ชนิดพืช"
              value={plot.cropType ?? ""}
              onChange={(e) =>
                handlePlotChange(idx, "cropType", e.target.value)
              }
            />
            <FormInput
              label="สายพันธุ์"
              value={plot.variety ?? ""}
              onChange={(e) => handlePlotChange(idx, "variety", e.target.value)}
            />
          </div>

          <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
            <FormInput
              label="ประเภทของดิน"
              value={plot.soilType ?? ""}
              onChange={(e) =>
                handlePlotChange(idx, "soilType", e.target.value)
              }
            />
            <FormInput
              label="แหล่งน้ำ"
              value={plot.waterSource ?? ""}
              onChange={(e) =>
                handlePlotChange(idx, "waterSource", e.target.value)
              }
            />
          </div>
        </div>
      ))}

      <div className="text-center">
        <Button
          type="button"
          className="bg-blue-500 hover:bg-blue-700 text-white rounded-2xl px-4 "
          onClick={() =>
            setValues((p: any) => ({
              ...p,
              farmPlots: [
                ...(p.farmPlots || []),
                {
                  latitude: "",
                  longitude: "",
                  areaRai: "",
                  cropType: "",
                  variety: "",
                  soilType: "",
                  waterSource: "",
                },
              ],
            }))
          }
        >
          เพิ่มข้อมูลแปลงเกษตร
        </Button>
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
        <div className="flex justify-center sm:flex-col-reverse sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-6">
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
