import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty } from "../templates/template-helpers";
import { renderApprovalBoxes } from "../templates/approval-boxes.template";
import {
  extractType11PlanTargets,
  type Type11TargetItem,
} from "@/modules/activity/features/type-11";
import type { Type11StockItem } from "@/modules/activity/features/type-11/shared/types";

export class Type11PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_11";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type11Targets or targets.t11List)
    let t11List: Type11TargetItem[] = [];
    if (targets?.t11List && targets.t11List.length > 0) {
      t11List = targets.t11List;
    } else if (targets?.t11 && (targets.t11.store || targets.t11.items?.length)) {
      t11List = [targets.t11];
    } else {
      const extracted = extractType11PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t11List = extracted.list;
      } else if (extracted.primary && (extracted.primary.store || extracted.primary.items?.length)) {
        t11List = [extracted.primary];
      }
    }

    if (t11List.length === 0) {
      t11List = [
        {
          store: (plan as any).customer?.name || planSummary.locationStr || "ตรวจเช็คสต๊อกหน้าร้าน",
          items: [],
        },
      ];
    }

    const title = "[TYPE 11] ตรวจเช็คสต๊อกหน้าร้าน (Store Stock Check)";

    // Render Plan HTML for each target
    const targetsHtml = t11List
      .map((item, idx) => {
        const stores =
          item.items && item.items.length > 0
            ? item.items.map((i: any) => i.store || i.storeName).filter(Boolean)
            : item.store
              ? String(item.store)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];

        const storeDisplay = stores.length > 0 ? stores.join(", ") : item.store || "-";
        const detailDisplay = item.detail || "-";

        return `
        <div style="${idx > 0 ? "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" : ""}">
          ${
            t11List.length > 1
              ? `<div style="font-weight: 700; font-size: 11px; color: #0f3568; margin-bottom: 4px;">
                   📍 รายการตรวจสต็อกจุดที่ ${idx + 1}: ${safeHtml(storeDisplay)}
                 </div>`
              : ""
          }
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ร้านค้าเป้าหมายสำหรับการตรวจสต็อก:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(storeDisplay)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">รายละเอียดเพิ่มเติม:</span>
                <span class="info-value">${safeHtml(detailDisplay)}</span>
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
            t11List.length > 1
              ? `<span style="font-size: 9px; color: #64748b; font-weight: normal;">รวมทั้งหมด ${t11List.length} แผนตรวจนับ</span>`
              : ""
          }
        </div>
        <div class="section-body">
          ${targetsHtml}
        </div>
      </div>
    `;

    // 2. Actual Results Section (Store Stock Items)
    let actualHtml = "";
    const rawStockItems: Type11StockItem[] =
      parsedResults?.type11Actual?.t11StockItems ||
      parsedResults?.t11StockItems ||
      parsedResults?.stockResults ||
      (plan as any).stockResults ||
      [];

    const nextAction =
      parsedResults?.type11Actual?.t11NextAction ||
      parsedResults?.t11NextAction ||
      parsedResults?.nextAction;

    const summaryNotes =
      parsedResults?.type11Actual?.t11Remarks ||
      parsedResults?.t11Remarks ||
      parsedResults?.type11Actual?.summary ||
      parsedResults?.summary;

    const feedbackNotes =
      parsedResults?.type11Actual?.feedback || parsedResults?.feedback;

    const hasActualData = Boolean(
      (rawStockItems && rawStockItems.length > 0) ||
        nextAction ||
        summaryNotes ||
        feedbackNotes,
    );

    if (hasActualData) {
      // Group stock items by store
      const map = new Map<string, { storeName: string; items: Type11StockItem[] }>();
      rawStockItems.forEach((item) => {
        const key = item.storeId || item.storeName || "default";
        const sName = item.storeName || "ร้านค้าเป้าหมาย";
        if (!map.has(key)) {
          map.set(key, { storeName: sName, items: [] });
        }
        map.get(key)!.items.push(item);
      });
      const groupedStores = Array.from(map.values());

      let tablesHtml = "";
      if (groupedStores.length > 0) {
        tablesHtml = groupedStores
          .map((grp, gIdx) => `
          <div style="${gIdx > 0 ? "margin-top: 10px;" : ""}">
            <div style="font-size: 9.5px; font-weight: 700; color: #0f3568; margin-bottom: 3px;">
              🏪 ร้านค้า: ${safeHtml(grp.storeName)} (ตรวจพบ ${grp.items.length} รายการ):
            </div>
            <table class="doc-table">
              <thead>
                <tr style="background: #f0fdf4;">
                  <th class="text-center" style="width: 6%;">ลำดับ</th>
                  <th style="width: 38%;">ชื่อสินค้า</th>
                  <th class="text-center" style="width: 14%;">จำนวนคงเหลือ</th>
                  <th class="text-center" style="width: 14%;">สถานะสต็อก</th>
                  <th class="text-center" style="width: 14%;">โอกาสสั่งซื้อใหม่</th>
                  <th style="width: 14%;">ข้อสังเกต</th>
                </tr>
              </thead>
              <tbody>
                ${grp.items
                  .map(
                    (item, itIdx) => `
                  <tr>
                    <td class="text-center">${itIdx + 1}</td>
                    <td style="font-weight: 600; color: #1e293b;">
                      ${safeHtml(item.productName)}
                      ${item.productCode ? `<br/><span style="font-size: 8.5px; color: #64748b;">(${safeHtml(item.productCode)})</span>` : ""}
                    </td>
                    <td class="text-center" style="font-weight: 700; color: #0f3568;">
                      ${item.remainingQty != null ? safeHtml(item.remainingQty) : "-"}
                    </td>
                    <td class="text-center">
                      <span class="doc-badge ${
                        item.stockStatus === "ขาดสต็อก"
                          ? "badge-red"
                          : item.stockStatus === "ใกล้หมด"
                            ? "badge-amber"
                            : "badge-green"
                      }">
                        ${safeHtml(item.stockStatus || "ปกติ")}
                      </span>
                    </td>
                    <td class="text-center">
                      <span class="doc-badge ${
                        item.reorderOpportunity === "สูง"
                          ? "badge-blue"
                          : item.reorderOpportunity === "ยังไม่แน่ใจ"
                            ? "badge-amber"
                            : "badge-slate"
                      }">
                        ${safeHtml(item.reorderOpportunity || "-")}
                      </span>
                    </td>
                    <td style="font-size: 8.5px; color: #475569;">${safeHtml(item.remarks || "-")}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `)
          .join("");
      }

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการตรวจเช็คสต๊อกหน้าร้านจริง (Type 11 Actual Stock Check Outcome)</span>
          </div>
          <div class="section-body">
            ${tablesHtml}
            ${
              nextAction || summaryNotes || feedbackNotes
                ? `
            <div class="info-grid" style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
              ${
                summaryNotes
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">ข้อสังเกตและสรุปภาพรวม:</span>
                        <span class="info-value">${safeHtml(summaryNotes)}</span>
                      </div>
                     </div>`
                  : ""
              }
              ${
                nextAction
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">แผนงาน / การนัดหมายครั้งถัดไป:</span>
                        <span class="info-value" style="font-weight: 600; color: #0f766e;">${safeHtml(nextAction)}</span>
                      </div>
                     </div>`
                  : ""
              }
              ${
                feedbackNotes
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">ความคิดเห็นจากร้านค้า:</span>
                        <span class="info-value">${safeHtml(feedbackNotes)}</span>
                      </div>
                     </div>`
                  : ""
              }
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
            roleTitle: "ผู้ตรวจนับสต็อก / ผู้แทนฝ่ายขาย",
            position: "เจ้าหน้าที่ผู้ตรวจนับ",
          },
          {
            roleTitle: "ร้านค้าผู้รับรองยอดตรวจสต็อก",
            position: "เจ้าของร้าน / ผู้จัดการร้านค้า",
          },
          {
            roleTitle: "ผู้อนุมัติผลการตรวจเช็คสต็อก",
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
