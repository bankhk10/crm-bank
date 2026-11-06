import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml } from "../templates/template-helpers";
import { renderApprovalBoxes } from "../templates/approval-boxes.template";
import {
  extractType2PlanTargets,
  type Type2TargetItem,
} from "@/modules/activity/features/type-2";

export class Type2PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_2";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type2Targets or targets.t2List)
    let t2List: Type2TargetItem[] = [];
    if (targets?.t2List && targets.t2List.length > 0) {
      t2List = targets.t2List;
    } else if (targets?.t2 && (targets.t2.customer || targets.t2.product || targets.t2.items?.length)) {
      t2List = [targets.t2];
    } else {
      const extracted = extractType2PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t2List = extracted.list;
      } else if (extracted.primary && (extracted.primary.customer || extracted.primary.product)) {
        t2List = [extracted.primary];
      }
    }

    if (t2List.length === 0) {
      t2List = [
        {
          customer: (plan as any).customer?.name || plan.title || "ติดตามผลการใช้สินค้า",
          detail: "-",
          expectedResult: "-",
        },
      ];
    }

    const title = "[TYPE 2] ติดตามผลการใช้สินค้า (Product Follow-up)";

    const rowsHtml = t2List
      .map((item, idx) => {
        const isStore = item.visitPurpose === "STORE";
        const isUnregistered = Boolean(item.isUnregisteredFarmer);
        const displayName = isUnregistered
          ? item.unregisteredFarmerName || item.customer || "-"
          : item.customer || "-";

        const purposeLabel = isStore ? "ร้านค้า" : "เกษตรกร";
        const productsStr =
          item.product ||
          (item.items && item.items.length > 0
            ? item.items.map((i: any) => i.productName).join(", ")
            : "-");

        const locationStr = item.province || planSummary.locationStr || "-";
        const detailStr = item.detail || "-";
        const expectedResult = item.expectedResult || "-";

        return `
          <tr>
            <td class="text-center" style="width: 5%;">${idx + 1}</td>
            <td style="width: 28%; font-weight: 600; color: #0f3568;">
              ${safeHtml(displayName)}
              <span class="doc-badge ${isStore ? "badge-blue" : "badge-green"}" style="margin-left: 4px;">
                ${purposeLabel}
              </span>
              ${locationStr !== "-" ? `<br/><span style="font-size: 8.5px; color: #64748b;">📍 ${safeHtml(locationStr)}</span>` : ""}
            </td>
            <td style="width: 22%; font-weight: 600; color: #166534;">${safeHtml(productsStr)}</td>
            <td style="width: 25%; font-size: 8.5px; color: #334155;">${safeHtml(detailStr)}</td>
            <td style="width: 20%; font-size: 8.5px; color: #0f766e;">${safeHtml(expectedResult)}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวมติดตาม ${t2List.length} รายการ</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 5%;">ลำดับ</th>
                <th style="width: 28%;">ชื่อเกษตรกร / ร้านค้า</th>
                <th style="width: 22%;">สินค้าที่ติดตาม</th>
                <th style="width: 25%;">วัตถุประสงค์ / รายละเอียด</th>
                <th style="width: 20%;">ผลที่คาดหวัง</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 2. Actual Follow-up Results Section
    let actualHtml = "";
    const followupList: any[] =
      parsedResults?.t2FollowupResults ||
      (t2List.flatMap((t) => t.items || []).filter((it: any) => it.usageResult)) ||
      [];

    const generalResult =
      parsedResults?.t2UsageResult ||
      parsedResults?.t2FollowupDetail ||
      parsedResults?.t2Detail;

    const problemDetail = parsedResults?.t2ProblemDetail || parsedResults?.problemFound;

    const hasActualData = followupList.length > 0 || generalResult || problemDetail;

    if (hasActualData) {
      const actRows =
        followupList.length > 0
          ? followupList
              .map(
                (f: any, idx: number) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td style="font-weight: 600;">${safeHtml(f.customer || f.customerName || "-")}</td>
                <td style="font-weight: 600; color: #166534;">${safeHtml(f.productName || f.product || "-")}</td>
                <td class="text-center">
                  <span class="doc-badge ${
                    f.usageResult === "พบปัญหา"
                      ? "badge-red"
                      : f.usageResult === "พืชตอบสนองดี"
                        ? "badge-green"
                        : "badge-blue"
                  }">
                    ${safeHtml(f.usageResult || "พึงพอใจ")}
                  </span>
                </td>
                <td style="font-size: 8.5px; color: #475569;">${safeHtml(f.problemDetail || f.followupDetail || f.notes || "-")}</td>
              </tr>
            `,
              )
              .join("")
          : "";

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการติดตามการใช้สินค้าจริง (Type 2 Actual Results)</span>
          </div>
          <div class="section-body" style="${followupList.length > 0 ? "padding: 0;" : ""}">
            ${
              followupList.length > 0
                ? `
            <table class="doc-table" style="margin: 0;">
              <thead>
                <tr style="background: #f0fdf4;">
                  <th class="text-center" style="width: 6%;">ลำดับ</th>
                  <th style="width: 28%;">ลูกค้า / เกษตรกร</th>
                  <th style="width: 26%;">สินค้าที่ติดตาม</th>
                  <th class="text-center" style="width: 18%;">ผลการใช้สินค้า</th>
                  <th style="width: 22%;">ข้อสังเกต / ปัญหาที่พบ</th>
                </tr>
              </thead>
              <tbody>
                ${actRows}
              </tbody>
            </table>
            `
                : `
            <div class="info-grid">
              ${
                generalResult
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">ผลการใช้สินค้าจริง:</span>
                        <span class="info-value" style="font-weight: 600; color: #059669;">${safeHtml(generalResult)}</span>
                      </div>
                     </div>`
                  : ""
              }
              ${
                problemDetail
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">ปัญหาหรืออุปสรรคที่พบ:</span>
                        <span class="info-value" style="color: #c2410c;">${safeHtml(problemDetail)}</span>
                      </div>
                     </div>`
                  : ""
              }
            </div>
            `
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
            roleTitle: "ผู้แทนฝ่ายขาย / ผู้ติดตามผล",
            position: "ผู้แทนฝ่ายขายประจำเขต",
          },
          {
            roleTitle: "เกษตรกร / ลูกค้าผู้ใช้สินค้า",
            position: "ผู้ให้ข้อมูลการใช้งาน",
          },
          {
            roleTitle: "ผู้อนุมัติผลการติดตาม",
            position: "ผู้จัดการฝ่ายส่งเสริมวิชาการ",
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
