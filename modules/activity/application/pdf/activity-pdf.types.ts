import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import type {
  PlanSummaryData,
  ActualTargetsState,
  ParsedSummaryValues,
} from "@/modules/activity/domain/summary";

/**
 * Options for configuring Activity Plan PDF export
 */
export interface PdfExportOptions {
  mode?: "ALL" | "SINGLE"; // "ALL" = Monthly Summary of all plans, "SINGLE" = Specific Plan Detail
  planId?: string; // used for SINGLE mode
  year?: number; // Christian year e.g. 2026 (used for ALL mode)
  month?: number; // 1 - 12 (used for ALL mode)
  employeeId?: string; // optional filter by employee for ALL mode
  typeCode?: string; // "ALL" or specific type code e.g. "TYPE_1", "TYPE_7A" (for SINGLE mode)
  includeActual?: boolean; // include actual results section if recorded
  includePhotos?: boolean; // include actual photo gallery
  pageBreakPerType?: boolean; // insert page-break between multiple types
  disposition?: "inline" | "attachment";
}

/**
 * Context provided to each type-specific renderer
 */
export interface TypeRenderContext {
  plan: ActivityPlanWithRelations;
  planSummary: PlanSummaryData;
  targets: ActualTargetsState;
  parsedResults?: ParsedSummaryValues;
  options: PdfExportOptions;
}

/**
 * Render result returned by each type-specific renderer
 */
export interface TypeRenderResult {
  title: string;
  workTypeCode: string;
  planHtml: string;
  actualHtml?: string;
  signatureBoxesHtml?: string;
}
