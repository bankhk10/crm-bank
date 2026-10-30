import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatDateThai } from "../templates/template-helpers";

export class Type14PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_14";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t14Targets: any[] = Array.isArray(targets?.type14)
      ? targets.type14
      : Array.isArray((plan as any).type14Targets)
      ? (plan as any).type14Targets
      : [];

    const title = "[TYPE 14] ติดตามแปลงแฮตแทค (Hat-Attack Follow-up)";

    if (t14Targets.length === 0) {
      return {
        title,
        workTypeCode: this.workTypeCode,
        planHtml: `
          <div class="section-box">
            <div class="section-header">${title}</div>
            <div class="section-body">
              <p style="color: #64748b; font-style: italic; margin: 0;">ไม่มีรายการติดตามแปลงแฮตแทคที่ระบุ</p>
            </div>
          </div>
        `,
      };
    }

    const rowsHtml = t14Targets
      .map((item, idx) => {
        const farmer = item.farmerName || item.owner || `แปลงที่ ${idx + 1}`;
        const round = item.followUpRound || item.dayRound || "Day 3";
        const date = item.scheduledDate || item.date ? formatDateThai(item.scheduledDate || item.date) : "-";
        const targetPest = item.pest || item.targetPest || "-";

        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 600; color: #0f3568;">${safeHtml(farmer)}</td>
            <td class="text-center" style="font-weight: 600;">${safeHtml(round)}</td>
            <td class="text-center">${safeHtml(date)}</td>
            <td>${safeHtml(targetPest)}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">เป้าหมายติดตาม ${t14Targets.length} แปลง</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 6%;">ลำดับ</th>
                <th style="width: 34%;">เกษตรกร / แปลงเป้าหมาย</th>
                <th class="text-center" style="width: 20%;">รอบการติดตาม</th>
                <th class="text-center" style="width: 20%;">กำหนดวันติดตาม</th>
                <th style="width: 20%;">ศัตรูพืชที่ตรวจนับ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Actual result
    let actualHtml = "";
    const t14Actual = parsedResults?.type14Actual || (parsedResults as any);
    if (t14Actual && (t14Actual.mortalityRate || t14Actual.observationNotes)) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการตรวจนับจริง (Type 14 Actual Follow-up Findings)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">อัตราการตายของศัตรูพืช:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669;">
                    ${safeHtml(t14Actual.mortalityRate ? `${t14Actual.mortalityRate}%` : "สูงกว่า 90%")}
                  </span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ผลกระทบต่อพืชประธาน:</span>
                  <span class="info-value">${safeHtml(t14Actual.cropImpact || "ไม่มีอาการใบไหม้ (ปกติ)")}</span>
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

