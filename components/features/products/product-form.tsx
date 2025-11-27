"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FloatingLabelInput } from "@/components/custom/FloatingLabelInputFixed";
import { MultiSelect } from "@/components/custom/multi-select";
import { Textarea } from "@/components/custom/Textarea";
import { FileUpload } from "@/components/custom/file-upload";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UNIT_OPTIONS,
  PRODUCT_GROUP_OPTIONS,
  BRAND_OPTIONS,
  STATUS_OPTIONS,
  PLANT_OPTIONS,
  type ProductFormData,
} from "@/types/product";

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  productId?: string;
  isEdit?: boolean;
  onSubmit?: (
    payload: any
  ) => Promise<{
    success: boolean;
    issues?: Record<string, string[]>;
    error?: string;
  }>;
  onCancel?: () => void;
  hideBorder?: boolean;
  canEdit?: boolean;
  permissionHint?: string;
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
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.productCode.trim()) {
      newErrors.productCode = "กรุณากรอกรหัสสินค้า";
    }

    if (!formData.name.trim()) {
      newErrors.name = "กรุณากรอกชื่อสินค้า";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (!canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // For now, we'll handle images separately through an upload API
      // In production, you'd upload images first and get URLs
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
      };

      const url = isEdit ? `/api/products/${productId}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      if (onSubmit) {
        const result = await onSubmit(payload);
        if (!result.success) {
          setError(result.error ?? Object.values(result.issues ?? {})[0]?.[0] ?? "Server error");
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
        setSuccess(true);

        // TODO: Handle image upload here if images were selected
        // await uploadImages(data.product.id, formData.images);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>
            บันทึกข้อมูลสำเร็จ กำลังนำทางกลับไปหน้ารายการสินค้า...
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">ข้อมูลสินค้า</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FloatingLabelInput
            label="รหัสสินค้า *"
            type="text"
            value={formData.productCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({
                ...prev,
                productCode: e.target.value,
              }))
            }
            error={errors.productCode}
            disabled={loading}
          />

          <FloatingLabelInput
            label="ชื่อสินค้า *"
            type="text"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            error={errors.name}
            disabled={loading}
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
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
            type="text"
            value={formData.packageSizePerBox}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({
                ...prev,
                packageSizePerBox: e.target.value,
              }))
            }
            disabled={loading}
          />

          <FloatingLabelInput
            label="สถานะสินค้า"
            type="select"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
              setFormData((prev) => ({
                ...prev,
                status: e.target.value as "ACTIVE" | "INACTIVE",
              }))
            }
            disabled={loading}
          />

          <div className="md:col-span-2">
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
          </div>

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
                }))
              }
              accept="image/jpeg,image/png"
              maxFiles={5}
              maxSizeMB={2}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className={`md:col-span-2 mt-8 ${hideBorder ? "my-2" : "border-t my-2"}`}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
