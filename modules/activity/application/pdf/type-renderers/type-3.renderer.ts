import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty, formatMoney } from "../templates/template-helpers";
import {
  extractType3PlanTargets,
  type Type3TargetItem,
} from "@/modules/activity/features/type-3";

export class Type3PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_3";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type3Targets or targets.t3List)
    let t3List: Type3TargetItem[] = [];
    if (targets?.t3List && targets.t3List.length > 0) {
      t3List = targets.t3List;
    } else if (targets?.t3 && (targets.t3.customer || targets.t3.product || targets.t3.items?.length)) {
      t3List = [targets.t3];
    } else {
      const extracted = extractType3PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t3List = extracted.list;
      } else if (extracted.primary && (extracted.primary.customer || extracted.primary.product)) {
        t3List = [extracted.primary];
      }
    }

    if (t3List.length === 0) {
      t3List = [
        {
          customer: (plan as any).customer?.name || plan.title || "เสนอขายสินค้า",
          detail: "-",
          items: [],
        },
      ];
    }

    const title = "[TYPE 3] เสนอขายสินค้า (Quotation & Sales Pitch)";

    // Flatten planned items from all targets
    const plannedItems = t3List.flatMap((t) =>
      t.items && t.items.length > 0
        ? t.items.map((it: any) => ({
            customer: t.customer || it.customer || "-",
            productName: it.productName || it.product || "-",
            qty: Number(it.qty) || Number(it.quantity) || Number(it.targetQuantity) || 1,
            unitPrice: Number(it.unitPrice) || Number(it.price) || 0,
            unit: it.unit || "หน่วย",
          }))
        : t.product
          ? [
              {
                customer: t.customer || "-",
                productName: t.product,
                qty: Number(t.targetQty) || Number(t.targetQuantity) || 1,
                unitPrice: Number(t.unitPrice) || Number(t.price) || 0,
                unit: t.unit || "หน่วย",
              },
            ]
          : [],
    );

    const totalTargetAmount = plannedItems.reduce(
      (sum, it) => sum + it.qty * it.unitPrice,
      0,
    );

    const planRowsHtml =
      plannedItems.length > 0
        ? plannedItems
            .map((item, idx) => {
              const lineTotal = item.qty * item.unitPrice;
              return `
              <tr>
                <td class="text-center" style="width: 6%;">${idx + 1}</td>
                <td style="width: 32%; font-weight: 600; color: #0f3568;">${safeHtml(item.customer)}</td>
                <td style="width: 32%; font-weight: 500;">${safeHtml(item.productName)}</td>
                <td class="text-center" style="width: 14%;">${formatQty(item.qty)} ${safeHtml(item.unit)}</td>
                <td class="text-right" style="width: 16%;">${item.unitPrice > 0 ? `฿${formatMoney(item.unitPrice)}` : "-"}</td>
              </tr>
            `;
            })
            .join("")
        : `
          <tr>
            <td colspan="5" class="text-center" style="color: #64748b; font-style: italic;">
              ไม่มีรายการสินค้าเป้าหมายที่ระบุ
            </td>
          </tr>
        `;

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวม ${plannedItems.length} รายการเสนอขาย</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 6%;">ลำดับ</th>
                <th style="width: 32%;">ชื่อร้านค้า / ลูกค้า</th>
                <th style="width: 32%;">รายการสินค้าที่เสนอขาย</th>
                <th class="text-center" style="width: 14%;">จำนวนเป้าหมาย</th>
                <th class="text-right" style="width: 16%;">ราคาที่เสนอ</th>
              </tr>
            </thead>
            <tbody>
              ${planRowsHtml}
            </tbody>
            ${
              totalTargetAmount > 0
                ? `<tfoot>
                    <tr style="background: #f8fafc; font-weight: 700;">
                      <td colspan="4" class="text-right">มูลค่าเสนอขายรวมประมาณการ:</td>
                      <td class="text-right" style="color: #0f3568;">฿${formatMoney(totalTargetAmount)}</td>
                    </tr>
                   </tfoot>`
                : ""
            }
          </table>
        </div>
      </div>
    `;

    // 2. Actual Sales Outcome Section
    let actualHtml = "";
    const actualSales =
      parsedResults?.t3ActualSales != null && parsedResults.t3ActualSales !== ""
        ? parsedResults.t3ActualSales
        : parsedResults?.actualSales != null && parsedResults.actualSales !== ""
          ? parsedResults.actualSales
          : null;

    const actualQuantity =
      parsedResults?.t3ActualQuantity != null && parsedResults.t3ActualQuantity !== ""
        ? parsedResults.t3ActualQuantity
        : parsedResults?.actualQuantity != null && parsedResults.actualQuantity !== ""
          ? parsedResults.actualQuantity
          : null;

    const unclosedReason =
      parsedResults?.t3UnclosedReason ||
      parsedResults?.unclosedReason ||
      parsedResults?.problemFound;

    const salesDetails: any[] =
      parsedResults?.t3ProductSalesDetails ||
      parsedResults?.productSalesDetails ||
      [];

    const hasActualData = Boolean(
      actualSales != null ||
        actualQuantity != null ||
        unclosedReason ||
        (salesDetails && salesDetails.length > 0),
    );

    if (hasActualData) {
      const actualRowsHtml =
        salesDetails.length > 0
          ? salesDetails
              .map((s: any, idx: number) => {
                const cust = s.customer || s.storeName || "-";
                const prod = s.productName || "-";
                const planQty = s.qty != null ? formatQty(s.qty) : "-";
                const actQty = s.actualQty != null ? formatQty(s.actualQty) : "-";
                const total = s.actualSales ? `฿${formatMoney(s.actualSales)}` : "-";
                const reason = s.unclosedReason || "-";

                return `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td style="font-weight: 600; color: #1e293b;">${safeHtml(cust)}</td>
                  <td>${safeHtml(prod)}</td>
                  <td class="text-center" style="color: #64748b;">${safeHtml(planQty)}</td>
                  <td class="text-center" style="font-weight: 700; color: #0f766e;">${safeHtml(actQty)}</td>
                  <td class="text-right" style="font-weight: 700; color: #059669;">${total}</td>
                  <td style="font-size: 8.5px; color: #64748b;">${safeHtml(reason)}</td>
                </tr>
              `;
              })
              .join("")
          : "";

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการเสนอขายจริง (Type 3 Actual Sales Outcome)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ยอดขายที่ทำได้จริงรวม:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669; font-size: 11px;">
                    ${actualSales ? `฿${formatMoney(String(actualSales).replace(/[^0-9.-]/g, ""))}` : "-"}
                  </span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">จำนวนที่ขายได้จริงรวม:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669; font-size: 11px;">
                    ${actualQuantity ? `${formatQty(actualQuantity)} หน่วย/ลัง` : "-"}
                  </span>
                </div>
              </div>
            </div>

            ${
              salesDetails.length > 0
                ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 9.5px; font-weight: 700; color: #166534; margin-bottom: 3px;">
                📊 ผลการขายเปรียบเทียบตามรายการสินค้า:
              </div>
              <table class="doc-table">
                <thead>
                  <tr style="background: #f0fdf4;">
                    <th class="text-center" style="width: 6%;">ลำดับ</th>
                    <th style="width: 26%;">ลูกค้า / ร้านค้า</th>
                    <th style="width: 24%;">สินค้า</th>
                    <th class="text-center" style="width: 11%;">เป้าหมาย</th>
                    <th class="text-center" style="width: 11%;">ขายได้จริง</th>
                    <th class="text-right" style="width: 12%;">ยอดขายจริง</th>
                    <th style="width: 10%;">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  ${actualRowsHtml}
                </tbody>
              </table>
            </div>
            `
                : ""
            }

            ${
              unclosedReason
                ? `
            <div style="margin-top: 6px; padding: 6px 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; font-size: 9px;">
              <span style="font-weight: 700; color: #b45309;">⚠️ กรณีปิดการขายไม่ได้ / ปัญหาที่พบ:</span>
              <span style="color: #78350f;"> ${safeHtml(unclosedReason)}</span>
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
            <div class="signature-role">ผู้เสนอขาย / ผู้แทนฝ่ายขาย</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้แทนฝ่ายขายประจำเขต<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ลูกค้า / ร้านค้าผู้รับข้อเสนอ</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้สั่งซื้อ / ตัวแทนร้านค้า<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ผู้อนุมัติผลการเสนอขาย</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้จัดการฝ่ายขาย<br/>วันที่: ....../....../......</div>
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
