import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml } from "../templates/template-helpers";

export class Type5PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_5";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t5Targets = targets?.type5 || (plan as any).type5Targets || {};

    const title = "[TYPE 5] สำรวจตลาดของคู่แข่ง (Competitor Market Survey)";

    const area = t5Targets.area || t5Targets.location || "-";
    const competitorName = t5Targets.competitorName || t5Targets.competitor || "-";
    const targetProduct = t5Targets.targetProduct || t5Targets.productCategory || "-";

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
        </div>
        <div class="section-body">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 33%;">
                <span class="info-label">พื้นที่สำรวจ:</span>
                <span class="info-value" style="font-weight: 600; color: #0f3568;">${safeHtml(area)}</span>
              </div>
              <div class="info-cell" style="width: 33%;">
                <span class="info-label">คู่แข่งเป้าหมาย:</span>
                <span class="info-value">${safeHtml(competitorName)}</span>
              </div>
              <div class="info-cell" style="width: 34%;">
                <span class="info-label">กลุ่มสินค้าที่สำรวจ:</span>
                <span class="info-value">${safeHtml(targetProduct)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Actual competitor findings
    let actualHtml = "";
    if (parsedResults?.t5Findings || parsedResults?.t5CompetitorPrices) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>สรุปผลการสำรวจตลาดจริง (Type 5 Actual Market Findings)</span>
          </div>
          <div class="section-body">
            <div style="font-size: 10px; color: #1e293b;">
              ${safeHtml(parsedResults.t5Findings || parsedResults.t5CompetitorPrices || "ไม่มีข้อมูล")}
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

