import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty, formatDateThai } from "../templates/template-helpers";

export class Type13PdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_13";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan } = context;
    const t13Targets: any[] = Array.isArray(targets?.type13)
      ? targets.type13
      : Array.isArray((plan as any).type13Targets)
      ? (plan as any).type13Targets
      : [];

    const title = "[TYPE 13] ฉีดแปลงแฮตแทค (Hat-Attack Spraying)";

    if (t13Targets.length === 0) {
      return {
        title,
        workTypeCode: this.workTypeCode,
        planHtml: `
          <div class="section-box">
            <div class="section-header">${title}</div>
            <div class="section-body">
              <p style="color: #64748b; font-style: italic; margin: 0;">ไม่มีรายการฉีดพ่นแปลงแฮตแทคที่ระบุ</p>
            </div>
          </div>
        `,
      };
    }

    const rowsHtml = t13Targets
      .map((item, idx) => {
        const farmer = item.farmerName || item.customerName || item.owner || `แปลงที่ ${idx + 1}`;
        const phone = item.farmerPhone || item.phone || "-";
        const crop = item.crop || item.cropName || "-";
        const area = item.areaRai ? `${formatQty(item.areaRai)} ไร่` : "-";
        const pest = item.targetPest || item.pest || "หนอนกระทู้ / เพลี้ย";
        const chemical = item.chemicalName || item.chemical || "แฮตแทค (Hat-Attack)";
        const method = item.sprayMethod || item.equipment || "โดรนการเกษตร";

        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 600; color: #0f3568;">
              ${safeHtml(farmer)}
              ${phone !== "-" ? `<br/><span style="font-size: 8.5px; color: #64748b;">โทร: ${safeHtml(phone)}</span>` : ""}
            </td>
            <td>${safeHtml(crop)} (${safeHtml(area)})</td>
            <td style="color: #b91c1c; font-weight: 500;">${safeHtml(pest)}</td>
            <td style="font-weight: 600;">${safeHtml(chemical)}</td>
            <td class="text-center">${safeHtml(method)}</td>
          </tr>
        `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">เป้าหมายฉีดพ่น ${t13Targets.length} แปลง</span>
        </div>
        <div class="section-body" style="padding: 0;">
          <table class="doc-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="text-center" style="width: 5%;">ลำดับ</th>
                <th style="width: 25%;">เกษตรกร / เจ้าของแปลง</th>
                <th style="width: 20%;">พืชเป้าหมาย / พื้นที่</th>
                <th style="width: 20%;">ศัตรูพืชที่ระบาด</th>
                <th style="width: 15%;">สารเคมีที่ใช้</th>
                <th class="text-center" style="width: 15%;">เครื่องมือฉีดพ่น</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Actual spray execution
    let actualHtml = "";
    const t13Actual = parsedResults?.type13Actual || (parsedResults as any);
    if (t13Actual && (t13Actual.sprayDate || t13Actual.actualSprayedRai || t13Actual.chemicalUsed)) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการฉีดพ่นจริง (Type 13 Actual Spraying Log)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 33%;">
                  <span class="info-label">วันที่ฉีดพ่นจริง:</span>
                  <span class="info-value">${safeHtml(formatDateThai(t13Actual.sprayDate || t13Actual.actualStartDate))}</span>
                </div>
                <div class="info-cell" style="width: 33%;">
                  <span class="info-label">พื้นที่ฉีดพ่นสำเร็จ:</span>
                  <span class="info-value" style="font-weight: 700; color: #059669;">${safeHtml(t13Actual.actualSprayedRai ? `${formatQty(t13Actual.actualSprayedRai)} ไร่` : "-")}</span>
                </div>
                <div class="info-cell" style="width: 34%;">
                  <span class="info-label">สภาพลม/อากาศ:</span>
                  <span class="info-value">${safeHtml(t13Actual.weather || "ลมสงบ เหมาะแก่การพ่น")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return {
      title,
      workTypeCode: this.workTypeCode,
      planHtml,
      actualHtml,
    };
  }
}

