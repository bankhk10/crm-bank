import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty, formatMoney } from "../templates/template-helpers";

export class Type10PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_10";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary } = context;
    const t10Targets = targets?.type10 || (plan as any).type10Targets || {};

    const title = "[TYPE 10] จัดงาน Field Day (Field Demonstration Day)";

    const venue = t10Targets.venue || t10Targets.location || planSummary.locationStr || "-";
    const farmerTarget = t10Targets.targetFarmers || t10Targets.expectedAttendees || "-";
    const highlightedProduct = t10Targets.productHighlight || t10Targets.productName || "-";
    const demoPlotRef = t10Targets.demoPlotRef || t10Targets.plotName || "-";
    const budget = t10Targets.budget || planSummary.salesPromotionBudget || planSummary.marketingBudget || 0;

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
        </div>
        <div class="section-body">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สถานที่จัดงาน / แปลงสาธิต:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(venue)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">แปลงสาธิตอ้างอิง:</span>
                <span class="info-value">${safeHtml(demoPlotRef)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">สินค้าไฮไลท์ประจำงาน:</span>
                <span class="info-value" style="font-weight: 600; color: #166534;">${safeHtml(highlightedProduct)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">เป้าหมายเกษตรกรร่วมงาน:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(farmerTarget !== "-" ? `${formatQty(farmerTarget)} คน` : "-")}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">งบประมาณจัดงาน (SP/MKT):</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${budget > 0 ? `฿${formatMoney(budget)}` : "-"}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">เป้าหมายยอดขายในงาน:</span>
                <span class="info-value">${t10Targets.salesTarget ? `฿${formatMoney(t10Targets.salesTarget)}` : "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Actual result
    let actualHtml = "";
    const actualFarmers = parsedResults?.actualAttendeesCount || parsedResults?.t10ActualAttendees;
    const actualSales = parsedResults?.t10ActualSales;
    if (actualFarmers || actualSales) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการจัดงาน Field Day จริง (Type 10 Actual Field Day Outcome)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">เกษตรกรเข้าร่วมจริง:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669;">
                    ${actualFarmers ? `${formatQty(actualFarmers)} คน` : "-"}
                  </span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ยอดขายที่ทำได้จริงในงาน:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669;">
                    ${actualSales ? `฿${formatMoney(actualSales)}` : "-"}
                  </span>
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

