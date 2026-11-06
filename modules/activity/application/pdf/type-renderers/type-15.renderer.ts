import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, resolvePdfImageSrc } from "../templates/template-helpers";
import { renderApprovalBoxes } from "../templates/approval-boxes.template";
import {
  extractType15PlanTargets,
  type Type15TargetItem,
} from "@/modules/activity/features/type-15";

export class Type15PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_15";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated relational type15Targets or targets.t15List)
    let t15List: Type15TargetItem[] = [];
    if (targets?.t15List && targets.t15List.length > 0) {
      t15List = targets.t15List;
    } else if (
      targets?.t15 &&
      (targets.t15.storeName ||
        targets.t15.dealerName ||
        targets.t15.village ||
        targets.t15.subDealerStore)
    ) {
      t15List = [targets.t15];
    } else {
      const extracted = extractType15PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t15List = extracted.list;
      } else if (
        extracted.primary &&
        (extracted.primary.storeName ||
          extracted.primary.dealerName ||
          extracted.primary.village)
      ) {
        t15List = [extracted.primary];
      }
    }

    // Fallback if empty
    if (t15List.length === 0) {
      t15List = [
        {
          id: "t15-default",
          storeName: (plan as any).customer?.name || plan.title || "บูมทีม / คาราวาน",
          dealerName: (plan as any).customer?.name || plan.title || "บูมทีม / คาราวาน",
          isSubDealer: false,
          isUnregisteredSubdealer: false,
          village: planSummary.locationStr || "-",
          objective: "-",
          detail: "-",
        },
      ];
    }

    const title = "[TYPE 15] บูมทีม / คาราวาน (Boom Team / Caravan)";

    const rowsHtml = t15List
      .map((item, idx) => {
        const isSubDealer = Boolean(item.isSubDealer);
        const storeName =
          item.store?.name ||
          item.storeName ||
          item.dealerName ||
          item.customerName ||
          "-";
        const subdealerName = item.isUnregisteredSubdealer
          ? `${item.subDealerStore || "-"} (ระบุเอง)`
          : item.subdealer?.name || item.subdealerName || item.subDealerStore || "-";

        let customerHtml = "";
        if (!isSubDealer) {
          customerHtml = `
            <div style="font-weight: 700; color: #0f3568;">
              ${safeHtml(storeName)}
            </div>
            <span class="doc-badge badge-blue" style="margin-top: 2px;">ตัวแทนจำหน่ายหลัก (Dealer)</span>
          `;
        } else {
          customerHtml = `
            <div style="font-weight: 700; color: #b45309;">
              ${safeHtml(subdealerName)}
            </div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
              สังกัด Dealer: <span style="font-weight: 600; color: #334155;">${safeHtml(storeName)}</span>
            </div>
            <span class="doc-badge badge-amber" style="margin-top: 2px;">
              ${item.isUnregisteredSubdealer ? "ร้านค้าย่อย (ระบุเอง)" : "ร้านค้าย่อย (Subdealer)"}
            </span>
          `;
        }

        const village = item.village || "-";
        const objective = item.objective || "-";
        const detail = item.detail || "-";

        return `
          <tr>
            <td class="text-center" style="width: 5%;">${idx + 1}</td>
            <td style="width: 35%; vertical-align: top;">
              ${customerHtml}
            </td>
            <td style="width: 20%; vertical-align: top; font-weight: 600; color: #0f766e;">
              ${village !== "-" ? `🏡 ม.${safeHtml(village)}` : "-"}
            </td>
            <td style="width: 20%; vertical-align: top; font-size: 9px; color: #334155;">
              ${safeHtml(objective)}
            </td>
            <td style="width: 20%; vertical-align: top; font-size: 8.5px; color: #64748b;">
              ${safeHtml(detail)}
            </td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">เป้าหมายจัดกิจกรรม ${t15List.length} แห่ง</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 5%;">ลำดับ</th>
                <th style="width: 35%;">ร้านค้าเป้าหมาย (Dealer / Subdealer)</th>
                <th style="width: 20%;">หมู่บ้านเป้าหมาย</th>
                <th style="width: 20%;">วัตถุประสงค์</th>
                <th style="width: 20%;">รายละเอียดเพิ่มเติม</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 2. Actual Outcome Section
    let actualHtml = "";
    const rawActual =
      parsedResults?.type15Actual ||
      (plan as any).type15Results?.[0] ||
      (plan as any).result?.type15Actual;

    const actualDetail =
      rawActual?.detail ||
      parsedResults?.t15Detail ||
      "";

    // Photos
    const rawPhotos = [
      ...(Array.isArray(parsedResults?.t15Images) ? parsedResults.t15Images : []),
      ...(Array.isArray(rawActual?.attachments) ? rawActual.attachments : []),
      ...(Array.isArray(rawActual?.images) ? rawActual.images : []),
    ];

    const photoUrls = rawPhotos
      .map((p: any) => (typeof p === "string" ? p : p?.url || p?.fileUrl || p?.previewUrl))
      .filter((u): u is string => Boolean(u && typeof u === "string"));
    const uniquePhotos = Array.from(new Set(photoUrls));

    const hasActualData = Boolean(actualDetail || uniquePhotos.length > 0);

    if (hasActualData) {
      let photosHtml = "";
      if (uniquePhotos.length > 0) {
        photosHtml = `
          <div style="margin-top: 8px; border-top: 1px dashed #fed7aa; padding-top: 6px;">
            <div style="font-weight: 700; font-size: 9.5px; color: #9a3412; margin-bottom: 4px;">
              📷 รูปภาพการปฏิบัติงานบูมทีม / คาราวาน (${uniquePhotos.length} รูป):
            </div>
            <div class="gallery-grid">
              ${(() => {
                let html = "";
                for (let i = 0; i < uniquePhotos.length; i += 2) {
                  const img1 = resolvePdfImageSrc(uniquePhotos[i]);
                  const img2 = uniquePhotos[i + 1] ? resolvePdfImageSrc(uniquePhotos[i + 1]) : "";
                  html += `<div class="gallery-row">
                    <div class="gallery-cell">
                      <img src="${img1}" class="gallery-img" alt="Photo ${i + 1}" />
                      <div class="gallery-caption">ภาพที่ ${i + 1}</div>
                    </div>
                    ${
                      img2
                        ? `<div class="gallery-cell">
                            <img src="${img2}" class="gallery-img" alt="Photo ${i + 2}" />
                            <div class="gallery-caption">ภาพที่ ${i + 2}</div>
                          </div>`
                        : `<div class="gallery-cell" style="border: none; background: transparent;"></div>`
                    }
                  </div>`;
                }
                return html;
              })()}
            </div>
          </div>
        `;
      }

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #fff7ed; color: #9a3412; border-color: #fed7aa;">
            <span>บันทึกผลการปฏิบัติงานจริง (Type 15 Actual Outcome)</span>
          </div>
          <div class="section-body">
            ${
              actualDetail
                ? `<div style="padding: 6px 8px; background: #fffaf5; border: 1px solid #ffedd5; border-radius: 4px; font-size: 9.5px; line-height: 1.5; color: #334155;">
                    <span style="font-weight: 700; color: #9a3412;">📝 รายละเอียดผลการปฏิบัติงาน:</span>
                    <div style="margin-top: 2px; white-space: pre-wrap;">${safeHtml(actualDetail)}</div>
                   </div>`
                : `<div style="color: #64748b; font-style: italic; font-size: 9px;">ไม่มีรายละเอียดผลการปฏิบัติงานเพิ่มเติม</div>`
            }
            ${photosHtml}
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
            roleTitle: "ผู้แทนฝ่ายขาย / ผู้รับผิดชอบกิจกรรม",
            position: "ผู้แทนฝ่ายขาย-ส่งเสริม",
          },
          {
            roleTitle: "ร้านค้าตัวแทนจำหน่าย / ผู้ประสานงาน",
            position: "ตัวแทนจำหน่ายผู้ร่วมจัดกิจกรรม",
          },
          {
            roleTitle: "ผู้อนุมัติกิจกรรม",
            position: "ผู้จัดการเขตการขาย / ผู้จัดการฝ่าย",
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

