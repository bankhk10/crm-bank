import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import {
  safeHtml,
  formatMoney,
  formatQty,
} from "../templates/template-helpers";
import {
  extractType10PlanTargets,
  type Type10TargetItem,
} from "@/modules/activity/features/type-10";

export class Type10PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_10";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated relational type10Targets or targets.t10List)
    let t10List: Type10TargetItem[] = [];
    if (targets?.t10List && targets.t10List.length > 0) {
      t10List = targets.t10List;
    } else if (targets?.t10 && (targets.t10.plot || targets.t10.plotName || targets.t10.location)) {
      t10List = [targets.t10];
    } else {
      const extracted = extractType10PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t10List = extracted.list;
      } else if (extracted.primary && (extracted.primary.plot || extracted.primary.plotName)) {
        t10List = [extracted.primary];
      }
    }

    // Fallback if empty
    if (t10List.length === 0) {
      t10List = [
        {
          plot: plan.title || "งาน Field Day",
          location: planSummary.locationStr || "-",
          targetAttendees: planSummary.targetSales ? "-" : "-",
        },
      ];
    }

    const title = "[TYPE 10] จัดงาน Field Day (Field Demonstration Day)";

    // Render Plan HTML for each target
    const targetsHtml = t10List
      .map((item, idx) => {
        const plotTitle =
          item.plot ||
          item.plotName ||
          item.farmerName ||
          (item.demoPlotId ? `แปลงสาธิต #${item.demoPlotId}` : "งาน Field Day");

        const cropTitle = item.crop || item.cropName || item.cropCategory || "-";
        const showcaseTitle = item.showcase || item.showcaseProductName || "-";
        const locationTitle =
          item.location ||
          [item.district, item.province].filter(Boolean).join(", ") ||
          planSummary.locationStr ||
          "-";

        const attendeesDisplay =
          item.targetAttendees ||
          (item.targetAttendeesCount != null && Number(item.targetAttendeesCount) > 0
            ? `${formatQty(item.targetAttendeesCount)} คน`
            : "-");

        const salesDisplay =
          item.targetSales ||
          (item.targetBookingSales != null && Number(item.targetBookingSales) > 0
            ? `฿${formatMoney(item.targetBookingSales)}`
            : "-");

        return `
        <div style="${idx > 0 ? "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" : ""}">
          ${
            t10List.length > 1
              ? `<div style="font-weight: 700; font-size: 11px; color: #0f3568; margin-bottom: 4px;">
                   📍 งาน Field Day จุดที่ ${idx + 1}: ${safeHtml(plotTitle)}
                 </div>`
              : ""
          }
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ชื่องาน / แปลงสาธิตอ้างอิง:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(plotTitle)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ชนิดพืชเป้าหมาย:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(cropTitle)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">สินค้าจัดแสดง (Showcase):</span>
                <span class="info-value" style="font-weight: 600; color: #166534;">${safeHtml(showcaseTitle)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">สถานที่จัดงาน:</span>
                <span class="info-value">${safeHtml(locationTitle)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">เป้าหมายเกษตรกรร่วมงาน:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(attendeesDisplay)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">เป้าหมายยอดสั่งจอง / ยอดขาย:</span>
                <span class="info-value" style="font-weight: 700; color: #059669;">${safeHtml(salesDisplay)}</span>
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
            t10List.length > 1
              ? `<span style="font-size: 9px; color: #64748b; font-weight: normal;">รวมทั้งหมด ${t10List.length} งาน</span>`
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
    const actualAttendees =
      parsedResults?.type10Actual?.actualAttendees != null &&
      parsedResults.type10Actual.actualAttendees !== ""
        ? parsedResults.type10Actual.actualAttendees
        : parsedResults?.actualAttendees != null &&
          parsedResults.actualAttendees !== ""
          ? parsedResults.actualAttendees
          : parsedResults?.t10ActualAttendees;

    const actualSalesOrBooking =
      parsedResults?.type10Actual?.actualSalesOrBooking != null &&
      parsedResults.type10Actual.actualSalesOrBooking !== ""
        ? parsedResults.type10Actual.actualSalesOrBooking
        : parsedResults?.type10Actual?.salesResultAmount != null &&
          parsedResults.type10Actual.salesResultAmount !== ""
          ? parsedResults.type10Actual.salesResultAmount
          : parsedResults?.actualSales != null && parsedResults.actualSales !== ""
            ? parsedResults.actualSales
            : parsedResults?.t10ActualSales;

    const farmerFeedback =
      parsedResults?.type10Actual?.farmerFeedback ||
      parsedResults?.farmerFeedback ||
      parsedResults?.problemFound;

    const rawSoldProducts: any[] =
      parsedResults?.type10Actual?.soldProducts ||
      parsedResults?.t10SoldProducts ||
      parsedResults?.productSalesDetails ||
      (plan as any).type10Products ||
      (plan as any).type10Targets?.[0]?.products ||
      [];

    const hasActualData = Boolean(
      actualAttendees != null ||
        actualSalesOrBooking != null ||
        farmerFeedback ||
        (rawSoldProducts && rawSoldProducts.length > 0),
    );

    if (hasActualData) {
      const effectiveSoldProducts = rawSoldProducts
        .filter((prod: any) => {
          if (!prod) return false;
          if (
            prod.productRole === "SHOWCASE" &&
            prod.actualQty == null &&
            prod.actualQuantity == null &&
            prod.actualSales == null &&
            prod.actualTotal == null
          ) {
            return false;
          }
          return true;
        })
        .map((prod: any) => {
          const productName =
            prod.productName || prod.product?.name || "สินค้าไม่ระบุชื่อ";

          const rawQty =
            prod.actualQty != null && prod.actualQty !== ""
              ? prod.actualQty
              : prod.actualQuantity != null && prod.actualQuantity !== ""
                ? prod.actualQuantity
                : prod.quantity != null && prod.quantity !== ""
                  ? prod.quantity
                  : prod.targetQuantity != null && prod.targetQuantity !== ""
                    ? prod.targetQuantity
                    : null;

          const rawUnitPrice =
            prod.unitPrice != null && prod.unitPrice !== ""
              ? prod.unitPrice
              : prod.actualUnitPrice != null && prod.actualUnitPrice !== ""
                ? prod.actualUnitPrice
                : prod.targetUnitPrice != null && prod.targetUnitPrice !== ""
                  ? prod.targetUnitPrice
                  : null;

          const rawSales =
            prod.actualSales != null && prod.actualSales !== ""
              ? prod.actualSales
              : prod.actualTotal != null && prod.actualTotal !== ""
                ? prod.actualTotal
                : prod.amount != null && prod.amount !== ""
                  ? prod.amount
                  : prod.targetAmount != null && prod.targetAmount !== ""
                    ? prod.targetAmount
                    : null;

          return {
            productName,
            displayQty: rawQty != null && rawQty !== "" ? formatQty(rawQty) : "-",
            displayUnitPrice:
              rawUnitPrice != null && rawUnitPrice !== "" && !isNaN(Number(rawUnitPrice))
                ? `฿${formatMoney(rawUnitPrice)}`
                : "-",
            displaySales:
              rawSales != null && rawSales !== "" && !isNaN(Number(rawSales))
                ? `฿${formatMoney(rawSales)}`
                : "-",
          };
        });

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการจัดงาน Field Day จริง (Type 10 Actual Field Day Outcome)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 35%;">
                  <span class="info-label">เกษตรกรเข้าร่วมจริง:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669; font-size: 11px;">
                    ${actualAttendees ? `${formatQty(actualAttendees)} คน` : "-"}
                  </span>
                </div>
                <div class="info-cell" style="width: 35%;">
                  <span class="info-label">ยอดสั่งจอง / ยอดขายจริง:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669; font-size: 11px;">
                    ${actualSalesOrBooking ? `฿${formatMoney(actualSalesOrBooking)}` : "-"}
                  </span>
                </div>
                <div class="info-cell" style="width: 30%;">
                  <span class="info-label">ผลตอบรับจากเกษตรกร:</span>
                  <span class="info-value">${safeHtml(farmerFeedback || "-")}</span>
                </div>
              </div>
            </div>

            ${
              effectiveSoldProducts.length > 0
                ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 9.5px; font-weight: 700; color: #166534; margin-bottom: 3px;">
                📦 รายการสินค้าที่สั่งจอง / จำหน่ายในงาน:
              </div>
              <table class="doc-table">
                <thead>
                  <tr style="background: #f0fdf4;">
                    <th class="text-center" style="width: 6%;">ลำดับ</th>
                    <th style="width: 44%;">สินค้า</th>
                    <th class="text-center" style="width: 16%;">จำนวน</th>
                    <th class="text-right" style="width: 17%;">ราคาต่อหน่วย</th>
                    <th class="text-right" style="width: 17%;">รวม (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  ${effectiveSoldProducts
                    .map(
                      (p, pIdx) => `
                    <tr>
                      <td class="text-center">${pIdx + 1}</td>
                      <td style="font-weight: 600; color: #1e293b;">${safeHtml(p.productName)}</td>
                      <td class="text-center">${safeHtml(p.displayQty)}</td>
                      <td class="text-right">${safeHtml(p.displayUnitPrice)}</td>
                      <td class="text-right" style="font-weight: 700; color: #059669;">${safeHtml(p.displaySales)}</td>
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

    // 3. Custom Signature Boxes for Standalone Export
    let signatureBoxesHtml: string | undefined = undefined;
    if (options.typeCode && options.typeCode !== "ALL") {
      signatureBoxesHtml = `
        <div class="signatures-grid avoid-break">
          <div class="signature-card">
            <div class="signature-role">ผู้จัดงาน / ผู้แทนฝ่ายขาย-ส่งเสริม</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้รับผิดชอบการจัดงาน<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">เกษตรกรเจ้าของแปลงสาธิต</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">เจ้าของสถานที่จัดงาน<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ผู้อนุมัติผลการจัดงาน Field Day</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้จัดการฝ่ายส่งเสริมการขาย / การตลาด<br/>วันที่: ....../....../......</div>
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
