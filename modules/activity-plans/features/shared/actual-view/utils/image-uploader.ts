import type { ImageFile } from "../types";
import type { FileMetadata, FileWithPreview } from "@/hooks/use-file-upload";

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
    rawFile: img.rawFile || (img as any).file,
    file: (img as any).file || img.rawFile,
  } as FileMetadata));
}

/**
 * Convert FileWithPreview[] from GalleryUpload onFilesChange to ImageFile[]
 * Preserves binary File object in rawFile when a new file is chosen.
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
        file: item.file,
      };
    }
    const meta = item.file as any;
    const raw = meta?.rawFile || meta?.file;
    return {
      id: meta?.id || item.id,
      url: item.preview || meta?.url || "",
      name: meta?.name || (item.preview ? "รูปภาพ" : ""),
      size: meta?.size || 0,
      type: meta?.type || "image/jpeg",
      rawFile: raw instanceof File ? raw : undefined,
      file: raw instanceof File ? raw : undefined,
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
      (item.url || (item as any).fileUrl) === (b[idx]?.url || (b[idx] as any).fileUrl) &&
      (item.rawFile || (item as any).file) === (b[idx]?.rawFile || (b[idx] as any).file),
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
    const raw =
      img.rawFile instanceof File
        ? img.rawFile
        : (img as any).file instanceof File
          ? (img as any).file
          : null;

    if (raw) {
      newFilesToUpload.push({ file: raw, tempId: img.id });
    } else if (img.url && img.url.startsWith("blob:")) {
      try {
        const res = await fetch(img.url);
        if (!res.ok) throw new Error("fetch blob failed");
        const blob = await res.blob();
        const ext = img.name?.includes(".")
          ? img.name.split(".").pop()?.toLowerCase()
          : "png";
        const mime =
          blob.type ||
          (img as any).type ||
          (ext === "png"
            ? "image/png"
            : ext === "webp"
              ? "image/webp"
              : "image/jpeg");
        const file = new File([blob], img.name || `${category}.${ext || "png"}`, {
          type: mime,
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
        errData.error || `อัปโหลดรูปภาพ (${category}) ล้มเหลว`,
      );
    }

    const data = await res.json();
    if (data.created && Array.isArray(data.created)) {
      data.created.forEach((uploaded: any, uIdx: number) => {
        const original = newFilesToUpload[uIdx];
        processedImages.push({
          id: uploaded.id,
          url: uploaded.url,
          name: uploaded.filename || original.file.name,
        });
        newlyUploadedUrls.push(uploaded.url);
      });
    }
  }

  // Safety check: ensure NO blob URL remains
  if (processedImages.some((img) => img.url.startsWith("blob:"))) {
    throw new Error(
      `พบรูปภาพ (${category}) ที่ยังไม่ได้อัปโหลดสมบูรณ์ กรุณาลองใหม่อีกครั้ง`,
    );
  }

  return { updatedImages: processedImages, newlyUploadedUrls };
}

/**
 * Delete specified activity plan image paths from physical storage
 */
export async function deleteActivityPlanImagePaths(
  planId: string,
  publicPaths: string[],
): Promise<void> {
  if (!publicPaths || publicPaths.length === 0) return;
  const validPaths = publicPaths.filter(
    (p) => typeof p === "string" && p.startsWith("/uploads/activity-plans/"),
  );
  if (validPaths.length === 0) return;

  try {
    await fetch(`/api/activity-plans/${planId}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicPaths: validPaths }),
    });
  } catch (err) {
    console.warn("Failed to delete activity plan images:", err);
  }
}
