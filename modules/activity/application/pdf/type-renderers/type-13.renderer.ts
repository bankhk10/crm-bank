import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty, formatDateThai } from "../templates/template-helpers";
import { renderApprovalBoxes } from "../templates/approval-boxes.template";
import {
  extractType13PlanTargets,
  type Type13PlotItem,
} from "@/modules/activity/features/type-13";

export class Type13PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_13";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type13Targets, targets.t13List, or plan.type13Plots)
    let t13List: Type13PlotItem[] = [];
    if (targets?.t13List && targets.t13List.length > 0) {
      t13List = targets.t13List;
    } else if (targets?.t13 && (targets.t13.name || targets.t13.ownerName)) {
      t13List = [targets.t13];
    } else {
      const extracted = extractType13PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t13List = extracted.list;
      } else if (extracted.primary && (extracted.primary.name || extracted.primary.ownerName)) {
        t13List = [extracted.primary];
      }
    }

    if (t13List.length === 0) {
      t13List = [
        {
          id: "t13-default",
          name: plan.title || "แปลงฉีดแฮตแทค",
          storeId: "",
          province: planSummary.locationStr || "-",
          district: "",
          objective: "-",
        },
      ];
    }

    const title = "[TYPE 13] ฉีดแปลงแฮตแทค (Hat-Attack Spraying)";

    const rowsHtml = t13List
      .map((item, idx) => {
        const plotName = item.name || `แปลงที่ ${idx + 1}`;
        const owner = item.ownerName || "-";
        const dealer = item.dealerName || "-";
        const location =
          [item.district, item.province].filter(Boolean).join(", ") ||
          planSummary.locationStr ||
          "-";
        const objective = item.objective || "ฉีดพ่นกำจัดหนอนกระทู้ / เพลี้ย";
        const plotsCount = item.plannedPlotsCount ? `${formatQty(item.plannedPlotsCount)} แปลง` : "1 แปลง";

        const withdrawnList = item.withdrawnProducts || [];
        const chemStr =
          withdrawnList.length > 0
            ? withdrawnList.map((w: any) => `${w.productName} (${w.quantity} ${w.unit || "ขวด"})`).join(", ")
            : "แฮตแทค (Hat-Attack)";

        return `
          <tr>
            <td class="text-center" style="width: 5%;">${idx + 1}</td>
            <td style="width: 28%; font-weight: 600; color: #0f3568;">
              ${safeHtml(plotName)}
              <br/><span style="font-size: 8.5px; color: #64748b;">เจ้าของ: ${safeHtml(owner)}</span>
              ${dealer !== "-" ? `<br/><span style="font-size: 8.5px; color: #475569;">Dealer: ${safeHtml(dealer)}</span>` : ""}
            </td>
            <td style="width: 22%;">
              📍 ${safeHtml(location)}
              <br/><span style="font-size: 8.5px; color: #0f766e; font-weight: 600;">(${safeHtml(plotsCount)})</span>
            </td>
            <td style="width: 22%; color: #b91c1c; font-weight: 600;">${safeHtml(objective)}</td>
            <td style="width: 23%; font-weight: 500;">${safeHtml(chemStr)}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">เป้าหมายฉีดพ่น ${t13List.length} แปลง</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 5%;">ลำดับ</th>
                <th style="width: 28%;">ชื่อแปลง / เกษตรกร</th>
                <th style="width: 22%;">ที่ตั้งแปลง / จำนวน</th>
                <th style="width: 22%;">วัตถุประสงค์ / ศัตรูพืช</th>
                <th style="width: 23%;">เคมีภัณฑ์ที่ใช้ฉีดพ่น</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 2. Actual Spraying Outcome Section
    let actualHtml = "";
    const sprayRounds: any[] =
      parsedResults?.type13Actual?.sprayRounds ||
      parsedResults?.t13SprayRounds ||
      (plan as any).sprayRounds ||
      [];

    const generalNotes =
      parsedResults?.type13Actual?.notes ||
      parsedResults?.t13Notes ||
      parsedResults?.problemFound;

    const hasActualData = sprayRounds.length > 0 || generalNotes;

    if (hasActualData) {
      const sprayRowsHtml =
        sprayRounds.length > 0
          ? `
        <div style="margin-top: 6px;">
          <div style="font-size: 9.5px; font-weight: 700; color: #166534; margin-bottom: 3px;">
            🚁 บันทึกรอบการฉีดพ่นจริง (Spraying Execution Records):
          </div>
          <table class="doc-table">
            <thead>
              <tr style="background: #f0fdf4;">
                <th class="text-center" style="width: 8%;">รอบที่</th>
                <th style="width: 24%;">วันที่และเวลาฉีดพ่น</th>
                <th style="width: 24%;">อุปกรณ์ / วิธีการพ่น</th>
                <th style="width: 22%;">ปริมาณน้ำ / อัตราใช้</th>
                <th style="width: 22%;">สภาพอากาศ / ข้อสังเกต</th>
              </tr>
            </thead>
            <tbody>
              ${sprayRounds
                .map(
                  (sr, sIdx) => `
                <tr>
                  <td class="text-center" style="font-weight: 700; color: #166534;">${sr.roundNumber || sIdx + 1}</td>
                  <td>${safeHtml(sr.sprayDate ? formatDateThai(sr.sprayDate) : "-")} ${sr.sprayTime ? `(${safeHtml(sr.sprayTime)})` : ""}</td>
                  <td style="font-weight: 600;">${safeHtml(sr.sprayMethod || sr.equipment || "โดรนการเกษตร")}</td>
                  <td>${safeHtml(sr.waterVolume || sr.dosage || "-")}</td>
                  <td>${safeHtml(sr.weatherCondition || sr.notes || "-")}</td>
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
            <span>บันทึกผลการฉีดพ่นจริง (Type 13 Actual Spraying Outcome)</span>
          </div>
          <div class="section-body">
            ${sprayRowsHtml}
            ${
              generalNotes
                ? `
            <div style="margin-top: 6px; padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 9px;">
              <span style="font-weight: 700; color: #0f3568;">📝 บันทึกหน้างานและผลการฉีดพ่นเพิ่มเติม:</span>
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
      signatureBoxesHtml = renderApprovalBoxes({
        plan,
        customBoxes: [
          {
            roleTitle: "ผู้ควบคุมการฉีดพ่น / นักบินโดรน",
            position: "ผู้ปฏิบัติงานฉีดพ่น",
          },
          {
            roleTitle: "เกษตรกรเจ้าของแปลงผู้รับบริการ",
            position: "เกษตรกรผู้รับรองแปลง",
          },
          {
            roleTitle: "ผู้อนุมัติผลการปฏิบัติงาน",
            position: "ผู้จัดการฝ่ายเทคนิค / ส่งเสริม",
          },
        ],
      });
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
