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
import generateRandomFarmer from "@/lib/random-fill/farmer";

type Props = Omit<CustomerFormProps, "customerType">;

type Option = { id: string; label: string };

type FarmPlot = {
  latitude?: string;
  longitude?: string;
  areaRai?: string;
  cropType?: string;
  variety?: string;
  soilType?: string;
  waterSource?: string;
};

const labelTextClass = "mx-2 mt-2 text-sm font-bold text-gray-900";
const inputTextClass = "mt-1 h-11 text-base placeholder:text-gray-500";

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
    setLoading(true);
    setError(null);
    setFieldErrors({});

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
            Object.values(res.issues).flat()[0] ?? res.error ?? "เกิดข้อผิดพลาด"
          );
        } else {
          setError(res.error ?? "เกิดข้อผิดพลาด");
        }
      } else {
        onSuccess?.();
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
            onChange={() => { }}
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
            <div>
              <Label className={labelTextClass}>Latitude</Label>
              <Input
                type="number"
                value={plot.latitude ?? ""}
                onChange={(e) =>
                  handlePlotChange(idx, "latitude", e.target.value)
                }
                className={inputTextClass}
              />
            </div>
            <div>
              <Label className={labelTextClass}>Longitude</Label>
              <Input
                type="number"
                value={plot.longitude ?? ""}
                onChange={(e) =>
                  handlePlotChange(idx, "longitude", e.target.value)
                }
                className={inputTextClass}
              />
            </div>
            <div>
              <Label className={labelTextClass}>
                ขนาดพื้นที่เพาะปลูก (ไร่)
              </Label>
              <Input
                type="number"
                value={plot.areaRai ?? ""}
                onChange={(e) =>
                  handlePlotChange(idx, "areaRai", e.target.value)
                }
                className={inputTextClass}
              />
            </div>
          </div>

          <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
            <div>
              <Label className={labelTextClass}>ชนิดพืช</Label>
              <Input
                value={plot.cropType ?? ""}
                onChange={(e) =>
                  handlePlotChange(idx, "cropType", e.target.value)
                }
                className={inputTextClass}
              />
            </div>
            <div>
              <Label className={labelTextClass}>สายพันธุ์</Label>
              <Input
                value={plot.variety ?? ""}
                onChange={(e) =>
                  handlePlotChange(idx, "variety", e.target.value)
                }
                className={inputTextClass}
              />
            </div>
          </div>

          <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
            <div>
              <Label className={labelTextClass}>ประเภทของดิน</Label>
              <Input
                value={plot.soilType ?? ""}
                onChange={(e) =>
                  handlePlotChange(idx, "soilType", e.target.value)
                }
                className={inputTextClass}
              />
            </div>
            <div>
              <Label className={labelTextClass}>แหล่งน้ำ</Label>
              <Input
                value={plot.waterSource ?? ""}
                onChange={(e) =>
                  handlePlotChange(idx, "waterSource", e.target.value)
                }
                className={inputTextClass}
              />
            </div>
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
              const rnd = generateRandomFarmer();
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
