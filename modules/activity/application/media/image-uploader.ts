import type { Type1ImageFile } from "@/modules/activity/features/type-1";
import type { FileMetadata, FileWithPreview } from "@/hooks/use-file-upload";

export type ImageFile = Type1ImageFile;

/**
 * Checks whether a URL is a permanent activity plan upload URL
 * (supports both `/uploads/activity-plans/...` and Cloudflare R2 public URLs containing `/uploads/activity-plans/`).
 */
export function isPermanentActivityUploadUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    url.startsWith("/uploads/activity-plans/") ||
    url.includes("/uploads/activity-plans/")
  );
}

/**
 * Convert ImageFile[] to FileMetadata[] for GalleryUpload initialFiles
 */
export function convertToFileMetadata(images: ImageFile[] = []): FileMetadata[] {
  return (images || []).map(
    (img) =>
      ({
        id: img.id,
        name: img.name || (img as any).fileName || `image-${img.id}`,
        size: (img as any).size || (img as any).fileSize || 0,
        type: (img as any).type || (img as any).mimeType || "image/jpeg",
        url: img.url || (img as any).fileUrl || "",
        rawFile: img.rawFile || (img as any).file,
        file: (img as any).file || img.rawFile,
      }) as FileMetadata,
  );
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
      (item.url || (item as any).fileUrl) ===
        (b[idx]?.url || (b[idx] as any).fileUrl) &&
      (item.rawFile || (item as any).file) ===
        (b[idx]?.rawFile || (b[idx] as any).file),
  );
}

/**
 * Extract all permanent URLs (/uploads/activity-plans/...) from an ImageFile array
 */
export function collectPermanentUrls(images: ImageFile[] = []): string[] {
  const urls: string[] = [];
  (images || []).forEach((img) => {
    if (isPermanentActivityUploadUrl(img?.url)) {
      urls.push(img.url);
    }
  });
  return urls;
}

/**
 * Compress an image file using browser Canvas API.
 * - Resizes image so its longest edge does not exceed maxDimension (default 1920px)
 * - Compresses JPEG/WebP with target quality (default 0.82)
 * - Marks compressed file with `__compressed = true` to avoid double compression
 * - Returns original file if compression fails, is unsupported, or doesn't reduce file size.
 */
