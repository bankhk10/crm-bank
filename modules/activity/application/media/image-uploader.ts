import type { Type1ImageFile } from "@/modules/activity/features/type-1";
import type { FileMetadata, FileWithPreview } from "@/hooks/use-file-upload";

export type ImageFile = Type1ImageFile;

/**
 * Convert ImageFile[] to FileMetadata[] for GalleryUpload initialFiles
 */
export function convertToFileMetadata(images: ImageFile[] = []): FileMetadata[] {
  return (images || []).map((img) => ({
    id: img.id,
    name: img.name || (img as any).fileName || `image-${img.id}`,
    size: (img as any).size || (img as any).fileSize || 0,
    type: (img as any).type || (img as any).mimeType || "image/jpeg",
    url: img.url || (img as any).fileUrl || "",
    rawFile: img.rawFile || (img as any).file,
    file: (img as any).file || img.rawFile,
  } as FileMetadata));
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
 * Compress an image file using browser Canvas API.
 * - Resizes image so its longest edge does not exceed maxDimension (default 1920px)
 * - Compresses JPEG/WebP with target quality (default 0.82)
 * - Returns original file if compression fails, is unsupported, or doesn't reduce file size.
 */
export async function compressImageFile(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
  } = {},
): Promise<File> {
  const { maxDimension = 1920, quality = 0.82 } = options;

  // SSR or non-image guard
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    !file.type.startsWith("image/")
  ) {
    return file;
  }

  // Skip SVG or GIF animations
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  // If already small (<= 300 KB), skip compression
  if (file.size <= 300 * 1024) {
    return file;
  }

  try {
    let width = 0;
    let height = 0;
    let imageSource: ImageBitmap | HTMLImageElement | null = null;

    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        width = bitmap.width;
        height = bitmap.height;
        imageSource = bitmap;
      } catch {
        imageSource = null;
      }
    }

    if (!imageSource) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = objectUrl;
      });
      URL.revokeObjectURL(objectUrl);
      width = img.width;
      height = img.height;
      imageSource = img;
    }

    if (!width || !height) {
      return file;
    }

    // Calculate aspect-ratio preserved dimensions
    let targetWidth = width;
    let targetHeight = height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        targetWidth = maxDimension;
        targetHeight = Math.round((height * maxDimension) / width);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((width * maxDimension) / height);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      if ("close" in imageSource && typeof (imageSource as any).close === "function") {
        (imageSource as any).close();
      }
      return file;
    }

    ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

    if ("close" in imageSource && typeof (imageSource as any).close === "function") {
      (imageSource as any).close();
    }

    // Determine output format
    const outputType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const ext = outputType === "image/webp" ? ".webp" : ".jpg";
    const newFileName = `${baseName}${ext}`;

    return new File([blob], newFileName, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("[ImageUploader] Image compression skipped due to error:", err);
    return file;
  }
}

const BATCH_SIZE = 2; // 2 files per request keeps payload well below 1MB
const MAX_CONCURRENT_UPLOADS = 3; // Up to 3 batches in parallel
const MAX_RETRIES = 2; // Retry transient network failures up to 2 times

/**
 * Upload an array of ImageFile to the server storage for an activity plan.
 * Returns updated ImageFile array with permanent URLs and newly uploaded URLs.
 * Uses client-side compression, chunked batching (2 files/request), concurrency limit (3), and auto-retry.
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
    // 1. Client-side compression
    const compressedFiles = await Promise.all(
      newFilesToUpload.map(async (item) => {
        const compressed = await compressImageFile(item.file);
        return {
          ...item,
          file: compressed,
        };
      }),
    );

    // 2. Split into small batches (2 files each)
    const batches: Array<{
      startIndex: number;
      items: typeof compressedFiles;
    }> = [];

    for (let i = 0; i < compressedFiles.length; i += BATCH_SIZE) {
      batches.push({
        startIndex: i,
        items: compressedFiles.slice(i, i + BATCH_SIZE),
      });
    }

    // 3. Helper to upload one batch with retry
    const uploadBatch = async (
      batch: typeof compressedFiles,
    ): Promise<Array<{ id: string; url: string; filename: string; fileSize?: number; fileType?: string }>> => {
      let lastError: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const form = new FormData();
          batch.forEach(({ file }) => form.append("images", file));

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
                `อัปโหลดรูปภาพ (${category}) ล้มเหลว กรุณาลองใหม่อีกครั้ง (HTTP ${res.status})`,
            );
          }

          const data = await res.json();
          const uploadedList = data.created || data.images || [];
          return uploadedList;
        } catch (err: any) {
          lastError = err;
          if (attempt < MAX_RETRIES) {
            // Wait with backoff before retrying
            await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }

      throw lastError || new Error(`อัปโหลดรูปภาพ (${category}) ล้มเหลว`);
    };

    // 4. Concurrency Queue (max 3 concurrent uploads)
    const batchResults: Array<{ startIndex: number; uploadedList: any[] }> = [];
    let currentBatchIndex = 0;

    const worker = async () => {
      while (currentBatchIndex < batches.length) {
        const batch = batches[currentBatchIndex++];
        const uploadedList = await uploadBatch(batch.items);

        // Track newly uploaded URLs immediately in case subsequent batches fail
        uploadedList.forEach((uploaded: any) => {
          const uUrl = uploaded.url || uploaded.fileUrl;
          if (uUrl && !newlyUploadedUrls.includes(uUrl)) {
            newlyUploadedUrls.push(uUrl);
          }
        });

        batchResults.push({
          startIndex: batch.startIndex,
          uploadedList,
        });
      }
    };

    const workersCount = Math.min(MAX_CONCURRENT_UPLOADS, batches.length);
    await Promise.all(
      Array.from({ length: workersCount }, () => worker()),
    );

    // 5. Restore original order
    batchResults.sort((a, b) => a.startIndex - b.startIndex);
    const sortedUploadedList = batchResults.flatMap((b) => b.uploadedList);

    sortedUploadedList.forEach((uploaded: any, uIdx: number) => {
      const original = compressedFiles[uIdx];
      const uploadedUrl = uploaded.url || uploaded.fileUrl;
      const uploadedName =
        uploaded.filename ||
        uploaded.fileName ||
        original?.file?.name ||
        "รูปภาพ";
      processedImages.push({
        id: uploaded.id,
        url: uploadedUrl,
        name: uploadedName,
        size: uploaded.fileSize || original?.file?.size || 0,
        type: uploaded.fileType || original?.file?.type || "image/jpeg",
      });
    });
  }

  // Safety check: ensure NO blob URL remains
  if (processedImages.some((img) => img.url && img.url.startsWith("blob:"))) {
    throw new Error(
      `พบรูปภาพ (${category}) ที่ยังไม่ได้อัปโหลดสมบูรณ์ กรุณาลองใหม่อีกครั้ง`,
    );
  }

  return {
    updatedImages: processedImages,
    newlyUploadedUrls,
  };
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
