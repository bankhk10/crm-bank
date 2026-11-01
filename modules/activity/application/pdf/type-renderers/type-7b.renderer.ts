import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatDateThai, formatQty } from "../templates/template-helpers";
import {
  extractType7bPlanTargets,
  type Type7bTargetItem,
} from "@/modules/activity/features/type-7b";

export class Type7bPdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_7B";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type7bTargets or targets.t7bList)
    let t7bList: Type7bTargetItem[] = [];
    if (targets?.t7bList && targets.t7bList.length > 0) {
      t7bList = targets.t7bList;
    } else if (targets?.t7b && (targets.t7b.plotName || targets.t7b.farmerName || targets.t7b.owner)) {
      t7bList = [targets.t7b];
    } else {
      const extracted = extractType7bPlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t7bList = extracted.list;
      } else if (extracted.primary && (extracted.primary.plotName || extracted.primary.farmerName)) {
        t7bList = [extracted.primary];
      }
    }

    if (t7bList.length === 0) {
      t7bList = [
        {
          plotName: plan.title || "แปลงสาธิต",
          farmerName: (plan as any).customer?.name || "-",
          objective: "-",
        },
      ];
    }

    const title = "[TYPE 7B] ติดตามแปลงสาธิต (Demo Plot Follow-up)";

    const plotsHtml = t7bList
      .map((item, idx) => {
        const plotName = item.plotName || `แปลงสาธิตที่ ${idx + 1}`;
        const farmer = item.farmerName || item.ownerName || item.owner || "-";
        const dealer = item.dealerName || "-";
        const crop = item.cropName || item.crop || item.cropCategory || "-";
        const areaRai = item.areaRai ? `${formatQty(item.areaRai)} ไร่` : "-";
        const location =
          [item.district, item.province].filter(Boolean).join(", ") ||
          planSummary.locationStr ||
          "-";
        const objective = item.objective || item.followUpObjective || item.detail || "ติดตามผลการเจริญเติบโตและประสิทธิภาพเคมีภัณฑ์";

        const withdrawnProducts = item.demoProducts || item.withdrawnProducts || [];

        return `
        <div style="${idx > 0 ? "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" : ""}">
          ${
            t7bList.length > 1
              ? `<div style="font-weight: 700; font-size: 11px; color: #0f3568; margin-bottom: 4px;">
                   📍 แปลงที่ ${idx + 1}: ${safeHtml(plotName)}
                 </div>`
              : ""
          }
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ชื่อแปลงสาธิต:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(plotName)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">เจ้าของแปลง / เกษตรกร:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(farmer)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">ร้านค้า Dealer ต้นสังกัด:</span>
                <span class="info-value">${safeHtml(dealer)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">ชนิดพืช / ขนาดแปลง:</span>
                <span class="info-value">${safeHtml(crop)} (${safeHtml(areaRai)})</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">ที่ตั้งแปลง:</span>
                <span class="info-value">${safeHtml(location)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">วัตถุประสงค์การติดตาม:</span>
                <span class="info-value">${safeHtml(objective)}</span>
              </div>
            </div>
          </div>

          ${
            withdrawnProducts.length > 0
              ? `
          <div style="margin-top: 6px;">
            <div style="font-size: 9px; font-weight: 700; color: #0f3568; margin-bottom: 2px;">
              📦 เคมีภัณฑ์ที่ใช้ในแปลงสาธิต:
            </div>
            <table class="doc-table">
              <thead>
                <tr style="background: #f8fafc;">
                  <th class="text-center" style="width: 8%;">ลำดับ</th>
                  <th style="width: 62%;">ชื่อเคมีภัณฑ์ / ผลิตภัณฑ์</th>
                  <th class="text-center" style="width: 30%;">จำนวนที่เบิกใช้</th>
                </tr>
              </thead>
              <tbody>
                ${withdrawnProducts
                  .map(
                    (p: any, pIdx: number) => `
                  <tr>
                    <td class="text-center">${pIdx + 1}</td>
                    <td style="font-weight: 500;">${safeHtml(p.productName || p.name || "-")}</td>
                    <td class="text-center" style="font-weight: 600; color: #0f3568;">
                      ${formatQty(p.quantity ?? p.targetQuantity ?? 1)} ${safeHtml(p.unit || "หน่วย")}
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }
        </div>
      `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวมติดตาม ${t7bList.length} แปลง</span>
        </div>
        <div class="section-body">
          ${plotsHtml}
        </div>
      </div>
    `;

    // 2. Actual Observation Outcome Section
    let actualHtml = "";
    const rounds: any[] =
      parsedResults?.type7bActual?.t7SprayingRounds ||
      parsedResults?.t7SprayingRounds ||
      [];

    const generalNotes =
      parsedResults?.type7bActual?.notes ||
      parsedResults?.notes ||
      parsedResults?.problemFound;

    const hasActualData = rounds.length > 0 || generalNotes;

    if (hasActualData) {
      const roundsHtml =
        rounds.length > 0
          ? `
        <div style="margin-top: 6px;">
          <div style="font-size: 9.5px; font-weight: 700; color: #166534; margin-bottom: 3px;">
            🌱 บันทึกรอบการพ่นและติดตามผลจริง (Follow-up Rounds):
          </div>
          <table class="doc-table">
            <thead>
              <tr style="background: #f0fdf4;">
                <th class="text-center" style="width: 8%;">รอบที่</th>
                <th style="width: 28%;">วันที่ลงแปลง</th>
                <th style="width: 34%;">ระยะการเจริญเติบโต / สภาพแปลง</th>
                <th style="width: 30%;">ผลการสังเกตการณ์</th>
              </tr>
            </thead>
            <tbody>
              ${rounds
                .map(
                  (r, rIdx) => `
                <tr>
                  <td class="text-center" style="font-weight: 700; color: #166534;">${r.round || rIdx + 1}</td>
                  <td>${safeHtml(r.date ? formatDateThai(r.date) : "-")}</td>
                  <td style="font-weight: 500;">${safeHtml(r.growthStage || r.cropStage || "-")}</td>
                  <td>${safeHtml(r.observation || r.notes || "-")}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
          : "";

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการติดตามแปลงสาธิตจริง (Type 7B Actual Follow-up Outcome)</span>
          </div>
          <div class="section-body">
            ${roundsHtml}
            ${
              generalNotes
                ? `
            <div style="margin-top: 6px; padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 9px;">
              <span style="font-weight: 700; color: #0f3568;">📝 ข้อสังเกตและผลการติดตามเพิ่มเติม:</span>
              <span style="color: #334155;"> ${safeHtml(generalNotes)}</span>
            </div>
            `
                : ""
            }
          </div>
        </div>
      `;
    }

    // 3. Custom Signature Boxes for Standalone Export
    let signatureBoxesHtml: string | undefined = undefined;
    if (options.typeCode && options.typeCode !== "ALL") {
      signatureBoxesHtml = `
        <div class="signatures-grid avoid-break">
          <div class="signature-card">
            <div class="signature-role">ผู้ติดตามแปลง / เจ้าหน้าที่ส่งเสริม</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้แทนฝ่ายขาย-ส่งเสริม<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">เกษตรกรเจ้าของแปลงสาธิต</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">เกษตรกรผู้ร่วมโครงการ<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ผู้อนุมัติผลการติดตามแปลง</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้จัดการฝ่ายส่งเสริมวิชาการ<br/>วันที่: ....../....../......</div>
          </div>
        </div>
      `;
    }

    return {
      title,
      workTypeCode: this.workTypeCode,
      planHtml,
      actualHtml,
      signatureBoxesHtml,
    };
  }
}
