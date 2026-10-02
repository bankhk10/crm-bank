import type { ImageFile } from "../../shared/actual-view/types";

export interface Type8ActualValidationInput {
  activityResultStatus?: string;
  t8RegistrationImages?: ImageFile[];
}

/**
 * Validates TYPE_8 (จัดประชุม / สัมมนา) actual results
 */
export function validateType8Actual(
  input: Type8ActualValidationInput,
): { isValid: boolean; error?: string } {
  const { activityResultStatus = "COMPLETED", t8RegistrationImages = [] } = input;

  if (activityResultStatus === "COMPLETED") {
    const regImagesCount = t8RegistrationImages.length;
    if (regImagesCount === 0) {
      return {
        isValid: false,
        error: "กรุณาแนบรูปใบลงทะเบียนผู้เข้าร่วมงานอย่างน้อย 1 รูป",
      };
    }
    if (regImagesCount > 5) {
      return {
        isValid: false,
        error: "รูปใบลงทะเบียนผู้เข้าร่วมงานต้องไม่เกิน 5 รูป",
      };
    }
  }

  return { isValid: true };
}
