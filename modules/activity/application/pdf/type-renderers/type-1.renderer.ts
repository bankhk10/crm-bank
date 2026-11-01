import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatDateThai } from "../templates/template-helpers";
import {
  extractType1PlanTargets,
  type Type1TargetItem,
} from "@/modules/activity/features/type-1";

export class Type1PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_1";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type1Targets or targets.t1List)
    let t1List: Type1TargetItem[] = [];
    if (targets?.t1List && targets.t1List.length > 0) {
      t1List = targets.t1List;
    } else if (targets?.t1 && (targets.t1.customer || targets.t1.topic)) {
      t1List = [targets.t1];
    } else {
      const extracted = extractType1PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t1List = extracted.list;
      } else if (extracted.primary && (extracted.primary.customer || extracted.primary.topic)) {
        t1List = [extracted.primary];
      }
    }

    if (!t1List || t1List.length === 0) {
      t1List = [
        {
          customer: (plan as any).customer?.name || plan.title || "เข้าพบลูกค้า / ร้านค้า",
          topic: "-",
        },
      ];
    }

    const title = "[TYPE 1] เข้าพบร้านค้า / เกษตรกร (Store & Key Farmer Visits)";

    const rowsHtml = t1List
      .map((item, idx) => {
        const isStore = item.visitPurpose === "STORE";
        const isUnregistered = Boolean(item.isUnregisteredFarmer);
        const displayName = isUnregistered
          ? item.unregisteredFarmerName || item.customer || "-"
          : item.customer || "-";

        const phone = item.unregisteredFarmerPhone || "-";
        const purposeLabel = isStore ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร";
        const topic = item.topic || "-";
        const locationStr =
          item.farmerHomeAddress ||
          item.province ||
          "-";

        const notes = item.notes || "-";

        return `
          <tr>
            <td class="text-center" style="width: 5%;">${idx + 1}</td>
            <td style="width: 30%; font-weight: 600; color: #0f3568;">
              ${safeHtml(displayName)}
              <span class="doc-badge ${isStore ? "badge-blue" : "badge-green"}" style="margin-left: 4px;">
                ${purposeLabel}
              </span>
              ${phone !== "-" ? `<br/><span style="font-size: 8.5px; color: #64748b;">โทร: ${safeHtml(phone)}</span>` : ""}
              ${locationStr !== "-" ? `<br/><span style="font-size: 8.5px; color: #475569;">📍 ${safeHtml(locationStr)}</span>` : ""}
            </td>
            <td style="width: 25%; font-weight: 500;">${safeHtml(topic)}</td>
            <td style="width: 40%; color: #334155;">${safeHtml(notes)}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">เป้าหมายรวม ${t1List.length} รายการ</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 5%;">ลำดับ</th>
                <th style="width: 30%;">ชื่อร้านค้า / เกษตรกร</th>
                <th style="width: 25%;">หัวข้อ / วัตถุประสงค์การเข้าพบ</th>
                <th style="width: 40%;">บันทึกรายละเอียดตามแผน</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 2. Actual Visit Outcome Section
    let actualHtml = "";
    const primaryTarget = t1List[0] || {};
    const discussionResult =
      primaryTarget.discussionResult ||
      parsedResults?.discussionResult ||
      parsedResults?.t1DiscussionResult;

    const productAdvice =
      primaryTarget.productAdvice ||
      parsedResults?.productAdvice ||
      parsedResults?.t1ProductAdvice;

    const salesOpportunity =
      primaryTarget.salesOpportunity ||
      parsedResults?.salesOpportunity ||
      parsedResults?.t1SalesOpportunity;

    const nextAction =
      primaryTarget.nextAction ||
      parsedResults?.nextAction ||
      parsedResults?.t1NextAction;

    const nextMeetingDate =
      primaryTarget.nextMeetingDate ||
      parsedResults?.nextMeetingDate ||
      parsedResults?.t1NextMeetingDate;

    const hasActualData = Boolean(
      discussionResult ||
        productAdvice ||
        salesOpportunity ||
        nextAction ||
        nextMeetingDate,
    );

    if (hasActualData) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการเข้าพบจริง (Type 1 Actual Visit Summary)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              ${
                discussionResult
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">ผลการเข้าพบและพูดคุย:</span>
                        <span class="info-value">${safeHtml(discussionResult)}</span>
                      </div>
                     </div>`
                  : ""
              }
              ${
                productAdvice
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">คำแนะนำทางเทคนิค / สินค้าที่แนะนำ:</span>
                        <span class="info-value" style="color: #0f3568; font-weight: 600;">${safeHtml(productAdvice)}</span>
                      </div>
                     </div>`
                  : ""
              }
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">โอกาสการขาย:</span>
                  <span class="info-value">
                    <span class="doc-badge ${
                      salesOpportunity === "สูง"
                        ? "badge-green"
                        : salesOpportunity === "ปานกลาง"
                          ? "badge-blue"
                          : "badge-slate"
                    }">
                      ${safeHtml(salesOpportunity || "-")}
                    </span>
                  </span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">วันนัดหมายครั้งถัดไป:</span>
                  <span class="info-value">${safeHtml(nextMeetingDate ? formatDateThai(nextMeetingDate) : "-")}</span>
                </div>
              </div>
              ${
                nextAction
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">แนวทางการดำเนินการต่อไป:</span>
                        <span class="info-value" style="font-weight: 600; color: #0f766e;">${safeHtml(nextAction)}</span>
                      </div>
                     </div>`
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
      signatureBoxesHtml = `
        <div class="signatures-grid avoid-break">
          <div class="signature-card">
            <div class="signature-role">ผู้แทนฝ่ายขาย / ผู้เข้าพบ</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้แทนฝ่ายขายประจำเขต<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ลูกค้า / เกษตรกรผู้ให้เข้าพบ</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้รับการเข้าพบ<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ผู้อนุมัติผลการปฏิบัติงาน</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้จัดการเขตการขาย<br/>วันที่: ....../....../......</div>
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
