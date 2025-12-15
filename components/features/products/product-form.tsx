"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/custom/image-upload";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { FormInput, FormSelect, FormTextarea } from "@/components/custom/form-components";
import { MultiSelect } from "@/components/custom/multi-select";
import {
  UNIT_OPTIONS,
  PRODUCT_GROUP_OPTIONS,
  BRAND_OPTIONS,
  STATUS_OPTIONS,
  PLANT_OPTIONS,
  type ProductFormData,
} from "@/types/product";
import generateRandomProduct from "@/lib/random-fill/product";

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  productId?: string;
  isEdit?: boolean;
  onSubmit?: (payload: any) => Promise<{
    success: boolean;
    issues?: Record<string, string[]>;
    error?: string;
  }>;
  onCancel?: () => void;
  hideBorder?: boolean;
  canEdit?: boolean;
  permissionHint?: string;
  showRandomFill?: boolean;
}

export function ProductForm({
  initialData,
  productId,
  isEdit = false,
  onSubmit,
  onCancel,
  hideBorder,
  canEdit = true,
  permissionHint = "จำเป็นต้องมีสิทธิ์ product.create เพื่อสร้างสินค้าใหม่",
  showRandomFill = process.env.NEXT_PUBLIC_SHOW_RANDOM_FILL === "true",
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    productCode: initialData?.productCode || "",
    name: initialData?.name || "",
    commonName: initialData?.commonName || "",
    unit: initialData?.unit || "",
    productGroup: initialData?.productGroup || "",
    brand: initialData?.brand || "",
    packageSize: initialData?.packageSize || "",
    packageSizePerBox: initialData?.packageSizePerBox || "",
    status: initialData?.status || "ACTIVE",
    usedForPlants: initialData?.usedForPlants || [],
    salesPoint: initialData?.salesPoint || "",
    properties: initialData?.properties || "",
    images: initialData?.images || [],
    coverIndex: (initialData as any)?.coverIndex ?? null,
  });

  const originalExistingIdsRef = useRef<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  useEffect(() => {
    const ids = (initialData?.images || [])
      .filter((i: any) => typeof (i as any).id === "string")
      .map((i: any) => (i as any).id as string);
    originalExistingIdsRef.current = ids;
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.productCode.trim()) {
      newErrors.productCode = "กรุณากรอกรหัสสินค้า";
    }

    if (!formData.name.trim()) {
      newErrors.name = "กรุณากรอกชื่อการค้า";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        productCode: formData.productCode,
        name: formData.name,
        commonName: formData.commonName || undefined,
        unit: formData.unit || undefined,
        productGroup: formData.productGroup || undefined,
        brand: formData.brand || undefined,
        packageSize: formData.packageSize || undefined,
        packageSizePerBox: formData.packageSizePerBox || undefined,
        status: formData.status,
        usedForPlants: formData.usedForPlants,
        salesPoint: formData.salesPoint || undefined,
        properties: formData.properties || undefined,
        coverIndex: formData.coverIndex ?? undefined,
      };

      const url = isEdit ? `/api/products/${productId}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      if (onSubmit) {
        const result = await onSubmit(payload);
        if (!result.success) {
          setError(
            result.error ??
            Object.values(result.issues ?? {})[0]?.[0] ??
            "Server error"
          );
        } else {
          setSuccess(true);
          setTimeout(() => {
            router.push("/products");
            router.refresh();
          }, 1200);
        }
      } else {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "เกิดข้อผิดพลาด");
        }

        const data = await res.json();

        if (isEdit && removedImageIds.length > 0) {
          const delRes = await fetch(`/api/products/${productId}/images`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageIds: removedImageIds }),
          });

          if (!delRes.ok) {
            const d = await delRes.json().catch(() => ({}));
            throw new Error(d.error || "ลบรูปภาพล้มเหลว");
          }
        }

        if (formData.images && formData.images.length > 0) {
          try {
            const filesToUpload = (formData.images as any[]).filter(
              (i) => i instanceof File
            ) as File[];
            if (filesToUpload.length > 0) {
              setUploadProgress(0);
              await uploadImages(
                data.product.id,
                filesToUpload,
                formData.coverIndex ?? undefined
              );
              setUploadProgress(null);
            }
          } catch (err) {
            console.error(err);
            setError("อัพโหลดรูปภาพล้มเหลว");
            setUploadProgress(null);
            setLoading(false);
            return;
          }
        }

        setRemovedImageIds([]);
        setSuccess(true);

        setTimeout(() => {
          router.push("/products");
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleRandomFill = async () => {
    const payload = generateRandomProduct();
    setFormData((prev) => ({
      ...prev,
      productCode: payload.productCode ?? prev.productCode,
      name: payload.name ?? prev.name,
      commonName: payload.commonName ?? prev.commonName,
      unit: payload.unit ?? prev.unit,
      productGroup: payload.productGroup ?? prev.productGroup,
      brand: payload.brand ?? prev.brand,
      packageSize: payload.packageSize ?? prev.packageSize,
      packageSizePerBox: payload.packageSizePerBox ?? prev.packageSizePerBox,
      status: payload.status ?? prev.status,
      usedForPlants: payload.usedForPlants ?? prev.usedForPlants,
      salesPoint: payload.salesPoint ?? prev.salesPoint,
      properties: payload.properties ?? prev.properties,
    }));
  };

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      if (!prev[field]) return prev;
      const newErr = { ...prev };
      delete newErr[field];
      return newErr;
    });
  };

  const uploadImages = (
    productId: string,
    files: File[],
    coverIndex?: number
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));
      if (typeof coverIndex === "number")
        form.append("coverIndex", String(coverIndex));

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/products/${productId}/images`);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Dialog open={true}>
          <DialogContent>
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <DialogTitle>บันทึกข้อมูลสำเร็จ</DialogTitle>
              <DialogDescription>กำลังนำทางกลับไปหน้ารายการสินค้า...</DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลสินค้า
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
        <FormInput
          label="รหัสสินค้า"
          value={formData.productCode}
          onChange={(e) => updateField("productCode", e.target.value)}
          required
          error={errors.productCode}
        />

        <FormInput
          label="ชื่อการค้า"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
          error={errors.name}
        />

        <FormInput
          label="ชื่อสามัญ"
          value={formData.commonName}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              commonName: e.target.value,
            }))
          }
          disabled={loading}
        />

        <FormSelect
          label="หน่วยนับ"
          value={formData.unit}
          onChange={(v) =>
            setFormData((prev) => ({
              ...prev,
              unit: v,
            }))
          }
          options={UNIT_OPTIONS}
          placeholder="เลือกหน่วยนับ"
          groupLabel="หน่วยนับ"
          disabled={loading}
        />

        <FormSelect
          label="กลุ่มสินค้า"
          value={formData.productGroup}
          onChange={(v) =>
            setFormData((prev) => ({
              ...prev,
              productGroup: v,
            }))
          }
          options={PRODUCT_GROUP_OPTIONS}
          placeholder="เลือกกลุ่มสินค้า"
          groupLabel="กลุ่มสินค้า"
          disabled={loading}
        />

        <FormSelect
          label="แบรนด์สินค้า"
          value={formData.brand}
          onChange={(v) =>
            setFormData((prev) => ({
              ...prev,
              brand: v,
            }))
          }
          options={BRAND_OPTIONS}
          placeholder="เลือกแบรนด์"
          groupLabel="แบรนด์"
          disabled={loading}
        />

        <FormInput
          label="ขนาดบรรจุ"
          value={formData.packageSize}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              packageSize: e.target.value,
            }))
          }
          disabled={loading}
        />

        <FormInput
          label="ขนาดบรรจุต่อลัง"
          type="number"
          value={formData.packageSizePerBox}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              packageSizePerBox: e.target.value,
            }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          disabled={loading}
        />

        <div className="space-y-2">
          <label className="text-base font-medium mx-2">ใช้กับพืช</label>
          <MultiSelect
            options={PLANT_OPTIONS}
            onValueChange={(values: string[]) =>
              setFormData((prev) => ({
                ...prev,
                usedForPlants: values,
              }))
            }
            defaultValue={formData.usedForPlants}
            placeholder="เลือกพืช"
            disabled={loading}
            searchable={true}
            hideSelectAll={false}
          />
        </div>

        <FormSelect
          label="สถานะสินค้า"
          value={formData.status}
          onChange={(v) =>
            setFormData((prev) => ({
              ...prev,
              status: v as "ACTIVE" | "INACTIVE",
            }))
          }
          options={STATUS_OPTIONS}
          placeholder="เลือกสถานะ"
          groupLabel="สถานะ"
          disabled={loading}
        />

        <FormTextarea
          label="จุดขายสินค้า"
          value={formData.salesPoint}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              salesPoint: e.target.value,
            }))
          }
          disabled={loading}
          rows={3}
          containerClassName="md:col-span-2"
        />

        <FormTextarea
          label="คุณสมบัติ"
          value={formData.properties}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              properties: e.target.value,
            }))
          }
          disabled={loading}
          rows={3}
          containerClassName="md:col-span-2"
        />

        <div className="md:col-span-2">
          <ImageUpload
            label="อัพโหลดรูปภาพสินค้า"
            value={formData.images || []}
            onChange={(files) =>
              setFormData((prev) => ({
                ...prev,
                images: files,
                coverIndex:
                  prev.coverIndex !== undefined && prev.coverIndex !== null
                    ? prev.coverIndex
                    : files.length > 0
                      ? 0
                      : null,
              }))
            }
            maxFiles={5}
            maxSizeMB={2}
            disabled={loading}
            onSetCover={(index) =>
              setFormData((prev) => ({
                ...prev,
                coverIndex: index,
              }))
            }
          />
        </div>
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

      <div className="md:col-span-2 pt-6 border-t my-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {showRandomFill && (
            <Button
              size="lg"
              className="w-44 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
              type="button"
              onClick={handleRandomFill}
              disabled={loading}
            >
              กรอกข้อมูลแบบสุ่ม
            </Button>
          )}
          <Button
            size="lg"
            className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
            type="button"
            onClick={onCancel ?? (() => router.back())}
            disabled={!canEdit}
            title={!canEdit ? permissionHint : undefined}
          >
            ยกเลิก
          </Button>

          <Button
            size="lg"
            className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
            type="submit"
            disabled={!canEdit || loading}
            title={!canEdit ? permissionHint : undefined}
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default ProductForm;
