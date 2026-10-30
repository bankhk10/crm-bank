import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty, formatMoney } from "../templates/template-helpers";

export class Type8PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_8";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary } = context;
    const t8Targets = targets?.type8 || (plan as any).type8Targets || {};

    const title = "[TYPE 8] จัดประชุม / สัมมนา (Meeting & Seminar)";

    const venue = t8Targets.venue || t8Targets.location || planSummary.locationStr || "-";
    const topic = t8Targets.topic || t8Targets.subject || t8Targets.objective || plan.title || "-";
    const targetAttendees = t8Targets.targetAttendees || t8Targets.expectedAttendees || "-";
    const targetGroup = t8Targets.targetGroup || t8Targets.attendeeGroup || "เกษตรกร / ร้านค้า";
    const budget = t8Targets.budget || planSummary.salesPromotionBudget || planSummary.marketingBudget || 0;

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
        </div>
        <div class="section-body">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">หัวข้อการประชุม/สัมมนา:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(topic)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สถานที่จัดงาน (Venue):</span>
                <span class="info-value">${safeHtml(venue)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">กลุ่มเป้าหมายผู้เข้าร่วม:</span>
                <span class="info-value">${safeHtml(targetGroup)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">เป้าหมายจำนวนคน:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(targetAttendees !== "-" ? `${formatQty(targetAttendees)} คน` : "-")}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">งบประมาณจัดงานที่ขออนุมัติ:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${budget > 0 ? `฿${formatMoney(budget)}` : "-"}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">วิทยากร / ผู้รับผิดชอบ:</span>
                <span class="info-value">${safeHtml(t8Targets.speaker || (plan as any).employee?.firstName || "-")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Actual results
    let actualHtml = "";
    const actualAttendees = parsedResults?.actualAttendeesCount || parsedResults?.t8ActualAttendees;
    if (actualAttendees || parsedResults?.problemFound || parsedResults?.t8ActualSummary) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการจัดประชุมจริง (Type 8 Actual Meeting Summary)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">จำนวนผู้เข้าร่วมจริง:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669;">
                    ${actualAttendees ? `${formatQty(actualAttendees)} คน` : "-"}
                  </span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ความสนใจและผลตอบรับ:</span>
                  <span class="info-value">${safeHtml(parsedResults?.t8Feedback || "ดีมาก")}</span>
                </div>
              </div>
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

