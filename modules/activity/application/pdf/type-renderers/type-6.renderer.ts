import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml } from "../templates/template-helpers";

export class Type6PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_6";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t6Targets = targets?.type6 || (plan as any).type6Targets || {};

    const title = "[TYPE 6] เรื่องร้องเรียน / แก้ปัญหา (Complaints & Problem Resolution)";

    const customer = t6Targets.customerName || t6Targets.customer || "-";
    const product = t6Targets.productName || t6Targets.product || "-";
    const issue = t6Targets.issue || t6Targets.problemDescription || "-";
    const urgency = t6Targets.urgency || t6Targets.priority || "ปกติ";

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #b91c1c; font-weight: 700;">ระดับความสำคัญ: ${safeHtml(urgency)}</span>
        </div>
        <div class="section-body">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ลูกค้า / ร้านค้าที่ร้องเรียน:</span>
                <span class="info-value" style="font-weight: 600; color: #0f3568;">${safeHtml(customer)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สินค้าที่เกิดปัญหา:</span>
                <span class="info-value">${safeHtml(product)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell" colspan="2">
                <span class="info-label">รายละเอียดปัญหาที่ได้รับแจ้ง:</span>
                <span class="info-value" style="color: #b91c1c;">${safeHtml(issue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Actual resolution
    let actualHtml = "";
    if (parsedResults?.t6RootCause || parsedResults?.t6Solution || parsedResults?.problemFound) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>ผลการตรวจสอบและแนวทางแก้ไข (Type 6 Resolution Findings)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              ${
                parsedResults.t6RootCause
                  ? `<div class="info-row">
                      <div class="info-cell">
                        <span class="info-label">สาเหตุแท้จริงที่ตรวจพบ:</span>
                        <span class="info-value">${safeHtml(parsedResults.t6RootCause)}</span>
                      </div>
                     </div>`
                  : ""
              }
              ${
                parsedResults.t6Solution
                  ? `<div class="info-row">
                      <div class="info-cell">
                        <span class="info-label">แนวทางการแก้ไข / ชดเชย:</span>
                        <span class="info-value" style="color: #15803d; font-weight: 600;">${safeHtml(parsedResults.t6Solution)}</span>
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

