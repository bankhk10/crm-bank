import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import type { PlanSummaryData } from "@/modules/activity/domain/summary";
import { getBase64Logo, formatDateThai, safeHtml } from "./template-helpers";

interface HeaderSectionProps {
  plan: ActivityPlanWithRelations;
  planSummary: PlanSummaryData;
  customTitle?: string;
  customSubTitle?: string;
}

export function renderHeaderSection({
  plan,
  planSummary,
  customTitle,
  customSubTitle,
}: HeaderSectionProps): string {
  const logo = getBase64Logo();
  const planNo = plan.code || planSummary.planNo || plan.id;
  const isUnplanned = plan.planType === "UNPLANNED";

  const defaultTitle = isUnplanned
    ? "รายงานกิจกรรมนอกแผน (Unplanned Activity Report)"
    : "รายงานสรุปแผนงานและกิจกรรมลงพื้นที่ (Trip Plan Report)";
  const defaultSubTitle = isUnplanned
    ? "FIELD ACTIVITY SUMMARY SHEET"
    : "OFFICIAL TRIP PLAN REPORT";

  const title = customTitle || defaultTitle;
  const subTitle = customSubTitle || defaultSubTitle;

  // Status mapping
  let statusBadgeClass = "badge-blue";
  let statusLabel: string = String(plan.status || "DRAFT");
  const planStatus = String(plan.status);

  switch (planStatus) {
    case "APPROVED":
      statusBadgeClass = "badge-green";
      statusLabel = "อนุมัติแล้ว (APPROVED)";
      break;
    case "PENDING_LINE_APPROVAL":
    case "PENDING_BUDGET_APPROVAL":
    case "PENDING_HELPER_APPROVAL":
      statusBadgeClass = "badge-amber";
      statusLabel = "รอการอนุมัติ (PENDING)";
      break;
    case "REJECTED":
    case "CANCELLED":
      statusBadgeClass = "badge-red";
      statusLabel = planStatus === "CANCELLED" ? "ยกเลิกแล้ว (CANCELLED)" : "ไม่อนุมัติ (REJECTED)";
      break;
    case "COMPLETED":
      statusBadgeClass = "badge-green";
      statusLabel = "เสร็จสมบูรณ์ (COMPLETED)";
      break;
    default:
      statusBadgeClass = "badge-slate";
      statusLabel = isUnplanned ? "กิจกรรมนอกแผน" : "ฉบับร่าง (DRAFT)";
      break;
  }

  const printDateStr = formatDateThai(new Date(), "d MMM yyyy, HH:mm น.");

  return `
  <table class="header-table">
    <tr>
      <td style="width: 58%;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${
              logo
                ? `<td style="width: 70px; vertical-align: top; padding-right: 10px;">
                    <img src="${logo}" alt="Logo" class="company-logo" />
                   </td>`
                : ""
            }
            <td style="vertical-align: top;">
              <div class="company-info">
                <h1>บริษัท คร็อพ ซายน์ จำกัด</h1>
                <h2>CROP SCIENCES CO., LTD.</h2>
                <p>22 อาคารไอซีจี ถ.พระรามที่ 6 แขวงพญาไท เขตพญาไท กรุงเทพฯ 10400</p>
                <p>โทร. 02-618-4522 &nbsp;|&nbsp; แฟกซ์ 02-618-4530 &nbsp;|&nbsp; www.cropsciences.co.th</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
      <td style="width: 42%;" class="doc-meta">
        <div class="doc-title-main">${safeHtml(title)}</div>
        <div class="doc-title-sub">${safeHtml(subTitle)}</div>
        <div style="margin-bottom: 4px;">
          <span style="font-size: 9.5px; color: #64748b; font-weight: 600;">เลขที่เอกสาร:</span>
          <span style="font-size: 11px; font-weight: 700; color: #0f3568;">${safeHtml(planNo)}</span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="font-size: 9px; color: #64748b;">วันที่สั่งพิมพ์: ${printDateStr}</span>
        </div>
        <div>
          <span class="doc-badge ${statusBadgeClass}">${statusLabel}</span>
        </div>
      </td>
    </tr>
  </table>
  `;
}
