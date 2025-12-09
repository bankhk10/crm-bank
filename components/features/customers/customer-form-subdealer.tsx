"use client";

import React, { useEffect, useState } from "react";
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
import generateRandomSubdealer from "@/lib/random-fill/subdealer";

type Props = Omit<CustomerFormProps, "customerType">;

type Option = { id: string; label: string };

const labelTextClass = "mx-2 mt-2 text-sm font-bold text-gray-900";
const inputTextClass = "mt-1 h-11 text-base placeholder:text-gray-500";

export default function CustomerFormSubdealer({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = "เพิ่มลูกค้า",
}: Props) {
  const [values, setValues] = useState<any>({
    id: (initial as any).id ?? "",
    customerCode: initial.customerCode ?? "",
    companyName: initial.name ?? "",
    taxId: initial.taxId ?? "",
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    latitude: (initial as any).latitude ?? "",
    longitude: (initial as any).longitude ?? "",
    addressLine: initial.addressLine ?? "",
    province: initial.province ?? "",
    district: initial.district ?? "",
    subdistrict: initial.subdistrict ?? "",
    postalCode: initial.postalCode ?? "",
    prefix: initial.prefix ?? "",
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    birthDate: (initial as any).birthDate ?? "",
    contactPhone: initial.contactPhone ?? "",
    contactEmail: initial.contactEmail ?? "",
    receiveFromDealer: (initial as any).receiveFromDealer ?? "",
    mainCompetitor: (initial as any).mainCompetitor ?? "",
    areaCrops: (initial as any).areaCrops ?? "",
    averageMonthlyPurchase: (initial as any).averageMonthlyPurchase ?? "",
    mainProductSold: (initial as any).mainProductSold ?? "",
    brandsSold: (initial as any).brandsSold ?? "",
    areaType: (initial as any).areaType ?? "",
    responsibleEmployeeId: (initial as any).responsibleEmployeeId ?? "",
    relationshipScore: (initial as any).relationshipScore ?? null,
    notes: initial.notes ?? "",
  });

  const [dealerOptions, setDealerOptions] = useState<Option[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // get next sequential customerCode from backend (format C00001)
  const fetchNextCustomerCode = async () => {
    try {
      const res = await fetch(`/api/customers/next-code`);
      const json = await res.json();
      if (res.ok && json.nextCode) return json.nextCode as string;
    } catch (err) {
      // ignore and fallback
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
    async function fetchOptions() {
      try {
        const [cRes, eRes] = await Promise.all([
          fetch(`/api/customers?page=1&perPage=100&type=DEALER`)
            .then((r) => r.json())
            .catch(() => ({ customers: [] })),
          fetch(`/api/employee`)
            .then((r) => r.json())
            .catch(() => ({ employees: [] })),
        ]);

        const comps = (cRes.customers || []).map((c: any) => ({
          id: c.id,
          label: c.name,
        }));
        const emps = (eRes.employees || []).map((e: any) => ({
          id: e.id,
          label: e.name,
        }));
        setDealerOptions(comps);
        setEmployeeOptions(emps);
      } catch (err) {
        // ignore
      }
    }

    fetchOptions();
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
      customerType: "SUBDEALER",
      name: values.companyName ?? "",
      prefix: values.prefix ?? "",
      firstName: values.firstName ?? "",
      lastName: values.lastName ?? "",
      birthDate: values.birthDate ?? undefined,
      email: values.email ?? "",
      phone: values.phone ?? "",
      taxId: values.taxId ?? "",
      addressLine: values.addressLine ?? "",
      province: values.province ?? "",
      district: values.district ?? "",
      subdistrict: values.subdistrict ?? "",
      postalCode: values.postalCode != null ? String(values.postalCode) : "",
      contactPerson: `${values.prefix ? `${values.prefix} ` : ""}${
        values.firstName ?? ""
      } ${values.lastName ?? ""}`.trim(),
      contactPhone: values.contactPhone ?? "",
      contactEmail: values.contactEmail ?? "",
      notes: values.notes ?? "",
      ...(values.latitude ? { latitude: values.latitude } : {}),
      ...(values.longitude ? { longitude: values.longitude } : {}),
      ...(values.receiveFromDealer
        ? { receiveFromDealer: values.receiveFromDealer }
        : {}),
      ...(values.mainCompetitor
        ? { mainCompetitor: values.mainCompetitor }
        : {}),
      ...(values.areaCrops ? { areaCrops: values.areaCrops } : {}),
      ...(values.averageMonthlyPurchase
        ? { averageMonthlyPurchase: values.averageMonthlyPurchase }
        : {}),
      ...(values.mainProductSold
        ? { mainProductSold: values.mainProductSold }
        : {}),
      ...(values.brandsSold ? { brandsSold: values.brandsSold } : {}),
      ...(values.areaType ? { areaType: values.areaType } : {}),
      ...(values.responsibleEmployeeId
        ? { responsibleEmployeeId: values.responsibleEmployeeId }
        : {}),
      ...(values.relationshipScore != null && values.relationshipScore !== ""
        ? { relationshipScore: Number(values.relationshipScore) }
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
        ข้อมูลบริษัท
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

        <div className="md:col-span-2">
          <Label className={labelTextClass}>ชื่อร้านค้า</Label>
          <Input
            value={values.companyName}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, companyName: e.target.value }));
              clearFieldError("name");
            }}
            required
            className={inputTextClass}
          />
          {fieldErrors.name?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <Label className={labelTextClass}>เลขประจำตัวผู้เสียภาษี</Label>
          <Input
            value={values.taxId}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, taxId: e.target.value }));
              clearFieldError("taxId");
            }}
            className={inputTextClass}
          />
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <div>
          <Label className={labelTextClass}>เบอร์โทรศัพท์ (บริษัท)</Label>
          <Input
            type="number"
            value={values.phone}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, phone: e.target.value }));
              clearFieldError("phone");
            }}
            required
            className={inputTextClass}
          />
        </div>
        <div>
          <Label className={labelTextClass}>E-mail (บริษัท)</Label>
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

        <div>
          <Label className={labelTextClass}>latitude (ละติจูด)</Label>
          <Input
            type="number"
            value={values.latitude}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, latitude: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>

        <div>
          <Label className={labelTextClass}>longitude (ลองจิจูด)</Label>
          <Input
            type="number"
            value={values.longitude}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, longitude: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
      </div>

      <div className="md:col-span-2 mt-6">
        <Label className={labelTextClass}>
          ที่อยู่บริษัท (บ้านเลขที่ หมู่ ซอย ถนน)
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
        ข้อมูลบุคคล
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3 mt-6">
        <div>
          <Label className={labelTextClass}>คำนำหน้า</Label>
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
          <Label className={labelTextClass}>ชื่อ</Label>
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
          <Label className={labelTextClass}>นามสกุล</Label>
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
          <Label className={labelTextClass}>เบอร์โทรศัพท์ (บุคคล)</Label>
          <Input
            type="number"
            value={values.contactPhone}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, contactPhone: e.target.value }));
              clearFieldError("contactPhone");
            }}
            className={inputTextClass}
          />
          {fieldErrors.contactPhone?.[0] && (
            <p className="text-xs text-red-600 mt-1">
              {fieldErrors.contactPhone[0]}
            </p>
          )}
        </div>

        <div>
          <Label className={labelTextClass}>E-mail (บุคคล)</Label>
          <Input
            type="email"
            value={values.contactEmail}
            onChange={(e) => {
              setValues((p: any) => ({ ...p, contactEmail: e.target.value }));
              clearFieldError("contactEmail");
            }}
            className={inputTextClass}
          />
          {fieldErrors.contactEmail?.[0] && (
            <p className="text-xs text-red-600 mt-1">
              {fieldErrors.contactEmail[0]}
            </p>
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

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลเพิ่มเติม (Sub-Dealer)
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3 mt-6">
        <div>
          <Label className={labelTextClass}>รับของจาก Dealer</Label>
          <Select
            value={values.receiveFromDealer ?? ""}
            onValueChange={(v) => {
              setValues((p: any) => ({ ...p, receiveFromDealer: v || "" }));
              clearFieldError("receiveFromDealer");
            }}
          >
            <SelectTrigger className={inputTextClass}>
              <SelectValue placeholder="เลือกร้านหลัก" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Dealer</SelectLabel>
                {dealerOptions
                  .filter((d) => d.id !== values.id)
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={labelTextClass}>คู่แข่งหลัก</Label>
          <Input
            value={values.mainCompetitor}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, mainCompetitor: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>

        <div>
          <Label className={labelTextClass}>พืชในพื้นที่</Label>
          <Input
            value={values.areaCrops}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, areaCrops: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <Label className={labelTextClass}>ยอดสั่งซื้อเฉลี่ย/เดือน</Label>
          <Input
            type="number"
            value={values.averageMonthlyPurchase}
            onChange={(e) =>
              setValues((p: any) => ({
                ...p,
                averageMonthlyPurchase: e.target.value,
              }))
            }
            className={inputTextClass}
          />
        </div>

        <div>
          <Label className={labelTextClass}>สินค้าหลักที่ขาย</Label>
          <Input
            value={values.mainProductSold}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, mainProductSold: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>

        <div>
          <Label className={labelTextClass}>ยี่ห้อที่จำหน่าย</Label>
          <Input
            value={values.brandsSold}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, brandsSold: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <Label className={labelTextClass}>ประเภทพื้นที่</Label>
          <Input
            value={values.areaType}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, areaType: e.target.value }))
            }
            className={inputTextClass}
          />
        </div>

        <div>
          <Label className={labelTextClass}>พนักงานรับผิดชอบ</Label>
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

        <div>
          <Label className={labelTextClass}>คะแนนความสัมพันธ์</Label>
          <Select
            value={String(values.relationshipScore ?? "")}
            onValueChange={(v) =>
              setValues((p: any) => ({
                ...p,
                relationshipScore: v ? Number(v) : null,
              }))
            }
          >
            <SelectTrigger className={inputTextClass}>
              <SelectValue placeholder="เลือกคะแนน" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>คะแนน</SelectLabel>
                <SelectItem value="1">แย่</SelectItem>
                <SelectItem value="2">ปานกลาง</SelectItem>
                <SelectItem value="3">ดี</SelectItem>
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
              const rnd = generateRandomSubdealer();
              setValues((p: any) => ({
                ...p,
                companyName: rnd.companyName ?? p.companyName,
                taxId: rnd.taxId ?? p.taxId,
                phone: rnd.phone ?? p.phone,
                email: rnd.email ?? p.email,
                latitude: rnd.latitude ?? p.latitude,
                longitude: rnd.longitude ?? p.longitude,
                addressLine: rnd.addressLine ?? p.addressLine,
                province: rnd.province ?? p.province,
                district: rnd.district ?? p.district,
                subdistrict: rnd.subdistrict ?? p.subdistrict,
                postalCode: rnd.postalCode ?? p.postalCode,
                prefix: rnd.prefix ?? p.prefix,
                firstName: rnd.firstName ?? p.firstName,
                lastName: rnd.lastName ?? p.lastName,
                birthDate: rnd.birthDate ?? p.birthDate,
                contactPhone: rnd.contactPhone ?? p.contactPhone,
                contactEmail: rnd.contactEmail ?? p.contactEmail,
                receiveFromDealer: rnd.receiveFromDealer ?? p.receiveFromDealer,
                mainCompetitor: rnd.mainCompetitor ?? p.mainCompetitor,
                areaCrops: rnd.areaCrops ?? p.areaCrops,
                averageMonthlyPurchase: rnd.averageMonthlyPurchase ?? p.averageMonthlyPurchase,
                mainProductSold: rnd.mainProductSold ?? p.mainProductSold,
                brandsSold: rnd.brandsSold ?? p.brandsSold,
                areaType: rnd.areaType ?? p.areaType,
                relationshipScore: rnd.relationshipScore ?? p.relationshipScore,
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
            onClick={onCancel}
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
