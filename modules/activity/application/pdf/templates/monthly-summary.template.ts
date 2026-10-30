import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import {
  getBase64Logo,
  formatDateThai,
  formatMoney,
  formatQty,
  safeHtml,
} from "./template-helpers";
import { getWorkTypeName, getWorkTypeCode } from "@/modules/activity/constants";

export interface MonthlySummaryTemplateProps {
  plans: ActivityPlanWithRelations[];
  month: number; // 1-12
  year: number; // Christian year e.g. 2026
  employeeName?: string;
  employeePosition?: string;
  departmentName?: string;
}

const THAI_MONTH_NAMES = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/**
 * Extracts all store, customer, and farmer target names from an ActivityPlan
 */
function extractTargetNames(p: ActivityPlanWithRelations): string[] {
  const names = new Set<string>();

  // 1. Dedicated Type 1 targets
  if (Array.isArray((p as any).type1Targets)) {
    (p as any).type1Targets.forEach((t: any) => {
      const name = t.storeName || t.name || t.store?.name || t.customerName;
      if (name) names.add(name);
    });
  }

  // 2. Dedicated Type 7A targets (Demo Plots & Farmers)
  if (Array.isArray((p as any).type7aTargets)) {
    (p as any).type7aTargets.forEach((t: any) => {
      const plot = t.plotName || t.name;
      const farmer = t.farmerName || t.owner || t.ownerName;
      const store = t.store?.name || t.dealerName;
      if (farmer) names.add(`คุณ${farmer}${plot ? ` (แปลง ${plot})` : ""}`);
      else if (plot) names.add(`แปลง ${plot}`);
      if (store) names.add(`ร้าน ${store}`);
    });
  }

  // 3. Dedicated Type 3, 4, 11 targets
  if (Array.isArray((p as any).type3Targets)) {
    (p as any).type3Targets.forEach((t: any) => {
      const name = t.customerName || t.storeName || t.store?.name;
      if (name) names.add(name);
    });
  }
  if (Array.isArray((p as any).type4Targets)) {
    (p as any).type4Targets.forEach((t: any) => {
      const name = t.customerName || t.storeName;
      if (name) names.add(name);
    });
  }
  if (Array.isArray((p as any).type11Targets)) {
    (p as any).type11Targets.forEach((t: any) => {
      const name = t.customerName || t.storeName || t.store?.name;
      if (name) names.add(name);
    });
  }

  // 4. Dedicated Type 13 targets (Spraying)
  if (Array.isArray((p as any).type13Targets)) {
    (p as any).type13Targets.forEach((t: any) => {
      const farmer = t.farmerName || t.customerName || t.owner;
      if (farmer) names.add(`แปลงคุณ${farmer}`);
    });
  }

  // 5. Stores relation
  if (Array.isArray((p as any).stores)) {
    (p as any).stores.forEach((s: any) => {
      const name = s.store?.name || s.name || s.storeName;
      if (name) names.add(name);
    });
  }

  return Array.from(names);
}

/**
 * Extracts work type labels from an ActivityPlan
 */
function extractWorkTypeLabels(p: ActivityPlanWithRelations): string[] {
  const labels: string[] = [];
  if (p.workTypes && Array.isArray(p.workTypes) && p.workTypes.length > 0) {
    p.workTypes.forEach((wt) => {
      const raw =
        wt.activityType?.code ||
        wt.activityType?.name ||
        (wt as any).workTypeCode ||
        "";
      const code = getWorkTypeCode(raw);
      const name = getWorkTypeName(code) || code;
      labels.push(`[${code}] ${name}`);
    });
  } else if (p.activityType) {
    const code = getWorkTypeCode(p.activityType.code || p.activityType.name);
    const name = getWorkTypeName(code) || p.activityType.name;
    labels.push(`[${code}] ${name}`);
  }
  return Array.from(new Set(labels));
}

