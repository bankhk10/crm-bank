"use client";

import React, { useState } from "react";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { generateRandomCompany } from "@/lib/random-fill/company";
import Can from "@/components/rbac/Can";

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
  status?: string;
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
    status: initial.status ?? "ACTIVE",
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
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        <div>
          <Label className="mx-2 mt-2 text-base">ชื่อบริษัท</Label>
          <Input
            value={payload.name}
            onChange={(e) => {
              setPayload((p) => ({ ...p, name: e.target.value }));
              clearFieldError("name");
            }}
            required
            className="mt-1 text-base h-10"
          />
          {fieldErrors.name?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">ชื่อย่อบริษัท</Label>
          <Input
            value={payload.shortName}
            onChange={(e) => {
              setPayload((p) => ({ ...p, shortName: e.target.value }));
              clearFieldError("shortName");
            }}
            className="mt-1 text-base h-10"
          />
          {fieldErrors.shortName?.[0] && (
            <p className="text-xs text-red-600 mt-1">
              {fieldErrors.shortName[0]}
            </p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">อีเมล</Label>
          <Input
            type="email"
            value={payload.email}
            onChange={(e) => {
              setPayload((p) => ({ ...p, email: e.target.value }));
              clearFieldError("email");
            }}
            className="mt-1 text-base h-10"
          />
          {fieldErrors.email?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">โทรศัพท์</Label>
          <Input
            value={payload.phone}
            onChange={(e) => {
              setPayload((p) => ({ ...p, phone: e.target.value }));
              clearFieldError("phone");
            }}
            className="mt-1 text-base h-10"
          />
          {fieldErrors.phone?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.phone[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">เลขประจำตัวผู้เสียภาษี</Label>
          <Input
            value={payload.taxId}
            onChange={(e) => {
              setPayload((p) => ({ ...p, taxId: e.target.value }));
              clearFieldError("taxId");
            }}
            className="mt-1 text-base h-10"
          />
          {fieldErrors.taxId?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.taxId[0]}</p>
          )}
        </div>

        <div>
          <Label className="mx-2 mt-2 text-base">สถานะ</Label>
          <Select
            value={payload.status}
            onValueChange={(v) => {
              setPayload((p) => ({ ...p, status: v }));
              clearFieldError("status");
            }}
          >
            <SelectTrigger className="w-full h-12 mt-1 text-base">
              <SelectValue placeholder="เลือกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>สถานะ</SelectLabel>
                <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
                <SelectItem value="INACTIVE">ไม่ได้ใช้งาน</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {fieldErrors.status?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.status[0]}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label className="mx-2 mt-2 text-base">ที่อยู่บริษัท</Label>
          <Input
            value={payload.addressLine}
            onChange={(e) => {
              setPayload((p) => ({ ...p, addressLine: e.target.value }));
              clearFieldError("addressLine");
            }}
            className="mt-1 text-base h-10"
          />
          {fieldErrors.addressLine?.[0] && (
            <p className="text-xs text-red-600 mt-1">
              {fieldErrors.addressLine[0]}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
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
              className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
              type="submit"
              disabled={loading}
            >
              {loading ? "กำลังบันทึก..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>

      <Can permission="randomize">
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
      </Can>
    </form>
  );
}
