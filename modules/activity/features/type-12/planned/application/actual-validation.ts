export interface ValidateType12ActualParams {
  actualAttendees?: string | number;
  tourHighlights?: string;
  feedbackIssues?: string;
  images?: any[];
}

export function validateType12Actual(
  params: ValidateType12ActualParams,
): { isValid: boolean; error?: string } {
  if (params.actualAttendees !== undefined && params.actualAttendees !== "") {
    const num = Number(params.actualAttendees);
    if (isNaN(num) || num < 0) {
      return { isValid: false, error: "จำนวนผู้ร่วมเดินทางจริงต้องเป็นตัวเลขที่ถูกต้อง" };
    }
  }

  return { isValid: true };
}
