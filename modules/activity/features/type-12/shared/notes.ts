import type { Type12TourRecord } from "./types";

/**
 * Format planned notes for Type 12 Tour
 */
export function formatType12PlannedNotes(data: Type12TourRecord): string {
  const isStore =
    data.tourType === "STORE" || data.tourType === "ทัวร์ร้านค้า";

  if (isStore) {
    const parts: string[] = ["[ทัวร์ร้านค้า]"];
    if (data.storeName) parts.push(`ร้านค้า: ${data.storeName}`);
    if (data.destination) parts.push(`สถานที่: ${data.destination}`);
    return parts.join(" | ");
  }

  const parts: string[] = ["[ทัวร์กลาง]"];
  const size =
    data.tourSize === "LARGE" || data.tourSize === "ทัวร์ใหญ่"
      ? "ทัวร์ใหญ่"
      : "ทัวร์เล็ก";
  parts.push(`ขนาดทัวร์: ${size}`);
  if (data.country) parts.push(`ประเทศ: ${data.country}`);
  return parts.join(" | ");
}

/**
 * Format actual summary notes for Type 12 Tour
 */
export function formatType12ActualSummary(params: {
  actualAttendees?: string | number;
  tourHighlights?: string;
  feedbackIssues?: string;
}): string {
  const parts: string[] = ["[ผลการศึกษาดูงาน/ทัวร์]"];
  if (params.actualAttendees) {
    parts.push(`ผู้ร่วมเดินทางจริง: ${params.actualAttendees} คน`);
  }
  if (params.tourHighlights) {
    parts.push(`ไฮไลท์การดูงาน: ${params.tourHighlights}`);
  }
  if (params.feedbackIssues) {
    parts.push(`ข้อคิดเห็น/ปัญหา: ${params.feedbackIssues}`);
  }
  return parts.join(" | ");
}
