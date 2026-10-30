import { db } from "@/lib/db";
import { findActivityPlanById } from "@/modules/activity/infrastructure/activity-plan.repository";
import { ACTIVITY_PLAN_FULL_INCLUDE } from "@/modules/activity/infrastructure/activity-plan-include";
import {
  extractPlanData,
  parseResultSummary,
  initialTargets,
} from "@/modules/activity/domain/summary";
import { getWorkTypeName, getWorkTypeCode } from "@/modules/activity/constants";
import { generatePdfFromHtml } from "@/modules/create-pdf/server/pdf-service";

import type {
  PdfExportOptions,
  TypeRenderContext,
  TypeRenderResult,
} from "./activity-pdf.types";
import { typeRendererRegistry } from "./type-renderers";
import { renderBaseLayout } from "./templates/base-layout.template";
import { renderHeaderSection } from "./templates/header-section.template";
import { renderOverviewSection } from "./templates/overview-section.template";
import { renderActualResultSection } from "./templates/actual-result-section.template";
import { renderApprovalBoxes } from "./templates/approval-boxes.template";
import { renderMonthlySummaryTemplate } from "./templates/monthly-summary.template";
import { safeHtml } from "./templates/template-helpers";

export class ActivityPdfService {
  /**
   * Generates the Monthly Summary HTML for all plans in a given month/year
   */
  async generateMonthlySummaryHtml(options: PdfExportOptions): Promise<string> {
    const now = new Date();
    let year = options.year || now.getFullYear();
    let month = options.month || now.getMonth() + 1;
    let employeeId = options.employeeId;

    // If a reference planId is provided without explicit month/year, borrow its period
    if (options.planId && (!options.year || !options.month)) {
      const refPlan = await findActivityPlanById(options.planId);
      if (refPlan) {
        if (refPlan.startDate) {
          const d = new Date(refPlan.startDate);
          year = options.year || d.getFullYear();
          month = options.month || d.getMonth() + 1;
        }
        if (!employeeId && refPlan.employeeId) {
          employeeId = refPlan.employeeId;
        }
      }
    }

    const startDateFrom = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const startDateTo = new Date(year, month, 0, 23, 59, 59, 999);

    const whereCondition: any = {
      deletedAt: null,
      OR: [
        { fiscalYear: year, fiscalMonth: month },
        { startDate: { gte: startDateFrom, lte: startDateTo } },
      ],
    };

    if (employeeId) {
      whereCondition.employeeId = employeeId;
    }

    const plans = await db.activityPlan.findMany({
      where: whereCondition,
      include: ACTIVITY_PLAN_FULL_INCLUDE,
      orderBy: { startDate: "asc" },
    });

    const thaiMonthNames = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
    ];
    const monthName = thaiMonthNames[month - 1] || `เดือนที่ ${month}`;
    const docTitle = `รายงานสรุปแผนงานประจำเดือน ${monthName} ${year + 543}`;

    const bodyHtml = renderMonthlySummaryTemplate({
      plans: plans as any,
      month,
      year,
    });

