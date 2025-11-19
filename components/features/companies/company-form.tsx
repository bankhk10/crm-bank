"use client";

import React, { useState } from "react";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateRandomCompany } from "@/lib/random-fill/company";

type CompanyPayload = {
  name: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
};

type SubmitResult = {
  success: boolean;
  issues?: Record<string, string[]>;
  error?: string;
};

interface Props {
  initial?: Partial<CompanyPayload>;
  onSubmit: (payload: CompanyPayload) => Promise<SubmitResult>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function CompanyForm({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = "บันทึก",
}: Props) {
  const [payload, setPayload] = useState<CompanyPayload>({
    name: initial.name ?? "",
    shortName: initial.shortName ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    taxId: initial.taxId ?? "",
    addressLine: initial.addressLine ?? "",
    province: initial.province ?? "",
    district: initial.district ?? "",
    subdistrict: initial.subdistrict ?? "",
    postalCode: initial.postalCode ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

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

    try {
      const res = await onSubmit(payload);
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
    } catch (error) {
      const err = error as Error;
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <Button
        variant="secondary"
        size="lg"
        className="w-40"
        type="button"
        onClick={() => {
          setFieldErrors({});
          setError(null);
          const random = generateRandomCompany();
          setPayload((p) => ({ ...p, ...random }));
        }}
      >
        สุ่มข้อมูล
      </Button>
      {error && (
        <div>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
        <div>
          <FloatingLabelInput
            label="ชื่อบริษัท"
            value={payload.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, name: e.target.value }));
              clearFieldError("name");
            }}
            required
            error={fieldErrors.name?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="ชื่อย่อบริษัท"
            value={payload.shortName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, shortName: e.target.value }));
              clearFieldError("shortName");
            }}
            error={fieldErrors.shortName?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="อีเมล"
            type="email"
            value={payload.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, email: e.target.value }));
              clearFieldError("email");
            }}
            error={fieldErrors.email?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="โทรศัพท์"
            value={payload.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, phone: e.target.value }));
              clearFieldError("phone");
            }}
            error={fieldErrors.phone?.[0]}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="เลขประจำตัวผู้เสียภาษี"
            value={payload.taxId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, taxId: e.target.value }));
              clearFieldError("taxId");
            }}
            error={fieldErrors.taxId?.[0]}
          />
        </div>

        <div className="md:col-span-2">
          <FloatingLabelInput
            label="ที่อยู่บริษัท"
            value={payload.addressLine}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPayload((p) => ({ ...p, addressLine: e.target.value }));
              clearFieldError("addressLine");
            }}
            error={fieldErrors.addressLine?.[0]}
          />

          <ThaiAddressPicker
            value={{
              province: payload.province,
              district: payload.district,
              subdistrict: payload.subdistrict,
              postalCode: payload.postalCode,
            }}
            onChange={(next) => {
              setPayload((p) => ({ ...p, ...next }));
              clearFieldError("province");
              clearFieldError("district");
              clearFieldError("subdistrict");
              clearFieldError("postalCode");
            }}
          />
        </div>

        <div className="md:col-span-2 pt-6 border-t my-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
              // เพิ่มคลาสพื้นหลังสีเขียว เช่น bg-green-500 และ hover:bg-green-600
              className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
              type="submit"
              disabled={loading}
            >
              {loading ? "กำลังบันทึก..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
