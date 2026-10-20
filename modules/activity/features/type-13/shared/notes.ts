import type { Type13PlotItem } from "./types";

/**
 * Format plan summary notes for Type 13 (Hattack Spraying)
 */
export function formatType13PlannedNotes(plots: Type13PlotItem[] = []): string {
  if (!plots || plots.length === 0) return "ฉีดแปลงแฮตแทค";

  const count = plots.length;
  const firstPlot = plots[0];
  const dealer = firstPlot.dealerName || "ตัวแทนจำหน่าย";
  const province = firstPlot.province ? ` จ.${firstPlot.province}` : "";

  return `ฉีดแปลงแฮตแทค ${count} แปลง (ตัวแทน: ${dealer}${province})`;
}

/**
 * Format execution result summary notes for Type 13
 */
export function formatType13ActualSummary(
  plotCount: number,
  roundsCount: number,
  totalSprayPlots?: number,
): string {
  let summary = `ฉีดแปลงแฮตแทคสำเร็จ ${plotCount} แปลง (${roundsCount} รอบการฉีด)`;
  if (totalSprayPlots != null && totalSprayPlots > 0) {
    summary += ` รวมพื้นที่ ${totalSprayPlots} แปลง`;
  }
  return summary;
}
