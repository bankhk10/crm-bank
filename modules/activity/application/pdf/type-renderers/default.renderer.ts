import type { TypePdfRenderer } from "./type-renderer.interface";
import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";
import { safeHtml } from "../templates/template-helpers";
import { getWorkTypeName } from "@/modules/activity/constants";

export class DefaultTypePdfRenderer implements TypePdfRenderer {
  readonly workTypeCode = "DEFAULT";

  render(context: TypeRenderContext): TypeRenderResult {
    const { plan, options } = context;
    const code = options.typeCode || "ACTIVITY";
    const typeName = getWorkTypeName(code) || code;
    const title = `รายละเอียดประเภทงาน: ${typeName}`;

    const planHtml = `
      <div class="section-box avoid-break">
        <div class="section-header">
          <span>${title}</span>
        </div>
        <div class="section-body">
          <div class="info-grid">
            <div class="info-row">
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">ชื่อแผนงาน:</span>
                <span class="info-value" style="font-weight: 600;">${safeHtml(plan.title)}</span>
              </div>
              <div class="info-cell" style="width: 50%;">
                <span class="info-label">รหัสประเภทงาน:</span>
                <span class="info-value">${safeHtml(code)}</span>
              </div>
            </div>
            ${
              plan.description
                ? `<div class="info-row">
                    <div class="info-cell" colspan="2">
                      <span class="info-label">รายละเอียด:</span>
                      <span class="info-value">${safeHtml(plan.description)}</span>
                    </div>
                   </div>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    return {
      title,
      workTypeCode: this.workTypeCode,
      planHtml,
    };
  }
}

