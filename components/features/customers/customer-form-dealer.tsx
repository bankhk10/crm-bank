"use client";

import React, { useEffect, useState } from "react";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import DatePicker from "@/components/custom/DatePicker";
import { Button } from "@/components/ui/button";
import Can from "@/components/rbac/Can";
import { CustomerFormProps, CustomerPayload, SubmitResult } from "./customer-form";
import generateRandomDealer from "@/lib/random-fill/dealer";

type Props = Omit<CustomerFormProps, "customerType">;

type Option = { id: string; label: string };

export default function CustomerFormDealer({ initial = {}, onSubmit, onCancel, submitLabel = "บันทึก" }: Props) {
  const [values, setValues] = useState<any>({
    customerCode: initial.customerCode ?? "",
    companyName: initial.name ?? "",
    taxId: initial.taxId ?? "",
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    latitude: (initial as any).latitude ?? "",
    longitude: (initial as any).longitude ?? "",
    prefix: initial.prefix ?? "",
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    birthDate: (initial as any).birthDate ?? "",
    contactPhone: initial.contactPhone ?? "",
    contactEmail: initial.contactEmail ?? "",
    parentDealer: (initial as any).parentDealer ?? "",
    responsibleEmployeeId: (initial as any).responsibleEmployeeId ?? null,
    relationshipScore: (initial as any).relationshipScore ?? null,
    businessNotes: (initial as any).businessNotes ?? (initial.notes ?? ""),
    addressLine: initial.addressLine ?? "",
    province: initial.province ?? "",
    district: initial.district ?? "",
    subdistrict: initial.subdistrict ?? "",
    postalCode: initial.postalCode ?? "",
    status: initial.status ?? "ACTIVE",
  });

  const [dealerOptions, setDealerOptions] = useState<Option[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);
  const [parentDealerLabel, setParentDealerLabel] = useState<string>("");
  const [responsibleEmployeeLabel, setResponsibleEmployeeLabel] = useState<string>("");

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
            // fallback simple padded counter based on timestamp
            setValues((p: any) => ({ ...p, customerCode: `C${String(Date.now()).slice(-5)}` }));
        }
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // fetch companies (for parent dealer) and employees (for responsible)
    async function fetchOptions() {
      try {
        const [cRes, eRes] = await Promise.all([
          fetch(`/api/customers?page=1&perPage=100&type=DEALER`).then((r) => r.json()).catch(() => ({ customers: [] })),
          fetch(`/api/employee`).then((r) => r.json()).catch(() => ({ employees: [] })),
        ]);

        const comps = (cRes.customers || []).map((c: any) => ({ id: c.id, label: c.name }));
        const emps = (eRes.employees || []).map((e: any) => ({ id: e.id, label: e.name }));
        setDealerOptions(comps);
        setEmployeeOptions(emps);
      } catch (err) {
        // ignore
      }
    }

    fetchOptions();
  }, []);

  // when options or initial change, set labels for inputs
  useEffect(() => {
    if (values.parentDealer) {
      const found = dealerOptions.find((d) => d.id === values.parentDealer);
      if (found) setParentDealerLabel(found.label);
    }
    if (values.responsibleEmployeeId) {
      const found = employeeOptions.find((d) => d.id === values.responsibleEmployeeId);
      if (found) setResponsibleEmployeeLabel(found.label);
    }
  }, [dealerOptions, employeeOptions, values.parentDealer, values.responsibleEmployeeId]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev || !(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  function handleChange(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const v = (e.target as HTMLInputElement).value;
      setValues((prev: any) => ({ ...prev, [key]: v }));
      clearFieldError(key);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

      const payload: CustomerPayload & any = {
      customerCode: values.customerCode ?? "",
      customerType: "DEALER",
      name: values.companyName ?? "",
      prefix: values.prefix ?? "",
      firstName: values.firstName ?? "",
      lastName: values.lastName ?? "",
      email: values.email ?? "",
      phone: values.phone ?? "",
      taxId: values.taxId ?? "",
        addressLine: values.addressLine ?? "",
        province: values.province ?? "",
        district: values.district ?? "",
        subdistrict: values.subdistrict ?? "",
        postalCode: values.postalCode != null ? String(values.postalCode) : "",
      status: values.status ?? "ACTIVE",
      contactPerson: `${values.firstName ?? ""} ${values.lastName ?? ""}`.trim(),
      contactPhone: values.contactPhone ?? "",
      contactEmail: values.contactEmail ?? "",
      notes: values.businessNotes ?? "",
      // extra fields kept alongside payload (backend may ignore unknown keys)
      ...(values.latitude ? { latitude: values.latitude } : {}),
      ...(values.longitude ? { longitude: values.longitude } : {}),
      ...(values.parentDealer ? { parentDealerId: values.parentDealer } : {}),
      ...(values.responsibleEmployeeId ? { responsibleEmployeeId: values.responsibleEmployeeId } : {}),
      ...(values.relationshipScore ? { relationshipScore: Number(values.relationshipScore) } : {}),
    } as any;

    try {
      const res = await onSubmit(payload);
      if (!res.success) {
        if (res.issues) {
          setFieldErrors(res.issues);
          setError(Object.values(res.issues).flat()[0] ?? res.error ?? "เกิดข้อผิดพลาด");
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



  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-1">
      <div className="bg-gray-200 rounded p-3">
        <h3 className="text-lg font-semibold">ข้อมูลบริษัท</h3>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <FloatingLabelInput
            label="รหัสลูกค้า"
            value={values.customerCode}
            onChange={(e: any) => {
              setValues((p: any) => ({ ...p, customerCode: e.target.value }));
              clearFieldError("customerCode");
            }}
            roundedClass="rounded-lg"
            error={fieldErrors.customerCode?.[0]}
            // user typically shouldn't edit, but allow copy/regenerate; mark disabled by default
            readOnly
            disabled
          />
        </div>

        <div>
          <FloatingLabelInput
            label="ชื่อร้านค้า"
            value={values.companyName}
            onChange={(e: any) => {
              setValues((p: any) => ({ ...p, companyName: e.target.value }));
              clearFieldError("name");
            }}
            required
            error={fieldErrors.name?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="เลขประจำตัวผู้เสียภาษี"
            value={values.taxId}
            onChange={(e: any) => {
              setValues((p: any) => ({ ...p, taxId: e.target.value }));
              clearFieldError("taxId");
            }}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="เบอร์โทรศัพท์ (บริษัท)"
            value={values.phone}
            onChange={(e: any) => {
              setValues((p: any) => ({ ...p, phone: e.target.value }));
              clearFieldError("phone");
            }}
            required
          />
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <FloatingLabelInput
            label="E-mail (บริษัท)"
            type="email"
            value={values.email}
            onChange={(e: any) => { setValues((p: any) => ({ ...p, email: e.target.value })); clearFieldError("email"); }}
            error={fieldErrors.email?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="latitude (ละติจูด)"
            type="number"
            value={values.latitude}
            onChange={(e: any) => setValues((p: any) => ({ ...p, latitude: e.target.value }))}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="longitude (ลองจิจูด)"
            type="number"
            value={values.longitude}
            onChange={(e: any) => setValues((p: any) => ({ ...p, longitude: e.target.value }))}
          />
        </div>
      </div>

      <div className="md:col-span-2">
        <FloatingLabelInput
          label="ที่อยู่ (บ้านเลขที่, ถนน, ฯลฯ)"
          placeholder="123/45 หมู่ 6 ต. ... อ. ..."
          value={values.addressLine}
          onChange={(e: any) => {
            setValues((p: any) => ({ ...p, addressLine: e.target.value }));
            clearFieldError("addressLine");
          }}
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

      <div className="bg-gray-200 rounded p-3">
        <h3 className="text-lg font-semibold">ข้อมูลบุคคล</h3>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <FloatingLabelInput
            label="คำนำหน้า"
            type="select"
            options={[
              { value: "", label: "เลือกคำนำหน้า" },
              { value: "นาย", label: "นาย" },
              { value: "นาง", label: "นาง" },
              { value: "นางสาว", label: "นางสาว" },
              { value: "บริษัท", label: "บริษัท" },
            ]}
            value={values.prefix}
            onChange={(e: any) => setValues((p: any) => ({ ...p, prefix: e.target.value }))}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="ชื่อ"
            value={values.firstName}
            onChange={(e: any) => { setValues((p: any) => ({ ...p, firstName: e.target.value })); clearFieldError("firstName"); }}
            required
          />
        </div>

        <div>
          <FloatingLabelInput
            label="นามสกุล"
            value={values.lastName}
            onChange={(e: any) => { setValues((p: any) => ({ ...p, lastName: e.target.value })); clearFieldError("lastName"); }}
            required
          />
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <div>
          <DatePicker
            label="วันเกิด"
            value={values.birthDate}
            onChange={(v) => setValues((p: any) => ({ ...p, birthDate: v }))}
            placeholder=""
          />
        </div>

        <div>
          <label className="block text-sm mb-1">อายุ</label>
          <input
            type="text"
            value={values.birthDate ? String(Math.floor((Date.now() - new Date(values.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))) : ""}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-50"
          />
        </div>

        <div>
          <FloatingLabelInput
            label="เบอร์โทรศัพท์ (บุคคล)"
            value={values.contactPhone}
            onChange={(e: any) => { setValues((p: any) => ({ ...p, contactPhone: e.target.value })); clearFieldError("contactPhone"); }}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="E-mail (บุคคล)"
            type="email"
            value={values.contactEmail}
            onChange={(e: any) => { setValues((p: any) => ({ ...p, contactEmail: e.target.value })); clearFieldError("contactEmail"); }}
          />
        </div>
      </div>

      <div className="bg-gray-200 rounded p-3">
        <h3 className="text-lg font-semibold">ข้อมูลเพิ่มเติม</h3>
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
        <div>
          <label className="block text-sm mb-1">ร้านหลัก (ถ้ามี)</label>
          <FloatingLabelInput
            label="ร้านหลัก (ถ้ามี)"
            type="select"
            options={dealerOptions.map((d) => ({ value: d.id, label: d.label }))}
            value={values.parentDealer ?? ""}
            onChange={(e: any) => {
              const v = e.target.value;
              setValues((p: any) => ({ ...p, parentDealer: v || "" }));
              const found = dealerOptions.find((d) => d.id === v);
              setParentDealerLabel(found ? found.label : "");
              clearFieldError("parentDealer");
            }}
            searchable
          />
        </div>

        <div>
          <FloatingLabelInput
            label="พนักงานที่รับผิดชอบ"
            type="select"
            options={employeeOptions.map((d) => ({ value: d.id, label: d.label }))}
            value={values.responsibleEmployeeId ?? ""}
            onChange={(e: any) => {
              const v = e.target.value;
              setValues((p: any) => ({ ...p, responsibleEmployeeId: v || null }));
              const found = employeeOptions.find((d) => d.id === v);
              setResponsibleEmployeeLabel(found ? found.label : "");
              clearFieldError("responsibleEmployeeId");
            }}
            searchable
          />
        </div>

        <div>
          <FloatingLabelInput
            label="คะแนนความสัมพันธ์"
            type="select"
            options={[
              { value: "", label: "(เลือก)" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
            ]}
            value={(values.relationshipScore ?? "") as any}
            onChange={(e: any) => setValues((p: any) => ({ ...p, relationshipScore: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">หมายเหตุ</label>
        <textarea
          value={values.businessNotes}
          onChange={(e) => { setValues((p: any) => ({ ...p, businessNotes: e.target.value })); clearFieldError("notes"); }}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <div className="md:col-span-2 pt-6 border-t my-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            className="w-44 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
            type="button"
            onClick={() => {
              const rnd = generateRandomDealer();
              setValues((p: any) => ({
                ...p,
                companyName: rnd.name ?? p.companyName,
                taxId: rnd.taxId ?? p.taxId,
                phone: rnd.phone ?? p.phone,
                email: rnd.email ?? p.email,
                addressLine: rnd.addressLine ?? p.addressLine,
                province: rnd.province ?? p.province,
                district: rnd.district ?? p.district,
                subdistrict: rnd.subdistrict ?? p.subdistrict,
                postalCode: rnd.postalCode ?? p.postalCode,
                prefix: rnd.prefix ?? p.prefix,
                firstName: rnd.firstName ?? p.firstName,
                lastName: rnd.lastName ?? p.lastName,
                contactPhone: rnd.contactPhone ?? p.contactPhone,
                contactEmail: rnd.contactEmail ?? p.contactEmail,
                businessNotes: rnd.businessNotes ?? p.businessNotes,
                relationshipScore: rnd.relationshipScore ?? p.relationshipScore,
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
            ยกเลิก
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
