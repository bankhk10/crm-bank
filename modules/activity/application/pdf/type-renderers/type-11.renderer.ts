import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml } from "../templates/template-helpers";

export class Type11PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_11";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t11Targets: any[] = Array.isArray(targets?.type11)
      ? targets.type11
      : Array.isArray((plan as any).type11Targets)
      ? (plan as any).type11Targets
      : [];

    const title = "[TYPE 11] ตรวจเยี่ยมลูกค้า (Customer Visits)";

    if (t11Targets.length === 0) {
      return {
        title,
        workTypeCode: this.workTypeCode,
        planHtml: `
          <div class="section-box">
            <div class="section-header">${title}</div>
            <div class="section-body">
              <p style="color: #64748b; font-style: italic; margin: 0;">ไม่มีรายการตรวจเยี่ยมลูกค้าที่ระบุ</p>
            </div>
          </div>
        `,
      };
    }

    const rowsHtml = t11Targets
      .map((item, idx) => {
        const customer = item.customerName || item.storeName || item.customer || "-";
        const purpose = item.objective || item.purpose || "ตรวจเยี่ยมสร้างความสัมพันธ์และเช็กสต็อกสินค้า";

        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 600; color: #0f3568;">${safeHtml(customer)}</td>
            <td>${safeHtml(purpose)}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวม ${t11Targets.length} รายการ</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 6%;">ลำดับ</th>
                <th style="width: 44%;">ลูกค้า / ร้านค้าที่เข้าตรวจเยี่ยม</th>
                <th style="width: 50%;">วัตถุประสงค์การตรวจเยี่ยม</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    let actualHtml = "";
    if (parsedResults?.t11Remarks || parsedResults?.t11StockStatus) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการตรวจเยี่ยมจริง (Type 11 Actual Findings)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">สถานะสต็อกสินค้า:</span>
                  <span class="info-value">${safeHtml(parsedResults.t11StockStatus || "ปกติ")}</span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">โอกาสในการสั่งซื้อซ้ำ:</span>
                  <span class="info-value" style="font-weight: 600; color: #059669;">${safeHtml(parsedResults.t11ReorderOpportunity || "-")}</span>
                </div>
              </div>
              ${
                parsedResults.t11Remarks
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">ข้อคิดเห็นและข้อเสนอแนะ:</span>
                        <span class="info-value">${safeHtml(parsedResults.t11Remarks)}</span>
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

