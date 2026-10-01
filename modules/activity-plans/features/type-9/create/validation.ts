export interface ValidateType9Options {
  selectedWorkTypes?: string[];
  isUnregisteredSubdealer?: boolean;
  subDealerStore?: string;
  subDealerProvince?: string;
  subDealerDistrict?: string;
  subdealerId?: string;
}

export interface Type9ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 9 (Promotion Event / Sales Promotion).
 * Validates Subdealer registration or manual store name, province, and district.
 */
export function validateType9FormItems({
  selectedWorkTypes = [],
  isUnregisteredSubdealer = false,
  subDealerStore = "",
  subDealerProvince = "",
  subDealerDistrict = "",
  subdealerId = "",
}: ValidateType9Options): Type9ValidationResult {
  const isType9Selected =
    selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") ||
    selectedWorkTypes.includes("TYPE_9");

  if (!isType9Selected) {
    return { isValid: true };
  }

  if (isUnregisteredSubdealer) {
    if (!subDealerStore || !subDealerStore.trim()) {
      return {
        isValid: false,
        error: "กรุณากรอกชื่อร้านค้า Sub Dealer",
      };
    }
    if (!subDealerProvince || !subDealerProvince.trim()) {
      return {
        isValid: false,
        error: "กรุณาเลือกจังหวัดของร้านค้า Sub Dealer",
      };
    }
    if (!subDealerDistrict || !subDealerDistrict.trim()) {
      return {
        isValid: false,
        error: "กรุณาเลือกอำเภอของร้านค้า Sub Dealer",
      };
    }
  } else {
    if (!subdealerId) {
      return {
        isValid: false,
        error: "กรุณาเลือกร้านค้า Sub Dealer จาก Customer Master",
      };
    }
  }

  return { isValid: true };
}
