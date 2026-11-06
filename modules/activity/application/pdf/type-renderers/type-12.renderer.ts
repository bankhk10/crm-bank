import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty } from "../templates/template-helpers";
import { renderApprovalBoxes } from "../templates/approval-boxes.template";
import {
  extractType12PlanTargets,
  type Type12TargetItem,
} from "@/modules/activity/features/type-12";

export class Type12PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_12";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type12Targets or targets.t12List)
    let t12List: Type12TargetItem[] = [];
    if (targets?.t12List && targets.t12List.length > 0) {
      t12List = targets.t12List;
    } else if (targets?.t12 && (targets.t12.destination || targets.t12.storeName || targets.t12.tourType)) {
      t12List = [targets.t12];
    } else {
      const extracted = extractType12PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t12List = extracted.list;
      } else if (extracted.primary && (extracted.primary.destination || extracted.primary.storeName)) {
        t12List = [extracted.primary];
      }
    }

    if (t12List.length === 0) {
      t12List = [
        {
          tourType: "STORE",
          destination: planSummary.locationStr || plan.title || "ศึกษาดูงาน",
          storeName: (plan as any).customer?.name || "-",
        },
      ];
    }

    const title = "[TYPE 12] พาลูกค้าศึกษาดูงาน (Customer Study Tour)";

    const targetsHtml = t12List
      .map((item, idx) => {
        const typeLabel =
          item.tourType === "STORE"
            ? "ทัวร์ร้านค้า"
            : item.tourType === "CENTRAL"
              ? "ทัวร์ส่วนกลาง"
              : "ศึกษาดูงาน";

        const sizeLabel =
          item.tourSize === "LARGE"
            ? "ขนาดใหญ่"
            : item.tourSize === "SMALL"
              ? "ขนาดเล็ก"
              : "-";

        const storeName = item.storeName || (plan as any).customer?.name || "-";
        const destination = item.destination || planSummary.locationStr || "-";
        const country = item.country ? ` (${item.country})` : "";
        const detail = item.detail || "-";

        return `
        <div style="${idx > 0 ? "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" : ""}">
          ${
            t12List.length > 1
              ? `<div style="font-weight: 700; font-size: 11px; color: #0f3568; margin-bottom: 4px;">
                   📍 รายการดูงานที่ ${idx + 1}: ${safeHtml(destination)}
                 </div>`
              : ""
          }
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ประเภทกิจกรรมศึกษาดูงาน:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">
                  <span class="doc-badge badge-blue">${typeLabel}</span>
                  ${sizeLabel !== "-" ? `<span class="doc-badge badge-slate" style="margin-left: 4px;">${sizeLabel}</span>` : ""}
                </span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ร้านค้า / ลูกค้าที่ร่วมเดินทาง:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(storeName)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">จุดหมายปลายทาง / สถานที่ดูงาน:</span>
                <span class="info-value" style="font-weight: 600; color: #166534;">${safeHtml(destination)}${safeHtml(country)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">รายละเอียดกำหนดการ:</span>
                <span class="info-value">${safeHtml(detail)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          ${
            t12List.length > 1
              ? `<span style="font-size: 9px; color: #64748b; font-weight: normal;">รวมทั้งหมด ${t12List.length} รายการ</span>`
              : ""
          }
        </div>
        <div class="section-body">
          ${targetsHtml}
        </div>
      </div>
    `;

    // 2. Actual Tour Outcome Section
    let actualHtml = "";
    const actualAttendees =
      parsedResults?.type12Actual?.actualAttendees != null &&
      parsedResults.type12Actual.actualAttendees !== ""
        ? parsedResults.type12Actual.actualAttendees
        : parsedResults?.t12ActualAttendees != null &&
          parsedResults.t12ActualAttendees !== ""
          ? parsedResults.t12ActualAttendees
          : null;

    const tourHighlights =
      parsedResults?.type12Actual?.tourHighlights ||
      parsedResults?.t12TourHighlights ||
      parsedResults?.problemFound;

    const feedbackIssues =
      parsedResults?.type12Actual?.feedbackIssues ||
      parsedResults?.t12FeedbackIssues;

    const hasActualData = Boolean(
      actualAttendees != null || tourHighlights || feedbackIssues,
    );

    if (hasActualData) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการพาลูกค้าศึกษาดูงานจริง (Type 12 Actual Tour Outcome)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ผู้ร่วมเดินทางจริง:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669; font-size: 11px;">
                    ${actualAttendees ? `${formatQty(actualAttendees)} คน` : "-"}
                  </span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ข้อเสนอแนะ / ปัญหาที่พบ:</span>
                  <span class="info-value">${safeHtml(feedbackIssues || "การเดินทางเป็นไปด้วยความเรียบร้อย")}</span>
                </div>
              </div>
              ${
                tourHighlights
                  ? `
              <div class="info-row">
                <div class="info-cell" colspan="2">
                  <span class="info-label">สรุปภาพรวมและไฮไลท์การศึกษาดูงาน:</span>
                  <span class="info-value" style="color: #334155;">${safeHtml(tourHighlights)}</span>
                </div>
              </div>
              `
                  : ""
              }
            </div>
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
            roleTitle: "ผู้จัดทัวร์ / ผู้แทนฝ่ายขาย",
            position: "ผู้ประสานงานดูงาน",
          },
          {
            roleTitle: "ตัวแทนลูกค้า / ร้านค้าผู้ร่วมเดินทาง",
            position: "ตัวแทนผู้ร่วมศึกษาดูงาน",
          },
          {
            roleTitle: "ผู้อนุมัติผลการศึกษาดูงาน",
            position: "ผู้จัดการฝ่ายการตลาด / พัฒนาธุรกิจ",
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
