"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FloatingLabelInput } from "@/components/custom/FloatingLabelInputFixed";
import { MultiSelect } from "@/components/custom/multi-select";
import { Textarea } from "@/components/custom/Textarea";
import { FileUpload } from "@/components/custom/file-upload";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
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

  // track existing image ids that were present when the form mounted
  const originalExistingIdsRef = useRef<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  useEffect(() => {
    const ids = (initialData?.images || [])
      .filter((i: any) => typeof (i as any).id === "string")
      .map((i: any) => (i as any).id as string);
    originalExistingIdsRef.current = ids;
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  // sampleImageUrls removed: random fill will NOT upload or set images

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

        // If editing and there are removed existing images, delete them first
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

        // If there are new File objects to upload, do that now with progress
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

        // clear removed ids after successful deletion
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

  // Fill form fields with generated random product data. Intentionally
  // do NOT generate/upload images — user will choose images manually.
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

  // 📌 อัปเดตฟิลด์ และเคลียร์ error อัตโนมัติ
  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // เคลียร์ error เมื่อเริ่มพิมพ์
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <FloatingLabelInput
          label="รหัสสินค้า *"
          type="text"
          value={formData.productCode}
          onChange={(e) => updateField("productCode", e.target.value)}
          error={errors.productCode}
        />

        <FloatingLabelInput
          label="ชื่อการค้า *"
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          error={errors.name}
        />

        <FloatingLabelInput
          label="ชื่อสามัญ"
          type="text"
          value={formData.commonName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              commonName: e.target.value,
            }))
          }
          disabled={loading}
        />

        <FloatingLabelInput
          label="หน่วยนับ"
          type="select"
          options={UNIT_OPTIONS}
          value={formData.unit}
          onChange={(
            e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
          ) =>
            setFormData((prev) => ({
              ...prev,
              unit: e.target.value,
            }))
          }
          disabled={loading}
          searchable
        />

        <FloatingLabelInput
          label="กลุ่มสินค้า"
          type="select"
          options={PRODUCT_GROUP_OPTIONS}
          value={formData.productGroup}
          onChange={(
            e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
          ) =>
            setFormData((prev) => ({
              ...prev,
              productGroup: e.target.value,
            }))
          }
          disabled={loading}
          searchable
        />

        <FloatingLabelInput
          label="แบรนด์สินค้า"
          type="select"
          options={BRAND_OPTIONS}
          value={formData.brand}
          onChange={(
            e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
          ) =>
            setFormData((prev) => ({
              ...prev,
              brand: e.target.value,
            }))
          }
          disabled={loading}
          searchable
        />

        <FloatingLabelInput
          label="ขนาดบรรจุ"
          type="text"
          value={formData.packageSize}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              packageSize: e.target.value,
            }))
          }
          disabled={loading}
        />

        <FloatingLabelInput
          label="ขนาดบรรจุต่อลัง"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={0}
          step={1}
          value={formData.packageSizePerBox}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              // store numeric input as string to match ProductFormData
              packageSizePerBox: e.target.value,
            }))
          }
          disabled={loading}
        />

        <MultiSelect
          label="ใช้กับพืช"
          options={PLANT_OPTIONS}
          value={formData.usedForPlants}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              usedForPlants: value as string[],
            }))
          }
          disabled={loading}
        />

        <FloatingLabelInput
          label="สถานะสินค้า"
          type="select"
          options={STATUS_OPTIONS}
          value={formData.status}
          onChange={(
            e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
          ) =>
            setFormData((prev) => ({
              ...prev,
              status: e.target.value as "ACTIVE" | "INACTIVE",
            }))
          }
          disabled={loading}
        />

        <div className="md:col-span-2">
          <Textarea
            label="จุดขายสินค้า"
            value={formData.salesPoint}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev) => ({
                ...prev,
                salesPoint: e.target.value,
              }))
            }
            disabled={loading}
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="คุณสมบัติ"
            value={formData.properties}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev) => ({
                ...prev,
                properties: e.target.value,
              }))
            }
            disabled={loading}
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <FileUpload
            label="อัพโหลดรูปภาพสินค้า"
            value={formData.images || []}
            onChange={(files) =>
              setFormData((prev) => ({
                ...prev,
                images: files,
                // if cover not set, default to first image
                coverIndex:
                  prev.coverIndex !== undefined && prev.coverIndex !== null
                    ? prev.coverIndex
                    : files.length > 0
                    ? 0
                    : null,
              }))
            }
            accept="image/jpeg,image/png"
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

          {/* random-fill no longer uploads or shows sample images */}
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

      <div
        className={`md:col-span-2 mt-8 ${
          hideBorder ? "my-2" : "border-t my-2"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
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
      {showRandomFill && (
        <div className="flex items-center justify-end gap-2 mb-2">
          <Button
            type="button"
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            onClick={handleRandomFill}
            disabled={loading}
          >
            กรอกแบบสุ่ม
          </Button>
        </div>
      )}
    </form>
  );
}

export default ProductForm;
