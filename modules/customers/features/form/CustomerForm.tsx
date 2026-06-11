"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileWithPreview, FileMetadata } from "@/hooks/use-file-upload";

import { CustomerFormProps, CustomerFormData } from "../../types";
import { customerSchema } from "../../application/validations";
import { mapFormDataToPayload } from "../../application/customer-mapper";
import { getCustomerDefaultValues } from "./config/default-values";

import { BasicInfoSection } from "./sections/BasicInfoSection";
import { ContactInfoSection } from "./sections/ContactInfoSection";
import { AddressSection } from "./sections/AddressSection";
import { SpecificSection } from "./sections/SpecificSection";
import { ImageGallerySection } from "./sections/ImageGallerySection";

export function CustomerForm({
  initial = {},
  customerType,
  onSubmit,
  onCancel,
  submitLabel = "บันทึก",
  onSuccess,
}: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  // Resolve active customer type
  const activeType = customerType || (initial as any).customerType || "DEALER";

  // Form setup
  const methods = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      ...getCustomerDefaultValues(activeType),
      ...initial,
    } as any,
  });

  const { handleSubmit, formState: { errors } } = methods;

  // Separate Image Upload logic similar to original behavior
  const uploadImages = (customerId: string, files: File[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/customers/${customerId}/images`);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText || "{}"));
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

  const deleteImages = (customerId: string, imageIds: string[]): Promise<any> => {
    return fetch(`/api/customers/${customerId}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageIds }),
    }).then((res) => res.json());
  };

  const reorderImages = (customerId: string, imageIds: string[]): Promise<any> => {
    return fetch(`/api/customers/${customerId}/images`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageIds }),
    }).then((res) => res.json());
  };

  const handleFormSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    setServerErrors({});

    try {
      const payload = mapFormDataToPayload(data);
      const res = await onSubmit(payload);

      if (!res.success) {
        if (res.issues) {
          // You could map these issues back to RHF using setError, or just show them
          setServerErrors(res.issues);
        }
        setLoading(false);
        return;
      }

      // Handle images after successful creation/update
      const targetCustomerId = res.data?.customer?.id || (initial as any).id;
      const uploadedFiles: (FileWithPreview | FileMetadata)[] = data.images || [];

      if (targetCustomerId && uploadedFiles.length > 0) {
        try {
          const initialImages = (initial.images || []) as any[];
          const currentImageIds = uploadedFiles
            .map((item) => (item instanceof File ? null : (item as any).id))
            .filter(Boolean);
          const removedImageIds = initialImages
            .map((img) => img.id)
            .filter((id) => !currentImageIds.includes(id));

          if (removedImageIds.length > 0) {
            await deleteImages(targetCustomerId, removedImageIds);
          }

          const filesToUpload = uploadedFiles.filter((item) => item instanceof File) as File[];
          let createdImages: any[] = [];
          if (filesToUpload.length > 0) {
            const uploadRes = await uploadImages(targetCustomerId, filesToUpload);
            if (uploadRes.created) createdImages = uploadRes.created;
          }

          let uploadIndex = 0;
          const finalOrderedIds = uploadedFiles
            .map((item) => {
              if (item instanceof File) return createdImages[uploadIndex++]?.id;
              return (item as any).id;
            })
            .filter(Boolean);

          if (finalOrderedIds.length > 0) {
            await reorderImages(targetCustomerId, finalOrderedIds);
          }
        } catch (err) {
          console.error("Image operation failed", err);
        }
      }

      onSuccess?.();
    } catch (e) {
      console.error(e);
      setServerErrors({ form: ["เกิดข้อผิดพลาดในการบันทึกข้อมูล"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
        {/* Render Form Sections */}
        <BasicInfoSection />
        <AddressSection />
        <ContactInfoSection />
        
        {/* Dynamic Section based on Customer Type */}
        <SpecificSection />
        
        <ImageGallerySection />

        {/* Global Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
            โปรดตรวจสอบข้อมูลที่ไม่ถูกต้องในฟอร์ม
            <ul className="list-disc pl-5 mt-2">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{String(err?.message || "Invalid field")}</li>
              ))}
            </ul>
          </div>
        )}

        {Object.keys(serverErrors).length > 0 && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
            เกิดข้อผิดพลาดจากเซิร์ฟเวอร์
            <ul className="list-disc pl-5 mt-2">
              {Object.values(serverErrors).map((msgs, idx) =>
                msgs.map((msg, idx2) => <li key={`${idx}-${idx2}`}>{msg}</li>)
              )}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sm:pt-2 mt-8 sm:mt-8 space-y-6">
          <div className="flex justify-center flex-col-reverse sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Button
              size="lg"
              className="flex-1 sm:flex-none sm:w-32 bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
              type="button"
              onClick={() => {
                if (onCancel) onCancel();
                else router.push("/customers");
              }}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
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
                  <Save className="h-4 w-4 mr-2" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="w-full h-12 sm:hidden"></div>
      </form>
    </FormProvider>
  );
}
