"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import GalleryUpload from "@/components/custom/gallery-upload";


import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormInput,
  FormSelect,
  FormCombobox,
  FormTextarea,
} from "@/components/custom/form-components";
import FormActions from "@/components/custom/form-actions";
import { MultiSelect } from "@/components/custom/multi-select";
import { STATUS_OPTIONS, type ProductFormData } from "@/modules/products/types";

import type { FileWithPreview, FileMetadata } from "@/hooks/use-file-upload";

import { ProductFormProps } from "../../types";
import { getProductFormOptionsAction } from "../../server/actions";

interface SelectOption {
  value: string;
  label: string;
}

const PACKAGE_UNIT_OPTIONS = [
  { value: "G", label: "G (กรัม)" },
  { value: "KG", label: "KG (กิโลกรัม)" },
  { value: "ML", label: "ML (มิลลิลิตร)" },
  { value: "L", label: "L (ลิตร)" },
];

export function ProductForm({
  initialData,
  productId,
  isEdit = false,
  onSubmit,
  onCancel,
  canEdit = true,
  successMessage,
  redirectPath,
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    productCode: initialData?.productCode || "",
    name: initialData?.name || "",
    commonName: initialData?.commonName || "",
    unit: initialData?.unit || "",
    tradeNameGroupId: initialData?.tradeNameGroupId || "",
    brand: initialData?.brand || "Crop Science",
    productGroupId: initialData?.productGroupId || "",
    packageSize: initialData?.packageSize || "",
    packageSizeUnit: initialData?.packageSizeUnit || "G",
    packageSizePerBox: initialData?.packageSizePerBox || "",
    status: initialData?.status || "ACTIVE",
    usedForPlants: initialData?.usedForPlants || [],
    salesPoint: initialData?.salesPoint || "",
    properties: initialData?.properties || "",
    coverIndex: (initialData as any)?.coverIndex ?? null,
    categoryId: initialData?.categoryId || "",
    productABCTypeId: initialData?.productABCTypeId || "",
    parentId: (initialData as any)?.parentId || "",
  });

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

  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const originalExistingIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const ids = (initialData?.images || [])
      .filter((i: any) => typeof (i as any).id === "string")
      .map((i: any) => (i as any).id as string);
    originalExistingIdsRef.current = ids;
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic options from database
  const [unitOptions, setUnitOptions] = useState<SelectOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<SelectOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);
  const [chemicalGroupOptions, setChemicalGroupOptions] = useState<
    SelectOption[]
  >([]);
  const [plantOptions, setPlantOptions] = useState<SelectOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [productABCTypeOptions, setProductABCTypeOptions] = useState<
    SelectOption[]
  >([]);
  const [parentOptions, setParentOptions] = useState<SelectOption[]>([]);

  // Fetch dynamic options from server action (single call replaces 7 API calls)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await getProductFormOptionsAction();
        if (!options) return;

        // Deduplicate helper
        const dedup = (arr: SelectOption[]) =>
          arr.filter(
            (opt, index, self) =>
              index === self.findIndex((t) => t.value === opt.value),
          );

        setUnitOptions(dedup(options.units));
        setGroupOptions(options.groups);
        setBrandOptions(dedup(options.brands));
        setChemicalGroupOptions(options.chemicalGroups);
        setPlantOptions(dedup(options.plants));
        setCategoryOptions(options.categories);
        setProductABCTypeOptions(options.abcTypes);
      } catch (err) {
        console.error("Failed to fetch options:", err);
      }
      try {
        const res = await fetch('/api/products?page=1&perPage=1000');
        const data = await res.json();
        if (data?.products) {
          const parentItems = data.products
            .filter((p: any) => p.id !== productId)
            .map((p: any) => ({ value: p.id, label: `${p.productCode} - ${p.name}` }));

          setParentOptions([
            { value: "none", label: "ไม่มี" },
            ...parentItems
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    fetchOptions();
  }, [productId]);

  // Calculate total package size per box when packageSize, packageSizeUnit, or packageSizePerBox changes
  useEffect(() => {
    const packageSizeValue = parseFloat(formData.packageSize?.toString() || "0");
    const packageSizePerBox = parseFloat(formData.packageSizePerBox?.toString() || "0");

    if (packageSizeValue && packageSizePerBox) {
      const total = packageSizeValue * packageSizePerBox;
      const totalValue = `${total}`;

      setFormData((prev) => ({
        ...prev,
        totalPackageSizePerBox: totalValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        totalPackageSizePerBox: "",
      }));
    }
  }, [formData.packageSize, formData.packageSizeUnit, formData.packageSizePerBox]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.productCode.trim()) {
      newErrors.productCode = "กรุณากรอกรหัสสินค้า";
    }

    if (!formData.name.trim()) {
      newErrors.name = "กรุณากรอกชื่อการค้า";
    }

    if (!formData.commonName?.trim()) {
      newErrors.commonName = "กรุณากรอกชื่อสามัญ";
    }

    if (!formData.unit) {
      newErrors.unit = "กรุณาเลือกหน่วยนับ";
    }

    if (!formData.tradeNameGroupId) {
      newErrors.tradeNameGroupId = "กรุณาเลือกกลุ่มชื่อการค้า";
    }

    if (!formData.productGroupId) {
      newErrors.productGroupId = "กรุณาเลือกกลุ่มสินค้า";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "กรุณาเลือกหมวดสินค้า";
    }

    if (!formData.productABCTypeId) {
      newErrors.productABCTypeId = "กรุณาเลือกประเภท (ABC Code)";
    }

    if (!formData.packageSize) {
      newErrors.packageSize = "กรุณากรอกขนาดบรรจุ";
    }

    if (!formData.packageSizePerBox) {
      newErrors.packageSizePerBox = "กรุณากรอกจำนวนบรรจุต่อลัง";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validateForm()) return;

    if (!canEdit) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        productCode: formData.productCode.trim().replace(/\s/g, ""),
        name: formData.name.trim(),
        commonName: formData.commonName?.trim() || undefined,
        unit: formData.unit || undefined,
        tradeNameGroupId: formData.tradeNameGroupId || undefined,
        brand: formData.brand || undefined,
        productGroupId: formData.productGroupId || undefined,
        packageSize: formData.packageSize || undefined,
        packageSizeUnit: formData.packageSizeUnit || "G",
        packageSizePerBox: formData.packageSizePerBox || undefined,
        totalPackageSizePerBox: formData.totalPackageSizePerBox || undefined,
        status: formData.status,
        usedForPlants: formData.usedForPlants,
        salesPoint: formData.salesPoint || undefined,
        properties: formData.properties || undefined,
        coverIndex: formData.coverIndex ?? undefined,
        categoryId: (formData as any).categoryId || undefined,
        productABCTypeId: (formData as any).productABCTypeId || undefined,
        parentId: (formData as any).parentId === "none" ? null : ((formData as any).parentId || undefined),
      };

      const url = isEdit ? `/api/products/${productId}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      if (onSubmit) {
        const result = await onSubmit(payload);
        if (!result.success) {
          setError(
            result.error ??
            Object.values(result.issues ?? {})[0]?.[0] ??
            "Server error",
          );
          setLoading(false);
          setUploadProgress(null);
        } else {
          // Handle images (delete removed, upload new, reorder)
          const targetProductId = result.data?.product?.id || productId;

          if (targetProductId) {
            try {
              // 1. Identify removed images
              const initialImages = (initialData?.images || []) as any[];
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
                await deleteImages(targetProductId, removedImageIds);
              }

              // 3. Upload new images and collect all IDs in order
              let uploadedImages: any[] = [];
              const filesToUpload = uploadedFiles
                .filter((item) => item.file instanceof File)
                .map((item) => item.file as File);

              if (filesToUpload.length > 0) {
                setUploadProgress(0);
                const uploadRes = await uploadImages(
                  targetProductId,
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
                await reorderImages(targetProductId, finalOrderedIds);
              }
            } catch (err) {
              console.error("Image operation failed", err);
              // We don't block success navigation if image op fails, but we log it
            }
          }



          toast.success(successMessage || (isEdit ? "บันทึกการแก้ไขเรียบร้อยแล้ว" : "สร้างสินค้าใหม่เรียบร้อยแล้ว"));
          setTimeout(() => {
            router.push(redirectPath || "/products");
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
        const targetProductId = data.product.id;

        // Handle images (delete removed, upload new, reorder)
        if (targetProductId) {
          try {
            // 1. Identify removed images
            const initialImages = (initialData?.images || []) as any[];
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
              await deleteImages(targetProductId, removedImageIds);
            }

            // 3. Upload new images and collect all IDs in order
            let uploadedImages: any[] = [];
            const filesToUpload = uploadedFiles
              .filter((item) => item.file instanceof File)
              .map((item) => item.file as File);

            if (filesToUpload.length > 0) {
              setUploadProgress(0);
              const uploadRes = await uploadImages(
                targetProductId,
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
              await reorderImages(targetProductId, finalOrderedIds);
            }
          } catch (err) {
            console.error("Image operation failed", err);
            setError("อัพโหลดรูปภาพล้มเหลว");
            setUploadProgress(null);
            setLoading(false);
            return;
          }
        }


        toast.success(successMessage || (isEdit ? "บันทึกการแก้ไขเรียบร้อยแล้ว" : "สร้างสินค้าใหม่เรียบร้อยแล้ว"));

        setTimeout(() => {
          router.push(redirectPath || "/products");
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setLoading(false);
      setUploadProgress(null);
    }
  };



  const updateField = (field: keyof ProductFormData, value: any) => {
    let cleanValue = value;
    if (field === "productCode" && typeof value === "string") {
      cleanValue = value.replace(/\s/g, "");
    }

    setFormData((prev) => ({ ...prev, [field]: cleanValue }));

    setErrors((prev) => {
      if (!prev[field]) return prev;
      const newErr = { ...prev };
      delete newErr[field];
      return newErr;
    });
  };

  const uploadImages = (productId: string, files: File[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));

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
    productId: string,
    imageIds: string[],
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      fetch(`/api/products/${productId}/images`, {
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
    productId: string,
    imageIds: string[],
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      fetch(`/api/products/${productId}/images`, {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
          disabled={loading}
          error={errors.productCode}
        />

        <FormInput
          label="ชื่อการค้า"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
          disabled={loading}
          error={errors.name}
        />

        <FormInput
          label="ชื่อสามัญ"
          value={formData.commonName || ""}
          onChange={(e) => updateField("commonName", e.target.value)}
          required
          disabled={loading}
          error={errors.commonName}
        />

        <FormCombobox
          label="แบรนด์สินค้า"
          value={formData.brand || ""}
          onChange={(v) => updateField("brand", v)}
          options={brandOptions}
          placeholder="เลือกแบรนด์"
          searchPlaceholder="ค้นหาแบรนด์..."
          emptyText="ไม่พบแบรนด์"
          disabled={loading}
        />

        <FormCombobox
          label="กลุ่มสินค้า"
          value={formData.productGroupId || ""}
          onChange={(v) => updateField("productGroupId", v)}
          required
          options={chemicalGroupOptions}
          placeholder="เลือกกลุ่มสินค้า"
          searchPlaceholder="ค้นหากลุ่มสินค้า..."
          emptyText="ไม่พบกลุ่มสินค้า"
          disabled={loading}
          error={errors.productGroupId}
        />

        <FormCombobox
          label="กลุ่มชื่อการค้า"
          value={formData.tradeNameGroupId || ""}
          onChange={(v) => updateField("tradeNameGroupId", v)}
          required
          options={groupOptions}
          placeholder="เลือกกลุ่มชื่อการค้า"
          searchPlaceholder="ค้นหากลุ่มชื่อการค้า..."
          emptyText="ไม่พบกลุ่มชื่อการค้า"
          disabled={loading}
          error={errors.tradeNameGroupId}
        />

        <FormCombobox
          label="หมวดสินค้า"
          value={formData.categoryId || ""}
          onChange={(v) => updateField("categoryId", v)}
          required
          options={categoryOptions}
          placeholder="เลือกหมวดสินค้า"
          searchPlaceholder="ค้นหาหมวดสินค้า..."
          emptyText="ไม่พบหมวดสินค้า"
          disabled={loading}
          error={errors.categoryId}
        />

        <FormCombobox
          label="ประเภท (ABC Code)"
          value={formData.productABCTypeId || ""}
          onChange={(v) => updateField("productABCTypeId", v)}
          required
          options={productABCTypeOptions}
          placeholder="เลือกประเภท (ABC Code)"
          searchPlaceholder="ค้นหาประเภท (ABC Code)..."
          emptyText="ไม่พบประเภท (ABC Code)"
          disabled={loading}
          error={errors.productABCTypeId}
        />

        <FormCombobox
          label="หน่วยนับ"
          value={formData.unit || ""}
          onChange={(v) => updateField("unit", v)}
          required
          options={unitOptions}
          placeholder="เลือกหน่วยนับ"
          searchPlaceholder="ค้นหาหน่วยนับ..."
          emptyText="ไม่พบหน่วยนับ"
          disabled={loading}
          error={errors.unit}
        />

        <div className="space-y-2">
          <Label className={cn("text-base font-medium mx-2", errors.packageSize && "text-red-600")}>
            ขนาดบรรจุ
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              value={formData.packageSize || ""}
              onChange={(e) => updateField("packageSize", e.target.value)}
              placeholder="ระบุขนาด"
              className={cn("flex-1", errors.packageSize && "border-red-500")}
              disabled={loading}
              type="number"
            />
            <Select
              value={formData.packageSizeUnit || "G"}
              onValueChange={(newUnit) => setFormData(prev => ({ ...prev, packageSizeUnit: newUnit }))}
              disabled={loading}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="หน่วย" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGE_UNIT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.packageSize && <p className="text-xs text-red-600 mt-1">{errors.packageSize}</p>}
        </div>

        <FormInput
          label="จำนวนบรรจุต่อลัง (ชิ้น)"
          type="number"
          value={formData.packageSizePerBox || ""}
          onChange={(e) => updateField("packageSizePerBox", e.target.value)}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          required
          disabled={loading}
          error={errors.packageSizePerBox}
        />

        <div className="space-y-2">
          <Label className="text-base font-medium mx-2">ขนาดบรรจุรวมต่อลัง</Label>
          <div className="flex gap-2">
            <Input
              value={formData.totalPackageSizePerBox || ""}
              readOnly
              disabled
              placeholder="คำนวณอัตโนมัติ"
              className="bg-gray-50 flex-1"
            />
            <div className="w-[140px] flex items-center justify-center border rounded-md bg-gray-100 text-gray-500 text-sm font-medium">
              {PACKAGE_UNIT_OPTIONS.find(opt => opt.value === formData.packageSizeUnit)?.label || formData.packageSizeUnit}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium mx-2">ใช้กับพืช</label>
          <MultiSelect
            options={plantOptions}
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
          />
        </div>

        <FormCombobox
          label="สินค้าหลัก (ถ้ามี)"
          value={(formData as any).parentId || "none"}
          onChange={(v) => updateField("parentId" as keyof ProductFormData, v)}
          options={parentOptions}
          placeholder="เลือกสินค้าหลัก"
          searchPlaceholder="ค้นหาสินค้าหลัก..."
          emptyText="ไม่พบสินค้า"
          disabled={loading}
        />


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
          value={formData.salesPoint || ""}
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
          value={formData.properties || ""}
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

        <div className="md:col-span-2 mt-2 mx-2">
          <GalleryUpload
            maxFiles={5}
            accept="image/*"
            multiple={true}
            disabled={loading}
            initialFiles={convertToFileMetadata(initialData?.images || [])}
            onFilesChange={(files) => setUploadedFiles(files)}
            // Enforce 1080x1080 size
            targetSize={{ width: 1080, height: 1080 }}
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

      <FormActions
        loading={loading}
        onCancel={onCancel}
        submitLabel="บันทึก"
        className="pt-6 sm:pt-8 border-t mt-6 sm:mt-8"
      />


    </form>
  );
}

export default ProductForm;
