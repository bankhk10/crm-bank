import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import type { ParsedSummaryValues } from "@/modules/activity/domain/summary";
import { formatDateThai, safeHtml } from "./template-helpers";

interface ActualResultSectionProps {
  plan: ActivityPlanWithRelations;
  parsedResults?: ParsedSummaryValues;
  includePhotos?: boolean;
}

export function renderActualResultSection({
  plan,
  parsedResults = {},
  includePhotos = true,
}: ActualResultSectionProps): string {
  const status =
    parsedResults.activityResultStatus ||
    (plan as any).result?.resultStatus ||
    "COMPLETED";

  let statusLabel = "ดำเนินการเสร็จสิ้น (COMPLETED)";
  let badgeClass = "badge-green";

  if (status === "PARTIAL") {
    statusLabel = "ดำเนินการบางส่วน (PARTIAL)";
    badgeClass = "badge-blue";
  } else if (status === "POSTPONED") {
    statusLabel = "เลื่อนการปฏิบัติงาน (POSTPONED)";
    badgeClass = "badge-amber";
  } else if (status === "CANCELLED") {
    statusLabel = "ยกเลิกการปฏิบัติงาน (CANCELLED)";
    badgeClass = "badge-red";
  }

  // Postponed info
  const postponedDate = parsedResults.postponedDate
    ? formatDateThai(parsedResults.postponedDate)
    : "";
  const postponedTime = parsedResults.postponedTime || "";
  const postponedReason = parsedResults.postponedReason || "";
  const postponedNotes = parsedResults.postponedNotes || "";

  // Cancel info
  const cancelReason = parsedResults.cancelReason || "";

  // Problem & Next Action
  const problemFound = parsedResults.problemFound || "";
  const nextAction = parsedResults.nextAction || "";

  // Extract photos
  const rawImages: any[] = [];
  if (Array.isArray(parsedResults.images)) rawImages.push(...parsedResults.images);
  if (Array.isArray(parsedResults.t7Images)) rawImages.push(...parsedResults.t7Images);
  if (Array.isArray(parsedResults.t11Images)) rawImages.push(...parsedResults.t11Images);
  if (Array.isArray(parsedResults.t12Images)) rawImages.push(...parsedResults.t12Images);
  if (Array.isArray(parsedResults.t13Images)) rawImages.push(...parsedResults.t13Images);
  if (Array.isArray((plan as any).result?.images)) {
    rawImages.push(...(plan as any).result.images);
  }

  const validPhotos = rawImages
    .map((img) => (typeof img === "string" ? img : img?.url || img?.previewUrl))
    .filter((url): url is string => Boolean(url && typeof url === "string"));

  const uniquePhotos = Array.from(new Set(validPhotos));

  return `
  <div class="section-box avoid-break">
    <div class="section-header">
      <span>ผลการปฏิบัติงานจริงและปัญหาที่พบ (Actual Execution Summary)</span>
      <span class="doc-badge ${badgeClass}">${statusLabel}</span>
    </div>
    <div class="section-body">
      ${
        status === "POSTPONED"
          ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
          <div style="font-weight: 700; color: #b45309; margin-bottom: 4px;">📅 รายละเอียดการเลื่อนนัดหมาย:</div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">วันที่เลื่อนไปเป็น:</span>
                <span class="info-value">${safeHtml(postponedDate)} ${postponedTime ? `เวลา ${safeHtml(postponedTime)}` : ""}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สาเหตุการเลื่อน:</span>
                <span class="info-value">${safeHtml(postponedReason || "-")}</span>
              </div>
            </div>
            ${
              postponedNotes
                ? `<div class="info-row">
                    <div class="info-cell" colspan="2">
                      <span class="info-label">หมายเหตุการเลื่อน:</span>
                      <span class="info-value">${safeHtml(postponedNotes)}</span>
                    </div>
                   </div>`
                : ""
            }
          </div>
        </div>
        `
          : ""
      }

      ${
        status === "CANCELLED" && cancelReason
          ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
          <div style="font-weight: 700; color: #b91c1c; margin-bottom: 4px;">⚠️ สาเหตุการขอยกเลิก:</div>
          <div style="font-size: 10px; color: #7f1d1d;">${safeHtml(cancelReason)}</div>
        </div>
        `
          : ""
      }

      ${
        problemFound || nextAction
          ? `
        <div class="info-grid" style="margin-top: 4px;">
          ${
            problemFound
              ? `<div class="info-row">
                  <div class="info-cell">
                    <span class="info-label">ปัญหาหรืออุปสรรคที่พบ:</span>
                    <span class="info-value" style="color: #c2410c;">${safeHtml(problemFound)}</span>
                  </div>
                 </div>`
              : ""
          }
          ${
            nextAction
              ? `<div class="info-row">
                  <div class="info-cell">
                    <span class="info-label">แนวทางการแก้ไข / นัดหมายครั้งถัดไป:</span>
                    <span class="info-value" style="color: #15803d;">${safeHtml(nextAction)}</span>
                  </div>
                 </div>`
              : ""
          }
        </div>
        `
          : ""
      }

      ${
        includePhotos && uniquePhotos.length > 0
          ? `
        <div style="margin-top: 10px; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
          <div style="font-weight: 700; font-size: 10px; color: #0f3568; margin-bottom: 6px;">
            📷 แกลเลอรีรูปถ่ายผลการปฏิบัติงาน (${uniquePhotos.length} รูป)
          </div>
          <div class="gallery-grid">
            ${(() => {
              let html = "";
              for (let i = 0; i < uniquePhotos.length; i += 2) {
                const img1 = uniquePhotos[i];
                const img2 = uniquePhotos[i + 1];
                html += `<div class="gallery-row">
                  <div class="gallery-cell">
                    <img src="${img1}" class="gallery-img" alt="Photo ${i + 1}" />
                    <div class="gallery-caption">ภาพที่ ${i + 1}</div>
                  </div>
                  ${
                    img2
                      ? `<div class="gallery-cell">
                          <img src="${img2}" class="gallery-img" alt="Photo ${i + 2}" />
                          <div class="gallery-caption">ภาพที่ ${i + 2}</div>
                        </div>`
                      : `<div class="gallery-cell" style="border: none; background: transparent;"></div>`
                  }
                </div>`;
              }
              return html;
            })()}
          </div>
        </div>
        `
          : ""
      }
    </div>
  </div>
  `;
}

