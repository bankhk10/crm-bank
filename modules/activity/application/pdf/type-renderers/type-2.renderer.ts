import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatDateThai } from "../templates/template-helpers";

export class Type2PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_2";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t2Targets: any[] = Array.isArray(targets?.type2)
      ? targets.type2
      : Array.isArray((plan as any).type2Targets)
      ? (plan as any).type2Targets
      : [];

    const title = "[TYPE 2] ติดตามผลการใช้สินค้า (Product Follow-up)";

    if (t2Targets.length === 0) {
      return {
        title,
        workTypeCode: this.workTypeCode,
        planHtml: `
          <div class="section-box">
            <div class="section-header">${title}</div>
            <div class="section-body">
              <p style="color: #64748b; font-style: italic; margin: 0;">ไม่มีรายการติดตามผลการใช้สินค้าที่ระบุ</p>
            </div>
          </div>
        `,
      };
    }

    const rowsHtml = t2Targets
      .map((item, idx) => {
        const farmer = item.customerName || item.farmerName || item.customer || `เกษตรกรที่ ${idx + 1}`;
        const product = item.productName || item.product?.name || "-";
        const crop = item.crop || item.cropName || "-";
        const startDate = item.startDate ? formatDateThai(item.startDate) : "-";

        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 600; color: #0f3568;">${safeHtml(farmer)}</td>
            <td>${safeHtml(crop)}</td>
            <td style="font-weight: 600;">${safeHtml(product)}</td>
            <td class="text-center">${safeHtml(startDate)}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวม ${t2Targets.length} รายการ</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 6%;">ลำดับ</th>
                <th style="width: 30%;">เกษตรกร / ร้านค้า</th>
                <th style="width: 20%;">ชนิดพืช</th>
                <th style="width: 25%;">สินค้าที่ติดตาม</th>
                <th class="text-center" style="width: 19%;">วันที่เริ่มใช้</th>
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
    const followupList = parsedResults?.t2FollowupResults || [];
    if (followupList.length > 0) {
      const actRows = followupList
        .map((f: any, idx: number) => `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 600;">${safeHtml(f.customer || "-")}</td>
            <td>${safeHtml(f.productName || "-")}</td>
            <td style="color: #059669; font-weight: 600;">${safeHtml(f.usageResult || "พึงพอใจ")}</td>
            <td>${safeHtml(f.notes || "-")}</td>
          </tr>
        `)
        .join("");

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการติดตามการใช้สินค้าจริง (Type 2 Actual Results)</span>
          </div>
          <div class="section-body" style="padding: 0;">
            <table class="doc-table" style="margin: 0;">
              <thead>
                <tr>
                  <th class="text-center" style="width: 5%;">ลำดับ</th>
                  <th style="width: 25%;">เกษตรกร / ร้านค้า</th>
                  <th style="width: 25%;">สินค้า</th>
                  <th style="width: 20%;">ผลการใช้สินค้า</th>
                  <th style="width: 25%;">ข้อสังเกตเพิ่มเติม</th>
                </tr>
              </thead>
              <tbody>
                ${actRows}
              </tbody>
            </table>
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

