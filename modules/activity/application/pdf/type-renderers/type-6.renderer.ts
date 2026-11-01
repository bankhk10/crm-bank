import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml } from "../templates/template-helpers";
import { extractType6PlanTargets } from "@/modules/activity/features/type-6";
import type { Type6TargetItem } from "@/modules/activity/features/type-6/shared/types";

export class Type6PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_6";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, planSummary, options } = context;

    // 1. Resolve Targets List (Supports dedicated type6Targets or targets.t6List)
    let t6List: Type6TargetItem[] = [];
    if (targets?.t6List && targets.t6List.length > 0) {
      t6List = targets.t6List;
    } else if (targets?.t6 && (targets.t6.customer || targets.t6.detail || targets.t6.items?.length)) {
      t6List = [targets.t6];
    } else {
      const extracted = extractType6PlanTargets(plan);
      if (extracted.list && extracted.list.length > 0) {
        t6List = extracted.list;
      } else if (extracted.primary && (extracted.primary.customer || extracted.primary.detail)) {
        t6List = [extracted.primary];
      }
    }

    if (t6List.length === 0) {
      t6List = [
        {
          customer: (plan as any).customer?.name || plan.title || "เรื่องร้องเรียน / แก้ปัญหา",
          issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
          detail: "-",
          items: [],
        },
      ];
    }

    const title = "[TYPE 6] เรื่องร้องเรียน / แก้ปัญหา (Complaints & Problem Resolution)";

    // Flatten planned items from all targets
    const plannedItems = t6List.flatMap((t) =>
      t.items && t.items.length > 0
        ? t.items.map((it) => ({
            customer: it.customer || t.customer || "-",
            issueType: it.issueType || t.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
            detail: it.detail || t.detail || "-",
          }))
        : [
            {
              customer: t.customer || t.customerName || "-",
              issueType: t.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
              detail: t.detail || "-",
            },
          ],
    );

    const planRowsHtml =
      plannedItems.length > 0
        ? plannedItems
            .map((item, idx) => `
              <tr>
                <td class="text-center" style="width: 6%;">${idx + 1}</td>
                <td style="width: 34%; font-weight: 600; color: #0f3568;">${safeHtml(item.customer)}</td>
                <td style="width: 30%; color: #b91c1c; font-weight: 600;">${safeHtml(item.issueType)}</td>
                <td style="width: 30%; font-size: 8.5px; color: #334155;">${safeHtml(item.detail)}</td>
              </tr>
            `)
            .join("")
        : `
          <tr>
            <td colspan="4" class="text-center" style="color: #64748b; font-style: italic;">
              ไม่มีรายการเรื่องร้องเรียนที่ระบุ
            </td>
          </tr>
        `;

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวม ${plannedItems.length} รายการปัญหา</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 6%;">ลำดับ</th>
                <th style="width: 34%;">ลูกค้า / ร้านค้าที่ร้องเรียน</th>
                <th style="width: 30%;">ประเภทเรื่องร้องเรียน / ปัญหา</th>
                <th style="width: 30%;">รายละเอียดปัญหาที่ได้รับแจ้ง</th>
              </tr>
            </thead>
            <tbody>
              ${planRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 2. Actual Resolution Findings Section
    let actualHtml = "";
    const rawRecords: any[] =
      parsedResults?.t6IssueDetails ||
      (parsedResults?.t6IssueRecord ? [parsedResults.t6IssueRecord] : []) ||
      [];

    const singleRecordFallback = {
      productName: parsedResults?.t6ProductName,
      lotNumber: parsedResults?.t6LotNumber,
      purchaseChannel: parsedResults?.t6PurchaseChannel,
      storeName: parsedResults?.t6StoreName,
      issueType: parsedResults?.t6IssueType,
      detail: parsedResults?.t6Detail || parsedResults?.t6ProblemDetail,
      initialSolution: parsedResults?.t6InitialSolution || parsedResults?.t6Solution,
      status: parsedResults?.t6Status || "ดำเนินการแก้ไขเสร็จสิ้น",
    };

    const records =
      rawRecords.length > 0
        ? rawRecords
        : singleRecordFallback.productName ||
            singleRecordFallback.lotNumber ||
            singleRecordFallback.detail ||
            singleRecordFallback.initialSolution
          ? [singleRecordFallback]
          : [];

    const hasActualData = records.length > 0;

    if (hasActualData) {
      const recordsHtml = records
        .map((rec, rIdx) => `
        <div style="${rIdx > 0 ? "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" : ""}">
          ${
            records.length > 1
              ? `<div style="font-weight: 700; font-size: 10px; color: #166534; margin-bottom: 4px;">
                   ปัญหาที่ ${rIdx + 1}: ${safeHtml(rec.productName || rec.issueType || "ข้อร้องเรียน")}
                 </div>`
              : ""
          }
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สินค้าที่เกิดปัญหา:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(rec.productName || "-")}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">รหัสรุ่นผลิต (Lot Number):</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(rec.lotNumber || "-")}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ช่องทาง / ร้านค้าที่ซื้อ:</span>
                <span class="info-value">${safeHtml(rec.storeName || rec.purchaseChannel || "-")}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">สถานะการแก้ไข:</span>
                <span class="info-value">
                  <span class="doc-badge ${
                    rec.status === "ดำเนินการแก้ไขเสร็จสิ้น"
                      ? "badge-green"
                      : rec.status === "กำลังแก้ไข"
                        ? "badge-amber"
                        : "badge-blue"
                  }">
                    ${safeHtml(rec.status || "ดำเนินการแก้ไขเสร็จสิ้น")}
                  </span>
                </span>
              </div>
            </div>
            ${
              rec.detail || rec.problemDetail
                ? `<div class="info-row">
                    <div class="info-cell" colspan="2">
                      <span class="info-label">ผลการตรวจสอบหน้างานจริง:</span>
                      <span class="info-value" style="color: #c2410c;">${safeHtml(rec.problemDetail || rec.detail)}</span>
                    </div>
                   </div>`
                : ""
            }
            ${
              rec.initialSolution || rec.solution
                ? `<div class="info-row">
                    <div class="info-cell" colspan="2">
                      <span class="info-label">แนวทางการแก้ไข / มาตรการจัดการ:</span>
                      <span class="info-value" style="font-weight: 600; color: #15803d;">${safeHtml(rec.initialSolution || rec.solution)}</span>
                    </div>
                   </div>`
                : ""
            }
          </div>
        </div>
      `)
        .join("");

      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการตรวจสอบและแนวทางแก้ไขจริง (Type 6 Actual Resolution Outcome)</span>
          </div>
          <div class="section-body">
            ${recordsHtml}
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
            <div class="signature-role">ผู้รับเรื่องร้องเรียน / ตัวแทนฝ่ายขาย</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้แทนฝ่ายขายประจำเขต<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ลูกค้า / ร้านค้าผู้แจ้งเรื่อง</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้แจ้งปัญหา / ผู้ร้องเรียน<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ผู้อนุมัติผลการแก้ไขปัญหา</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้จัดการฝ่ายบริการลูกค้า / QA<br/>วันที่: ....../....../......</div>
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
