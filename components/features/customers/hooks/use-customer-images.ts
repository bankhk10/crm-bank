"use client";

import { useState, useCallback } from "react";
import type { FileWithPreview, FileMetadata } from "@/hooks/use-file-upload";

/**
 * useCustomerImages Hook
 * Handles image upload, delete, and reorder operations for customer forms
 */
export function useCustomerImages() {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  /**
   * Convert initial images to FileMetadata format for GalleryUpload
   */
  const convertToFileMetadata = useCallback((images: any[]): FileMetadata[] => {
    return images.map((img) => ({
      id: img.id,
      name: img.name || `image-${img.id}`,
      size: img.size || 0,
      type: img.type || "image/jpeg",
      url: img.url,
    }));
  }, []);

  /**
   * Upload images to customer
   */
  const uploadImages = useCallback(
    (customerId: string, files: File[]): Promise<any> => {
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
    },
    []
  );

  /**
   * Delete images from customer
   */
  const deleteImages = useCallback(
    (customerId: string, imageIds: string[]): Promise<any> => {
      return fetch(`/api/customers/${customerId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds }),
      }).then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to delete images");
      });
    },
    []
  );

  /**
   * Reorder images for customer
   */
  const reorderImages = useCallback(
    (customerId: string, imageIds: string[]): Promise<any> => {
      return fetch(`/api/customers/${customerId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds }),
      }).then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to reorder images");
      });
    },
    []
  );

  /**
   * Process images after form submit
   * Handles delete removed, upload new, and reorder
   */
  const processImages = useCallback(
    async (
      customerId: string,
      initialImages: any[],
      currentFiles: FileWithPreview[]
    ): Promise<void> => {
      try {
        // 1. Identify removed images
        const currentImageIds = currentFiles
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
          await deleteImages(customerId, removedImageIds);
        }

        // 3. Upload new images and collect all IDs in order
        let uploadedImages: any[] = [];
        const filesToUpload = currentFiles
          .filter((item) => item.file instanceof File)
          .map((item) => item.file as File);

        if (filesToUpload.length > 0) {
          setUploadProgress(0);
          const uploadRes = await uploadImages(customerId, filesToUpload);
          if (uploadRes.created) {
            uploadedImages = uploadRes.created;
          }
        }

        // 4. Construct final ordered ID list
        let uploadIndex = 0;
        const finalOrderedIds = currentFiles
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
          await reorderImages(customerId, finalOrderedIds);
        }
      } finally {
        setUploadProgress(null);
      }
    },
    [deleteImages, uploadImages, reorderImages]
  );

  return {
    uploadedFiles,
    setUploadedFiles,
    uploadProgress,
    convertToFileMetadata,
    uploadImages,
    deleteImages,
    reorderImages,
    processImages,
  };
}
