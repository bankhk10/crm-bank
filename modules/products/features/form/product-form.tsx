"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import GalleryUpload from "@/components/custom/gallery-upload";

import RandomFillButton from "@/components/custom/random-fill-button";
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
import { STATUS_OPTIONS, type ProductFormData } from "@/types/product";
import { useRandomFill } from "@/hooks/use-random-fill";
import type { FileWithPreview, FileMetadata } from "@/hooks/use-file-upload";

import { ProductFormProps } from "../../types";

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
    productGroup: initialData?.productGroup || "",
    brand: initialData?.brand || "",
    chemicalGroup: initialData?.chemicalGroup || "",
    packageSize: initialData?.packageSize || "",
    packageSizePerBox: initialData?.packageSizePerBox || "",
    status: initialData?.status || "ACTIVE",
    usedForPlants: initialData?.usedForPlants || [],
    salesPoint: initialData?.salesPoint || "",
    properties: initialData?.properties || "",
    coverIndex: (initialData as any)?.coverIndex ?? null,
    categoryId: (initialData as any)?.categoryId || "",
    productChainId: (initialData as any)?.productChainId || "",
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
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

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
  const [productChainOptions, setProductChainOptions] = useState<SelectOption[]>([]);

  // Fetch dynamic options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch units
        const unitsRes = await fetch("/api/products/units?perPage=100");
        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          if (unitsData.units && unitsData.units.length > 0) {
            const options = unitsData.units.map(
              (u: { code: string; description: string }) => ({
                value: u.description,
                label: u.description,
              }),
            );
            // Deduplicate to prevent key errors
            const uniqueOptions = options.filter(
              (opt: any, index: number, self: any[]) =>
                index === self.findIndex((t) => t.value === opt.value),
            );
            setUnitOptions(uniqueOptions);
          }
        }

        // Fetch product groups
        const groupsRes = await fetch("/api/products/groups?perPage=100");
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          if (groupsData.groups && groupsData.groups.length > 0) {
            setGroupOptions(
              groupsData.groups.map(
                (g: { code: string; description: string }) => ({
                  value: g.code,
                  label: g.description,
                }),
              ),
            );
          }
        }

        // Fetch brands
        const brandsRes = await fetch("/api/products/brands?perPage=100");
        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          if (brandsData.brands && brandsData.brands.length > 0) {
            const options = brandsData.brands.map(
              (b: { code: string; description: string }) => ({
                value: b.description,
                label: b.description,
              }),
            );
            // Deduplicate
            const uniqueOptions = options.filter(
              (opt: any, index: number, self: any[]) =>
                index === self.findIndex((t) => t.value === opt.value),
            );
            setBrandOptions(uniqueOptions);
          }
        }

        // Fetch chemical groups
        const chemicalGroupsRes = await fetch(
          "/api/products/chemical-groups?perPage=100",
        );
        if (chemicalGroupsRes.ok) {
          const chemicalGroupsData = await chemicalGroupsRes.json();
          if (
            chemicalGroupsData.groups &&
            chemicalGroupsData.groups.length > 0
          ) {
            setChemicalGroupOptions(
              chemicalGroupsData.groups.map(
                (g: { code: string; name: string }) => ({
                  value: g.code,
                  label: g.code + " - " + g.name,
                }),
              ),
            );
          }
        }

        // Fetch plants
        const plantsRes = await fetch("/api/products/plants?perPage=100");
        if (plantsRes.ok) {
          const plantsData = await plantsRes.json();
          if (plantsData.plants && plantsData.plants.length > 0) {
            const options = plantsData.plants.map(
              (p: { code: string; name: string }) => ({
                value: p.name,
                label: p.name,
              }),
            );
            // Deduplicate
            const uniqueOptions = options.filter(
              (opt: any, index: number, self: any[]) =>
                index === self.findIndex((t) => t.value === opt.value),
            );
            setPlantOptions(uniqueOptions);
          }
        }

        // Fetch categories (หมวดสินค้า)
        const categoriesRes = await fetch("/api/products/categories?perPage=100");
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          if (categoriesData.categories && categoriesData.categories.length > 0) {
            setCategoryOptions(
              categoriesData.categories.map(
                (c: { id: string; code: string; description: string }) => ({
                  value: c.id,
                  label: c.code + " - " + c.description,
                }),
              ),
            );
          }
        }

        // Fetch product chains (กรุ๊ปสินค้า)
        const chainsRes = await fetch("/api/products/chains?perPage=100");
        if (chainsRes.ok) {
          const chainsData = await chainsRes.json();
          if (chainsData.chains && chainsData.chains.length > 0) {
            setProductChainOptions(
              chainsData.chains.map(
                (c: { id: string; name: string }) => ({
                  value: c.id,
                  label: c.name,
                }),
              ),
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch options:", err);
      }
    };

    fetchOptions();
  }, []);

  // Calculate total package size per box when packageSize or packageSizePerBox changes
  useEffect(() => {
    const packageSizeMatch = (formData.packageSize || "").match(/^([\d.]+)/);
    const packageSizeValue = packageSizeMatch
      ? parseFloat(packageSizeMatch[1])
      : 0;
    const packageSizePerBox = parseFloat(formData.packageSizePerBox || "0");
    const packageSizeUnit =
      (formData.packageSize || "").match(/[a-zA-Z]+$/)?.[0] || "g";

    if (packageSizeValue && packageSizePerBox) {
      const total = packageSizeValue * packageSizePerBox;
      const totalValue = `${total} ${packageSizeUnit}`;

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
  }, [formData.packageSize, formData.packageSizePerBox]);

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

    if (!formData.productGroup) {
      newErrors.productGroup = "กรุณาเลือกกลุ่มสินค้า";
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
        productCode: formData.productCode,
        name: formData.name,
        commonName: formData.commonName || undefined,
        unit: formData.unit || undefined,
        productGroup: formData.productGroup || undefined,
        brand: formData.brand || undefined,
        chemicalGroup: formData.chemicalGroup || undefined,
        packageSize: formData.packageSize || undefined,
        packageSizePerBox: formData.packageSizePerBox || undefined,
        totalPackageSizePerBox: formData.totalPackageSizePerBox || undefined,
        status: formData.status,
        usedForPlants: formData.usedForPlants,
        salesPoint: formData.salesPoint || undefined,
        properties: formData.properties || undefined,
        coverIndex: formData.coverIndex ?? undefined,
        categoryId: (formData as any).categoryId || undefined,
        productChainId: (formData as any).productChainId || undefined,
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


          toast.success("บันทึกข้อมูลสำเร็จ");
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

        setRemovedImageIds([]);
        toast.success("บันทึกข้อมูลสำเร็จ");

        setTimeout(() => {
          router.push("/products");
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

  // Random fill - ใช้ dynamic import เพื่อ tree-shake ใน production
  const randomFillGenerator = useCallback(async () => {
    const { generateRandomProduct } = await import("@/lib/random-fill/product");
    return generateRandomProduct();
  }, []);

  const handleRandomFillGenerated = useCallback(
    (payload: Partial<ProductFormData>) => {
      setFormData((prev) => ({
        ...prev,
        productCode:
          (payload.productCode as string | undefined) ?? prev.productCode,
        name: (payload.name as string | undefined) ?? prev.name,
        commonName:
          (payload.commonName as string | undefined) ?? prev.commonName,
        unit: (payload.unit as string | undefined) ?? prev.unit,
        productGroup:
          (payload.productGroup as string | undefined) ?? prev.productGroup,
        brand: (payload.brand as string | undefined) ?? prev.brand,
        chemicalGroup:
          (payload.chemicalGroup as string | undefined) ?? prev.chemicalGroup,
        packageSize:
          (payload.packageSize as string | undefined) ?? prev.packageSize,
        packageSizePerBox:
          (payload.packageSizePerBox as string | undefined) ??
          prev.packageSizePerBox,
        status:
          (payload.status as "ACTIVE" | "INACTIVE" | undefined) ?? prev.status,
        usedForPlants:
          (payload.usedForPlants as string[] | undefined) ?? prev.usedForPlants,
        salesPoint:
          (payload.salesPoint as string | undefined) ?? prev.salesPoint,
        properties:
          (payload.properties as string | undefined) ?? prev.properties,
      }));
    },
    [],
  );

  const {
    isEnabled: isRandomFillEnabled,
    isGenerating: isRandomFillGenerating,
    triggerRandomFill,
  } = useRandomFill({
    generator: randomFillGenerator,
    onGenerated: handleRandomFillGenerated,
  });

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

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
          value={formData.chemicalGroup || ""}
          onChange={(v) => updateField("chemicalGroup", v)}
          options={chemicalGroupOptions}
          placeholder="เลือกกลุ่มสินค้า"
          searchPlaceholder="ค้นหากลุ่มสินค้า..."
          emptyText="ไม่พบกลุ่มสินค้า"
          disabled={loading}
        />

        <FormCombobox
          label="กลุ่มชื่อการค้า"
          value={formData.productGroup || ""}
          onChange={(v) => updateField("productGroup", v)}
          required
          options={groupOptions}
          placeholder="เลือกกลุ่มชื่อการค้า"
          searchPlaceholder="ค้นหากลุ่มชื่อการค้า..."
          emptyText="ไม่พบกลุ่มชื่อการค้า"
          disabled={loading}
          error={errors.productGroup}
        />

        <FormCombobox
          label="หมวดสินค้า"
          value={(formData as any).categoryId || ""}
          onChange={(v) => updateField("categoryId" as keyof ProductFormData, v)}
          options={categoryOptions}
          placeholder="เลือกหมวดสินค้า"
          searchPlaceholder="ค้นหาหมวดสินค้า..."
          emptyText="ไม่พบหมวดสินค้า"
          disabled={loading}
        />

        <FormCombobox
          label="กรุ๊ปสินค้า"
          value={(formData as any).productChainId || ""}
          onChange={(v) => updateField("productChainId" as keyof ProductFormData, v)}
          options={productChainOptions}
          placeholder="เลือกกรุ๊ปสินค้า"
          searchPlaceholder="ค้นหากรุ๊ปสินค้า..."
          emptyText="ไม่พบกรุ๊ปสินค้า"
          disabled={loading}
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
          <Label className="text-base font-medium mx-2">ขนาดบรรจุ</Label>
          <div className="flex gap-2">
            <Input
              value={(() => {
                const match = (formData.packageSize || "").match(/^([\d.]+)/);
                return match ? match[1] : formData.packageSize || "";
              })()}
              onChange={(e) => {
                const newValue = e.target.value;
                const currentUnit =
                  (formData.packageSize || "").match(/[a-zA-Z]+$/)?.[0] ||
                  (PACKAGE_UNIT_OPTIONS.find((opt) =>
                    (formData.packageSize || "").endsWith(opt.value),
                  )?.value ??
                    "g");
                updateField(
                  "packageSize",
                  newValue ? `${newValue} ${currentUnit}` : "",
                );
              }}
              placeholder="ระบุขนาด"
              className="flex-1"
              disabled={loading}
              type="number"
            />
            <Select
              value={(() => {
                // Try to find a matching unit from the end of the string
                const str = formData.packageSize || "";
                // Sort options by length desc to prioritize longer matches (e.g. kg over g)
                const sortedOptions = [...PACKAGE_UNIT_OPTIONS].sort(
                  (a, b) => b.value.length - a.value.length,
                );

                for (const opt of sortedOptions) {
                  if (
                    str.endsWith(opt.value) ||
                    str.endsWith(" " + opt.value)
                  ) {
                    return opt.value;
                  }
                }
                const match = str.match(/[a-zA-Z]+$/);
                return match ? match[0] : "g";
              })()}
              onValueChange={(newUnit) => {
                const match = (formData.packageSize || "").match(/^([\d.]+)/);
                const currentValue = match
                  ? match[1]
                  : formData.packageSize || "";
                if (currentValue) {
                  updateField("packageSize", `${currentValue} ${newUnit}`);
                }
              }}
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
        </div>

        <FormInput
          label="จำนวนบรรจุต่อลัง (ชิ้น)"
          type="number"
          value={formData.packageSizePerBox || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              packageSizePerBox: e.target.value,
            }))
          }
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          disabled={loading}
        />

        <FormInput
          label="ขนาดบรรจุรวมต่อลัง"
          type="text"
          value={formData.totalPackageSizePerBox || ""}
          onChange={() => { }}
          disabled={true}
          placeholder="คำนวณอัตโนมัติ"
          className="bg-gray-50"
        />

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
            maxSize={5 * 1024 * 1024}
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

export default ProductForm;
