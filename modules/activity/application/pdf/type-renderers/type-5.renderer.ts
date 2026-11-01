import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml } from "../templates/template-helpers";
import { renderApprovalBoxes } from "../templates/approval-boxes.template";
import {
  extractType5PlanTargets,
  type Type5TargetItem,
} from "@/modules/activity/features/type-5";

export class Type5PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_5";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type5Targets or targets.t5List)
    let t5List: Type5TargetItem[] = [];
    if (targets?.t5List && targets.t5List.length > 0) {
      t5List = targets.t5List;
    } else if (targets?.t5 && (targets.t5.store || targets.t5.product || targets.t5.items?.length)) {
      t5List = [targets.t5];
    } else {
      const extracted = extractType5PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t5List = extracted.list;
      } else if (extracted.primary && (extracted.primary.store || extracted.primary.product)) {
        t5List = [extracted.primary];
      }
    }

    if (t5List.length === 0) {
      t5List = [
        {
          store: (plan as any).customer?.name || planSummary.locationStr || "สำรวจตลาด",
          product: "-",
          detail: "-",
          items: [],
        },
      ];
    }

    const title = "[TYPE 5] สำรวจตลาดของคู่แข่ง (Competitor Market Survey)";

    // Flatten planned items from all targets
    const plannedItems = t5List.flatMap((t) =>
      t.items && t.items.length > 0
        ? t.items.map((it) => ({
            store: it.store || it.storeName || t.store || "-",
            product: it.product || it.productName || t.product || "-",
            detail: it.detail || t.detail || "-",
          }))
        : [
            {
              store: t.store || t.storeName || "-",
              product: t.product || t.productName || "-",
              detail: t.detail || "-",
            },
          ],
    );

    const planRowsHtml =
      plannedItems.length > 0
        ? plannedItems
            .map(
              (item, idx) => `
              <tr>
                <td class="text-center" style="width: 6%;">${idx + 1}</td>
                <td style="width: 34%; font-weight: 600; color: #0f3568;">${safeHtml(item.store)}</td>
                <td style="width: 30%; font-weight: 600; color: #166534;">${safeHtml(item.product)}</td>
                <td style="width: 30%; font-size: 8.5px; color: #334155;">${safeHtml(item.detail)}</td>
              </tr>
            `,
            )
            .join("")
        : `
          <tr>
            <td colspan="4" class="text-center" style="color: #64748b; font-style: italic;">
              ไม่มีรายการสำรวจตลาดที่ระบุ
            </td>
          </tr>
        `;

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวม ${plannedItems.length} รายการสำรวจ</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 6%;">ลำดับ</th>
                <th style="width: 34%;">ร้านค้า / พื้นที่สำรวจ</th>
                <th style="width: 30%;">สินค้าเป้าหมาย / คู่แข่ง</th>
                <th style="width: 30%;">วัตถุประสงค์ / รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              ${planRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 2. Actual Market Findings Section
    let actualHtml = "";
    const competitorBrand =
      parsedResults?.t5CompetitorBrand ||
      parsedResults?.competitorBrand;

    const competitorProduct =
      parsedResults?.t5CompetitorProduct ||
      parsedResults?.competitorProduct;

    const surveyDetails =
      parsedResults?.t5SurveyDetails ||
      parsedResults?.surveyDetails ||
      parsedResults?.t5Findings ||
      parsedResults?.problemFound;

    const hasActualData = Boolean(
      competitorBrand || competitorProduct || surveyDetails,
    );

    if (hasActualData) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>สรุปผลการสำรวจตลาดจริง (Type 5 Actual Market Findings)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              ${
                competitorBrand || competitorProduct
                  ? `
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">แบรนด์คู่แข่งที่พบ:</span>
                  <span class="info-value" style="font-weight: 700; color: #c2410c;">${safeHtml(competitorBrand || "-")}</span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">สินค้าคู่แข่งในตลาด:</span>
                  <span class="info-value" style="font-weight: 600;">${safeHtml(competitorProduct || "-")}</span>
                </div>
              </div>
              `
                  : ""
              }
              ${
                surveyDetails
                  ? `
              <div class="info-row">
                <div class="info-cell" colspan="2">
                  <span class="info-label">ข้อมูลการสำรวจราคา ความเคลื่อนไหว และโปรโมชั่น:</span>
                  <span class="info-value" style="color: #334155;">${safeHtml(surveyDetails)}</span>
                </div>
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
      signatureBoxesHtml = renderApprovalBoxes({
        plan,
        customBoxes: [
          {
            roleTitle: "ผู้สำรวจตลาด / ตัวแทนฝ่ายขาย",
            position: "ผู้แทนฝ่ายขายประจำเขต",
          },
          {
            roleTitle: "ร้านค้า / ผู้ให้ข้อมูลตลาด",
            position: "ผู้ให้ข้อมูลภาคสนาม",
          },
          {
            roleTitle: "ผู้อนุมัติผลการสำรวจตลาด",
            position: "ผู้จัดการฝ่ายการตลาด / พัฒนาธุรกิจ",
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
