import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatDateThai } from "../templates/template-helpers";

export class Type7bPdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_7B";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t7bTargets: any[] = Array.isArray(targets?.type7b)
      ? targets.type7b
      : Array.isArray((plan as any).type7bTargets)
      ? (plan as any).type7bTargets
      : [];

    const title = "[TYPE 7B] ติดตามแปลงสาธิต (Demo Plot Follow-up)";

    if (t7bTargets.length === 0) {
      return {
        title,
        workTypeCode: this.workTypeCode,
        planHtml: `
          <div class="section-box">
            <div class="section-header">${title}</div>
            <div class="section-body">
              <p style="color: #64748b; font-style: italic; margin: 0;">ไม่มีข้อมูลการติดตามแปลงสาธิตที่ระบุ</p>
            </div>
          </div>
        `,
      };
    }

    const rowsHtml = t7bTargets
      .map((item, idx) => {
        const plotName = item.plotName || item.demoPlotName || `แปลงที่ ${idx + 1}`;
        const farmer = item.farmerName || item.owner || "-";
        const round = item.followUpRound || item.stage || item.dayRound ? `รอบ ${item.followUpRound || item.stage || item.dayRound}` : "-";
        const scheduledDate = item.scheduledDate || item.date ? formatDateThai(item.scheduledDate || item.date) : "-";
        const objective = item.objective || item.focusPoint || "ติดตามประสิทธิภาพการใช้ยาและอัตราการเติบโต";

        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 600; color: #0f3568;">${safeHtml(plotName)}</td>
            <td>${safeHtml(farmer)}</td>
            <td class="text-center" style="font-weight: 600;">${safeHtml(round)}</td>
            <td class="text-center">${safeHtml(scheduledDate)}</td>
            <td>${safeHtml(objective)}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">เป้าหมายติดตาม ${t7bTargets.length} แปลง</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 5%;">ลำดับ</th>
                <th style="width: 25%;">ชื่อแปลงสาธิต</th>
                <th style="width: 20%;">เกษตรกรเจ้าของแปลง</th>
                <th class="text-center" style="width: 15%;">รอบวันติดตาม</th>
                <th class="text-center" style="width: 15%;">กำหนดการเข้าตรวจ</th>
                <th style="width: 20%;">จุดสังเกต / ประเด็นติดตาม</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Actual observation
    let actualHtml = "";
    const t7bActual = parsedResults?.type7bActual || (parsedResults as any);
    if (t7bActual && (t7bActual.observationNotes || t7bActual.growthRate || t7bActual.efficacyScore)) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการติดตามแปลงจริง (Type 7B Actual Follow-up Findings)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 33%;">
                  <span class="info-label">การเจริญเติบโต:</span>
                  <span class="info-value">${safeHtml(t7bActual.growthRate || "ดีตามเกณฑ์")}</span>
                </div>
                <div class="info-cell" style="width: 33%;">
                  <span class="info-label">คะแนนประสิทธิภาพ:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669;">${safeHtml(t7bActual.efficacyScore ? `${t7bActual.efficacyScore}/5 คะแนน` : "-")}</span>
                </div>
                <div class="info-cell" style="width: 34%;">
                  <span class="info-label">เปรียบเทียบแปลงควบคุม:</span>
                  <span class="info-value">${safeHtml(t7bActual.controlComparison || "ดีกว่าแปลงควบคุมชัดเจน")}</span>
                </div>
              </div>
              ${
                t7bActual.observationNotes
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="3">
                        <span class="info-label">ข้อสังเกตเพิ่มเติม:</span>
                        <span class="info-value">${safeHtml(t7bActual.observationNotes)}</span>
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

