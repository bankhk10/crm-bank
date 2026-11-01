import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty, formatMoney } from "../templates/template-helpers";
import { renderApprovalBoxes } from "../templates/approval-boxes.template";
import {
  extractType8PlanTargets,
  type Type8TargetItem,
} from "@/modules/activity/features/type-8";

export class Type8PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_8";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type8Targets or targets.t8List)
    let t8List: Type8TargetItem[] = [];
    if (targets?.t8List && targets.t8List.length > 0) {
      t8List = targets.t8List;
    } else if (targets?.t8 && (targets.t8.topic || targets.t8.customer)) {
      t8List = [targets.t8];
    } else {
      const extracted = extractType8PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t8List = extracted.list;
      } else if (extracted.primary && (extracted.primary.topic || extracted.primary.customer)) {
        t8List = [extracted.primary];
      }
    }

    if (t8List.length === 0) {
      t8List = [
        {
          topic: plan.title || "จัดประชุม / สัมมนา",
          customer: (plan as any).customer?.name || planSummary.locationStr || "-",
          detail: "-",
          targetAttendees: "-",
          products: "-",
        },
      ];
    }

    const title = "[TYPE 8] จัดประชุม / สัมมนา (Meeting & Seminar)";

    const targetsHtml = t8List
      .map((item, idx) => {
        const topic = item.topic || plan.title || "จัดประชุมสัมมนา";
        const customer = item.customer || item.dealerName || item.subDealerStore || "-";
        const targetAttendees = item.targetAttendees || "-";
        const productsStr =
          typeof item.products === "string"
            ? item.products
            : Array.isArray(item.targetProducts)
              ? item.targetProducts.join(", ")
              : "-";

        return `
        <div style="${idx > 0 ? "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" : ""}">
          ${
            t8List.length > 1
              ? `<div style="font-weight: 700; font-size: 11px; color: #0f3568; margin-bottom: 4px;">
                   📍 งานประชุมที่ ${idx + 1}: ${safeHtml(topic)}
                 </div>`
              : ""
          }
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">หัวข้อการประชุม/สัมมนา:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(topic)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สถานที่จัดงาน / ร้านค้า:</span>
                <span class="info-value">${safeHtml(customer)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">เป้าหมายจำนวนผู้เข้าร่วม:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(targetAttendees)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สินค้าเป้าหมายประจำงาน:</span>
                <span class="info-value" style="font-weight: 600; color: #166534;">${safeHtml(productsStr || "-")}</span>
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
            t8List.length > 1
              ? `<span style="font-size: 9px; color: #64748b; font-weight: normal;">รวมทั้งหมด ${t8List.length} งานประชุม</span>`
              : ""
          }
        </div>
        <div class="section-body">
          ${targetsHtml}
        </div>
      </div>
    `;

    // 2. Actual Meeting Outcome Section
    let actualHtml = "";
    const actualAttendees =
      parsedResults?.type8Actual?.t8ActualAttendees != null &&
      parsedResults.type8Actual.t8ActualAttendees !== ""
        ? parsedResults.type8Actual.t8ActualAttendees
        : parsedResults?.t8ActualAttendees != null &&
          parsedResults.t8ActualAttendees !== ""
          ? parsedResults.t8ActualAttendees
          : parsedResults?.actualAttendeesCount != null &&
            parsedResults.actualAttendeesCount !== ""
            ? parsedResults.actualAttendeesCount
            : null;

    const feedbackQnA =
      parsedResults?.type8Actual?.feedbackQnA ||
      parsedResults?.type8Actual?.t8Feedback ||
      parsedResults?.t8Feedback ||
      parsedResults?.problemFound;

    const rawProductSalesDetails: any[] =
      parsedResults?.type8Actual?.productSalesDetails ||
      parsedResults?.productSalesDetails ||
      (plan as any).productSalesDetails ||
      [];

    const hasActualData = Boolean(
      actualAttendees != null ||
        feedbackQnA ||
        (rawProductSalesDetails && rawProductSalesDetails.length > 0),
    );

    if (hasActualData) {
      const salesRowsHtml =
        rawProductSalesDetails.length > 0
          ? rawProductSalesDetails
              .map((prod: any, pIdx: number) => {
                const pName = prod.productName || prod.product?.name || "สินค้า";
                const qty =
                  prod.actualQty != null && prod.actualQty !== ""
                    ? prod.actualQty
                    : prod.actualQuantity != null && prod.actualQuantity !== ""
                      ? prod.actualQuantity
                      : "-";
                const sales =
                  prod.actualSales != null && prod.actualSales !== ""
                    ? prod.actualSales
                    : prod.actualTotal != null && prod.actualTotal !== ""
                      ? prod.actualTotal
                      : "-";

                return `
                <tr>
                  <td class="text-center">${pIdx + 1}</td>
                  <td style="font-weight: 600; color: #1e293b;">${safeHtml(pName)}</td>
                  <td class="text-center" style="font-weight: 700; color: #0f766e;">
                    ${qty !== "-" ? `${formatQty(qty)}` : "-"}
                  </td>
                  <td class="text-right" style="font-weight: 700; color: #059669;">
                    ${sales !== "-" ? `฿${formatMoney(String(sales).replace(/[^0-9.-]/g, ""))}` : "-"}
                  </td>
                </tr>
              `;
              })
              .join("")
          : "";

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการจัดประชุมจริง (Type 8 Actual Meeting Outcome)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">จำนวนผู้เข้าร่วมประชุมจริง:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669; font-size: 11px;">
                    ${actualAttendees ? `${formatQty(actualAttendees)} คน` : "-"}
                  </span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ข้อคิดเห็น / คำถาม-คำตอบ (Q&A):</span>
                  <span class="info-value">${safeHtml(feedbackQnA || "ผลการประชุมเป็นไปด้วยความเรียบร้อยดี")}</span>
                </div>
              </div>
            </div>

            ${
              rawProductSalesDetails.length > 0
                ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 9.5px; font-weight: 700; color: #166534; margin-bottom: 3px;">
                📦 รายการสินค้าที่สั่งจอง / ยอดขายในที่ประชุม:
              </div>
              <table class="doc-table">
                <thead>
                  <tr style="background: #f0fdf4;">
                    <th class="text-center" style="width: 8%;">ลำดับ</th>
                    <th style="width: 52%;">สินค้า</th>
                    <th class="text-center" style="width: 20%;">จำนวน (ลัง/หน่วย)</th>
                    <th class="text-right" style="width: 20%;">ยอดรวม (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  ${salesRowsHtml}
                </tbody>
              </table>
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
      signatureBoxesHtml = renderApprovalBoxes({
        plan,
        customBoxes: [
          {
            roleTitle: "ผู้จัดประชุม / ผู้รับผิดชอบ",
            position: "ผู้แทนฝ่ายขาย / ส่งเสริม",
          },
          {
            roleTitle: "ตัวแทนผู้ร่วมประชุม / ร้านค้า",
            position: "ผู้แทนผู้เข้าร่วมประชุม",
          },
          {
            roleTitle: "ผู้อนุมัติผลการจัดประชุม",
            position: "ผู้จัดการฝ่ายขาย / ส่งเสริมการตลาด",
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
