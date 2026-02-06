"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import DatePicker from "@/components/custom/DatePicker";
import { Button } from "@/components/ui/button";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview, FileMetadata } from "@/hooks/use-file-upload";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/custom/form-components";
import RandomFillButton from "@/components/custom/random-fill-button";
import { MultiSelect } from "@/components/custom/multi-select";
import { LocateFixed, X, Save } from "lucide-react";
import { useRandomFill } from "@/hooks/use-random-fill";

// Local feature imports - use types from centralized types.ts
import type {
  CustomerFormProps,
  CustomerPayload,
  SubmitResult,
  SelectOption,
} from "../../_types/types";

type Props = Omit<CustomerFormProps, "customerType">;

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
    images: initial.images || [],
  });

  const [dealerOptions, setDealerOptions] = useState<SelectOption[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([]);
  const [productGroupOptions, setProductGroupOptions] = useState<
    SelectOption[]
  >([]);
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generatingCode, setGeneratingCode] = useState(false);

  // Random fill - ใช้ dynamic import เพื่อ tree-shake ใน production
  const randomFillGenerator = useCallback(async () => {
    const { generateRandomSubdealer } =
      await import("@/lib/random-fill/subdealer");
    return generateRandomSubdealer();
  }, []);

  const handleRandomFillGenerated = useCallback((rnd: any) => {
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
  }, []);

  const {
    isEnabled: isRandomFillEnabled,
    isGenerating: isRandomFillGenerating,
    triggerRandomFill,
  } = useRandomFill({
    generator: randomFillGenerator,
    onGenerated: handleRandomFillGenerated,
  });

  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Auto-generate customer code on mount for new customers
  useEffect(() => {
    async function generateCustomerCode() {
      // Only generate for new customers (no initial.customerCode)
      if (initial.customerCode) return;

      setGeneratingCode(true);
      try {
        const res = await fetch(`/api/customers/generate-code?type=SUBDEALER`);
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
        const brands = (bRes.brands || []).map((b: any) => ({
          value: b.description,
          label: b.description,
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

  // Convert initial images to FileMetadata format for GalleryUpload
  const convertToFileMetadata = (images: any[]): FileMetadata[] => {
    return images.map((img) => ({
      id: img.id,
      name: img.name || `image-${img.id}`,
      size: img.size || 0,
      type: img.type || "image/jpeg",
      url: img.url,
    }));
  };

  const uploadImages = (customerId: string, files: File[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/customers/${customerId}/images`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText || "{}");
            resolve(json);
          } catch (err) {
            resolve({});
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(form);
    });
  };

  const deleteImages = (
    customerId: string,
    imageIds: string[],
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      fetch(`/api/customers/${customerId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds }),
      })
        .then((res) => {
          if (res.ok) resolve(res.json());
          else reject(new Error("Failed to delete images"));
        })
        .catch(reject);
    });
  };

  const reorderImages = (
    customerId: string,
    imageIds: string[],
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      fetch(`/api/customers/${customerId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds }),
      })
        .then((res) => {
          if (res.ok) resolve(res.json());
          else reject(new Error("Failed to reorder images"));
        })
        .catch(reject);
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const nextFieldErrors: Record<string, string[]> = {};
    const pushErr = (field: string, msg: string) => {
      nextFieldErrors[field] = [msg];
    };

    // customerCode is auto-generated, no validation needed
    if (!values.companyName?.trim()) {
      pushErr("name", "กรุณากรอกชื่อร้านค้า");
    }
    if (!values.prefix) {
      pushErr("prefix", "กรุณาเลือกคำนำหน้า");
    }
    if (!values.firstName?.trim()) {
      pushErr("firstName", "กรุณากรอกชื่อ");
    }
    if (!values.lastName?.trim()) {
      pushErr("lastName", "กรุณากรอกนามสกุล");
    }
    if (!values.contactPhone?.trim()) {
      pushErr("contactPhone", "กรุณากรอกเบอร์โทรศัพท์บุคคล");
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
            Object.values(res.issues).flat()[0] ??
            res.error ??
            "เกิดข้อผิดพลาด",
          );
        } else {
          setError(res.error ?? "เกิดข้อผิดพลาด");
        }
      } else {
        // Handle images (delete removed, upload new, reorder)
        const targetCustomerId = res.data?.customer?.id || values.id;

        if (targetCustomerId) {
          try {
            // 1. Identify removed images
            const initialImages = (initial.images || []) as any[];
            const currentImageIds = uploadedFiles
              .map((item) => {
                if (item.file instanceof File) return null;
                return (item.file as FileMetadata).id;
              })
              .filter(Boolean);
            const removedImageIds = initialImages
              .map((img) => img.id)
              .filter((id) => !currentImageIds.includes(id));

            // 2. Delete removed images
            if (removedImageIds.length > 0) {
              await deleteImages(targetCustomerId, removedImageIds);
            }

            // 3. Upload new images and collect all IDs in order
            let uploadedImages: any[] = [];
            const filesToUpload = uploadedFiles
              .filter((item) => item.file instanceof File)
              .map((item) => item.file as File);

            if (filesToUpload.length > 0) {
              setUploadProgress(0);
              const uploadRes = await uploadImages(
                targetCustomerId,
                filesToUpload,
              );
              if (uploadRes.created) {
                uploadedImages = uploadRes.created;
              }
            }

            // 4. Construct final ordered ID list
            let uploadIndex = 0;
            const finalOrderedIds = uploadedFiles
              .map((item) => {
                if (item.file instanceof File) {
                  const newImg = uploadedImages[uploadIndex++];
                  return newImg?.id;
                }
                return (item.file as FileMetadata).id;
              })
              .filter(Boolean);

            // 5. Update order
            if (finalOrderedIds.length > 0) {
              await reorderImages(targetCustomerId, finalOrderedIds);
            }
          } catch (err) {
            console.error("Image operation failed", err);
            // We don't block success navigation if image op fails, but we log it
          }
        }
        // Navigation is handled by onSuccess callback
        onSuccess?.();
      }
    } catch (err: any) {
      setError(String(err));
    } finally {
      setLoading(false);
      setUploadProgress(null);
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValues((prev: any) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
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
        ข้อมูลบริษัท
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4 mt-6">
        <FormInput
          label="รหัสลูกค้า (สร้างอัตโนมัติ)"
          value={values.customerCode || (generatingCode ? "กำลังสร้างรหัส..." : "")}
          onChange={() => { }}
          disabled={true}
          placeholder="รหัสจะถูกสร้างอัตโนมัติ"
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

        <div className="md:col-span-2 flex items-end gap-2">
          <FormInput
            label="latitude (ละติจูด)"
            type="number"
            value={values.latitude}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, latitude: e.target.value }))
            }
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            containerClassName="flex-1"
          />

          <FormInput
            label="longitude (ลองจิจูด)"
            type="number"
            value={values.longitude}
            onChange={(e) =>
              setValues((p: any) => ({ ...p, longitude: e.target.value }))
            }
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            containerClassName="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mb-1 shrink-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
            onClick={getCurrentLocation}
            title="ดึงพิกัดปัจจุบัน"
          >
            <LocateFixed className="h-4 w-4" />
          </Button>
        </div>
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
          containerClassName="md:col-span-2"
        />
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <FormInput
          label="เบอร์โทรศัพท์ (บุคคล)"
          type="number"
          value={values.contactPhone}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, contactPhone: e.target.value }));
            clearFieldError("contactPhone");
          }}
          required
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
          required
          error={fieldErrors.responsibleEmployeeId?.[0]}
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

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        รูปภาพร้านค้า
      </h3>
      <div className="md:col-span-2 mt-6 mx-2">
        <GalleryUpload
          maxFiles={5}
          maxSize={5 * 1024 * 1024}
          accept="image/*"
          multiple={true}
          disabled={loading}
          initialFiles={convertToFileMetadata(initial.images || [])}
          onFilesChange={(files) => setUploadedFiles(files)}
          // Enforce 1080x1080 size
          targetSize={{ width: 1080, height: 1080 }}
        />
      </div>

      {uploadProgress !== null && (
        <div className="md:col-span-2 mt-4">
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-green-600 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            กำลังอัพโหลดรูป: {uploadProgress}%
          </div>
        </div>
      )}

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
