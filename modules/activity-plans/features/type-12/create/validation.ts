export interface ValidateType12Params {
  selectedWorkTypes: string[];
  type12TourType: string;
  type12TourSize: string;
  type12Country: string;
  type12Store: string;
  type12Destination: string;
}

export function validateType12FormValues({
  selectedWorkTypes,
  type12TourType,
  type12TourSize,
  type12Country,
  type12Store,
  type12Destination,
}: ValidateType12Params): { isValid: boolean; error?: string } {
  if (!selectedWorkTypes.includes("ทัวร์")) {
    return { isValid: true };
  }
  if (!type12TourType) {
    return { isValid: false, error: "กรุณาเลือกประเภททัวร์" };
  }
  if (type12TourType === "ทัวร์กลาง") {
    if (!type12TourSize) {
      return { isValid: false, error: "กรุณาเลือกขนาดทัวร์" };
    }
    if (!type12Country.trim()) {
      return { isValid: false, error: "กรุณากรอกชื่อประเทศ" };
    }
  } else if (type12TourType === "ทัวร์ร้านค้า") {
    if (!type12Store.trim()) {
      return { isValid: false, error: "กรุณาเลือกร้านค้า" };
    }
    if (!type12Destination.trim()) {
      return { isValid: false, error: "กรุณากรอกสถานที่จะไป" };
    }
  }
  return { isValid: true };
}
