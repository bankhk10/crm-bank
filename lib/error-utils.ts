/**
 * Translates low-level framework/server/database errors into user-friendly Thai messages.
 */
export function formatUserFriendlyError(
  err: any,
  fallbackMessage: string = "เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง",
): string {
  if (!err) return fallbackMessage;

  const raw = typeof err === "string" ? err : err.message || "";
  const lower = raw.toLowerCase();

  // 1. Next.js Server Action body size / payload size limit (HTTP 413)
  if (
    lower.includes("body exceeded") ||
    lower.includes("413") ||
    lower.includes("payload too large") ||
    lower.includes("entity too large")
  ) {
    return "ขนาดข้อมูลหรือไฟล์รูปภาพรวมมีขนาดใหญ่เกินไป กรุณาลดจำนวนรูปภาพหรือเลือกรูปภาพที่มีขนาดเล็กลงแล้วลองใหม่อีกครั้ง";
  }

  // 2. Network / connection issues
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("econnrefused") ||
    lower.includes("timeout") ||
    lower.includes("aborted")
  ) {
    return "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง";
  }

  // 3. Authentication / Session expired (HTTP 401 / 403)
  if (
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return "เซสชันการเข้าสู่ระบบของคุณหมดอายุหรือไม่ได้รับสิทธิ์ กรุณาเข้าสู่ระบบใหม่อีกครั้ง";
  }

  // 4. Server 500 / internal error / crash
  if (
    lower.includes("internal server error") ||
    lower.includes("500") ||
    lower.includes("an unexpected response was received")
  ) {
    return "ระบบเซิร์ฟเวอร์ขัดข้องชั่วคราว ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง";
  }

  // 5. Prisma / Database errors
  if (
    lower.includes("prisma") ||
    lower.includes("unique constraint") ||
    lower.includes("foreign key") ||
    lower.includes("database")
  ) {
    return "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล กรุณาตรวจสอบความถูกต้องของข้อมูลแล้วลองใหม่อีกครั้ง";
  }

  // 6. Next.js digest errors (minified production exceptions)
  if (lower.includes("digest:")) {
    return "เกิดข้อผิดพลาดที่ไม่คาดคิดที่ระบบเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ";
  }

  // 7. If the message is already a clean Thai message without developer URLs/stack traces
  if (
    /[ก-๙]/.test(raw) &&
    !lower.includes("http") &&
    !lower.includes("nextjs.org") &&
    !lower.includes("node_modules")
  ) {
    return raw;
  }

  return raw && !lower.includes("http") ? raw : fallbackMessage;
}

