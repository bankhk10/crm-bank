"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import DatePicker from "@/components/custom/DatePicker";
import { Button } from "@/components/ui/button";
import {
  CustomerFormProps,
  CustomerPayload,
  SubmitResult,
} from "./customer-form-types";
import generateRandomSubdealer from "@/lib/random-fill/subdealer";
import { FormInput, FormSelect, FormTextarea } from "@/components/custom/form-components";
import { MultiSelect } from "@/components/custom/multi-select";

type Props = Omit<CustomerFormProps, "customerType">;

type Option = { value: string; label: string };

export default function CustomerFormSubdealer({
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
    mainProductSold: (initial as any).mainProductSold ?? [],
    brandsSold: (initial as any).brandsSold ?? [],
    areaType: (initial as any).areaType ?? "",
    responsibleEmployeeId: (initial as any).responsibleEmployeeId ?? "",
    relationshipScore: (initial as any).relationshipScore ?? null,
    notes: initial.notes ?? "",
  });

  const [dealerOptions, setDealerOptions] = useState<Option[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);
  const [productGroupOptions, setProductGroupOptions] = useState<Option[]>([]);
  const [brandOptions, setBrandOptions] = useState<Option[]>([]);

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
        const [cRes, eRes, pgRes, bRes] = await Promise.all([
          fetch(`/api/customers?page=1&perPage=100&type=DEALER`)
            .then((r) => r.json())
            .catch(() => ({ customers: [] })),
          fetch(`/api/employee`)
            .then((r) => r.json())
            .catch(() => ({ employees: [] })),
          fetch(`/api/products/product-groups`)
            .then((r) => r.json())
            .catch(() => ({ productGroups: [] })),
          fetch(`/api/products/brands`)
            .then((r) => r.json())
            .catch(() => ({ brands: [] })),
        ]);

        const comps = (cRes.customers || []).map((c: any) => ({
          value: c.id,
          label: c.name,
        }));
        const emps = (eRes.employees || []).map((e: any) => ({
          value: e.id,
          label: e.name,
        }));
        const productGroups = (pgRes.productGroups || []).map((pg: string) => ({
          value: pg,
          label: pg,
        }));
        const brands = (bRes.brands || []).map((b: string) => ({
          value: b,
          label: b,
        }));
        setDealerOptions(comps);
        setEmployeeOptions(emps);
        setProductGroupOptions(productGroups);
        setBrandOptions(brands);
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
      contactPerson: `${values.prefix ? `${values.prefix} ` : ""}${values.firstName ?? ""
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
        ข้อมูลบริษัท
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4 mt-6">
        <FormInput
          label="รหัสลูกค้า"
          value={values.customerCode}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, customerCode: e.target.value }));
            clearFieldError("customerCode");
          }}
          readOnly
          disabled
          error={fieldErrors.customerCode?.[0]}
        />

        <FormInput
          label="ชื่อร้านค้า"
          value={values.companyName}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, companyName: e.target.value }));
            clearFieldError("name");
          }}
          required
          error={fieldErrors.name?.[0]}
          containerClassName="md:col-span-2"
        />

        <FormInput
          label="เลขประจำตัวผู้เสียภาษี"
          value={values.taxId}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, taxId: e.target.value }));
            clearFieldError("taxId");
          }}
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <FormInput
          label="เบอร์โทรศัพท์ (บริษัท)"
          type="number"
          value={values.phone}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, phone: e.target.value }));
            clearFieldError("phone");
          }}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          required
        />
        <FormInput
          label="E-mail (บริษัท)"
          type="email"
          value={values.email}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, email: e.target.value }));
            clearFieldError("email");
          }}
          error={fieldErrors.email?.[0]}
        />

        <FormInput
          label="latitude (ละติจูด)"
          type="number"
          value={values.latitude}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, latitude: e.target.value }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />

        <FormInput
          label="longitude (ลองจิจูด)"
          type="number"
          value={values.longitude}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, longitude: e.target.value }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
      </div>

      <FormInput
        label="ที่อยู่บริษัท (บ้านเลขที่ หมู่ ซอย ถนน)"
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
        ข้อมูลบุคคล
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-5 mt-6">
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
          containerClassName="md:col-span-2"
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <FormInput
          label="เบอร์โทรศัพท์ (บุคคล)"
          value={values.contactPhone}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, contactPhone: e.target.value }));
            clearFieldError("contactPhone");
          }}
          error={fieldErrors.contactPhone?.[0]}
        />
        <FormInput
          label="E-mail (บุคคล)"
          type="email"
          value={values.contactEmail}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, contactEmail: e.target.value }));
            clearFieldError("contactEmail");
          }}
          error={fieldErrors.contactEmail?.[0]}
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

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลเพิ่มเติม (Sub-Dealer)
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4 mt-6">
        <FormSelect
          label="รับของจาก Dealer"
          value={values.receiveFromDealer ?? ""}
          onChange={(v) => {
            setValues((p: any) => ({ ...p, receiveFromDealer: v || "" }));
            clearFieldError("receiveFromDealer");
          }}
          options={dealerOptions.filter((d) => d.value !== values.id)}
          placeholder="เลือกร้านหลัก"
          groupLabel="Dealer"
        />

        <FormInput
          label="คู่แข่งหลัก"
          value={values.mainCompetitor}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, mainCompetitor: e.target.value }))
          }
        />

        <FormInput
          label="พืชในพื้นที่"
          value={values.areaCrops}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, areaCrops: e.target.value }))
          }
        />
        <FormInput
          label="ยอดสั่งซื้อเฉลี่ย/เดือน"
          type="number"
          value={values.averageMonthlyPurchase}
          onChange={(e) =>
            setValues((p: any) => ({
              ...p,
              averageMonthlyPurchase: e.target.value,
            }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-base font-medium mx-2">สินค้าหลักที่ขาย</label>
          <MultiSelect
            options={productGroupOptions}
            onValueChange={(v: string[]) => {
              setValues((p: any) => ({ ...p, mainProductSold: v }));
              clearFieldError("mainProductSold");
            }}
            defaultValue={values.mainProductSold}
            placeholder="เลือกสินค้า"
            searchable={true}
            hideSelectAll={false}
          />
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium mx-2">แบรนด์ที่จำหน่าย</label>
          <MultiSelect
            options={brandOptions}
            onValueChange={(v: string[]) => {
              setValues((p: any) => ({ ...p, brandsSold: v }));
              clearFieldError("brandsSold");
            }}
            defaultValue={values.brandsSold}
            placeholder="เลือกแบรนด์"
            searchable={true}
            hideSelectAll={false}
          />
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <FormInput
          label="ประเภทพื้นที่"
          value={values.areaType}
          onChange={(e) =>
            setValues((p: any) => ({ ...p, areaType: e.target.value }))
          }
        />

        <FormSelect
          label="พนักงานรับผิดชอบ"
          value={values.responsibleEmployeeId ?? ""}
          onChange={(v) => {
            setValues((p: any) => ({ ...p, responsibleEmployeeId: v || "" }));
            clearFieldError("responsibleEmployeeId");
          }}
          options={employeeOptions}
          placeholder="เลือกพนักงาน"
          groupLabel="พนักงาน"
        />

        <FormSelect
          label="คะแนนความสัมพันธ์"
          value={String(values.relationshipScore ?? "")}
          onChange={(v) =>
            setValues((p: any) => ({
              ...p,
              relationshipScore: v ? Number(v) : null,
            }))
          }
          options={[
            { value: "1", label: "แย่" },
            { value: "2", label: "ปานกลาง" },
            { value: "3", label: "ดี" },
          ]}
          placeholder="เลือกคะแนน"
          groupLabel="คะแนน"
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
                averageMonthlyPurchase:
                  rnd.averageMonthlyPurchase ?? p.averageMonthlyPurchase,
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
