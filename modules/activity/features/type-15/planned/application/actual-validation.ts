/**
 * Type 15 Feature: Actual Validation (บูมทีม / คาราวาน)
 */

import { z } from "zod";
import type { ImageFile } from "@/modules/activity/application/media/image-uploader";
import { TYPE_15_MAX_IMAGES } from "../../shared/constants";

export const type15ActualSchema = z.object({
  detail: z.string().optional().default(""),
  images: z
    .array(z.any())
    .max(TYPE_15_MAX_IMAGES, {
      message: `สามารถอัพโหลดรูปภาพได้สูงสุด ${TYPE_15_MAX_IMAGES} รูป`,
    })
    .default([]),
});

export function validateType15Actual(options: {
  detail?: string;
  images?: ImageFile[];
}): { isValid: boolean; error?: string } {
  const imagesCount = options.images?.length || 0;
  if (imagesCount > TYPE_15_MAX_IMAGES) {
    return {
      isValid: false,
      error: `อัพโหลดรูปภาพได้สูงสุด ${TYPE_15_MAX_IMAGES} รูป (ปัจจุบันเลือก ${imagesCount} รูป)`,
    };
  }

  return { isValid: true };
}

