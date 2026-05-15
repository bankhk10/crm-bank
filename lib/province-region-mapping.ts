export const regionMapping: Record<string, string[]> = {
  ภาคเหนือ: [
    "เชียงใหม่",
    "เชียงราย",
    "ลำปาง",
    "ลำพูน",
    "แม่ฮ่องสอน",
    "น่าน",
    "พะเยา",
    "แพร่",
    "อุตรดิตถ์",
    "สุโขทัย",
    "พิษณุโลก",
    "พิจิตร",
    "กำแพงเพชร",
    "เพชรบูรณ์",
    "ตาก",
    "นครสวรรค์",
  ],
  ภาคอีสาน: [
    "ขอนแก่น",
    "อุดรธานี",
    "นครราชสีมา",
    "อุบลราชธานี",
    "ร้อยเอ็ด",
    "มหาสารคาม",
    "สกลนคร",
    "นครพนม",
    "กาฬสินธุ์",
    "หนองคาย",
    "หนองบัวลำภู",
    "เลย",
    "ชัยภูมิ",
    "บุรีรัมย์",
    "สุรินทร์",
    "ศรีสะเกษ",
    "ยโสธร",
    "อำนาจเจริญ",
    "มุกดาหาร",
    "บึงกาฬ",
  ],
  ภาคตะวันออก: [
    "ชลบุรี",
    "ระยอง",
    "จันทบุรี",
    "ตราด",
    "ฉะเชิงเทรา",
    "ปราจีนบุรี",
    "สระแก้ว",
  ],
  ภาคตะวันตก: [
    "ราชบุรี",
    "กาญจนบุรี",
    "สุพรรณบุรี",
    "นครปฐม",
    "สมุทรสาคร",
    "สมุทรสงคราม",
    "เพชรบุรี",
    "ประจวบคีรีขันธ์",
  ],
  ภาคกลาง: [
    "กรุงเทพมหานคร",
    "นนทบุรี",
    "ปทุมธานี",
    "สมุทรปราการ",
    "พระนครศรีอยุธยา",
    "อ่างทอง",
    "ลพบุรี",
    "สิงห์บุรี",
    "ชัยนาท",
    "สระบุรี",
    "นครนายก",
    "อุทัยธานี",
  ],
  ภาคใต้: [
    "นครศรีธรรมราช",
    "กระบี่",
    "พังงา",
    "ภูเก็ต",
    "สุราษฎร์ธานี",
    "ระนอง",
    "ชุมพร",
    "สงขลา",
    "สตูล",
    "ตรัง",
    "พัทลุง",
    "ปัตตานี",
    "ยะลา",
    "นราธิวาส",
  ],
};

// Invert the map for O(1) lookup: province -> region
const provinceToRegionMap: Record<string, string> = {};
Object.entries(regionMapping).forEach(([region, provinces]) => {
  provinces.forEach((province) => {
    provinceToRegionMap[province] = region;
  });
});

export function getRegionByProvince(
  province: string | undefined | null
): string | null {
  if (!province) return null;
  // Handle potential whitespace or slight mismatches if needed, but usually just exact match
  return provinceToRegionMap[province.trim()] || null;
}

export function getAllRegions(): string[] {
  return Object.keys(regionMapping);
}
