"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import { Button } from "@/components/ui/button";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";

export default function NewCompanyPage() {
  const router = useRouter();

  const [payload, setPayload] = useState({
    name: "",
    shortName: "",
    email: "",
    phone: "",
    taxId: "",
    addressLine: "",
    province: "",
    district: "",
    subdistrict: "",
    postalCode: "",
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

  const onAddressChange = (next: any) => {
    setPayload((p) => ({ ...p, ...next }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        // If Zod validation issues exist, set field-level errors
        if (json?.issues) {
          try {
            const fe = json.issues as Record<string, string[]>;
            setFieldErrors(fe);
            // set a short summary as `error` as well
            const firstMsg = Object.values(fe).flat()[0];
            setError(firstMsg || json?.error || "Invalid payload");
          } catch (e) {
            setError(json?.error || "Invalid payload");
          }
        } else {
          setError(json?.error || "Failed to create company");
        }

        setLoading(false);
        return;
      }

      router.push("/companies");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">
              สร้างบริษัทใหม่
            </h5>
          </div>

          <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
            <div>
              <FloatingLabelInput
                label="ชื่อบริษัท"
                value={payload.name}
                onChange={(e: any) => {
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
                onChange={(e: any) => {
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
                onChange={(e: any) => {
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
                onChange={(e: any) => {
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
                onChange={(e: any) => {
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
                onChange={(e: any) => {
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
                  onAddressChange(next);
                  // clear address related errors
                  clearFieldError("province");
                  clearFieldError("district");
                  clearFieldError("subdistrict");
                  clearFieldError("postalCode");
                }}
              />

              {/* Show any address field errors from server for the picker */}
              {(
                fieldErrors.province ||
                fieldErrors.district ||
                fieldErrors.subdistrict ||
                fieldErrors.postalCode
              ) && (
                <div className="mt-2 text-sm text-red-700">
                  {fieldErrors.province?.[0] || fieldErrors.district?.[0] || fieldErrors.subdistrict?.[0] || fieldErrors.postalCode?.[0]}
                </div>
              )}
            </div>
            {error && (
              <div className="md:col-span-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="md:col-span-2 pt-6 border-t my-2">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-36 shadow-sm hover:shadow-md transition-transform transform-gpu hover:-translate-y-0.5 bg-gray-300 hover:bg-gray-400"
                  type="button"
                  onClick={() => router.push("/companies")}
                >
                  ยกเลิก
                </Button>

                <Button
                  size="lg"
                  className="w-40 shadow-md bg-emerald-700 text-white hover:bg-emerald-800 transition-transform transform-gpu hover:-translate-y-0.5"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
