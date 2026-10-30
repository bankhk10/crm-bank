import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml, formatQty, formatDateThai } from "../templates/template-helpers";

export class Type7aPdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "TYPE_7A";

  render(context: TypeRenderContext): TypeRenderResult {
    const { targets, parsedResults, plan, options } = context;
    const t7aTargets: any[] = Array.isArray(targets?.type7a)
      ? targets.type7a
      : Array.isArray((plan as any).type7aTargets)
      ? (plan as any).type7aTargets
      : [];

    const title = "[TYPE 7A] จัดทำแปลงสาธิต (Demonstration Plot Establishment)";

    if (t7aTargets.length === 0) {
      return {
        title,
        workTypeCode: this.workTypeCode,
        planHtml: `
          <div class="section-box">
            <div class="section-header">${title}</div>
            <div class="section-body">
              <p style="color: #64748b; font-style: italic; margin: 0;">ไม่มีข้อมูลแปลงสาธิตที่ระบุ</p>
            </div>
          </div>
        `,
      };
    }

    const plotsHtml = t7aTargets
      .map((plot, idx) => {
        const plotName = plot.plotName || plot.name || `แปลงสาธิตที่ ${idx + 1}`;
        const farmer = plot.farmerName || plot.owner || plot.ownerName || "-";
        const phone = plot.farmerPhone || plot.ownerPhone || "-";
        const crop = plot.cropName || plot.crop || plot.customCropName || "-";
        const areaRai = plot.areaRai ? `${formatQty(plot.areaRai)} ไร่` : "-";
        const treeCount = plot.treeCount ? `${formatQty(plot.treeCount)} ต้น` : "";
        const areaStr = [areaRai, treeCount].filter((s) => s !== "-").join(" / ") || "-";
        const plantingDate = plot.plantingDate ? formatDateThai(plot.plantingDate) : "-";
        const location = [plot.subdistrict, plot.district, plot.province].filter(Boolean).join(", ") || plot.location || "-";
        const gps = plot.latitude && plot.longitude ? `${plot.latitude}, ${plot.longitude}` : "-";
        const objective = plot.objective || "-";

        // Requisition / sample products
        const products: any[] = Array.isArray(plot.demoProducts)
          ? plot.demoProducts
          : Array.isArray(plot.products)
          ? plot.products
          : [];

        const productsTableHtml =
          products.length > 0
            ? `
          <div style="margin-top: 6px;">
            <div style="font-size: 9.5px; font-weight: 700; color: #0f3568; margin-bottom: 3px;">
              📦 รายการสารเคมีและผลิตภัณฑ์ที่ขอเบิกใช้งาน (Product Withdrawal Requisition):
            </div>
            <table class="doc-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 6%;">ลำดับ</th>
                  <th style="width: 50%;">ชื่อผลิตภัณฑ์ / สารเคมี</th>
                  <th class="text-center" style="width: 20%;">จำนวนขอเบิก</th>
                  <th class="text-center" style="width: 24%;">หน่วยนับ</th>
                </tr>
              </thead>
              <tbody>
                ${products
                  .map((p, pIdx) => {
                    const pName = p.productName || p.name || p.product?.name || "-";
                    const pQty = p.targetQuantity ?? p.quantity ?? 1;
                    const pUnit = p.unit || p.product?.unit || "หน่วย";
                    return `
                    <tr>
                      <td class="text-center">${pIdx + 1}</td>
                      <td style="font-weight: 600;">${safeHtml(pName)}</td>
                      <td class="text-center" style="font-weight: 700; color: #0f3568;">${formatQty(pQty)}</td>
                      <td class="text-center">${safeHtml(pUnit)}</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : "";

        return `
        <div style="${idx > 0 ? "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" : ""}">
          <div style="font-weight: 700; font-size: 11px; color: #0f3568; margin-bottom: 4px;">
            📍 แปลงที่ ${idx + 1}: ${safeHtml(plotName)}
          </div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">เจ้าของแปลง/เกษตรกร:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(farmer)}</span>
                ${phone !== "-" ? `<span style="font-size: 9px; color: #64748b;"> (โทร: ${safeHtml(phone)})</span>` : ""}
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ชนิดพืช / ขนาดแปลง:</span>
                <span class="info-value">${safeHtml(crop)} (${safeHtml(areaStr)})</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">ที่ตั้งแปลง:</span>
                <span class="info-value">${safeHtml(location)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">พิกัดดาวเทียม (GPS):</span>
                <span class="info-value">${safeHtml(gps)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-cell">
                <span class="info-label">วันที่ปลูก/หยอดเมล็ด:</span>
                <span class="info-value">${safeHtml(plantingDate)}</span>
              </div>
              <div class="info-cell">
                <span class="info-label">วัตถุประสงค์การทดสอบ:</span>
                <span class="info-value">${safeHtml(objective)}</span>
              </div>
            </div>
          </div>
          ${productsTableHtml}
        </div>
      `;
      })
      .join("");

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: normal;">แปลงสาธิตทั้งหมด ${t7aTargets.length} แปลง</span>
        </div>
        <div class="section-body">
          ${plotsHtml}
        </div>
      </div>
    `;

    // Actual observation
    let actualHtml = "";
    const t7aActual = parsedResults?.type7aActual || (parsedResults as any);
    if (t7aActual && (t7aActual.t7StartDate || t7aActual.notes || t7aActual.actualQuantityUsed)) {
      actualHtml = `
        <div class="section-box avoid-break" style="margin-top: 8px;">
          <div class="section-header" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <span>บันทึกผลการจัดทำแปลงจริง (Type 7A Actual Establishment)</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-row">
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">วันที่ลงแปลงจริง:</span>
                  <span class="info-value">${safeHtml(formatDateThai(t7aActual.t7StartDate || t7aActual.actualStartDate))}</span>
                </div>
                <div class="info-cell" style="width: 50%;">
                  <span class="info-label">สภาพดินและภูมิอากาศ:</span>
                  <span class="info-value">${safeHtml(t7aActual.weatherCondition || t7aActual.soilCondition || "ปกติ")}</span>
                </div>
              </div>
              ${
                t7aActual.notes
                  ? `<div class="info-row">
                      <div class="info-cell" colspan="2">
                        <span class="info-label">บันทึกเพิ่มเติมหน้างาน:</span>
                        <span class="info-value">${safeHtml(t7aActual.notes)}</span>
                      </div>
                     </div>`
                  : ""
              }
            </div>
          </div>
        </div>
      `;
    }

    // Custom signature boxes if user exports specifically this single type
    let signatureBoxesHtml: string | undefined = undefined;
    if (options.typeCode && options.typeCode !== "ALL") {
      signatureBoxesHtml = `
        <div class="signatures-grid avoid-break">
          <div class="signature-card">
            <div class="signature-role">ผู้ขอเบิก / ผู้รับผิดชอบแปลง</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้แทนฝ่ายขาย / ส่งเสริม<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">เกษตรกรเจ้าของแปลงผู้ร่วมทดสอบ</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">เกษตรกรผู้รับรองแปลง<br/>วันที่: ....../....../......</div>
          </div>
          <div class="signature-card">
            <div class="signature-role">ผู้อนุมัติจ่ายผลิตภัณฑ์ตัวอย่าง</div>
            <div class="signature-line"></div>
            <div class="signature-name">....................................................</div>
            <div class="signature-date">ผู้จัดการฝ่ายส่งเสริมการขาย / คลัง<br/>วันที่: ....../....../......</div>
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

