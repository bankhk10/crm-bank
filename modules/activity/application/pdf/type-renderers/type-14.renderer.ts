import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty, formatDateThai } from "../templates/template-helpers";
import {
  extractType14PlanTargets,
  type Type14PlotItem,
} from "@/modules/activity/features/type-14";

export class Type14PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_14";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type14Targets, targets.t14List, or plan.type14Plots)
    let t14List: Type14PlotItem[] = [];
    if (targets?.t14List && targets.t14List.length > 0) {
      t14List = targets.t14List;
    } else if (targets?.t14 && (targets.t14.name || targets.t14.ownerName)) {
      t14List = [targets.t14];
    } else {
      const extracted = extractType14PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t14List = extracted.list;
      } else if (extracted.primary && (extracted.primary.name || extracted.primary.ownerName)) {
        t14List = [extracted.primary];
      }
    }

    if (t14List.length === 0) {
      t14List = [
        {
          id: "t14-default",
          name: plan.title || "แปลงติดตามแฮตแทค",
          province: planSummary.locationStr || "-",
          district: "",
        },
      ];
    }

    const title = "[TYPE 14] ติดตามแปลงแฮตแทค (Hat-Attack Follow-up)";

    const rowsHtml = t14List
      .map((item, idx) => {
        const plotName = item.plotName || item.name || `แปลงที่ ${idx + 1}`;
        const owner = item.ownerName || "-";
        const dealer = item.dealerName || "-";
        const crop = item.cropName || "-";
        const area = item.areaRai ? `${formatQty(item.areaRai)} ไร่` : "-";
        const location =
          [item.district, item.province].filter(Boolean).join(", ") ||
          planSummary.locationStr ||
          "-";

        return `
          <tr>
            <td class="text-center" style="width: 5%;">${idx + 1}</td>
            <td style="width: 30%; font-weight: 600; color: #0f3568;">
              ${safeHtml(plotName)}
              <br/><span style="font-size: 8.5px; color: #64748b;">เจ้าของ: ${safeHtml(owner)}</span>
            </td>
            <td style="width: 25%; font-weight: 500;">${safeHtml(dealer)}</td>
            <td style="width: 20%;">${safeHtml(crop)} (${safeHtml(area)})</td>
            <td style="width: 20%; font-size: 8.5px; color: #475569;">📍 ${safeHtml(location)}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">เป้าหมายติดตาม ${t14List.length} แปลง</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 5%;">ลำดับ</th>
                <th style="width: 30%;">ชื่อแปลง / เกษตรกร</th>
                <th style="width: 25%;">ร้านค้า Dealer ต้นสังกัด</th>
                <th style="width: 20%;">ชนิดพืช / ขนาด</th>
                <th style="width: 20%;">ที่ตั้งแปลง</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 2. Actual Follow-up Rounds Section (Day 3 / Day 7 / Day 14)
    let actualHtml = "";
    const followUpRounds: any[] =
      parsedResults?.type14Actual?.rounds ||
      parsedResults?.t14FollowUpRounds ||
      (plan as any).result?.rounds ||
      [];

    const generalNotes =
      parsedResults?.type14Actual?.notes ||
      parsedResults?.t14Notes ||
      parsedResults?.problemFound;

    const hasActualData = followUpRounds.length > 0 || generalNotes;

    if (hasActualData) {
      const followUpRowsHtml =
        followUpRounds.length > 0
          ? `
        <div style="margin-top: 6px;">
          <div style="font-size: 9.5px; font-weight: 700; color: #166534; margin-bottom: 3px;">
            🔍 บันทึกผลการตรวจนับหนอนและประสิทธิภาพรายรอบ (Evaluation Rounds):
          </div>
          <table class="doc-table">
            <thead>
              <tr style="background: #f0fdf4;">
                <th class="text-center" style="width: 10%;">รอบการตรวจ</th>
                <th style="width: 22%;">วันที่ลงตรวจแปลง</th>
                <th style="width: 28%;">อัตราการกำจัดหนอน / ศัตรูพืช</th>
                <th style="width: 22%;">อาการความเป็นพิษ (Phyto)</th>
                <th style="width: 18%;">ความพึงพอใจ</th>
              </tr>
            </thead>
            <tbody>
              ${followUpRounds
                .map(
                  (fr, fIdx) => `
                <tr>
                  <td class="text-center" style="font-weight: 700; color: #166534;">${safeHtml(fr.dayRound || fr.roundName || `Day ${fIdx * 4 + 3}`)}</td>
                  <td>${safeHtml(fr.evaluationDate ? formatDateThai(fr.evaluationDate) : "-")}</td>
                  <td style="font-weight: 600; color: #0f766e;">${safeHtml(fr.pestReduction || fr.efficacy || "ควบคุมได้ดีมาก")}</td>
                  <td>${safeHtml(fr.phytotoxicity || "ไม่พบอาการใบไหม้")}</td>
                  <td>
                    <span class="doc-badge badge-green">${safeHtml(fr.farmerSatisfaction || "พึงพอใจมาก")}</span>
                  </td>
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
            <span>บันทึกผลการติดตามแปลงแฮตแทคจริง (Type 14 Actual Follow-up Outcome)</span>
          </div>
          <div class="section-body">
            ${followUpRowsHtml}
            ${
              generalNotes
                ? `
            <div style="margin-top: 6px; padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 9px;">
              <span style="font-weight: 700; color: #0f3568;">📝 บันทึกหน้างานและผลการสังเกตการณ์เพิ่มเติม:</span>
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
            <div class="signature-role">ผู้ตรวจติดตามแปลง / เจ้าหน้าที่ส่งเสริม</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้แทนฝ่ายขาย-ส่งเสริม<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">เกษตรกรเจ้าของแปลงผู้รับการติดตาม</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">เกษตรกรผู้รับรองผล<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ผู้อนุมัติผลการประเมินแปลง</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้จัดการฝ่ายเทคนิค / ส่งเสริม<br/>วันที่: ....../....../......</div>
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
