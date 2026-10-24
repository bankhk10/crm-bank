/**
 * Parse Type 13 actual outcome from resultSummary and plan attachments/relations
 */
export function parseType13ActualResult(
  resultSummary: string = "",
  planPayload?: any,
): {
  plotCount?: number;
  roundsCount?: number;
  sprayRounds?: any[];
  type13Actual?: any;
} {
  const result: any = {};

  if (planPayload?.type13Results && Array.isArray(planPayload.type13Results) && planPayload.type13Results.length > 0) {
    const allRounds = planPayload.type13Results.flatMap((r: any) => r.sprayRounds || []);
    return {
      type13Actual: {
        plots: planPayload.type13Results,
        sprayRounds: allRounds,
        totalPlots: planPayload.type13Results.length,
      },
      plotCount: planPayload.type13Results.length,
      sprayRounds: allRounds,
      roundsCount: allRounds.length,
    };
  }

  if (planPayload?.type13Actual) {
    return {
      type13Actual: planPayload.type13Actual,
      plotCount: planPayload.type13Actual.plots?.length,
      sprayRounds: planPayload.type13Actual.sprayRounds,
    };
  }

  // Parse from resultSummary if present (e.g., "ฉีดแปลงแฮตแทคสำเร็จ 2 แปลง (3 รอบการฉีด)")
  const plotMatch = resultSummary.match(/ฉีดแปลงแฮตแทคสำเร็จ\s*(\d+)\s*แปลง/);
  if (plotMatch) {
    result.plotCount = parseInt(plotMatch[1], 10);
  }

  const roundMatch = resultSummary.match(/(\d+)\s*รอบการฉีด/);
  if (roundMatch) {
    result.roundsCount = parseInt(roundMatch[1], 10);
  }

  return result;
}
