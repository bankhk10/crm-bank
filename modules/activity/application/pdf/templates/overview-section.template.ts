import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import type { PlanSummaryData } from "@/modules/activity/domain/summary";
import { formatMoney, safeHtml } from "./template-helpers";

interface OverviewSectionProps {
  plan: ActivityPlanWithRelations;
  planSummary: PlanSummaryData;
}

export function renderOverviewSection({
  plan,
  planSummary,
}: OverviewSectionProps): string {
  // Creator info
  const emp = (plan as any).employee;
  const creatorUser = (plan as any).creator;
  const creatorName = emp
    ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
    : creatorUser?.name || "-";
  const employeeCode = emp?.employeeCode || "-";
  const position = emp?.position?.name || emp?.positionTitle || "-";
  const department = emp?.department?.name || "-";
  const phone = emp?.phone || creatorUser?.phone || "-";

  // Date range
  const dateStr = planSummary.endDateStr && planSummary.endDateStr !== planSummary.startDateStr
    ? `${planSummary.startDateStr} ถึง ${planSummary.endDateStr}`
    : planSummary.startDateStr || "-";

  // Helpers
  const helpersList = planSummary.helpers && planSummary.helpers.length > 0
    ? planSummary.helpers.map((h) => h.name + (h.positionTitle ? ` (${h.positionTitle})` : "")).join(", ")
    : (planSummary.helperEmployeeNames && planSummary.helperEmployeeNames.length > 0
      ? planSummary.helperEmployeeNames.join(", ")
      : "-");

  // Budgets
  const mktBudget = planSummary.marketingBudget || 0;
  const spBudget = planSummary.salesPromotionBudget || 0;
  const extraBudget = planSummary.extraExpenseAmount || 0;
  const totalBudget = mktBudget + spBudget + extraBudget;

  const hasBudget = totalBudget > 0;

  return `
  <div class="section-box">
    <div class="section-header">
      <span>1. ข้อมูลทั่วไปของแผนงาน (Trip Overview)</span>
      <span style="font-size: 9px; font-weight: normal; color: #64748b;">
        ช่วงเวลา: ${safeHtml(dateStr)} ${planSummary.timeStr ? `(${planSummary.timeStr})` : ""}
      </span>
    </div>
    <div class="section-body">
      <div class="info-grid">
        <div class="info-row">
          <div class="info-cell" style="width: 50%;">
            <span class="info-label">ชื่อแผนงาน:</span>
            <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(plan.title || "-")}</span>
          </div>
          <div class="info-cell" style="width: 50%;">
            <span class="info-label">พื้นที่ปฏิบัติงาน:</span>
            <span class="info-value">${safeHtml(planSummary.locationStr || "-")}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-cell">
            <span class="info-label">ผู้จัดทำแผน:</span>
            <span class="info-value">${safeHtml(creatorName)} (${safeHtml(employeeCode)})</span>
          </div>
          <div class="info-cell">
            <span class="info-label">ตำแหน่ง/ฝ่าย:</span>
            <span class="info-value">${safeHtml(position)} / ${safeHtml(department)}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-cell">
            <span class="info-label">เบอร์ติดต่อ:</span>
            <span class="info-value">${safeHtml(phone)}</span>
          </div>
          <div class="info-cell">
            <span class="info-label">ผู้ร่วมเดินทาง:</span>
            <span class="info-value">${safeHtml(helpersList)}</span>
          </div>
        </div>
        ${
          plan.description
            ? `<div class="info-row">
                <div class="info-cell" colspan="2" style="padding-top: 4px;">
                  <span class="info-label">รายละเอียด/หมายเหตุ:</span>
                  <span class="info-value" style="color: #475569;">${safeHtml(plan.description)}</span>
                </div>
               </div>`
            : ""
        }
      </div>

      ${
        hasBudget
          ? `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
          <table class="doc-table">
            <thead>
              <tr>
                <th>งบการตลาด (MKT)</th>
                <th>งบส่งเสริมการขาย (SP)</th>
                <th>ค่าใช้จ่ายอื่นๆ / เบี้ยเลี้ยง</th>
                <th style="background: #e2e8f0; color: #0f3568;">งบประมาณรวมที่ขออนุมัติ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>฿${formatMoney(mktBudget)}</td>
                <td>฿${formatMoney(spBudget)}</td>
                <td>฿${formatMoney(extraBudget)} ${planSummary.extraExpenseDetail ? `(${safeHtml(planSummary.extraExpenseDetail)})` : ""}</td>
                <td style="font-weight: 700; color: #0f3568; background: #f8fafc;">฿${formatMoney(totalBudget)}</td>
              </tr>
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

