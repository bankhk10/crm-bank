import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty } from "../templates/template-helpers";

export class Type12PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_12";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary } = context;
    const t12Targets = targets?.type12 || (plan as any).type12Targets || {};

    const title = "[TYPE 12] สำรวจข้อมูลทั่วไป / ทัวร์ (General Survey & Tour)";

    const location = t12Targets.location || planSummary.locationStr || "-";
    const objective = t12Targets.objective || plan.title || "สำรวจข้อมูลภาคสนาม";
    const targetAttendees = t12Targets.targetAttendees || "-";

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
        </div>
        <div class="section-body">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">วัตถุประสงค์การสำรวจ/ศึกษาดูงาน:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(objective)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สถานที่:</span>
                <span class="info-value">${safeHtml(location)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">กลุ่มเป้าหมาย/จำนวน:</span>
                <span class="info-value">${safeHtml(targetAttendees !== "-" ? `${formatQty(targetAttendees)} คน` : "-")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    let actualHtml = "";
    if (parsedResults?.t12ActualAttendees || parsedResults?.t12TourHighlights) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>สรุปผลการศึกษาดูงานจริง (Type 12 Tour Findings)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ผู้ร่วมเดินทางจริง:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669;">
                    ${safeHtml(parsedResults.t12ActualAttendees ? `${formatQty(parsedResults.t12ActualAttendees)} คน` : "-")}
                  </span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ไฮไลท์สำคัญ:</span>
                  <span class="info-value">${safeHtml(parsedResults.t12TourHighlights || "-")}</span>
                </div>
              </div>
              ${
                parsedResults.t12FeedbackIssues
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">ข้อคิดเห็นและปัญหาที่พบ:</span>
                        <span class="info-value">${safeHtml(parsedResults.t12FeedbackIssues)}</span>
                      </div>
                     </div>`
                  : ""
              }
            </div>
          </div>
        </div>
      `;
    }

    return {
      title,
      workTypeCode: this.workTypeCode,
      planHtml,
      actualHtml,
    };
  }
}

