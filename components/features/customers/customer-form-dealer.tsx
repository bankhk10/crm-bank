"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocateFixed, X, Save } from "lucide-react";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import DatePicker from "@/components/custom/DatePicker";
import { Button } from "@/components/ui/button";
import { CustomerFormProps, CustomerPayload } from "./customer-form-types";
import generateRandomDealer from "@/lib/random-fill/dealer";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview, FileMetadata } from "@/hooks/use-file-upload";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/custom/form-components";
import RandomFillButton from "@/components/custom/random-fill-button";

type Props = Omit<CustomerFormProps, "customerType">;

type Option = { value: string; label: string };

const labelTextClass = "text-base font-medium mx-2";
const inputTextClass = "mt-1 h-11 text-base placeholder:text-gray-500";

export default function CustomerFormDealer({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = "บันทึก",
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
    prefix: initial.prefix ?? "",
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    birthDate: (initial as any).birthDate ?? "",
    contactPhone: initial.contactPhone ?? "",
    contactEmail: initial.contactEmail ?? "",
    parentDealer: (initial as any).parentDealer ?? "",
    responsibleEmployeeId: (initial as any).responsibleEmployeeId ?? null,
    relationshipScore: (initial as any).relationshipScore ?? null,
    businessNotes: (initial as any).businessNotes ?? initial.notes ?? "",
    addressLine: initial.addressLine ?? "",
    province: initial.province ?? "",
    district: initial.district ?? "",
    subdistrict: initial.subdistrict ?? "",
    postalCode: initial.postalCode ?? "",
    billingAddressLine: (initial as any).billingAddressLine ?? "",
    billingProvince: (initial as any).billingProvince ?? "",
    billingDistrict: (initial as any).billingDistrict ?? "",
    billingSubdistrict: (initial as any).billingSubdistrict ?? "",
    billingPostalCode: (initial as any).billingPostalCode ?? "",
    shippingAddressLine: (initial as any).shippingAddressLine ?? "",
    shippingProvince: (initial as any).shippingProvince ?? "",
    shippingDistrict: (initial as any).shippingDistrict ?? "",
    shippingSubdistrict: (initial as any).shippingSubdistrict ?? "",
    shippingPostalCode: (initial as any).shippingPostalCode ?? "",
    status: initial.status ?? "ACTIVE",
    images: initial.images || [],
  });

  const [dealerOptions, setDealerOptions] = useState<Option[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);
  const [parentDealerLabel, setParentDealerLabel] = useState<string>("");
  const [responsibleEmployeeLabel, setResponsibleEmployeeLabel] =
    useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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
          // fallback simple padded counter based on timestamp
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
    // fetch companies (for parent dealer) and employees (for responsible)
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
          value: c.id,
          label: c.name,
        }));
        const emps = (eRes.employees || []).map((e: any) => ({
          value: e.id,
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

  // when options or initial change, set labels for inputs
  useEffect(() => {
    // if parentDealer is set to self, clear it
    if (values.parentDealer && values.id && values.parentDealer === values.id) {
      setValues((p: any) => ({ ...p, parentDealer: "" }));
      clearFieldError("parentDealer");
    }

    if (values.parentDealer) {
      const found = dealerOptions.find((d) => d.value === values.parentDealer);
      if (found) setParentDealerLabel(found.label);
    }
    if (values.responsibleEmployeeId) {
      const found = employeeOptions.find(
        (d) => d.value === values.responsibleEmployeeId
      );
      if (found) setResponsibleEmployeeLabel(found.label);
    }
  }, [
    dealerOptions,
    employeeOptions,
    values.parentDealer,
    values.responsibleEmployeeId,
  ]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev || !(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
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
    imageIds: string[]
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
    imageIds: string[]
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
      birthDate: values.birthDate ?? undefined,
      email: values.email ?? "",
      phone: values.phone ?? "",
      taxId: values.taxId ?? "",
      addressLine: values.addressLine ?? "",
      province: values.province ?? "",
      district: values.district ?? "",
      subdistrict: values.subdistrict ?? "",
      postalCode: values.postalCode != null ? String(values.postalCode) : "",
      billingAddressLine: values.billingAddressLine ?? "",
      billingProvince: values.billingProvince ?? "",
      billingDistrict: values.billingDistrict ?? "",
      billingSubdistrict: values.billingSubdistrict ?? "",
      billingPostalCode: values.billingPostalCode ?? "",
      shippingAddressLine: values.shippingAddressLine ?? "",
      shippingProvince: values.shippingProvince ?? "",
      shippingDistrict: values.shippingDistrict ?? "",
      shippingSubdistrict: values.shippingSubdistrict ?? "",
      shippingPostalCode: values.shippingPostalCode ?? "",
      status: values.status ?? "ACTIVE",
      contactPerson: `${values.firstName ?? ""} ${
        values.lastName ?? ""
      }`.trim(),
      contactPhone: values.contactPhone ?? "",
      contactEmail: values.contactEmail ?? "",
      notes: values.businessNotes ?? "",
      // extra fields kept alongside payload (backend may ignore unknown keys)
      ...(values.latitude ? { latitude: values.latitude } : {}),
      ...(values.longitude ? { longitude: values.longitude } : {}),
      ...(values.parentDealer ? { parentDealerId: values.parentDealer } : {}),
      ...(values.responsibleEmployeeId
        ? { responsibleEmployeeId: values.responsibleEmployeeId }
        : {}),
      ...(values.relationshipScore != null
        ? { relationshipScore: Number(values.relationshipScore) }
        : {}),
    } as any;

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
                filesToUpload
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
          (1000 * 60 * 60 * 24 * 365.25)
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
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        ที่อยู่วางบิล
      </h3>

      <FormInput
        label="ที่อยู่วางบิล (บ้านเลขที่ หมู่ ซอย ถนน)"
        placeholder="123/45 หมู่ 6"
        value={values.billingAddressLine}
        onChange={(e) => {
          setValues((p: any) => ({
            ...p,
            billingAddressLine: e.target.value,
          }));
          clearFieldError("billingAddressLine");
        }}
        containerClassName="md:col-span-2 mt-6"
      />

      <div className="md:col-span-2">
        <ThaiAddressPicker
          value={{
            province: values.billingProvince,
            district: values.billingDistrict,
            subdistrict: values.billingSubdistrict,
            postalCode: values.billingPostalCode,
          }}
          onChange={(next) => {
            setValues((p: any) => ({
              ...p,
              billingProvince: next.province,
              billingDistrict: next.district,
              billingSubdistrict: next.subdistrict,
              billingPostalCode: next.postalCode,
            }));
            clearFieldError("billingProvince");
            clearFieldError("billingDistrict");
            clearFieldError("billingSubdistrict");
            clearFieldError("billingPostalCode");
          }}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ที่อยู่จัดส่ง
      </h3>

      <FormInput
        label="ที่อยู่จัดส่ง (บ้านเลขที่ หมู่ ซอย ถนน)"
        placeholder="123/45 หมู่ 6"
        value={values.shippingAddressLine}
        onChange={(e) => {
          setValues((p: any) => ({
            ...p,
            shippingAddressLine: e.target.value,
          }));
          clearFieldError("shippingAddressLine");
        }}
        containerClassName="md:col-span-2 mt-6"
      />

      <div className="md:col-span-2">
        <ThaiAddressPicker
          value={{
            province: values.shippingProvince,
            district: values.shippingDistrict,
            subdistrict: values.shippingSubdistrict,
            postalCode: values.shippingPostalCode,
          }}
          onChange={(next) => {
            setValues((p: any) => ({
              ...p,
              shippingProvince: next.province,
              shippingDistrict: next.district,
              shippingSubdistrict: next.subdistrict,
              shippingPostalCode: next.postalCode,
            }));
            clearFieldError("shippingProvince");
            clearFieldError("shippingDistrict");
            clearFieldError("shippingSubdistrict");
            clearFieldError("shippingPostalCode");
          }}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลผู้ติดต่อ
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-5 mt-6">
        <FormSelect
          label="คำนำหน้า"
          value={values.prefix}
          onChange={(v) => setValues((p: any) => ({ ...p, prefix: v }))}
          options={[
            { value: "นาย", label: "นาย" },
            { value: "นาง", label: "นาง" },
            { value: "นางสาว", label: "นางสาว" },
          ]}
          placeholder="เลือกคำนำหน้า"
          groupLabel="คำนำหน้า"
        />

        <FormInput
          label="ชื่อ"
          value={values.firstName}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, firstName: e.target.value }));
            clearFieldError("firstName");
          }}
          required
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
        />
        <FormInput
          label="E-mail (บุคคล)"
          type="email"
          value={values.contactEmail}
          onChange={(e) => {
            setValues((p: any) => ({ ...p, contactEmail: e.target.value }));
            clearFieldError("contactEmail");
          }}
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
          onChange={() => {}}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลเพิ่มเติม
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3 mt-6">
        {/* <div>
          <Label className={labelTextClass}>ร้านหลัก (ถ้ามี)</Label>
          <Select
            value={values.parentDealer ?? ""}
            onValueChange={(v) => {
              setValues((p: any) => ({ ...p, parentDealer: v || "" }));
              const found = dealerOptions.find((d) => d.id === v);
              setParentDealerLabel(found ? found.label : "");
              clearFieldError("parentDealer");
            }}
          >
            <SelectTrigger className={inputTextClass}>
              <SelectValue placeholder="เลือกร้านหลัก" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>ร้านหลัก</SelectLabel>
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
        </div> */}

        <FormSelect
          label="พนักงานที่รับผิดชอบ"
          value={values.responsibleEmployeeId ?? ""}
          onChange={(v) => {
            setValues((p: any) => ({
              ...p,
              responsibleEmployeeId: v || null,
            }));
            const found = employeeOptions.find((d) => d.value === v);
            setResponsibleEmployeeLabel(found ? found.label : "");
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
        <FormSelect
          label="สถานะ"
          value={values.status ?? "ACTIVE"}
          onChange={(v) => {
            setValues((p: any) => ({ ...p, status: v }));
            clearFieldError("status");
          }}
          options={[
            { value: "ACTIVE", label: "ใช้งาน" },
            { value: "INACTIVE", label: "ไม่ได้ใช้งาน" },
            { value: "SUSPENDED", label: "ระงับ" },
          ]}
          placeholder="เลือกสถานะ"
          groupLabel="สถานะ"
          error={fieldErrors.status?.[0]}
        />
      </div>

      <FormTextarea
        label="หมายเหตุ"
        value={values.businessNotes}
        onChange={(e) => {
          setValues((p: any) => ({ ...p, businessNotes: e.target.value }));
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
            onClick={onCancel ?? (() => router.back())}
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

      <div className="w-full sm:w-auto">
        <RandomFillButton
          size="lg"
          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border-0 transition-colors"
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
              billingAddressLine:
                rnd.billingAddressLine ?? p.billingAddressLine,
              billingProvince: rnd.billingProvince ?? p.billingProvince,
              billingDistrict: rnd.billingDistrict ?? p.billingDistrict,
              billingSubdistrict:
                rnd.billingSubdistrict ?? p.billingSubdistrict,
              billingPostalCode: rnd.billingPostalCode ?? p.billingPostalCode,
              shippingAddressLine:
                rnd.shippingAddressLine ?? p.shippingAddressLine,
              shippingProvince: rnd.shippingProvince ?? p.shippingProvince,
              shippingDistrict: rnd.shippingDistrict ?? p.shippingDistrict,
              shippingSubdistrict:
                rnd.shippingSubdistrict ?? p.shippingSubdistrict,
              shippingPostalCode:
                rnd.shippingPostalCode ?? p.shippingPostalCode,
              prefix: rnd.prefix ?? p.prefix,
              firstName: rnd.firstName ?? p.firstName,
              lastName: rnd.lastName ?? p.lastName,
              contactPhone: rnd.contactPhone ?? p.contactPhone,
              contactEmail: rnd.contactEmail ?? p.contactEmail,
              businessNotes: rnd.businessNotes ?? p.businessNotes,
              relationshipScore: rnd.relationshipScore ?? p.relationshipScore,
            }));
          }}
          disabled={loading}
          variant="secondary"
        >
          <span className="mr-2">🎲</span> กรอกข้อมูลแบบสุ่ม
        </RandomFillButton>
      </div>
    </form>
  );
}