    return renderBaseLayout(docTitle, bodyHtml, { landscape: false });
  }

  /**
   * Generates the Single Trip Plan HTML
   */
  async generateSinglePlanHtml(
    planId: string,
    options: PdfExportOptions = { planId },
  ): Promise<string> {
    const plan = await findActivityPlanById(planId);
    if (!plan) {
      throw new Error(`ไม่พบข้อมูลแผนงานรหัส ${planId}`);
    }

    const { planSummary, resolvedWorkTypes, targets } = extractPlanData(
      plan,
      initialTargets,
    );

    const rawResultData = (plan as any).result || plan;
    const parsedResults = parseResultSummary(rawResultData);

    const isSingleType =
      Boolean(options.typeCode) && options.typeCode !== "ALL";
    const selectedTypeCode = isSingleType ? options.typeCode! : undefined;

    const includeActual = options.includeActual !== false;
    const includePhotos = options.includePhotos !== false;
    const pageBreakPerType = options.pageBreakPerType !== false;

    // 1. Determine which types to render
    let typeCodesToRender: string[] = [];
    if (selectedTypeCode) {
      typeCodesToRender = [selectedTypeCode];
    } else if (resolvedWorkTypes.length > 0) {
      typeCodesToRender = resolvedWorkTypes.map((t) => getWorkTypeCode(t));
    } else if (plan.activityType?.code) {
      typeCodesToRender = [plan.activityType.code];
    } else {
      typeCodesToRender = ["TYPE_1"];
    }

    // De-duplicate
    typeCodesToRender = Array.from(new Set(typeCodesToRender));

    // 2. Render each type via strategy registry
    const renderContext: TypeRenderContext = {
      plan,
      planSummary,
      targets,
      parsedResults,
      options,
    };

    const renderedTypes: TypeRenderResult[] = [];
    for (const code of typeCodesToRender) {
      const renderer = typeRendererRegistry.getRenderer(code);
      const res = await renderer.render(renderContext);
      renderedTypes.push(res);
    }

    // 3. Assemble document layout
    let bodyContent = "";

    if (isSingleType) {
      // ─── Single Plan Specific Type Sheet (e.g. Type 7A Demo Plot Order) ───
      const typeResult = renderedTypes[0];
      const typeName = getWorkTypeName(selectedTypeCode!) || selectedTypeCode;

      const headerTitle = `ใบงาน ${typeName}`;
      const headerSubTitle = `WORK ORDER / JOB ACTION SHEET (${selectedTypeCode})`;

      bodyContent += renderHeaderSection({
        plan,
        planSummary,
        customTitle: headerTitle,
        customSubTitle: headerSubTitle,
      });

      // Quick Plan Meta Bar
      bodyContent += `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; font-size: 9.5px;">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 35%;">
                <span class="info-label">แผนงานอ้างอิง:</span>
                <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(plan.title)}</span>
              </div>
              <div class="info-cell" style="width: 35%;">
                <span class="info-label">ผู้รับผิดชอบ:</span>
                <span class="info-value">${safeHtml((plan as any).employee?.firstName || (plan as any).createdBy?.name || "-")}</span>
              </div>
              <div class="info-cell" style="width: 30%;">
                <span class="info-label">ช่วงวันที่:</span>
                <span class="info-value">${safeHtml(planSummary.startDateStr || "-")}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Specific Type Plan Body
      bodyContent += typeResult.planHtml;

      // Specific Type Actual Body
      if (includeActual && typeResult.actualHtml) {
        bodyContent += typeResult.actualHtml;
      }

      // General Actual Results & Photos
      if (includeActual) {
        bodyContent += renderActualResultSection({
          plan,
          parsedResults,
          includePhotos,
        });
      }

      // Custom Signatures or Default Approval Boxes
      if (typeResult.signatureBoxesHtml) {
        bodyContent += typeResult.signatureBoxesHtml;
      } else {
        bodyContent += renderApprovalBoxes({ plan });
      }
    } else {
      // ─── Single Trip Plan Full Breakdown ───
      bodyContent += renderHeaderSection({
        plan,
        planSummary,
      });

      bodyContent += renderOverviewSection({
        plan,
        planSummary,
      });

      // Summary Table of all Work Types in this trip
      if (renderedTypes.length > 1) {
        const scheduleRows = renderedTypes
          .map((rt, idx) => {
            const typeName = getWorkTypeName(rt.workTypeCode) || rt.workTypeCode;
            return `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td style="font-weight: 700; color: #0f3568;">${safeHtml(rt.workTypeCode)}</td>
              <td>${safeHtml(typeName)}</td>
              <td class="text-center">${safeHtml(planSummary.startDateStr || "-")}</td>
              <td class="text-center">
                <span class="doc-badge badge-blue">ตามแผน</span>
              </td>
            </tr>
          `;
          })
          .join("");

        bodyContent += `
          <div class="section-box avoid-break">
            <div class="section-header">
              <span>2. สรุปกำหนดการและแผนงานทั้งหมดในทริป (Trip Work Schedule Summary)</span>
              <span style="font-size: 9px; color: #64748b; font-weight: normal;">รวม ${renderedTypes.length} แผนงาน</span>
            </div>
            <div class="section-body" style="padding: 0;">
              <table class="doc-table" style="margin: 0;">
                <thead>
                  <tr>
                    <th class="text-center" style="width: 6%;">ลำดับ</th>
                    <th style="width: 15%;">รหัสงาน</th>
                    <th style="width: 45%;">ชื่อแผนงาน</th>
                    <th class="text-center" style="width: 20%;">กำหนดวันที่</th>
                    <th class="text-center" style="width: 14%;">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  ${scheduleRows}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      // Detailed Sections for Each Work Type
      renderedTypes.forEach((rt, idx) => {
        const needsBreak = pageBreakPerType && idx > 0;
        bodyContent += `
          <div class="${needsBreak ? "page-break" : ""}">
            <div style="font-size: 11px; font-weight: 800; color: #0f3568; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1.5px solid #cbd5e1;">
              📌 ${renderedTypes.length > 1 ? `ลำดับที่ 3.${idx + 1}: ` : "รายละเอียดแผนงาน: "}${safeHtml(rt.title)}
            </div>
            ${rt.planHtml}
            ${includeActual && rt.actualHtml ? rt.actualHtml : ""}
          </div>
        `;
      });

      // Overall Actual Results & Photo Gallery
      if (includeActual) {
        bodyContent += renderActualResultSection({
          plan,
          parsedResults,
          includePhotos,
        });
      }

      // Approval Boxes
      bodyContent += renderApprovalBoxes({ plan });
    }

    const documentTitle = isSingleType
      ? `${getWorkTypeName(selectedTypeCode!) || "ใบงาน"} - ${plan.code || plan.title}`
      : `รายงานแผนงาน ${plan.code || plan.title}`;

    return renderBaseLayout(documentTitle, bodyContent);
  }

  /**
   * Main Router: Dispatches to either Monthly Summary (mode="ALL") or Single Plan Detail (mode="SINGLE")
   */
  async generatePlanHtml(
    planId?: string,
    options: PdfExportOptions = {},
  ): Promise<string> {
    const isMonthlyAll = options.mode === "ALL";

    if (isMonthlyAll) {
      return this.generateMonthlySummaryHtml({
        ...options,
        planId: planId || options.planId,
      });
    }

    const targetPlanId = planId || options.planId;
    if (!targetPlanId) {
      throw new Error("กรุณาระบุรหัสแผนงานที่ต้องการพิมพ์");
    }

    return this.generateSinglePlanHtml(targetPlanId, options);
  }

  /**
   * Generates a binary PDF buffer using Puppeteer
   */
  async generatePlanPdfBuffer(
    planId?: string,
    options: PdfExportOptions = {},
  ): Promise<Buffer> {
    const fullHtml = await this.generatePlanHtml(planId, options);

    return generatePdfFromHtml(fullHtml, {
      landscape: false,
    });
  }
}

export const activityPdfService = new ActivityPdfService();
