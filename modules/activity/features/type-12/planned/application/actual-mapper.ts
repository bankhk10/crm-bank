import type { Type12ActualRecord } from "../types/actual.types";
import type { Type12ImageFile } from "../../shared/types";

export function parseType12ActualResult(result: any): Type12ActualRecord {
  if (!result) return {};

  const summary = result.summary || "";
  let actualAttendees: string | number | undefined;
  let tourHighlights: string | undefined;
  let feedbackIssues: string | undefined;

  const attendeesMatch = summary.match(/ผู้ร่วมเดินทางจริง:\s*(\d+)/);
  if (attendeesMatch) {
    actualAttendees = Number(attendeesMatch[1]);
  } else if (result.actualAttendees) {
    actualAttendees = result.actualAttendees;
  }

  const highlightsMatch = summary.match(/ไฮไลท์การดูงาน:\s*([^|]+)/);
  if (highlightsMatch) {
    tourHighlights = highlightsMatch[1].trim();
  } else if (result.tourHighlights) {
    tourHighlights = result.tourHighlights;
  }

  const feedbackMatch = summary.match(/ข้อคิดเห็น\/ปัญหา:\s*([^|]+)/);
  if (feedbackMatch) {
    feedbackIssues = feedbackMatch[1].trim();
  } else if (result.feedbackIssues) {
    feedbackIssues = result.feedbackIssues;
  }

  const images: Type12ImageFile[] = Array.isArray(result.attachments)
    ? result.attachments
        .filter(
          (a: any) =>
            a.workTypeCode === "TYPE_12" ||
            a.category === "TOUR" ||
            a.category === "IMAGE",
        )
        .map((a: any) => ({
          id: a.id,
          url: a.fileUrl || a.url,
          name: a.fileName || a.name || "ภาพกิจกรรมศึกษาดูงาน",
          size: a.fileSize || a.size || 0,
          type: a.mimeType || a.type || "image/jpeg",
        }))
    : [];

  return {
    actualAttendees,
    tourHighlights,
    feedbackIssues,
    images,
  };
}