export function renderMonthlySummaryTemplate({
  plans,
  month,
  year,
  employeeName,
  employeePosition,
  departmentName,
}: MonthlySummaryTemplateProps): string {
  const logo = getBase64Logo();
  const thaiMonthName = THAI_MONTH_NAMES[month - 1] || `เดือนที่ ${month}`;
  const thaiYear = year + 543;
  const printDateStr = formatDateThai(new Date(), "d MMM yyyy, HH:mm น.");

  // Determine Primary Employee Info from the plans if not explicitly passed
  let empName = employeeName;
  let empPos = employeePosition;
  let empDept = departmentName;

  if (plans.length > 0) {
    for (const p of plans) {
      const e = (p as any).employee;
      const c = (p as any).createdBy || (p as any).creator;
      const u = e?.user || c;

      if (!empName || empName === "-") {
        const combined = `${e?.firstName || ""} ${e?.lastName || ""}`.trim();
        const resolvedName = combined || e?.name || c?.name || "";
        if (resolvedName) empName = resolvedName;
      }

      if (!empPos || empPos === "-") {
        const resolvedPos =
          e?.position?.name ||
          e?.positionTitle ||
          e?.roleTitle ||
          u?.position?.name ||
          u?.roleTitle ||
          "";
        if (resolvedPos) empPos = resolvedPos;
      }

      if (!empDept || empDept === "-") {
        const resolvedDept =
          e?.department?.name ||
          e?.departmentName ||
          u?.department?.name ||
          "";
        if (resolvedDept) empDept = resolvedDept;
      }

      if (empName && empName !== "-" && empPos && empPos !== "-" && empDept && empDept !== "-") {
        break;
      }
    }
  }

  empName = empName || "-";
  empPos = empPos || "-";
  empDept = empDept || "-";

  // Calculate Monthly Metrics
  let totalDays = 0;
  let totalBudget = 0;
  const allUniqueTargets = new Set<string>();

  plans.forEach((p) => {
    // Days calculation
    if (p.startDate && p.endDate) {
      const s = new Date(p.startDate);
      const e = new Date(p.endDate);
      const ms = Math.max(0, e.getTime() - s.getTime());
      const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1);
      totalDays += days;
    } else {
      totalDays += 1;
    }

    // Budget
    const mkt = p.marketingBudgetRequested ? Number(p.marketingBudgetRequested) : 0;
    const sp = p.salesPromotionBudgetRequested ? Number(p.salesPromotionBudgetRequested) : 0;
    const extra = (p as any).extraExpenseAmount ? Number((p as any).extraExpenseAmount) : 0;
    totalBudget += mkt + sp + extra;

    // Targets
    const targets = extractTargetNames(p);
    targets.forEach((t) => allUniqueTargets.add(t));
  });

  // Table rows
  const tableRowsHtml = plans
    .map((p, idx) => {
      // Date string
      const startStr = formatDateThai(p.startDate, "d MMM");
      const endStr = formatDateThai(p.endDate, "d MMM");
      const dateDisplay =
        startStr === endStr ? startStr : `${startStr} - ${endStr}`;

      // Calculate days
      let daysCount = 1;
      if (p.startDate && p.endDate) {
        const s = new Date(p.startDate);
        const e = new Date(p.endDate);
        const ms = Math.max(0, e.getTime() - s.getTime());
        daysCount = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1);
      }

      // Location
      const areaParts = [p.district, p.province].filter(Boolean);
      const areaStr =
        areaParts.length > 0 ? areaParts.join(", ") : p.location || "-";

      // Targets / Stores
      const targets = extractTargetNames(p);
      const targetsHtml =
        targets.length > 0
          ? targets
              .map(
                (t) =>
                  `<div style="margin-bottom: 2px;">• ${safeHtml(t)}</div>`,
              )
              .join("")
          : `<span style="color: #94a3b8; font-style: italic;">-</span>`;

      // Work Types
      const workTypes = extractWorkTypeLabels(p);
      const workTypesHtml =
        workTypes.length > 0
          ? workTypes
              .map(
                (wt) =>
                  `<div style="font-size: 8.5px; font-weight: 600; color: #0f3568; margin-bottom: 2px;">${safeHtml(wt)}</div>`,
              )
              .join("")
          : "-";

      // Helpers
      const helpersList = Array.isArray((p as any).helpers)
        ? (p as any).helpers
            .map(
              (h: any) =>
                h.employee?.firstName ||
                h.employee?.name ||
                h.name ||
                "",
            )
            .filter(Boolean)
            .join(", ")
        : "";

      // Status
      let badgeClass = "badge-blue";
      let statusText: string = p.status;
      if (p.status === "APPROVED") {
        badgeClass = "badge-green";
        statusText = "อนุมัติแล้ว";
      } else if (p.status.startsWith("PENDING")) {
        badgeClass = "badge-amber";
        statusText = "รออนุมัติ";
      } else if (p.status === "CANCELLED") {
        badgeClass = "badge-red";
        statusText = "ยกเลิก";
      } else {
        badgeClass = "badge-slate";
        statusText = "แบบร่าง";
      }

      return `
        <tr>
          <td class="text-center" style="font-weight: 600; width: 4%;">${idx + 1}</td>
          <td style="width: 15%; line-height: 1.3;">
            <div style="font-weight: 700; color: #0f3568;">${safeHtml(dateDisplay)}</div>
            <div style="font-size: 8px; color: #64748b;">(ระยะเวลา ${daysCount} วัน)</div>
          </td>
          <td style="width: 23%;">
            <div style="font-weight: 700; color: #0f3568; font-size: 9.5px;">${safeHtml(p.title)}</div>
            <div style="font-size: 8px; color: #64748b;">เลขที่: ${safeHtml(p.code || p.id)}</div>
            ${helpersList ? `<div style="font-size: 8px; color: #475569; margin-top: 2px;">ผู้ร่วมเดินทาง: ${safeHtml(helpersList)}</div>` : ""}
          </td>
          <td style="width: 16%; font-weight: 500; font-size: 8.5px;">
            ${safeHtml(areaStr)}
          </td>
          <td style="width: 21%; font-size: 8.5px;">
            ${targetsHtml}
          </td>
          <td style="width: 12%;">
            ${workTypesHtml}
          </td>
          <td class="text-center" style="width: 9%;">
            <span class="doc-badge ${badgeClass}" style="font-size: 8px; padding: 2px 5px;">${statusText}</span>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
  <!-- HEADER -->
  <table class="header-table">
    <tr>
      <td style="width: 60%;">
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
      <td style="width: 40%;" class="doc-meta">
        <div class="doc-title-main">รายงานสรุปแผนงานลงพื้นที่ประจำเดือน</div>
        <div class="doc-title-sub">MONTHLY FIELD ACTIVITY ITINERARY</div>
        <div style="margin-top: 4px; font-size: 11px; font-weight: 700; color: #0f3568;">
          ประจำเดือน: ${thaiMonthName} ${thaiYear}
        </div>
        <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
          วันที่พิมพ์รายงาน: ${printDateStr}
        </div>
      </td>
    </tr>
  </table>

  <!-- EMPLOYEE / REP INFO -->
  <div class="section-box avoid-break" style="margin-bottom: 10px;">
    <div class="section-body" style="padding: 6px 10px;">
      <div class="info-grid">
        <div class="info-row">
          <div class="info-cell" style="width: 35%;">
            <span class="info-label">พนักงานผู้จัดทำแผน:</span>
            <span class="info-value" style="font-weight: 700; color: #0f3568;">${safeHtml(empName || "-")}</span>
          </div>
          <div class="info-cell" style="width: 35%;">
            <span class="info-label">ตำแหน่ง/ฝ่าย:</span>
            <span class="info-value">${safeHtml(empPos || "-")} / ${safeHtml(empDept || "-")}</span>
          </div>
          <div class="info-cell" style="width: 30%;">
            <span class="info-label">รอบแผนงาน:</span>
            <span class="info-value" style="font-weight: 600;">เดือน ${thaiMonthName} ${thaiYear}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ITINERARY TABLE -->
  <div class="section-box avoid-break">
    <div class="section-header">
      <span>ตารางสรุปแผนงานลงพื้นที่ตลอดเดือน (Monthly Schedule & Itinerary)</span>
      <span style="font-size: 9px; color: #64748b; font-weight: normal;">
        พบทั้งหมด ${plans.length} แผนงาน
      </span>
    </div>
    <div class="section-body" style="padding: 0;">
      <table class="doc-table" style="margin: 0; font-size: 8.5px;">
        <thead>
          <tr>
            <th class="text-center" style="width: 4%;">ลำดับ</th>
            <th style="width: 15%;">วันที่ลงพื้นที่</th>
            <th style="width: 23%;">ชื่อแผนงาน / รหัสแผน</th>
            <th style="width: 16%;">พื้นที่เป้าหมาย</th>
            <th style="width: 21%;">ร้านค้า / เกษตรกรเป้าหมาย</th>
            <th style="width: 12%;">ประเภทงาน</th>
            <th class="text-center" style="width: 9%;">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          ${
            plans.length > 0
              ? tableRowsHtml
              : `<tr><td colspan="7" class="text-center" style="padding: 16px; color: #94a3b8; font-style: italic;">ไม่พบแผนงานในเดือนที่เลือก</td></tr>`
          }
        </tbody>
      </table>
    </div>
  </div>

  <!-- MONTHLY METRICS SUMMARY -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">จำนวนแผนงานทั้งหมด</div>
      <div class="kpi-value">${plans.length} แผนงาน</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">จำนวนวันที่ลงพื้นที่รวม</div>
      <div class="kpi-value">${totalDays} วัน</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">ร้านค้า/แปลงเป้าหมายรวม</div>
      <div class="kpi-value">${allUniqueTargets.size} แห่ง</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">งบประมาณรวมที่ขออนุมัติ</div>
      <div class="kpi-value" style="color: #059669;">฿${formatMoney(totalBudget)}</div>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="signatures-grid avoid-break">
    <div class="signature-card">
      <div class="signature-role">ผู้จัดทำแผนงาน (Prepared By)</div>
      <div class="signature-line"></div>
      <div class="signature-name">${empName && empName !== "-" ? `(${safeHtml(empName)})` : "...................................................."}</div>
      <div class="signature-date">ผู้แทนฝ่ายขาย / ส่งเสริม<br/>วันที่: ....../....../......</div>
    </div>
    <div class="signature-card">
      <div class="signature-role">หัวหน้างาน / ผู้จัดการเขต (Verified By)</div>
      <div class="signature-line"></div>
      <div class="signature-name">....................................................</div>
      <div class="signature-date">ผู้จัดการเขตการขาย<br/>วันที่: ....../....../......</div>
    </div>
    <div class="signature-card">
      <div class="signature-role">ผู้อำนวยการฝ่าย (Approved By)</div>
      <div class="signature-line"></div>
      <div class="signature-name">....................................................</div>
      <div class="signature-date">ผู้อำนวยการสายงาน<br/>วันที่: ....../....../......</div>
    </div>
  </div>
  `;
}

