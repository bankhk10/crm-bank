import type { Type8ActualValidationInput } from "../types/actual.types";

/**
 * Validates TYPE_8 (จัดประชุม / สัมมนา) actual results
 */
export function validateType8Actual(
  input: Type8ActualValidationInput,
): { isValid: boolean; error?: string; errors?: string[] } {
  const { activityResultStatus = "COMPLETED", t8RegistrationImages = [] } = input;

  if (activityResultStatus === "COMPLETED") {
    const regImagesCount = t8RegistrationImages.length;
    if (regImagesCount === 0) {
      const msg = "กรุณาแนบรูปใบลงทะเบียนผู้เข้าร่วมงานอย่างน้อย 1 รูป";
      return {
        isValid: false,
        error: msg,
        errors: [msg],
      };
    }
    if (regImagesCount > 5) {
      const msg = "รูปใบลงทะเบียนผู้เข้าร่วมงานต้องไม่เกิน 5 รูป";
      return {
        isValid: false,
        error: msg,
        errors: [msg],
      };
    }
  }

  return { isValid: true, errors: [] };
}