export async function compressImageFile(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
  } = {},
): Promise<File> {
  if ((file as any).__compressed) {
    return file;
  }

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
    (file as any).__compressed = true;
    return file;
  }

  let imageSource: ImageBitmap | HTMLImageElement | null = null;
  let objectUrl: string | null = null;

  try {
    let width = 0;
    let height = 0;

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
      objectUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = objectUrl!;
      });
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
      return file;
    }

    ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

    // Determine output format
    const outputType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    // Release canvas backing memory immediately
    canvas.width = 0;
    canvas.height = 0;

    if (!blob || blob.size >= file.size) {
      (file as any).__compressed = true;
      return file;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const ext = outputType === "image/webp" ? ".webp" : ".jpg";
    const newFileName = `${baseName}${ext}`;

    const compressed = new File([blob], newFileName, {
      type: outputType,
      lastModified: Date.now(),
    });
    (compressed as any).__compressed = true;
    return compressed;
  } catch (err) {
    console.warn("[ImageUploader] Image compression skipped due to error:", err);
    return file;
  } finally {
    if (
      imageSource &&
      "close" in imageSource &&
      typeof (imageSource as any).close === "function"
    ) {
      try {
        (imageSource as any).close();
      } catch {
        // Ignore close error
      }
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

const COMPRESSION_CONCURRENCY = 4; // Max 4 simultaneous Canvas operations to prevent OOM on 200 photos
const DIRECT_R2_CONCURRENCY = 6; // 6 parallel direct-to-R2 PUT uploads
const SERVER_BATCH_SIZE = 4; // 4 compressed files per multipart request (~1.2MB)
const MAX_CONCURRENT_SERVER_BATCHES = 3; // Up to 3 server batches in parallel
const MAX_RETRIES = 2; // Retry transient network failures up to 2 times

export interface UploadProgressInfo {
  phase: "compressing" | "uploading";
  completed: number;
  total: number;
}

/**
 * Upload an array of ImageFile to Cloudflare R2 (via Presigned PUT URLs or Server Multipart Fallback)
 * for an activity plan.
 * Designed to handle up to 200+ photos in a single invocation without browser memory exhaustion.
 */
export async function uploadActivityPlanImageGroup(
  planId: string,
  images: ImageFile[] = [],
  category: string,
  itemId: string = "general",
  onProgress?: (info: UploadProgressInfo) => void,
): Promise<{
  updatedImages: ImageFile[];
  newlyUploadedUrls: string[];
}> {
  const newlyUploadedUrls: string[] = [];

  // Keep slots in original order so permanent & newly uploaded images stay in exact user order
  type SlotItem =
    | { kind: "permanent"; image: ImageFile }
    | { kind: "upload"; file: File; tempId: string; result?: ImageFile };

  const slots: SlotItem[] = [];
  const uploadSlots: Extract<SlotItem, { kind: "upload" }>[] = [];

  for (const img of images) {
    const raw =
      img.rawFile instanceof File
        ? img.rawFile
        : (img as any).file instanceof File
          ? (img as any).file
          : null;

    if (raw) {
      const slot: Extract<SlotItem, { kind: "upload" }> = {
        kind: "upload",
        file: raw,
        tempId: img.id,
      };
      slots.push(slot);
      uploadSlots.push(slot);
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
        const file = new File(
          [blob],
          img.name || `${category}.${ext || "png"}`,
          {
            type: mime,
          },
        );
        const slot: Extract<SlotItem, { kind: "upload" }> = {
          kind: "upload",
          file,
          tempId: img.id,
        };
        slots.push(slot);
        uploadSlots.push(slot);
      } catch {
        throw new Error(
          `ไม่สามารถเข้าถึงไฟล์รูปภาพ (${category}) กรุณาเลือกไฟล์ใหม่อีกครั้ง`,
        );
      }
    } else {
      // Already permanent URL
      slots.push({
        kind: "permanent",
        image: {
          id: img.id,
          url: img.url,
          name: img.name,
          size: img.size,
          type: img.type,
        },
      });
    }
  }

  if (uploadSlots.length > 0) {
    const totalToUpload = uploadSlots.length;

    // 1. Controlled Client-Side Compression Pool (max 4 concurrent Canvas operations)
    let compressCursor = 0;
    let compressedCount = 0;

    const compressWorker = async () => {
      while (compressCursor < uploadSlots.length) {
        const currentSlot = uploadSlots[compressCursor++];
        currentSlot.file = await compressImageFile(currentSlot.file);
        compressedCount++;
        onProgress?.({
          phase: "compressing",
          completed: compressedCount,
          total: totalToUpload,
        });
      }
    };

    const compressWorkerCount = Math.min(
      COMPRESSION_CONCURRENCY,
      uploadSlots.length,
    );
    await Promise.all(
      Array.from({ length: compressWorkerCount }, () => compressWorker()),
    );

    const endpointUrl = `/api/activity-plans/${planId}/images?surveyItemId=${encodeURIComponent(itemId)}&category=${encodeURIComponent(category)}`;

    // 2. Attempt Direct-to-R2 Upload via Presigned PUT URLs (Fastest path for up to 200+ photos)
    let directUploadSucceeded = false;

    try {
      const presignRes = await fetch(`${endpointUrl}&action=presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: uploadSlots.map((s) => ({
            filename: s.file.name,
            contentType: s.file.type || "image/jpeg",
            size: s.file.size,
          })),
        }),
      });

      if (presignRes.ok) {
        const presignData = await presignRes.json();
        if (
          presignData.r2Enabled &&
          Array.isArray(presignData.presigned) &&
          presignData.presigned.length === uploadSlots.length
        ) {
          const presignedList = presignData.presigned as Array<{
            id: string;
            filename: string;
            uploadUrl: string;
            publicUrl: string;
            contentType: string;
          }>;

          let uploadCursor = 0;
          let uploadedCount = 0;

          const putSingleToR2 = async (
            slot: Extract<SlotItem, { kind: "upload" }>,
            target: (typeof presignedList)[number],
          ) => {
            let lastErr: any = null;
            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
              try {
                const putRes = await fetch(target.uploadUrl, {
                  method: "PUT",
                  headers: {
                    "Content-Type":
                      target.contentType || slot.file.type || "image/jpeg",
                  },
                  body: slot.file,
                });

                if (!putRes.ok) {
                  throw new Error(`R2 PUT failed with HTTP ${putRes.status}`);
                }

                newlyUploadedUrls.push(target.publicUrl);
                slot.result = {
                  id: target.id,
                  url: target.publicUrl,
                  name: slot.file.name || target.filename || "รูปภาพ",
                  size: slot.file.size,
                  type: slot.file.type || target.contentType || "image/jpeg",
                };
                uploadedCount++;
                onProgress?.({
                  phase: "uploading",
                  completed: uploadedCount,
                  total: totalToUpload,
                });
                return;
              } catch (err) {
                lastErr = err;
                if (attempt < MAX_RETRIES) {
                  await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
                }
              }
            }
            throw lastErr || new Error("Direct R2 PUT failed");
          };

          const r2Worker = async () => {
            while (uploadCursor < uploadSlots.length) {
              const idx = uploadCursor++;
              await putSingleToR2(uploadSlots[idx], presignedList[idx]);
            }
          };

          const r2WorkerCount = Math.min(
            DIRECT_R2_CONCURRENCY,
            uploadSlots.length,
          );
          await Promise.all(
            Array.from({ length: r2WorkerCount }, () => r2Worker()),
          );

          directUploadSucceeded = true;
        }
      }
    } catch (presignOrCorsErr) {
      // If CORS is not yet configured on the R2 bucket or presign fails for remaining items,
      // automatically fall back to multipart server upload for any remaining slots!
      console.warn(
        "[ImageUploader] Direct R2 presigned upload unavailable or partially failed, falling back to Server Multipart Upload:",
        presignOrCorsErr,
      );
    }

    // 3. Fallback: Upload any remaining un-uploaded slots via Multipart Server API Batches
    const remainingSlots = directUploadSucceeded
      ? []
      : uploadSlots.filter((s) => !s.result);

    if (remainingSlots.length > 0) {
      const batches: Array<Extract<SlotItem, { kind: "upload" }>[]> = [];
      for (let i = 0; i < remainingSlots.length; i += SERVER_BATCH_SIZE) {
        batches.push(remainingSlots.slice(i, i + SERVER_BATCH_SIZE));
      }

      let uploadedCount = uploadSlots.length - remainingSlots.length;

      const uploadBatchToServer = async (
        batch: Extract<SlotItem, { kind: "upload" }>[],
      ) => {
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            const form = new FormData();
            batch.forEach(({ file }) => form.append("images", file));

            const res = await fetch(endpointUrl, {
              method: "POST",
              body: form,
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(
                errData.error ||
                  `อัปโหลดรูปภาพ (${category}) ล้มเหลว กรุณาลองใหม่อีกครั้ง (HTTP ${res.status})`,
              );
            }

            const data = await res.json();
            const uploadedList = data.created || data.images || [];

            uploadedList.forEach((uploaded: any, idx: number) => {
              const slot = batch[idx];
              if (!slot) return;
              const uUrl = uploaded.url || uploaded.fileUrl;
              if (uUrl && !newlyUploadedUrls.includes(uUrl)) {
                newlyUploadedUrls.push(uUrl);
              }
              slot.result = {
                id: uploaded.id,
                url: uUrl,
                name:
                  uploaded.filename ||
                  uploaded.fileName ||
                  slot.file.name ||
                  "รูปภาพ",
                size: uploaded.fileSize || slot.file.size || 0,
                type: uploaded.fileType || slot.file.type || "image/jpeg",
              };
            });

            uploadedCount += batch.length;
            onProgress?.({
              phase: "uploading",
              completed: uploadedCount,
              total: totalToUpload,
            });
            return;
          } catch (err: any) {
            lastError = err;
            if (attempt < MAX_RETRIES) {
              await new Promise((resolve) =>
                setTimeout(resolve, 500 * (attempt + 1)),
              );
            }
          }
        }

        throw lastError || new Error(`อัปโหลดรูปภาพ (${category}) ล้มเหลว`);
      };

      let currentBatchIndex = 0;
      const serverWorker = async () => {
        while (currentBatchIndex < batches.length) {
          const batch = batches[currentBatchIndex++];
          await uploadBatchToServer(batch);
        }
      };

      const workersCount = Math.min(
        MAX_CONCURRENT_SERVER_BATCHES,
        batches.length,
      );
      await Promise.all(
        Array.from({ length: workersCount }, () => serverWorker()),
      );
    }
  }

  // 4. Assemble final ordered ImageFile array
  const processedImages: ImageFile[] = slots.map((slot) => {
    if (slot.kind === "permanent") {
      return slot.image;
    }
    if (!slot.result) {
      throw new Error(
        `พบรูปภาพ (${category}) ที่ยังไม่ได้อัปโหลดสมบูรณ์ กรุณาลองใหม่อีกครั้ง`,
      );
    }
    return slot.result;
  });

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
 * Delete specified activity plan image paths from physical storage (Cloudflare R2 & local)
 */
export async function deleteActivityPlanImagePaths(
  planId: string,
  publicPaths: string[],
): Promise<void> {
  if (!publicPaths || publicPaths.length === 0) return;
  const validPaths = publicPaths.filter((p) => isPermanentActivityUploadUrl(p));
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
