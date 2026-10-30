import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatMoney } from "../templates/template-helpers";

export class Type9PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_9";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, plan, planSummary } = context;
    const t9Targets = targets?.type9 || (plan as any).type9Targets || {};

    const title = "[TYPE 9] จัดกิจกรรมส่งเสริมการขาย / ออกบูธ (Sales Promotion & Booths)";

    const venue = t9Targets.venue || t9Targets.location || planSummary.locationStr || "-";
    const activityName = t9Targets.activityName || t9Targets.name || plan.title || "-";
    const budget = t9Targets.budget || planSummary.salesPromotionBudget || 0;

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
        </div>
        <div class="section-body">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ชื่องานกิจกรรม / บูธ:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(activityName)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สถานที่จัดบูธ:</span>
                <span class="info-value">${safeHtml(venue)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">งบประมาณส่งเสริมการขาย (SP):</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${budget > 0 ? `฿${formatMoney(budget)}` : "-"}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">เป้าหมายยอดขาย:</span>
                <span class="info-value">${t9Targets.salesTarget ? `฿${formatMoney(t9Targets.salesTarget)}` : "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return {
      title,
      workTypeCode: this.workTypeCode,
      planHtml,
    };
  }
}

