import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import {
  safeHtml,
  formatMoney,
  formatQty,
} from "../templates/template-helpers";
import { renderApprovalBoxes } from "../templates/approval-boxes.template";
import {
  extractType9PlanTargets,
  type Type9TargetItem,
} from "@/modules/activity/features/type-9";

export class Type9PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_9";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated relational type9Targets or targets.t9List)
    let t9List: Type9TargetItem[] = [];
    if (targets?.t9List && targets.t9List.length > 0) {
      t9List = targets.t9List;
    } else if (
      targets?.t9 &&
      (targets.t9.store ||
        targets.t9.targetSales ||
        (targets.t9.items && targets.t9.items.length > 0))
    ) {
      t9List = [targets.t9];
    } else {
      const extracted = extractType9PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t9List = extracted.list;
      } else if (
        extracted.primary &&
        (extracted.primary.store || extracted.primary.targetSales)
      ) {
        t9List = [extracted.primary];
      }
    }

    // Fallback if completely empty
    if (t9List.length === 0) {
      t9List = [
        {
          store:
            (plan as any).customer?.name ||
            plan.title ||
            "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
          province: planSummary.locationStr || "",
          targetSales: planSummary.targetSales
            ? `฿${formatMoney(planSummary.targetSales)}`
            : "",
          items: [],
        },
      ];
    }

    const title =
      "[TYPE 9] จัดกิจกรรมส่งเสริมการขายหน้าร้าน (Store Event / Sales Promotion)";

    // Render each target card
    const targetsHtml = t9List
      .map((item, idx) => {
        const storeName = item.store || item.storeName || "-";
        const isSubDealer = item.isSubDealer || Boolean(item.subDealerStore);
        const subDealerStore = item.subDealerStore || "";
        const dealerName = item.dealerName || "-";
        const location =
          [item.district, item.province].filter(Boolean).join(", ") ||
          item.location ||
          planSummary.locationStr ||
          "-";

        const targetSalesDisplay = item.targetSales
          ? String(item.targetSales).includes("บาท") ||
            String(item.targetSales).includes("฿")
            ? String(item.targetSales)
            : `฿${formatMoney(item.targetSales)}`
          : "-";

        const salesRatioDisplay =
          item.salesRatio != null && Number(item.salesRatio) > 0
            ? `${Number(item.salesRatio).toFixed(2)} %`
            : "-";

        const attendeesDisplay = item.targetAttendees
          ? String(item.targetAttendees).includes("คน")
            ? String(item.targetAttendees)
            : `${formatQty(item.targetAttendees)} คน`
          : "-";

        const items = item.items || [];
        const totalItemsCases = items.reduce(
          (sum, it) => sum + (Number(it.quantityCases) || 0),
          0,
        );
        const totalItemsAmount = items.reduce(
          (sum, it) => sum + (Number(it.totalAmount) || 0),
          0,
        );

        const itemsTableHtml =
          items.length > 0
            ? `
          <div style="margin-top: 8px;">
            <div style="font-size: 9.5px; font-weight: 700; color: #0f3568; margin-bottom: 3px;">
              📦 รายการสินค้าเป้าหมาย (${items.length} รายการ):
            </div>
            <table class="doc-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 6%;">ลำดับ</th>
                  <th style="width: 44%;">สินค้า</th>
                  <th class="text-center" style="width: 16%;">จำนวนเป้าหมาย</th>
                  <th class="text-right" style="width: 17%;">ราคา/หน่วย</th>
                  <th class="text-right" style="width: 17%;">ยอดรวมเป้าหมาย</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (it, itIdx) => `
                  <tr>
                    <td class="text-center">${itIdx + 1}</td>
                    <td style="font-weight: 600; color: #1e293b;">${safeHtml(it.productName)}</td>
                    <td class="text-center">${it.quantityCases != null ? `${formatQty(it.quantityCases)} ลัง` : "-"}</td>
                    <td class="text-right">${it.pricePerCase != null ? `฿${formatMoney(it.pricePerCase)}` : "-"}</td>
                    <td class="text-right" style="font-weight: 700; color: #0f3568;">
                      ${it.totalAmount != null ? `฿${formatMoney(it.totalAmount)}` : "-"}
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr style="background: #f8fafc; font-weight: 700;">
                  <td colspan="2" class="text-right">รวมเป้าหมายทั้งสิ้น:</td>
                  <td class="text-center" style="color: #0f3568;">${formatQty(totalItemsCases)} ลัง</td>
                  <td></td>
                  <td class="text-right" style="color: #0f3568; font-size: 10.5px;">฿${formatMoney(totalItemsAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        `
            : "";

        return `
        <div style="${idx > 0 ? "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" : ""}">
          ${
            t9List.length > 1
              ? `<div style="font-weight: 700; font-size: 11px; color: #0f3568; margin-bottom: 4px;">
                   📍 จุดจัดกิจกรรมที่ ${idx + 1}: ${safeHtml(storeName)}
                 </div>`
              : ""
          }
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ร้านค้าที่จัดกิจกรรม (Subdealer):</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(storeName)}</span>
                ${
                  isSubDealer && subDealerStore
                    ? `<span style="font-size: 9px; color: #64748b;"> (ร้านค้าย่อย: ${safeHtml(subDealerStore)})</span>`
                    : ""
                }
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ร้านค้า Dealer ต้นสังกัด:</span>
                <span class="info-value">${safeHtml(dealerName)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">พื้นที่จัดงาน (จังหวัด/อำเภอ):</span>
                <span class="info-value">${safeHtml(location)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">เป้ายอดขายกิจกรรม:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(targetSalesDisplay)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">สัดส่วนต่อยอดขาย:</span>
                <span class="info-value" style="font-weight: 600; color: #b45309;">${safeHtml(salesRatioDisplay)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">ผู้เข้าร่วมเป้าหมาย:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(attendeesDisplay)}</span>
              </div>
            </div>
          </div>
          ${itemsTableHtml}
        </div>
      `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          ${
            t9List.length > 1
              ? `<span style="font-size: 9px; color: #64748b; font-weight: normal;">รวมทั้งหมด ${t9List.length} จุดจัดกิจกรรม</span>`
              : ""
          }
        </div>
        <div class="section-body">
          ${targetsHtml}
        </div>
      </div>
    `;

    // 2. Actual Results Section
    let actualHtml = "";
    const actualSales =
      parsedResults?.type9Actual?.actualSales != null
        ? parsedResults.type9Actual.actualSales
        : parsedResults?.t9ActualSales != null
          ? parsedResults.t9ActualSales
          : parsedResults?.actualSales != null
            ? parsedResults.actualSales
            : t9List.find((t) => t.actualSales)?.actualSales;

    const actualAttendees =
      parsedResults?.type9Actual?.actualAttendees != null
        ? parsedResults.type9Actual.actualAttendees
        : parsedResults?.actualAttendees != null
          ? parsedResults.actualAttendees
          : t9List.find((t) => t.actualAttendees)?.actualAttendees;

    const rawProductSalesDetails: any[] =
      parsedResults?.type9Actual?.productSalesDetails ||
      parsedResults?.t9ProductSalesDetails ||
      parsedResults?.productSalesDetails ||
      (plan as any).productSalesDetails ||
      [];

    const hasActualData = Boolean(
      actualSales != null ||
        actualAttendees != null ||
        (rawProductSalesDetails && rawProductSalesDetails.length > 0) ||
        t9List.some((t) => t.result || t.actualSales || t.actualAttendees),
    );

    if (hasActualData) {
      const allTargetItems = t9List.flatMap((t) => t.items || []);
      const hasMultipleTargetProducts = allTargetItems.length > 0;

      const effectiveSalesList = hasMultipleTargetProducts
        ? allTargetItems.map((item, idx) => {
            const saved =
              rawProductSalesDetails.find(
                (d) =>
                  (item.id && d.id === item.id) ||
                  (item.productId &&
                    (d.productId === item.productId ||
                      d.id === item.productId)) ||
                  d.productName === item.productName,
              ) || rawProductSalesDetails[idx];

            const actualQty =
              saved?.actualQuantityCases ??
              saved?.quantityCases ??
              item.actualQuantityCases;
            const actSales =
              saved?.actualSales ?? saved?.totalAmount ?? item.actualSales;

            return {
              productName: item.productName,
              quantityCases:
                item.quantityCases != null ? `${item.quantityCases}` : "-",
              actualQuantityCases:
                actualQty != null && actualQty !== "" ? `${actualQty}` : "-",
              actualSales:
                actSales != null && actSales !== "" ? actSales : "-",
            };
          })
        : rawProductSalesDetails.map((item) => ({
            productName: item.productName || item.product?.name || "-",
            quantityCases:
              item.quantityCases != null ? `${item.quantityCases}` : "-",
            actualQuantityCases:
              item.actualQuantityCases != null &&
              item.actualQuantityCases !== ""
                ? `${item.actualQuantityCases}`
                : item.quantityCases != null
                  ? `${item.quantityCases}`
                  : "-",
            actualSales:
              item.actualSales != null && item.actualSales !== ""
                ? item.actualSales
                : item.totalAmount != null
                  ? item.totalAmount
                  : "-",
          }));

      const cleanActualSales = (val?: any): string => {
        if (val === undefined || val === null || val === "") return "-";
        const num = Number(String(val).replace(/[^0-9.-]/g, ""));
        return isNaN(num) || num <= 0 ? "-" : `฿${formatMoney(num)}`;
      };

      const cleanActualAttendees = (val?: any): string => {
        if (val === undefined || val === null || val === "") return "-";
        const num = Number(String(val).replace(/[^0-9.-]/g, ""));
        return isNaN(num) || num <= 0 ? "-" : `${formatQty(num)} คน`;
      };

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการจัดกิจกรรมส่งเสริมการขายหน้าร้านจริง (Type 9 Actual Store Promotion Outcome)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ยอดขายหน้าร้านจริงรวม:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669; font-size: 11px;">
                    ${cleanActualSales(actualSales)}
                  </span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">ผู้เข้าร่วมกิจกรรมจริง:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669; font-size: 11px;">
                    ${cleanActualAttendees(actualAttendees)}
                  </span>
                </div>
              </div>
            </div>

            ${
              effectiveSalesList.length > 0
                ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 9.5px; font-weight: 700; color: #166534; margin-bottom: 3px;">
                📊 ผลการขายจริงแยกตามรายการสินค้า (Actual Sales by Product):
              </div>
              <table class="doc-table">
                <thead>
                  <tr style="background: #f0fdf4;">
                    <th class="text-center" style="width: 6%;">ลำดับ</th>
                    <th style="width: 44%;">สินค้า</th>
                    <th class="text-center" style="width: 16%;">เป้าหมาย (ลัง)</th>
                    <th class="text-center" style="width: 16%;">ขายได้จริง (ลัง)</th>
                    <th class="text-right" style="width: 18%;">ยอดขายจริง (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  ${effectiveSalesList
                    .map(
                      (it, itIdx) => `
                    <tr>
                      <td class="text-center">${itIdx + 1}</td>
                      <td style="font-weight: 600; color: #1e293b;">${safeHtml(it.productName)}</td>
                      <td class="text-center" style="color: #64748b;">${safeHtml(it.quantityCases)}</td>
                      <td class="text-center" style="font-weight: 700; color: #0f766e;">${safeHtml(it.actualQuantityCases)}</td>
                      <td class="text-right" style="font-weight: 700; color: #059669;">
                        ${
                          it.actualSales !== "-"
                            ? `฿${formatMoney(String(it.actualSales).replace(/[^0-9.-]/g, ""))}`
                            : "-"
                        }
                      </td>
                    </tr>
                  `,
                    )
                    .join("")}
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

    // 3. Custom Signature Boxes for Standalone Type 9 Export
    let signatureBoxesHtml: string | undefined = undefined;
    if (options.typeCode && options.typeCode !== "ALL") {
      signatureBoxesHtml = renderApprovalBoxes({
        plan,
        customBoxes: [
          {
            roleTitle: "ผู้จัดกิจกรรม / ผู้รับผิดชอบ",
            position: "ผู้แทนฝ่ายขาย / ส่งเสริม",
          },
          {
            roleTitle: "ร้านค้าผู้ร่วมจัดกิจกรรม",
            position: "เจ้าของร้าน / ตัวแทนจำหน่าย",
          },
          {
            roleTitle: "ผู้อนุมัติผลการจัดกิจกรรม",
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
