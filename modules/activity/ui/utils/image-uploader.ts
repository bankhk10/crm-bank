import type { Type1ImageFile } from "../../features/type-1/shared/types";
import type { FileMetadata, FileWithPreview } from "@/hooks/use-file-upload";

export type ImageFile = Type1ImageFile;

/**
 * Convert ImageFile[] to FileMetadata[] for GalleryUpload initialFiles
 */
export function convertToFileMetadata(images: ImageFile[] = []): FileMetadata[] {
  return (images || []).map((img) => ({
    id: img.id,
    name: img.name || `image-${img.id}`,
    size: (img as any).size || 0,
    type: (img as any).type || "image/jpeg",
    url: img.url,
  }));
}

/**
 * Convert FileWithPreview[] from GalleryUpload onFilesChange to ImageFile[]
 */
export function filesWithPreviewToImageFiles(
  files: FileWithPreview[],
): ImageFile[] {
  return (files || []).map((item) => {
    if (item.file instanceof File) {
      return {
        id: item.id,
        url:
          item.preview ||
          (typeof window !== "undefined"
            ? URL.createObjectURL(item.file)
            : ""),
        name: item.file.name,
        size: item.file.size,
        type: item.file.type,
        rawFile: item.file,
      };
    }
    return {
      id: item.file.id,
      url: item.file.url,
      name: item.file.name,
      size: item.file.size,
      type: item.file.type,
    };
  });
}

/**
 * Check if two ImageFile arrays are equal to prevent redundant state updates
 */
export function isImageFilesEqual(
  a: ImageFile[] = [],
  b: ImageFile[] = [],
): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (item, idx) =>
      item.id === b[idx]?.id &&
      item.url === b[idx]?.url &&
      item.rawFile === b[idx]?.rawFile,
  );
}

/**
 * Extract all permanent URLs (/uploads/activity-plans/...) from an ImageFile array
 */
export function collectPermanentUrls(images: ImageFile[] = []): string[] {
  const urls: string[] = [];
  (images || []).forEach((img) => {
    if (
      typeof img.url === "string" &&
      img.url.startsWith("/uploads/activity-plans/")
    ) {
      urls.push(img.url);
    }
  });
  return urls;
}

/**
 * Upload an array of ImageFile to the server storage for an activity plan.
 * Returns updated ImageFile array with permanent URLs and newly uploaded URLs.
 */
export async function uploadActivityPlanImageGroup(
  planId: string,
  images: ImageFile[] = [],
  category: string,
  itemId: string = "general",
): Promise<{
  updatedImages: ImageFile[];
  newlyUploadedUrls: string[];
}> {
  const processedImages: ImageFile[] = [];
  const newlyUploadedUrls: string[] = [];
  const newFilesToUpload: { file: File; tempId: string }[] = [];

  for (const img of images) {
    if (img.rawFile instanceof File) {
      newFilesToUpload.push({ file: img.rawFile, tempId: img.id });
    } else if (img.url && img.url.startsWith("blob:")) {
      try {
        const res = await fetch(img.url);
        const blob = await res.blob();
        const file = new File([blob], img.name || `${category}.jpg`, {
          type: blob.type || "image/jpeg",
        });
        newFilesToUpload.push({ file, tempId: img.id });
      } catch {
        throw new Error(
          `ไม่สามารถเข้าถึงไฟล์รูปภาพ (${category}) กรุณาเลือกไฟล์ใหม่อีกครั้ง`,
        );
      }
    } else {
      // Already permanent URL
      processedImages.push({
        id: img.id,
        url: img.url,
        name: img.name,
        size: img.size,
        type: img.type,
      });
    }
  }

  if (newFilesToUpload.length > 0) {
    const form = new FormData();
    newFilesToUpload.forEach(({ file }) => form.append("images", file));

    const res = await fetch(
      `/api/activity-plans/${planId}/images?surveyItemId=${encodeURIComponent(itemId)}&category=${encodeURIComponent(category)}`,
      {
        method: "POST",
        body: form,
      },
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData.error ||
          `อัปโหลดรูปภาพ (${category}) ล้มเหลว กรุณาลองใหม่อีกครั้ง`,
      );
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.images)) {
      data.images.forEach((img: any) => {
        processedImages.push({
          id: img.id,
          url: img.fileUrl,
          name: img.fileName,
          size: img.fileSize,
          type: img.fileType,
        });
        newlyUploadedUrls.push(img.fileUrl);
      });
    }
  }

  return {
    updatedImages: processedImages,
    newlyUploadedUrls,
  };
}
