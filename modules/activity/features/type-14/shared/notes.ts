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
  rounds: any[] = [],
  plotName = "",
): string {
  const roundCount = rounds.length;
  const latestRound = rounds[roundCount - 1];
  const daysText = latestRound?.daysAfterSpray
    ? `(${latestRound.daysAfterSpray} วันหลังฉีด)`
    : "";
  const resultText = latestRound?.trackingResult
    ? `ผล: ${latestRound.trackingResult}`
    : "";

  return `ติดตามแปลงแฮตแทค${plotName ? ` (${plotName})` : ""}: ${roundCount} รอบ ${daysText} ${resultText}`.trim();
}
