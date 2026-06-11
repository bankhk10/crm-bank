"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileMetadata } from "@/hooks/use-file-upload";
import { CustomerFormData } from "../../../types";

export function ImageGallerySection() {
  const { control } = useFormContext<CustomerFormData>();

  // Convert initial images to FileMetadata format for GalleryUpload
  const convertToFileMetadata = (images: any[]): FileMetadata[] => {
    if (!images || !Array.isArray(images)) return [];
    return images.map((img) => ({
      id: img.id,
      name: img.name || `image-${img.id}`,
      size: img.size || 0,
      type: img.type || "image/jpeg",
      url: img.url,
    }));
  };

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        อัพโหลดรูปภาพ
      </h3>
      <Controller
        name="images"
        control={control}
        render={({ field }) => (
          <GalleryUpload
            maxFiles={10}
            maxSize={20 * 1024 * 1024}
            initialFiles={convertToFileMetadata(field.value || [])}
            onFilesChange={field.onChange}
          />
        )}
      />
    </div>
  );
}
