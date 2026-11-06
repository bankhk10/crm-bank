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

  // 1. Resolve results array from all possible locations
  const type15Results =
    initial.type15Results ||
    initial.activityPlan?.type15Results ||
    initial.plan?.type15Results ||
    initial.type15Targets?.[0]?.results ||
    initial.activityPlan?.type15Targets?.[0]?.results ||
    [];

  const firstResult =
    Array.isArray(type15Results) && type15Results.length > 0
      ? type15Results[0]
      : null;

  // 2. Resolve detail from all possible locations
  let detail = "";
  if (initial.type15Actual?.detail != null) {
    detail = String(initial.type15Actual.detail);
  } else if (firstResult?.detail != null) {
    detail = String(firstResult.detail);
  } else if (initial.t15Detail != null) {
    detail = String(initial.t15Detail);
  } else if (initial.detail != null && typeof initial.detail === "string") {
    detail = initial.detail;
  } else if (initial.actual?.detail != null) {
    detail = String(initial.actual.detail);
  }

  // 3. Resolve attachments
  let images: ImageFile[] = [];
  const rawAttachments =
    initial.type15Actual?.images ||
    initial.type15Actual?.attachments ||
    firstResult?.attachments ||
    initial.type15Results?.[0]?.attachments ||
    initial.activityPlan?.type15Results?.[0]?.attachments ||
    initial.t15Images ||
    initial.attachments?.filter(
      (a: any) =>
        a.type15ResultId ||
        a.workTypeCode === "TYPE_15" ||
        a.category === "GENERAL",
    ) ||
    initial.activityPlan?.attachments?.filter(
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

