import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatMoney, formatQty } from "../templates/template-helpers";

export class Type1PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_1";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t1Targets: any[] = Array.isArray(targets?.type1)
      ? targets.type1
      : Array.isArray((plan as any).type1Targets)
      ? (plan as any).type1Targets
      : [];

    const title = "[TYPE 1] เข้าพบร้านค้า / เกษตรกร (Store & Key Farmer Visits)";

    if (t1Targets.length === 0) {
      return {
        title,
        workTypeCode: this.workTypeCode,
        planHtml: `
          <div class="section-box">
            <div class="section-header">${title}</div>
            <div class="section-body">
              <p style="color: #64748b; font-style: italic; margin: 0;">ไม่มีรายการร้านค้าหรือเกษตรกรเป้าหมายที่ระบุ</p>
            </div>
          </div>
        `,
      };
    }

    const rowsHtml = t1Targets
      .map((item, idx) => {
        const storeName =
          item.storeName ||
          item.name ||
          item.store?.name ||
          item.customerName ||
          "-";
        const contactPerson = item.contactPerson || item.owner || item.contact || "-";
        const phone = item.phone || item.contactPhone || item.ownerPhone || "-";
        const objective = item.objective || item.purpose || "-";
        const products = Array.isArray(item.products)
          ? item.products
              .map((p: any) => p.name || p.productName || p.product?.name)
              .filter(Boolean)
              .join(", ")
          : typeof item.products === "string"
          ? item.products
          : "-";

        return `
          <tr>
            <td class="text-center" style="width: 5%;">${idx + 1}</td>
            <td style="width: 28%; font-weight: 600; color: #0f3568;">
              ${safeHtml(storeName)}
              ${item.customerCode ? `<br/><span style="font-size: 8.5px; color: #64748b;">รหัส: ${safeHtml(item.customerCode)}</span>` : ""}
            </td>
            <td style="width: 22%;">
              ${safeHtml(contactPerson)}
              ${phone !== "-" ? `<br/><span style="font-size: 8.5px; color: #64748b;">โทร: ${safeHtml(phone)}</span>` : ""}
            </td>
            <td style="width: 25%;">${safeHtml(objective)}</td>
            <td style="width: 20%;">${safeHtml(products || "-")}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">เป้าหมายรวม ${t1Targets.length} รายการ</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 5%;">ลำดับ</th>
                <th style="width: 28%;">ชื่อร้านค้า / เกษตรกร</th>
                <th style="width: 22%;">บุคคลที่เข้าพบ / เบอร์โทร</th>
                <th style="width: 25%;">วัตถุประสงค์การเข้าพบ</th>
                <th style="width: 20%;">รายการสินค้าเป้าหมาย</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Actual section
    let actualHtml = "";
    const t1ActualList = Array.isArray(parsedResults?.t1Visits)
      ? parsedResults.t1Visits
      : Array.isArray((plan as any).type1Results)
      ? (plan as any).type1Results
      : [];

    if (t1ActualList.length > 0) {
      const actualRows = t1ActualList
        .map((act: any, idx: number) => {
          const storeName = act.storeName || act.store?.name || `ร้านที่ ${idx + 1}`;
          const visitedPerson = act.visitedPerson || act.actualContact || "-";
          const discussion = act.discussionSummary || act.notes || act.resultOutcome || "-";
          const orderAmount = act.orderAmount ? `฿${formatMoney(act.orderAmount)}` : "-";

          return `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td style="font-weight: 600;">${safeHtml(storeName)}</td>
              <td>${safeHtml(visitedPerson)}</td>
              <td>${safeHtml(discussion)}</td>
              <td class="text-right" style="font-weight: 600; color: #059669;">${orderAmount}</td>
            </tr>
          `;
        })
        .join("");

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการเข้าพบจริง (Type 1 Actual Visits)</span>
          </div>
          <div class="section-body" style="padding: 0;">
            <table class="doc-table" style="margin: 0;">
              <thead>
                <tr>
                  <th class="text-center" style="width: 5%;">ลำดับ</th>
                  <th style="width: 30%;">ร้านค้าที่เข้าพบจริง</th>
                  <th style="width: 20%;">บุคคลที่ได้พบ</th>
                  <th style="width: 30%;">สรุปการเจรจา / ประเด็นพูดคุย</th>
                  <th class="text-right" style="width: 15%;">ยอดคำสั่งซื้อ</th>
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

