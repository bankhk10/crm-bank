import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatMoney, formatDateThai } from "../templates/template-helpers";
import {
  extractType4PlanTargets,
  type Type4TargetItem,
} from "@/modules/activity/features/type-4";

export class Type4PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_4";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type4Targets or targets.t4List)
    let t4List: Type4TargetItem[] = [];
    if (targets?.t4List && targets.t4List.length > 0) {
      t4List = targets.t4List;
    } else if (targets?.t4 && (targets.t4.customer || targets.t4.targetCollect || targets.t4.items?.length)) {
      t4List = [targets.t4];
    } else {
      const extracted = extractType4PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t4List = extracted.list;
      } else if (extracted.primary && (extracted.primary.customer || extracted.primary.targetCollect)) {
        t4List = [extracted.primary];
      }
    }

    if (t4List.length === 0) {
      t4List = [
        {
          customer: (plan as any).customer?.name || plan.title || "วางบิล / เก็บเงิน",
          detail: "-",
          items: [],
        },
      ];
    }

    const title = "[TYPE 4] วางบิล / เก็บเงิน (Billing & Payment Collection)";

    // Flatten planned items from all targets
    const plannedItems = t4List.flatMap((t) =>
      t.items && t.items.length > 0
        ? t.items.map((it) => ({
            customer: it.customer || it.companyName || t.customer || "-",
            collectType: it.collectType || t.collectType || "COLLECT",
            targetAmount:
              it.targetAmountNum ??
              (it.targetCollect ? Number(String(it.targetCollect).replace(/[^0-9.-]/g, "")) : 0),
            detail: it.detail || t.detail || "-",
          }))
        : [
            {
              customer: t.customer || "-",
              collectType: t.collectType || "COLLECT",
              targetAmount:
                t.targetAmountNum ??
                t.collectAmount ??
                (t.targetCollect ? Number(String(t.targetCollect).replace(/[^0-9.-]/g, "")) : 0),
              detail: t.detail || "-",
            },
          ],
    );

    const totalTargetAmount = plannedItems.reduce(
      (sum, it) => sum + (it.targetAmount || 0),
      0,
    );

    const planRowsHtml =
      plannedItems.length > 0
        ? plannedItems
            .map((item, idx) => {
              const typeLabel = item.collectType === "BILLING" ? "วางบิล" : "เก็บเงิน";
              const typeBadgeClass = item.collectType === "BILLING" ? "badge-blue" : "badge-green";

              return `
              <tr>
                <td class="text-center" style="width: 6%;">${idx + 1}</td>
                <td style="width: 38%; font-weight: 600; color: #0f3568;">
                  ${safeHtml(item.customer)}
                </td>
                <td class="text-center" style="width: 16%;">
                  <span class="doc-badge ${typeBadgeClass}">${typeLabel}</span>
                </td>
                <td class="text-right" style="width: 20%; font-weight: 700; color: #0f3568;">
                  ${item.targetAmount > 0 ? `฿${formatMoney(item.targetAmount)}` : "-"}
                </td>
                <td style="width: 20%; font-size: 8.5px; color: #475569;">
                  ${safeHtml(item.detail)}
                </td>
              </tr>
            `;
            })
            .join("")
        : `
          <tr>
            <td colspan="5" class="text-center" style="color: #64748b; font-style: italic;">
              ไม่มีรายการวางบิลหรือเก็บเงินที่ระบุ
            </td>
          </tr>
        `;

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวม ${plannedItems.length} รายการ</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 6%;">ลำดับ</th>
                <th style="width: 38%;">ชื่อร้านค้า / ลูกค้า</th>
                <th class="text-center" style="width: 16%;">ประเภทงาน</th>
                <th class="text-right" style="width: 20%;">ยอดเงินเป้าหมาย</th>
                <th style="width: 20%;">รายละเอียด / หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${planRowsHtml}
            </tbody>
            ${
              totalTargetAmount > 0
                ? `<tfoot>
                    <tr style="background: #f8fafc; font-weight: 700;">
                      <td colspan="3" class="text-right">ยอดเงินเป้าหมายรวม:</td>
                      <td class="text-right" style="color: #0f3568; font-size: 10.5px;">฿${formatMoney(totalTargetAmount)}</td>
                      <td></td>
                    </tr>
                   </tfoot>`
                : ""
            }
          </table>
        </div>
      </div>
    `;

    // 2. Actual Outcome Section
    let actualHtml = "";
    const orderNo =
      parsedResults?.t4OrderNo ||
      parsedResults?.orderNo ||
      t4List.find((t) => t.orderNo)?.orderNo;

    const receivedAmount =
      parsedResults?.t4ReceivedAmount != null && parsedResults.t4ReceivedAmount !== ""
        ? parsedResults.t4ReceivedAmount
        : parsedResults?.receivedAmount != null && parsedResults.receivedAmount !== ""
          ? parsedResults.receivedAmount
          : t4List.find((t) => t.receivedAmount)?.receivedAmount;

    const billingStatus =
      parsedResults?.t4BillingStatus ||
      parsedResults?.billingStatus ||
      t4List.find((t) => t.billingStatus)?.billingStatus;

    const billingDetail =
      parsedResults?.t4BillingDetail ||
      parsedResults?.billingDetail ||
      t4List.find((t) => t.billingDetail)?.billingDetail;

    const collectDetail =
      parsedResults?.t4CollectDetail ||
      parsedResults?.collectDetail ||
      t4List.find((t) => t.collectDetail)?.collectDetail;

    const hasActualData = Boolean(
      orderNo || receivedAmount || billingStatus || billingDetail || collectDetail,
    );

    if (hasActualData) {
      const cleanReceived =
        receivedAmount != null && receivedAmount !== ""
          ? Number(String(receivedAmount).replace(/[^0-9.-]/g, ""))
          : null;

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการวางบิล / เก็บเงินจริง (Type 4 Actual Collection Outcome)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 35%;">
                  <span class="info-label">เลขที่คำสั่งซื้อ / ใบแจ้งหนี้:</span>
                  <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(orderNo || "-")}</span>
                </div>
                <div class="info-cell" style="width: 35%;">
                  <span class="info-label">ยอดเงินที่ได้รับจริง:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669; font-size: 11px;">
                    ${cleanReceived != null && !isNaN(cleanReceived) && cleanReceived > 0 ? `฿${formatMoney(cleanReceived)}` : "-"}
                  </span>
                </div>
                <div class="info-cell" style="width: 30%;">
                  <span class="info-label">สถานะการวางบิล:</span>
                  <span class="info-value">
                    <span class="doc-badge ${billingStatus === "วางบิลสำเร็จ" ? "badge-green" : billingStatus ? "badge-red" : "badge-slate"}">
                      ${safeHtml(billingStatus || "-")}
                    </span>
                  </span>
                </div>
              </div>
              ${
                billingDetail || collectDetail
                  ? `
              <div class="info-row">
                ${
                  billingDetail
                    ? `<div class="info-cell" style="width: 50%;">
                        <span class="info-label">รายละเอียดการวางบิล:</span>
                        <span class="info-value">${safeHtml(billingDetail)}</span>
                       </div>`
                    : ""
                }
                ${
                  collectDetail
                    ? `<div class="info-cell" style="width: 50%;">
                        <span class="info-label">รายละเอียดการเก็บเงิน:</span>
                        <span class="info-value" style="font-weight: 600; color: #0f766e;">${safeHtml(collectDetail)}</span>
                       </div>`
                    : ""
                }
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
      signatureBoxesHtml = `
        <div class="signatures-grid avoid-break">
          <div class="signature-card">
            <div class="signature-role">ผู้แทนฝ่ายขาย / ผู้วางบิล-เก็บเงิน</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้ดำเนินการ<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ลูกค้า / ร้านค้าผู้จ่ายเงิน-รับบิล</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้รับบิล / ผู้ชำระเงิน<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">แผนกการเงิน / บัญชีผู้อนุมัติ</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">เจ้าหน้าที่การเงิน<br/>วันที่: ....../....../......</div>
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
