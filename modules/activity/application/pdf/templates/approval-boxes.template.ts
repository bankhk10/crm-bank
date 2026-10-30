import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import { formatDateThai, safeHtml } from "./template-helpers";

interface ApprovalBoxesProps {
  plan: ActivityPlanWithRelations;
  customBoxes?: {
    roleTitle: string;
    personName?: string;
    position?: string;
    dateStr?: string;
  }[];
}

export function renderApprovalBoxes({
  plan,
  customBoxes,
}: ApprovalBoxesProps): string {
  if (customBoxes && customBoxes.length > 0) {
    const widthPercent = (100 / customBoxes.length).toFixed(2);
    return `
    <div class="signatures-grid avoid-break">
      ${customBoxes
        .map(
          (box) => `
        <div class="signature-card" style="width: ${widthPercent}%;">
          <div class="signature-role">${safeHtml(box.roleTitle)}</div>
          <div class="signature-line"></div>
          <div class="signature-name">${safeHtml(box.personName || "....................................................")}</div>
          <div class="signature-date">${box.position ? safeHtml(box.position) + "<br/>" : ""}วันที่: ${safeHtml(box.dateStr || "....../....../......")}</div>
        </div>
      `,
        )
        .join("")}
    </div>
    `;
  }

  // Standard 3 boxes
  const emp = (plan as any).employee;
  const creatorUser = (plan as any).creator;
  const creatorName = emp
    ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
    : creatorUser?.name || "";

  const approverName = (plan as any).approver?.name || "";
  const approvedDateStr = (plan as any).approvedAt
    ? formatDateThai((plan as any).approvedAt)
    : "";

  const createdDateStr = (plan as any).createdAt
    ? formatDateThai((plan as any).createdAt)
    : "";

  return `
  <div class="signatures-grid avoid-break">
    <div class="signature-card">
      <div class="signature-role">ผู้จัดทำแผนงาน (Prepared By)</div>
      <div class="signature-line"></div>
      <div class="signature-name">${creatorName ? `(${safeHtml(creatorName)})` : "...................................................."}</div>
      <div class="signature-date">วันที่: ${createdDateStr || "....../....../......"}</div>
    </div>
    <div class="signature-card">
      <div class="signature-role">หัวหน้างาน / ผู้จัดการเขต (Verified By)</div>
      <div class="signature-line"></div>
      <div class="signature-name">${approverName ? `(${safeHtml(approverName)})` : "...................................................."}</div>
      <div class="signature-date">วันที่: ${approvedDateStr || "....../....../......"}</div>
    </div>
    <div class="signature-card">
      <div class="signature-role">ผู้อำนวยการฝ่าย (Approved By)</div>
      <div class="signature-line"></div>
      <div class="signature-name">....................................................</div>
      <div class="signature-date">วันที่: ....../....../......</div>
    </div>
  </div>
  `;
}

