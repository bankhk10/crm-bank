"use client";

import type { ImageFile } from "@/modules/activity/application/media/image-uploader";

// 1x1 transparent PNG fallback base64
const FALLBACK_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = typeof window !== "undefined" ? window.atob(base64) : "";
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates a realistic mock PNG File & ImageFile object in browser memory using Canvas.
 * Because it produces a genuine `File` instance (`rawFile` & `file`),
 * `uploadActivityPlanImageGroup` will upload it to `/api/activity-plans/[id]/images`
 * and persist it in the database just like a real user-uploaded photo.
 */
export function createMockImageFile(
  label: string = "TEST_IMAGE",
  index: number = 1,
): ImageFile {
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  const fileName = `mock_${safeLabel}_${index}.png`;
  const id = `mock-img-${safeLabel}-${Date.now()}-${index}`;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      id,
      url: "/test/mock-image.png",
      name: fileName,
      size: 1024,
      type: "image/png",
    };
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 260;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 400, 260);
      grad.addColorStop(0, "#0f766e");
      grad.addColorStop(1, "#047857");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 260);

      // Border
      ctx.strokeStyle = "#5eead4";
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 380, 240);

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("🧪 ADMIN UI TEST PHOTO", 30, 65);

      ctx.fillStyle = "#ccfbf1";
      ctx.font = "16px sans-serif";
      ctx.fillText(`หมวด: ${label}`, 30, 115);
      ctx.fillText(`ไฟล์: ${fileName}`, 30, 150);
      ctx.fillText(
        `เวลา: ${new Date().toLocaleTimeString("th-TH")}`,
        30,
        185,
      );
    }

    const dataUrl = canvas.toDataURL("image/png");
    const base64Data = dataUrl.split(",")[1] || FALLBACK_PNG_BASE64;
    const bytes = base64ToUint8Array(base64Data);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "image/png" });
    const file = new File([blob], fileName, {
      type: "image/png",
      lastModified: Date.now(),
    });
    const objectUrl = URL.createObjectURL(file);

    return {
      id,
      url: objectUrl,
      name: fileName,
      size: file.size,
      type: "image/png",
      rawFile: file,
    };
  } catch {
    const bytes = base64ToUint8Array(FALLBACK_PNG_BASE64);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "image/png" });
    const file = new File([blob], fileName, {
      type: "image/png",
      lastModified: Date.now(),
    });
    const objectUrl = URL.createObjectURL(file);

    return {
      id,
      url: objectUrl,
      name: fileName,
      size: file.size,
      type: "image/png",
      rawFile: file,
    };
  }
}
