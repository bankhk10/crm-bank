import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty, formatMoney } from "../templates/template-helpers";

export class Type3PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_3";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t3Targets: any[] = Array.isArray(targets?.type3)
      ? targets.type3
      : Array.isArray((plan as any).type3Targets)
      ? (plan as any).type3Targets
      : [];

    const title = "[TYPE 3] เสนอขายสินค้า (Quotation & Sales Pitch)";

    if (t3Targets.length === 0) {
      return {
        title,
        workTypeCode: this.workTypeCode,
        planHtml: `
          <div class="section-box">
            <div class="section-header">${title}</div>
            <div class="section-body">
              <p style="color: #64748b; font-style: italic; margin: 0;">ไม่มีรายการเสนอขายสินค้าที่ระบุ</p>
            </div>
          </div>
        `,
      };
    }

    const rowsHtml = t3Targets
      .map((item, idx) => {
        const customer = item.customerName || item.storeName || item.customer || item.store?.name || "-";
        const product = item.productName || item.product?.name || "-";
        const targetQty = item.targetQuantity || item.targetQty || 1;
        const targetPrice = item.targetPrice || item.price || 0;
        const unit = item.unit || "หน่วย";

        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 600; color: #0f3568;">${safeHtml(customer)}</td>
            <td>${safeHtml(product)}</td>
            <td class="text-center">${formatQty(targetQty)} ${safeHtml(unit)}</td>
            <td class="text-right" style="font-weight: 600;">${targetPrice > 0 ? `฿${formatMoney(targetPrice)}` : "-"}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวม ${t3Targets.length} รายการ</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 6%;">ลำดับ</th>
                <th style="width: 32%;">ชื่อร้านค้า / ลูกค้า</th>
                <th style="width: 32%;">รายการสินค้าที่เสนอขาย</th>
                <th class="text-center" style="width: 15%;">จำนวนเป้าหมาย</th>
                <th class="text-right" style="width: 15%;">ราคาที่เสนอ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Actual sales
    let actualHtml = "";
    const salesDetails = parsedResults?.t3ProductSalesDetails || [];
    if (salesDetails.length > 0 || parsedResults?.t3ActualSales) {
      const actualRows = salesDetails
        .map((s: any, idx: number) => {
          const cust = s.customer || s.storeName || "-";
          const prod = s.productName || "-";
          const qty = s.actualQty || 0;
          const total = s.actualSales ? `฿${formatMoney(s.actualSales)}` : "-";
          const reason = s.unclosedReason || "-";

          return `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td style="font-weight: 600;">${safeHtml(cust)}</td>
              <td>${safeHtml(prod)}</td>
              <td class="text-center">${formatQty(qty)}</td>
              <td class="text-right" style="font-weight: 700; color: #059669;">${total}</td>
              <td style="font-size: 8.5px; color: #64748b;">${safeHtml(reason)}</td>
            </tr>
          `;
        })
        .join("");

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการเสนอขายจริง (Type 3 Actual Sales Outcome)</span>
            <span style="font-weight: 700; color: #15803d;">ยอดขายรวม: ฿${formatMoney(parsedResults?.t3ActualSales ? Number(parsedResults.t3ActualSales) : 0)}</span>
          </div>
          <div class="section-body" style="padding: 0;">
            <table class="doc-table" style="margin: 0;">
              <thead>
                <tr>
                  <th class="text-center" style="width: 5%;">ลำดับ</th>
                  <th style="width: 25%;">ลูกค้า / ร้านค้า</th>
                  <th style="width: 25%;">สินค้าที่ปิดการขาย</th>
                  <th class="text-center" style="width: 12%;">จำนวนที่ขายได้</th>
                  <th class="text-right" style="width: 15%;">ยอดขายจริง</th>
                  <th style="width: 18%;">หมายเหตุ / เหตุผลที่ปิดไม่ได้</th>
                </tr>
              </thead>
              <tbody>
                ${actualRows}
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

