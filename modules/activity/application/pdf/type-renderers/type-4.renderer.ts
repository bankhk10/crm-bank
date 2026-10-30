import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatMoney, formatDateThai } from "../templates/template-helpers";

export class Type4PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_4";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t4Targets: any[] = Array.isArray(targets?.type4)
      ? targets.type4
      : Array.isArray((plan as any).type4Targets)
      ? (plan as any).type4Targets
      : [];

    const title = "[TYPE 4] วางบิล / เก็บเงิน (Billing & Collection)";

    if (t4Targets.length === 0) {
      return {
        title,
        workTypeCode: this.workTypeCode,
        planHtml: `
          <div class="section-box">
            <div class="section-header">${title}</div>
            <div class="section-body">
              <p style="color: #64748b; font-style: italic; margin: 0;">ไม่มีรายการวางบิลหรือเก็บเงินที่ระบุ</p>
            </div>
          </div>
        `,
      };
    }

    const rowsHtml = t4Targets
      .map((item, idx) => {
        const customer = item.customerName || item.storeName || item.customer || "-";
        const invoiceNo = item.invoiceNumber || item.billNumber || item.documentNo || "-";
        const dueDate = item.dueDate ? formatDateThai(item.dueDate) : "-";
        const amount = item.amount || item.targetAmount || 0;

        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 600; color: #0f3568;">${safeHtml(customer)}</td>
            <td>${safeHtml(invoiceNo)}</td>
            <td class="text-center">${safeHtml(dueDate)}</td>
            <td class="text-right" style="font-weight: 700; color: #0f3568;">฿${formatMoney(amount)}</td>
          </tr>
        `;
      })
      .join("");

    const totalTargetAmount = t4Targets.reduce(
      (sum, item) => sum + Number(item.amount || item.targetAmount || 0),
      0,
    );

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">
            ยอดเรียกเก็บตามแผน: ฿${formatMoney(totalTargetAmount)}
          </span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 6%;">ลำดับ</th>
                <th style="width: 34%;">ชื่อร้านค้า / ลูกหนี้</th>
                <th style="width: 25%;">เลขที่ใบแจ้งหนี้ / ใบกำกับ</th>
                <th class="text-center" style="width: 15%;">กำหนดชำระ</th>
                <th class="text-right" style="width: 20%;">ยอดเงินที่ต้องเก็บ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Actual collection
    let actualHtml = "";
    const t4ActualList = Array.isArray(parsedResults?.type4Results)
      ? parsedResults.type4Results
      : [];

    if (t4ActualList.length > 0 || parsedResults?.t4CollectedAmount) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการเก็บเงินจริง (Type 4 Actual Collection Outcome)</span>
            <span style="font-weight: 700; color: #15803d;">ยอดเก็บได้จริง: ฿${formatMoney(parsedResults?.t4CollectedAmount ? Number(parsedResults.t4CollectedAmount) : 0)}</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 33%;">
                  <span class="info-label">รูปแบบการชำระ:</span>
                  <span class="info-value">${safeHtml(parsedResults?.t4PaymentMethod || "โอนเงินเข้าบัญชี")}</span>
                </div>
                <div class="info-cell" style="width: 33%;">
                  <span class="info-label">สถานะเช็ค:</span>
                  <span class="info-value">${safeHtml(parsedResults?.t4ChequeStatus || "-")}</span>
                </div>
                <div class="info-cell" style="width: 34%;">
                  <span class="info-label">วันที่เช็คเคลียร์:</span>
                  <span class="info-value">${safeHtml(parsedResults?.t4ChequeDate ? formatDateThai(parsedResults.t4ChequeDate) : "-")}</span>
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

