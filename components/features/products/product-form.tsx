"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const labelTextClass = "mx-2 mt-2 text-sm font-bold text-gray-900";
const inputTextClass = "mt-1 h-11 text-base placeholder:text-gray-500";

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
  const [plantSearchQuery, setPlantSearchQuery] = useState("");
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

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลสินค้า
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
        <div>
          <Label className={labelTextClass}>รหัสสินค้า *</Label>
          <Input
            value={formData.productCode}
            onChange={(e) => updateField("productCode", e.target.value)}
            required
            className={inputTextClass}
          />
          {errors.productCode && (
            <p className="text-xs text-red-600 mt-1">{errors.productCode}</p>
          )}
        </div>

        <div>
          <Label className={labelTextClass}>ชื่อการค้า *</Label>
          <Input
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
            className={inputTextClass}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label className={labelTextClass}>ชื่อสามัญ</Label>
          <Input
            value={formData.commonName}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                commonName: e.target.value,
              }))
            }
            disabled={loading}
            className={inputTextClass}
          />
        </div>

        <div>
          <Label className={labelTextClass}>หน่วยนับ</Label>
          <Select
            value={formData.unit}
            onValueChange={(v) =>
              setFormData((prev) => ({
                ...prev,
                unit: v,
              }))
            }
            disabled={loading}
          >
            <SelectTrigger className={inputTextClass}>
              <SelectValue placeholder="เลือกหน่วยนับ" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>หน่วยนับ</SelectLabel>
                {UNIT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={labelTextClass}>กลุ่มสินค้า</Label>
          <Select
            value={formData.productGroup}
            onValueChange={(v) =>
              setFormData((prev) => ({
                ...prev,
                productGroup: v,
              }))
            }
            disabled={loading}
          >
            <SelectTrigger className={inputTextClass}>
              <SelectValue placeholder="เลือกกลุ่มสินค้า" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>กลุ่มสินค้า</SelectLabel>
                {PRODUCT_GROUP_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={labelTextClass}>แบรนด์สินค้า</Label>
          <Select
            value={formData.brand}
            onValueChange={(v) =>
              setFormData((prev) => ({
                ...prev,
                brand: v,
              }))
            }
            disabled={loading}
          >
            <SelectTrigger className={inputTextClass}>
              <SelectValue placeholder="เลือกแบรนด์" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>แบรนด์</SelectLabel>
                {BRAND_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={labelTextClass}>ขนาดบรรจุ</Label>
          <Input
            value={formData.packageSize}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                packageSize: e.target.value,
              }))
            }
            disabled={loading}
            className={inputTextClass}
          />
        </div>

        <div>
          <Label className={labelTextClass}>ขนาดบรรจุต่อลัง</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={formData.packageSizePerBox}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                packageSizePerBox: e.target.value,
              }))
            }
            disabled={loading}
            className={inputTextClass}
          />
        </div>


        <div>
          <Label className={labelTextClass}>ใช้กับพืช</Label>

          <Select
            value={formData.usedForPlants.length > 0 ? "selected" : ""}
            disabled={loading}
          >
            <SelectTrigger className={`${inputTextClass} !h-auto min-h-[44px] py-2 items-start`}>
              <div className="flex flex-wrap gap-1.5 w-full items-center">
                {formData.usedForPlants.length > 0 ? (
                  formData.usedForPlants.map((plantValue) => {
                    const plant = PLANT_OPTIONS.find((p) => p.value === plantValue);
                    return (
                      <div
                        key={plantValue}
                        className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-sm font-medium shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <span>{plant ? plant.label : plantValue}</span>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!loading) {
                              setFormData((prev) => ({
                                ...prev,
                                usedForPlants: prev.usedForPlants.filter((v) => v !== plantValue),
                              }));
                            }
                          }}
                          className="hover:bg-green-200 rounded-full p-0.5 transition-colors cursor-pointer"
                        >
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-gray-500">คลิกเพื่อเลือกพืช</span>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <div className="sticky top-0 bg-white z-10 pb-2">
                  <SelectLabel>พืช (เลือกได้หลายรายการ)</SelectLabel>

                  {/* Search input */}
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="ค้นหาพืช..."
                      value={plantSearchQuery}
                      onChange={(e) => setPlantSearchQuery(e.target.value)}
                      className="h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Clear all button */}
                  {formData.usedForPlants.length > 0 && (
                    <div className="px-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFormData((prev) => ({
                            ...prev,
                            usedForPlants: [],
                          }));
                        }}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline"
                      >
                        ลบทั้งหมด ({formData.usedForPlants.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Filtered options */}
                <div className="max-h-60 overflow-y-auto">
                  {PLANT_OPTIONS.filter((opt) =>
                    opt.label.toLowerCase().includes(plantSearchQuery.toLowerCase())
                  ).map((opt) => {
                    const isSelected = formData.usedForPlants.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newValues = isSelected
                            ? formData.usedForPlants.filter((v) => v !== opt.value)
                            : [...formData.usedForPlants, opt.value];
                          setFormData((prev) => ({
                            ...prev,
                            usedForPlants: newValues,
                          }));
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => { }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                    );
                  })}

                  {/* No results message */}
                  {PLANT_OPTIONS.filter((opt) =>
                    opt.label.toLowerCase().includes(plantSearchQuery.toLowerCase())
                  ).length === 0 && (
                      <div className="px-2 py-4 text-center text-sm text-gray-500">
                        ไม่พบผลลัพธ์
                      </div>
                    )}
                </div>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={labelTextClass}>สถานะสินค้า</Label>
          <Select
            value={formData.status}
            onValueChange={(v) =>
              setFormData((prev) => ({
                ...prev,
                status: v as "ACTIVE" | "INACTIVE",
              }))
            }
            disabled={loading}
          >
            <SelectTrigger className={inputTextClass}>
              <SelectValue placeholder="เลือกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>สถานะ</SelectLabel>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label className={`${labelTextClass} mb-2`}>จุดขายสินค้า</Label>
          <textarea
            value={formData.salesPoint}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                salesPoint: e.target.value,
              }))
            }
            disabled={loading}
            rows={3}
            className="w-full border rounded-xl px-3 py-2 text-base text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div className="md:col-span-2">
          <Label className={`${labelTextClass} mb-2`}>คุณสมบัติ</Label>
          <textarea
            value={formData.properties}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                properties: e.target.value,
              }))
            }
            disabled={loading}
            rows={3}
            className="w-full border rounded-xl px-3 py-2 text-base text-gray-900 placeholder:text-gray-400"
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
