import type { TypeRenderContext, TypeRenderResult } from "../activity-pdf.types";

export interface TypePdfRenderer {
  /**
   * The work type code this renderer handles (e.g. "TYPE_1", "TYPE_7A", "TYPE_13")
   */
  readonly workTypeCode: string;

  /**
   * Renders the type-specific plan and actual sections into HTML
   */
  render(context: TypeRenderContext): Promise<TypeRenderResult> | TypeRenderResult;
}

