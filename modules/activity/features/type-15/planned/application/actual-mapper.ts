/**
 * Type 15 Feature: Actual Mapper (บูมทีม / คาราวาน)
 */

import type { ImageFile } from "@/modules/activity/application/media/image-uploader";

export function mapType15ActualInitialData(initial: any): {
  detail: string;
  images: ImageFile[];
} {
  if (!initial) {
    return { detail: "", images: [] };
  }

  // Find actual result for Type 15
  let detail = "";
  if (initial.type15Actual?.detail) {
    detail = initial.type15Actual.detail;
  } else if (Array.isArray(initial.type15Results) && initial.type15Results.length > 0) {
    detail = initial.type15Results[0].detail || "";
  } else if (initial.actual?.detail) {
    detail = initial.actual.detail;
  }

  // Find attachments
  let images: ImageFile[] = [];
  const rawAttachments =
    initial.type15Actual?.images ||
    initial.type15Results?.[0]?.attachments ||
    initial.attachments?.filter(
      (a: any) =>
        a.type15ResultId ||
        a.workTypeCode === "TYPE_15" ||
        a.category === "GENERAL",
    ) ||
    [];

  if (Array.isArray(rawAttachments)) {
    images = rawAttachments.map((att: any, idx: number) => ({
      id: att.id || `img-type15-${idx}`,
      url: att.fileUrl || att.url || "",
      name: att.fileName || att.name || `photo-${idx + 1}.jpg`,
      size: att.fileSize || att.size || 0,
      mimeType: att.mimeType || att.type || "image/jpeg",
    }));
  }

  return { detail, images };
}

export function mapType15ActualToPayload(options: {
  detail: string;
  images: ImageFile[];
}) {
  return {
    type15Actual: {
      detail: options.detail || "",
      images: (options.images || []).map((img) => ({
        url: img.url,
        name: img.name || "boom-team-photo.jpg",
        size: img.size || 0,
        mimeType: img.type || "image/jpeg",
      })),
    },
  };
}

