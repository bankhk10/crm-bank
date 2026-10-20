import { useState, useCallback } from "react";
import type { Type12ImageFile } from "../../shared/types";

export interface UseType12ActualOptions {
  initialAttendees?: string | number;
  initialHighlights?: string;
  initialFeedback?: string;
  initialImages?: Type12ImageFile[];
}

export interface UseType12ActualResult {
  actualAttendees: string;
  setActualAttendees: React.Dispatch<React.SetStateAction<string>>;
  tourHighlights: string;
  setTourHighlights: React.Dispatch<React.SetStateAction<string>>;
  feedbackIssues: string;
  setFeedbackIssues: React.Dispatch<React.SetStateAction<string>>;
  images: Type12ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<Type12ImageFile[]>>;
  hydrate: (parsedSummary?: any, attachments?: any[]) => void;
  uploadImages: (files: File[]) => Promise<Type12ImageFile[]>;
  collectPayload: () => {
    actualAttendees?: number;
    tourHighlights?: string;
    feedbackIssues?: string;
    images?: Type12ImageFile[];
  };
}

export function useType12Actual(
  options: UseType12ActualOptions = {},
): UseType12ActualResult {
  const [actualAttendees, setActualAttendees] = useState<string>(
    options.initialAttendees !== undefined ? String(options.initialAttendees) : "",
  );
  const [tourHighlights, setTourHighlights] = useState<string>(
    options.initialHighlights || "",
  );
  const [feedbackIssues, setFeedbackIssues] = useState<string>(
    options.initialFeedback || "",
  );
  const [images, setImages] = useState<Type12ImageFile[]>(
    options.initialImages || [],
  );

  const hydrate = useCallback(
    (parsedSummary?: any, attachments: any[] = []) => {
      if (parsedSummary) {
        if (parsedSummary.actualAttendees !== undefined) {
          setActualAttendees(String(parsedSummary.actualAttendees));
        } else if (parsedSummary.summary) {
          const match = parsedSummary.summary.match(/ผู้ร่วมเดินทางจริง:\s*(\d+)/);
          if (match) setActualAttendees(match[1]);
        }

        if (parsedSummary.tourHighlights) {
          setTourHighlights(parsedSummary.tourHighlights);
        } else if (parsedSummary.summary) {
          const match = parsedSummary.summary.match(/ไฮไลท์การดูงาน:\s*([^|]+)/);
          if (match) setTourHighlights(match[1].trim());
        }

        if (parsedSummary.feedbackIssues) {
          setFeedbackIssues(parsedSummary.feedbackIssues);
        } else if (parsedSummary.summary) {
          const match = parsedSummary.summary.match(/ข้อคิดเห็น\/ปัญหา:\s*([^|]+)/);
          if (match) setFeedbackIssues(match[1].trim());
        }
      }

      if (Array.isArray(attachments) && attachments.length > 0) {
        const t12Atts = attachments
          .filter(
            (a) =>
              a.workTypeCode === "TYPE_12" ||
              a.category === "TOUR" ||
              a.category === "IMAGE",
          )
          .map((a) => ({
            id: a.id,
            url: a.fileUrl || a.url,
            name: a.fileName || a.name || "ภาพกิจกรรมศึกษาดูงาน",
            size: a.fileSize || a.size || 0,
            type: a.mimeType || a.type || "image/jpeg",
          }));
        if (t12Atts.length > 0) {
          setImages(t12Atts);
        }
      }
    },
    [],
  );

  const uploadImages = useCallback(async (files: File[]): Promise<Type12ImageFile[]> => {
    if (!files || files.length === 0) return [];

    const uploaded: Type12ImageFile[] = files.map((item, idx) => ({
      id: `local-${Date.now()}-${idx}`,
      url: typeof window !== "undefined" ? URL.createObjectURL(item) : "",
      name: item.name,
      size: item.size,
      type: item.type,
      rawFile: item,
      file: item,
    }));

    setImages((prev) => [...prev, ...uploaded]);
    return uploaded;
  }, []);

  const collectPayload = useCallback(() => {
    return {
      actualAttendees: actualAttendees.trim() ? Number(actualAttendees) : undefined,
      tourHighlights: tourHighlights.trim() || undefined,
      feedbackIssues: feedbackIssues.trim() || undefined,
      images,
    };
  }, [actualAttendees, tourHighlights, feedbackIssues, images]);

  return {
    actualAttendees,
    setActualAttendees,
    tourHighlights,
    setTourHighlights,
    feedbackIssues,
    setFeedbackIssues,
    images,
    setImages,
    hydrate,
    uploadImages,
    collectPayload,
  };
}
