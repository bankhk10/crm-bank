import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import {
  formatDateThai,
  safeHtml,
  resolvePlanCreatorInfo,
} from "./template-helpers";

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
  const creatorInfo = resolvePlanCreatorInfo(plan);
  const creatorName = creatorInfo.name !== "-" ? creatorInfo.name : "";
  const creatorPos = creatorInfo.position !== "-" ? creatorInfo.position : "";

  if (customBoxes && customBoxes.length > 0) {
    const widthPercent = (100 / customBoxes.length).toFixed(2);
    return `
    <div class="signatures-grid avoid-break">
      ${customBoxes
        .map(
          (box, idx) => {
            const resolvedPersonName =
              box.personName || (idx === 0 ? creatorName : "");
            const resolvedPosition =
              idx === 0
                ? (creatorPos || box.position)
                : box.position;
            return `
        <div class="signature-card" style="width: ${widthPercent}%;">
          <div class="signature-role">${safeHtml(box.roleTitle)}</div>
          <div class="signature-line"></div>
          <div class="signature-name">${resolvedPersonName ? `(${safeHtml(resolvedPersonName)})` : "...................................................."}</div>
          <div class="signature-date">${resolvedPosition ? safeHtml(resolvedPosition) + "<br/>" : ""}วันที่: ${safeHtml(box.dateStr || "....../....../......")}</div>
        </div>
      `;
          },
        )
        .join("")}
    </div>
    `;
  }

  // Standard 3 boxes
  let approverName =
    (plan as any).approver?.name ||
    (plan as any).currentApprover?.name ||
    "";

  if (
    !approverName &&
    Array.isArray((plan as any).approvalLogs) &&
    (plan as any).approvalLogs.length > 0
  ) {
    const approveLog =
      (plan as any).approvalLogs.find(
        (log: any) => log.action === "APPROVE" || log.action === "APPROVED",
      ) || (plan as any).approvalLogs[0];
    approverName =
      approveLog?.user?.name ||
      approveLog?.user?.employeeProfile?.name ||
      "";
  }

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
      <div class="signature-date">${creatorPos ? safeHtml(creatorPos) + "<br/>" : ""}วันที่: ${createdDateStr || "....../....../......"}</div>
    </div>
    <div class="signature-card">
      <div class="signature-role">ผู้จัดการแผนกบริหารงานขาย</div>
      <div class="signature-line"></div>
      <div class="signature-name">${approverName ? `(${safeHtml(approverName)})` : "...................................................."}</div>
      <div class="signature-date">วันที่: ${approvedDateStr || "....../....../......"}</div>
    </div>
    <div class="signature-card">
      <div class="signature-role">ผู้จัดการฝ่ายขาย</div>
      <div class="signature-line"></div>
      <div class="signature-name">....................................................</div>
      <div class="signature-date">วันที่: ....../....../......</div>
    </div>
  </div>
  `;
}

