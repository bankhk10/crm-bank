/**
 * Format plan summary notes for Type 14 (Hattack Follow-up)
 */
export function formatType14PlannedNotes(data: any): string {
  if (!data) return "";
  const parts: string[] = [];

  if (data.mode === "EXISTING_PLOT") {
    parts.push("โหมด: ติดตามแปลงเดิม");
  } else {
    parts.push("โหมด: สร้างแปลงติดตามใหม่");
  }

  if (data.name) {
    parts.push(`แปลง: ${data.name}`);
  }
  if (data.dealerName) {
    parts.push(`ร้านค้า/Dealer: ${data.dealerName}`);
  }
  if (data.ownerName) {
    parts.push(`เกษตรกร: ${data.ownerName}`);
  }
  if (data.province || data.district) {
    parts.push(
      `พื้นที่: ${[data.district, data.province].filter(Boolean).join(", ")}`,
    );
  }

  return parts.join(" | ");
}

/**
 * Format actual execution summary for Type 14
 */
export function formatType14ActualSummary(
  plotsOrRounds: any[] = [],
  plotName = "",
): string {
  const count = plotsOrRounds.length;
  const latestItem = plotsOrRounds[count - 1];
  const daysText = latestItem?.daysAfterSpray
    ? `(${latestItem.daysAfterSpray} วันหลังฉีด)`
    : "";
  const resultText = latestItem?.trackingResult
    ? `ผล: ${latestItem.trackingResult}`
    : "";

  return `ติดตามแปลงแฮตแทค${plotName ? ` (${plotName})` : ""}: ${count} แปลง ${daysText} ${resultText}`.trim();
}
