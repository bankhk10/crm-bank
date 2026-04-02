"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, X, Save, Loader2 } from "lucide-react";
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
import { FormCombobox } from "@/components/custom/FormCombobox";
import type { CustomerFormProps, CustomerPayload, SelectOption } from "../../types";
import { ShippingAddressList } from "./shipping-address-list";
import { ContactList } from "./contact-list";

type Props = Omit<CustomerFormProps, "customerType">;

export default function CustomerFormDealer({
  initial = {},
  onSubmit,
  onCancel,
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
    shippingAddresses: (initial as any).shippingAddresses ?? [],
    contacts: (initial as any).contacts ?? [],
    status: initial.status ?? "ACTIVE",
    images: initial.images || [],
  });

  const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([]);
  const [dealerOptions, setDealerOptions] = useState<SelectOption[]>([]);
  const [parentDealerLabel, setParentDealerLabel] = useState("");

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Check if customer code already exists
  const checkCustomerCode = useCallback(
    async (code: string) => {
      if (!code?.trim()) return;

      try {
        const excludeId = (initial as any)?.id || "";
        const res = await fetch(
          `/api/customers/check-code?code=${encodeURIComponent(code)}${excludeId ? `&excludeId=${excludeId}` : ""
          }`,
        );
        const json = await res.json();

        if (json.exists) {
          setFieldErrors((prev) => ({
            ...prev,
            customerCode: [json.message || `รหัสลูกค้า "${code}" ถูกใช้แล้ว`],
          }));
        } else {
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.customerCode;
            return next;
          });
        }
      } catch {
        // ignore network errors during check
      } finally {
        // setCheckingCode(false);
      }
    },
    [initial],
  );

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

  useEffect(() => {
    // fetch companies (for parent dealer) and employees (for responsible)
    async function fetchEmployees() {
      try {
        const { getEmployeesAction } = await import("@/modules/employee/server/actions");
        const res = await getEmployeesAction();
        const emps = (res.employees || []).map((e: any) => ({
          value: e.id,
          label: e.name,
        }));
        setEmployeeOptions(emps);
      } catch (err) {
        // ignore
      }
    }

    async function fetchDealers() {
      try {
        // Fetch dealer customers for parent dealer dropdown
        const cRes = await fetch(`/api/customers?type=DEALER&perPage=1000`)
          .then((r) => r.json())
          .catch(() => ({ customers: [] }));

        const dealers = (cRes.customers || []).map((c: any) => ({
          value: c.id,
          label: `${c.customerCode} - ${c.name}`,
        }));
        setDealerOptions(dealers);
      } catch {
        // ignore
      }
    }

    fetchEmployees();
    fetchDealers();
  }, []);

  // when options or initial change, set labels for inputs
  useEffect(() => {
    // if parentDealer is set to self, clear it
    if (values.parentDealer && values.id && values.parentDealer === values.id) {
      setValues((p: any) => ({ ...p, parentDealer: "" }));
      clearFieldError("parentDealer");
    }

  }, [
    values.parentDealer,
    values.id,
  ]);

  // Set parentDealerLabel when dealerOptions are loaded and parentDealer has initial value
  useEffect(() => {
    if (values.parentDealer && dealerOptions.length > 0) {
      const found = dealerOptions.find((d) => d.value === values.parentDealer);
      if (found) {
        setParentDealerLabel(found.label);
      }
    }
  }, [values.parentDealer, dealerOptions]);

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
          } catch {
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
    if (loading) return;
    setLoading(true);
    setFieldErrors({});

    // Client-side validation
    const nextFieldErrors: Record<string, string[]> = {};
    const pushErr = (field: string, msg: string) => {
      nextFieldErrors[field] = [msg];
    };

    if (!values.customerCode?.trim()) {
      pushErr("customerCode", "กรุณากรอกรหัสลูกค้า");
    } else if (fieldErrors.customerCode?.length) {
      // If there's already a duplicate error from onBlur check
      nextFieldErrors.customerCode = fieldErrors.customerCode;
    }
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
      setLoading(false);
      return;
    }

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
      contactPerson: `${values.firstName ?? ""} ${values.lastName ?? ""
        }`.trim(),
      contactPhone: values.contactPhone ?? "",
      contactEmail: values.contactEmail ?? "",
      notes: values.businessNotes ?? "",
      // extra fields kept alongside payload (backend may ignore unknown keys)
      ...(values.latitude ? { latitude: values.latitude } : {}),
      ...(values.longitude ? { longitude: values.longitude } : {}),
      parentDealerId: values.parentDealer || "",
      ...(values.responsibleEmployeeId
        ? { responsibleEmployeeId: values.responsibleEmployeeId }
        : {}),
      ...(values.relationshipScore != null
        ? { relationshipScore: Number(values.relationshipScore) }
        : {}),
      shippingAddresses: values.shippingAddresses,
      contacts: values.contacts,
    } as any;

    try {
      const res = await onSubmit(payload);
      if (!res.success) {
        if (res.issues) {
          setFieldErrors(res.issues);
        }
        setLoading(false);
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

    } catch {
      setLoading(false);
    } finally {
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
    } catch {
      return "";
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValues((prev: any) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location");
        setIsLocating(false);
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
          onBlur={(e) => {
            const code = e.target.value?.trim();
            if (code) checkCustomerCode(code);
          }}
          required
          error={fieldErrors.customerCode?.[0]}
          placeholder=""
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
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
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

      <div className="flex items-center justify-between mt-6 my-2 p-4 bg-gray-300 rounded-3xl">
        <h3 className="text-xl font-semibold text-gray-800">
          ที่อยู่วางบิล
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-sm bg-white hover:bg-gray-100 text-gray-700"
          onClick={() => {
            setValues((p: any) => ({
              ...p,
              billingAddressLine: values.addressLine,
              billingProvince: values.province,
              billingDistrict: values.district,
              billingSubdistrict: values.subdistrict,
              billingPostalCode: values.postalCode,
            }));
            clearFieldError("billingAddressLine");
            clearFieldError("billingProvince");
            clearFieldError("billingDistrict");
            clearFieldError("billingSubdistrict");
            clearFieldError("billingPostalCode");
          }}
        >
          คัดลอกจากที่อยู่บริษัท
        </Button>
      </div>

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

      <div className="flex items-center justify-between mt-6 my-2 p-4 bg-gray-300 rounded-3xl">
        <h3 className="text-xl font-semibold text-gray-800">
          ที่อยู่จัดส่ง
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-sm bg-white hover:bg-gray-100 text-gray-700"
          onClick={() => {
            setValues((p: any) => ({
              ...p,
              shippingAddressLine: values.addressLine,
              shippingProvince: values.province,
              shippingDistrict: values.district,
              shippingSubdistrict: values.subdistrict,
              shippingPostalCode: values.postalCode,
            }));
            clearFieldError("shippingAddressLine");
            clearFieldError("shippingProvince");
            clearFieldError("shippingDistrict");
            clearFieldError("shippingSubdistrict");
            clearFieldError("shippingPostalCode");
          }}
        >
          คัดลอกจากที่อยู่บริษัท
        </Button>
      </div>

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

      <div className="md:col-span-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">ที่อยู่จัดส่งเพิ่มเติม</h4>
        <ShippingAddressList
          value={values.shippingAddresses}
          onChange={(val) => setValues((p: any) => ({ ...p, shippingAddresses: val }))}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลผู้ติดต่อ
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

      <div className="md:col-span-4 mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลผู้ติดต่อเพิ่มเติม</h4>
        <ContactList
          value={values.contacts}
          onChange={(val) => setValues((p: any) => ({ ...p, contacts: val }))}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลเพิ่มเติม
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3 mt-6">
        <FormCombobox
          label="ร้านหลัก (ถ้ามี)"
          value={values.parentDealer ?? ""}
          onChange={(v) => {
            setValues((p: any) => ({ ...p, parentDealer: v || "" }));
            const found = dealerOptions.find((d) => d.value === v);
            setParentDealerLabel(found ? found.label : "");
            clearFieldError("parentDealer");
          }}
          options={[
            { value: "", label: "ไม่มีร้านหลัก" },
            ...dealerOptions.filter((d) => d.value !== values.id)
          ]}
          placeholder="เลือกร้านหลัก"
          searchPlaceholder="ค้นหาร้านหลัก..."
          emptyText="ไม่พบร้านหลัก"
          error={fieldErrors.parentDealer?.[0]}
          containerClassName="md:col-span-1"
        />

        <FormSelect
          label="พนักงานที่รับผิดชอบ"
          value={values.responsibleEmployeeId ?? ""}
          onChange={(v) => {
            setValues((p: any) => ({
              ...p,
              responsibleEmployeeId: v || null,
            }));

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
        <div className="flex justify-center flex-col-reverse sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-6">
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


    </form>
  );
}
