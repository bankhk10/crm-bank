export interface WorkTypeConfig {
  code: string;
  name: string;
  shortName: string;
  sortOrder: number;
  hasActual: boolean;
  requiresApproval: boolean;
}

export const WORK_TYPE_CONFIG: Record<string, WorkTypeConfig> = {
  TYPE_1: {
    code: "TYPE_1",
    name: "เข้าพบร้านค้า / Key Farmer",
    shortName: "Visit",
    sortOrder: 1,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_2: {
    code: "TYPE_2",
    name: "ติดตามผลการใช้สินค้า",
    shortName: "Followup",
    sortOrder: 2,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_3: {
    code: "TYPE_3",
    name: "เสนอขายสินค้า",
    shortName: "Sales",
    sortOrder: 3,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_4: {
    code: "TYPE_4",
    name: "วางบิล / เก็บเงิน",
    shortName: "Collect",
    sortOrder: 4,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_5: {
    code: "TYPE_5",
    name: "สำรวจตลาดของคู่แข่ง",
    shortName: "Survey",
    sortOrder: 5,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_6: {
    code: "TYPE_6",
    name: "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
    shortName: "Issue",
    sortOrder: 6,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_7A: {
    code: "TYPE_7A",
    name: "ทำแปลงสาธิต",
    shortName: "DemoNew",
    sortOrder: 7,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_7B: {
    code: "TYPE_7B",
    name: "ติดตามแปลงสาธิต",
    shortName: "DemoFollow",
    sortOrder: 8,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_8: {
    code: "TYPE_8",
    name: "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
    shortName: "Meeting",
    sortOrder: 9,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_9: {
    code: "TYPE_9",
    name: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    shortName: "Store",
    sortOrder: 10,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_10: {
    code: "TYPE_10",
    name: "จัดงาน Field Day",
    shortName: "FieldDay",
    sortOrder: 11,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_11: {
    code: "TYPE_11",
    name: "ตรวจเช็กสต็อกหน้าร้าน",
    shortName: "Stock",
    sortOrder: 12,
    hasActual: true,
    requiresApproval: true,
  },
  TYPE_12: {
    code: "TYPE_12",
    name: "ทัวร์",
    shortName: "Tour",
    sortOrder: 13,
    hasActual: false,
    requiresApproval: true,
  },
};

// Master 13 work types list
export const WORK_TYPES = Object.values(WORK_TYPE_CONFIG).map((c) => c.name);

// Helper function to resolve code from name or code
export function getWorkTypeCode(nameOrCode: string): string {
  if (!nameOrCode) return "";
  if (WORK_TYPE_CONFIG[nameOrCode]) return nameOrCode;
  if (
    nameOrCode === "เข้าพบร้านค้า / Key Farmer" ||
    nameOrCode === "เข้าพบเกษตรกร"
  )
    return "TYPE_1";
  if (
    nameOrCode === "แก้ปัญหา / รับเรื่องร้องเรียน" ||
    nameOrCode === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา"
  ) {
    return "TYPE_6";
  }
  if (nameOrCode === "ทำแปลงสาธิต" || nameOrCode === "TYPE_7A") {
    return "TYPE_7A";
  }
  if (nameOrCode === "ติดตามแปลงสาธิต" || nameOrCode === "TYPE_7B") {
    return "TYPE_7B";
  }
  if (nameOrCode === "ติดตามแปลงสาธิต / ทำแปลง" || nameOrCode === "TYPE_7") {
    return "TYPE_7A";
  }
  const entry = Object.values(WORK_TYPE_CONFIG).find(
    (c) => c.name === nameOrCode || c.shortName === nameOrCode,
  );
  return entry ? entry.code : nameOrCode;
}

// Helper function to resolve name from code
export function getWorkTypeName(codeOrName: string): string {
  if (!codeOrName) return "";
  if (
    codeOrName === "เข้าพบร้านค้า / Key Farmer" ||
    codeOrName === "เข้าพบเกษตรกร" ||
    codeOrName === "TYPE_1"
  ) {
    return WORK_TYPE_CONFIG.TYPE_1.name;
  }
  if (
    codeOrName === "แก้ปัญหา / รับเรื่องร้องเรียน" ||
    codeOrName === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา" ||
    codeOrName === "TYPE_6"
  ) {
    return WORK_TYPE_CONFIG.TYPE_6.name;
  }
  if (
    codeOrName === "ทำแปลงสาธิต" ||
    codeOrName === "TYPE_7A" ||
    codeOrName === "TYPE_7"
  ) {
    return WORK_TYPE_CONFIG.TYPE_7A.name;
  }
  if (codeOrName === "ติดตามแปลงสาธิต" || codeOrName === "TYPE_7B") {
    return WORK_TYPE_CONFIG.TYPE_7B.name;
  }
  if (WORK_TYPE_CONFIG[codeOrName]) return WORK_TYPE_CONFIG[codeOrName].name;
  return codeOrName;
}

/**
 * Work Type codes that require/display Location and Team section:
 * - TYPE_8: จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์
 * - TYPE_9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน
 * - TYPE_10: จัดงาน Field Day
 */
export const LOCATION_TEAM_WORK_TYPE_CODES = new Set([
  "TYPE_8",
  "TYPE_9",
  "TYPE_10",
]);

/**
 * Returns true if any of the given work types (by name, shortName, or code)
 * requires/displays the Location and Team section.
 */
export function isLocationAndTeamRequired(
  workTypes?: string[] | null,
): boolean {
  if (!workTypes || workTypes.length === 0) return false;
  return workTypes.some((wt) => {
    const code = getWorkTypeCode(wt);
    return LOCATION_TEAM_WORK_TYPE_CODES.has(code);
  });
}

// Sample lists for dropdowns
export const DEMO_OWNERS = [
  "บริษัททดสอบ",
  "ร้านทดสอบ สาขา 1",
  "เกษตรกรตัวอย่าง 1",
  "ร้านสหายพานิช",
];

export const DEMO_PRODUCTS = [
  "สินค้าทดสอบ A",
  "สินค้าทดสอบ B",
  "สินค้าทดสอบ C",
  "ปุ๋ยเคมีสูตรพิเศษ",
];

export const DEMO_PRODUCT_PRICES: Record<string, number> = {
  "สินค้าทดสอบ A": 500,
  "สินค้าทดสอบ B": 750,
  "สินค้าทดสอบ C": 1200,
  ปุ๋ยเคมีสูตรพิเศษ: 950,
};

export const MARKETING_PRODUCT_CATEGORIES = [
  "Premium_item",
  "PP_Board",
  "Banner",
  "Leaflet",
  "อุปกรณ์จัดงาน",
  "อื่นๆ",
];

export const CROP_CATEGORIES = ["ผักและพืชล้มลุก", "พืชไร่", "พืชสวน"];

export const CROPS_BY_CATEGORY: Record<string, string[]> = {
  ผักและพืชล้มลุก: [
    "คะน้า",
    "กะหล่ำปลี",
    "พริก",
    "มะเขือเทศ",
    "แตงกวา",
    "หอมแดง",
    "กระเทียม",
    "แตงโม",
    "ฟักทอง",
    "ผักและพืชล้มลุกอื่นๆ",
  ],
  พืชไร่: [
    "ข้าว",
    "มันสำปะหลัง",
    "ยางพารา",
    "อ้อย",
    "ข้าวโพด",
    "ปาล์มน้ำมัน",
    "ถั่วเหลือง",
    "พืชไร่อื่นๆ",
  ],
  พืชสวน: [
    "ทุเรียน",
    "ชมพู่",
    "มังคุด",
    "เงาะ",
    "ส้ม",
    "มะม่วง",
    "ลำไย",
    "มะพร้าว",
    "ลองกอง",
    "พืชสวนอื่นๆ",
  ],
};

export const TARGET_CROPS = [
  "ทุเรียน",
  "ข้าว",
  "มันสำปะหลัง",
  "ยางพารา",
  "อ้อย",
  "ส้ม",
];

export const STORES_LIST = [
  "ร้านทดสอบ สาขา 1",
  "ร้านทดสอบ สาขา 2",
  "ร้านสหายพานิช จันทบุรี",
  "ร้านเกษตรพัฒนา",
];

export const REQUISITION_UNITS = [
  "ขวด",
  "ซอง",
  "แผ่น",
  "กล่อง",
  "ชิ้น",
  "ถุง",
  "ชุด",
  "ม้วน",
];

export const MARKETING_UNITS = [
  "ชิ้น",
  "ใบ",
  "เล่ม",
  "ตัว",
  "แผ่น",
  "ผืน",
  "กล่อง",
  "ลัง",
  "แพค",
  "อัน",
  "คัน",
  "ชุด",
  "ขวด",
  "ซอง",
  "ถุง",
  "ม้วน",
];

export interface UserDemoPlotOption {
  id: string;
  code?: string;
  name: string;
  location: string;
  targetCrop: string;
  showcase: string;
  ownerName?: string;
  cropCategory?: string;
  cropName?: string;
  customCropName?: string;
  productId?: string;
  productName?: string;
  areaRai?: number;
  treeCount?: number;
  startDate?: string;
  status?: string;
  visitsCount?: number;
  totalCost?: number;
  daysSinceStart?: number;
  objective?: string;
  experimentDetail?: string;
  latitude?: string;
  longitude?: string;
}

export const USER_DEMO_PLOTS: UserDemoPlotOption[] = [
  {
    id: "plot-1",
    name: "แปลงสาธิตสวนทุเรียน อ.แกลง (นายสมชาย)",
    location: "แปลงสาธิตสวนทุเรียน ต.วังหว้า อ.แกลง จ.ระยอง",
    targetCrop: "ทุเรียนหมอนทอง",
    showcase: "ปุ๋ยสูตรพรีเมียม A",
    ownerName: "นายสมชาย ใจดี",
    cropCategory: "พืชสวน",
    cropName: "ทุเรียน",
    productName: "สินค้าทดสอบ A",
    areaRai: 10,
    treeCount: 120,
    startDate: "2026-03-15",
  },
  {
    id: "plot-2",
    name: "แปลงสาธิตนาข้าว อ.บางเลน (ร้านเกษตรพัฒนา)",
    location: "แปลงสาธิตนาข้าว ต.บางเลน อ.บางเลน จ.นครปฐม",
    targetCrop: "ข้าวหอมมะลิ",
    showcase: "ฮอร์โมนเร่งรวง B",
    ownerName: "ร้านเกษตรพัฒนา (นายสมศักดิ์)",
    cropCategory: "พืชไร่",
    cropName: "ข้าว",
    productName: "สินค้าทดสอบ B",
    areaRai: 25,
    treeCount: 0,
    startDate: "2026-04-01",
  },
  {
    id: "plot-3",
    name: "แปลงสาธิตมันสำปะหลัง อ.ด่านขุนทด (ร้านสหายพานิช)",
    location: "แปลงสาธิต ต.ห้วยบง อ.ด่านขุนทด จ.นครราชสีมา",
    targetCrop: "มันสำปะหลัง",
    showcase: "ปุ๋ยชีวภาพเร่งหัว C",
    ownerName: "ร้านสหายพานิช",
    cropCategory: "พืชไร่",
    cropName: "มันสำปะหลัง",
    productName: "สินค้าทดสอบ C",
    areaRai: 15,
    treeCount: 0,
    startDate: "2026-02-10",
  },
  {
    id: "plot-4",
    name: "แปลงสาธิตสวนส้ม อ.ฝาง (เกษตรกรตัวอย่าง 1)",
    location: "แปลงสาธิต ต.เวียง อ.ฝาง จ.เชียงใหม่",
    targetCrop: "ส้มสายน้ำผึ้ง",
    showcase: "สารบำรุงใบพรีเมียม",
    ownerName: "เกษตรกรตัวอย่าง 1 (นายวิชัย)",
    cropCategory: "พืชสวน",
    cropName: "ส้ม",
    productName: "ปุ๋ยเคมีสูตรพิเศษ",
    areaRai: 8,
    treeCount: 150,
    startDate: "2026-01-20",
  },
];

/**
 * Helper to identify whether an ActivityPlanItem is a Type 10 (Field Day) item
 */
export function isFieldDayItem(item: any): boolean {
  if (!item) return false;
  if (item.itemType === "TYPE_10") return true;
  if (
    typeof item.meetingTopic === "string" &&
    item.meetingTopic.includes("Field Day")
  )
    return true;
  const detailStr = String(item.detail || "");
  if (
    detailStr.includes("[Field Day]") ||
    detailStr.includes("Field Day") ||
    detailStr.includes("จัดงาน Field Day")
  ) {
    return true;
  }
  if (
    detailStr.includes("สินค้าโชว์:") ||
    (detailStr.includes("พืชเป้าหมาย:") &&
      (detailStr.includes("เป้ายอดจอง:") || detailStr.includes("ผู้ร่วมงาน:")))
  ) {
    return true;
  }
  if (
    item.plotProductName &&
    item.plotCropName &&
    item.meetingAttendeesCount != null &&
    item.saleTotalPrice != null &&
    !item.saleQuantity &&
    !item.plotActivityType
  ) {
    return true;
  }
  return false;
}

/**
 * Resolves canonical work type code (e.g. "TYPE_1") from relation item, code, or name.
 */
export function resolveWorkTypeCode(
  wt: any,
  masterList?: Array<{ id?: string; code?: string; name?: string }>,
): string | null {
  if (!wt) return null;
  if (typeof wt === "string") {
    if (WORK_TYPE_CONFIG[wt]) return wt;
    if (wt === "เข้าพบร้านค้า / Key Farmer" || wt === "เข้าพบเกษตรกร")
      return "TYPE_1";
    if (
      wt === "แก้ปัญหา / รับเรื่องร้องเรียน" ||
      wt === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา"
    ) {
      return "TYPE_6";
    }
    const found = Object.values(WORK_TYPE_CONFIG).find(
      (c) => c.name === wt || c.shortName === wt,
    );
    if (found) return found.code;
    return null;
  }
  // 1. Primary: activityType.code
  if (wt.activityType?.code && typeof wt.activityType.code === "string") {
    if (WORK_TYPE_CONFIG[wt.activityType.code]) return wt.activityType.code;
  }
  // 2. Direct workTypeCode
  if (wt.workTypeCode && typeof wt.workTypeCode === "string") {
    if (WORK_TYPE_CONFIG[wt.workTypeCode]) return wt.workTypeCode;
  }
  // 3. activityTypeId matching master lookup by id or code
  if (wt.activityTypeId && typeof wt.activityTypeId === "string") {
    if (WORK_TYPE_CONFIG[wt.activityTypeId]) return wt.activityTypeId;
    if (masterList && masterList.length > 0) {
      const matched = masterList.find(
        (at) => at.id === wt.activityTypeId || at.code === wt.activityTypeId,
      );
      if (matched?.code && WORK_TYPE_CONFIG[matched.code]) {
        return matched.code;
      }
    }
  }
  // 4. Fallback: activityType.name
  if (wt.activityType?.name && typeof wt.activityType.name === "string") {
    if (
      wt.activityType.name === "เข้าพบร้านค้า / Key Farmer" ||
      wt.activityType.name === "เข้าพบเกษตรกร"
    )
      return "TYPE_1";
    if (
      wt.activityType.name === "แก้ปัญหา / รับเรื่องร้องเรียน" ||
      wt.activityType.name === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา"
    ) {
      return "TYPE_6";
    }
    const found = Object.values(WORK_TYPE_CONFIG).find(
      (c) =>
        c.name === wt.activityType.name || c.shortName === wt.activityType.name,
    );
    if (found) return found.code;
  }
  return null;
}

/**
 * Resolves initial selected work type display names from initial plan data.
 * Guarantees that canonical identifier (code) is used, preserving multi-select
 * and current UI display names.
 */
export function hydrateWorkTypesFromPlan(
  initial: any,
  masterList?: Array<{ id?: string; code?: string; name?: string }>,
): string[] {
  const detectedTypes = new Set<string>();

  // 1. Direct check from normalized relation (code as canonical identifier)
  if (
    initial?.workTypes &&
    Array.isArray(initial.workTypes) &&
    initial.workTypes.length > 0
  ) {
    const relationCodes: string[] = [];
    for (const wt of initial.workTypes) {
      const code = resolveWorkTypeCode(wt, masterList);
      if (code && WORK_TYPE_CONFIG[code]) {
        relationCodes.push(code);
      }
    }
    if (relationCodes.length > 0) {
      const mappedNames = new Set(
        relationCodes.map((c) => WORK_TYPE_CONFIG[c].name),
      );
      return WORK_TYPES.filter((t) => mappedNames.has(t));
    }
  }

  // 2. Legacy / compatibility checks
  if (initial?.tour) {
    detectedTypes.add(WORK_TYPE_CONFIG.TYPE_12.name);
  }

  const initialTypesRaw =
    initial?.activityType || initial?.activityTypeId || "";
  if (typeof initialTypesRaw === "string" && initialTypesRaw) {
    initialTypesRaw
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean)
      .forEach((t) => {
        const code = resolveWorkTypeCode(t, masterList);
        if (code && WORK_TYPE_CONFIG[code]) {
          detectedTypes.add(WORK_TYPE_CONFIG[code].name);
        } else if (WORK_TYPES.includes(t)) {
          detectedTypes.add(t);
        }
      });
  } else if (initialTypesRaw && typeof initialTypesRaw === "object") {
    const code = resolveWorkTypeCode(initialTypesRaw, masterList);
    if (code && WORK_TYPE_CONFIG[code]) {
      detectedTypes.add(WORK_TYPE_CONFIG[code].name);
    }
  }

  // Stores workTypeCode check
  if (Array.isArray(initial?.stores)) {
    for (const s of initial.stores) {
      const code = s.workTypeCode
        ? resolveWorkTypeCode(s.workTypeCode, masterList)
        : undefined;
      if (code && WORK_TYPE_CONFIG[code]) {
        detectedTypes.add(WORK_TYPE_CONFIG[code].name);
      }
    }
  }

  // Heuristic / details check
  const items = initial?.details;
  if (Array.isArray(items)) {
    const actualItems = items.filter(
      (item: any) =>
        item.itemType !== "MARKETING_PRODUCT" &&
        item.itemType !== "SALES_PROMOTION" &&
        item.visitTopic !== "MARKETING_PRODUCT" &&
        item.visitTopic !== "SALES_PROMOTION",
    );
    for (const item of actualItems) {
      const isFD = isFieldDayItem(item);
      if (
        item.itemType === "TYPE_1" ||
        (item.visitTopic &&
          item.visitTopic !== "FOLLOWUP" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION")
      ) {
        detectedTypes.add(WORK_TYPES[0]);
      }
      if (
        item.itemType === "TYPE_2" ||
        item.visitTopic === "FOLLOWUP" ||
        item.followupProductName
      ) {
        detectedTypes.add(WORK_TYPES[1]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_3" ||
          item.saleProductName ||
          (item.saleQuantity != null && item.saleUnitPrice != null) ||
          (item.saleTotalPrice != null &&
            !item.storeTotalAmount &&
            !item.collectAmount &&
            item.meetingAttendeesCount == null))
      ) {
        detectedTypes.add(WORK_TYPES[2]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_4" ||
          (item.collectAmount != null && item.visitTopic !== "SALES_PROMOTION"))
      ) {
        detectedTypes.add(WORK_TYPES[3]);
      }
      if (
        item.itemType === "TYPE_5" ||
        item.surveyCompetitorProduct ||
        (item.surveyStoreName && item.itemType !== "TYPE_9")
      ) {
        detectedTypes.add(WORK_TYPES[4]);
      }
      if (item.itemType === "TYPE_6" || item.issueType) {
        detectedTypes.add(WORK_TYPES[5]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_7" ||
          item.plotActivityType ||
          item.existingPlotId ||
          ((item.plotCropName ||
            item.plotOwnerName ||
            item.plotAreaRai != null) &&
            !item.storePricePerCase))
      ) {
        detectedTypes.add(WORK_TYPES[6]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_8" ||
          item.meetingTopic ||
          item.meetingTargetProducts ||
          (item.meetingAttendeesCount != null && !item.storeProductName))
      ) {
        detectedTypes.add(WORK_TYPES[7]);
      }
      if (
        !isFD &&
        (item.itemType === "TYPE_9" ||
          (item.storeProductName && item.visitTopic !== "MARKETING_PRODUCT") ||
          (item.storeQuantityCases != null &&
            item.visitTopic !== "MARKETING_PRODUCT") ||
          (item.storePricePerCase != null &&
            item.visitTopic !== "MARKETING_PRODUCT") ||
          (item.storeTotalAmount != null &&
            item.visitTopic !== "MARKETING_PRODUCT"))
      ) {
        detectedTypes.add(WORK_TYPES[8]);
      }
      if (isFD || item.itemType === "TYPE_10") {
        detectedTypes.add(WORK_TYPES[9]);
      }
      if (
        item.itemType === "TYPE_11" ||
        item.targetOpportunity ||
        (item.detail && item.detail.includes("ตรวจเช็กสต็อกหน้าร้าน"))
      ) {
        detectedTypes.add(WORK_TYPES[10]);
      }
      if (
        item.itemType === "TYPE_12" ||
        (item.detail && item.detail.includes("[ทัวร์")) ||
        (item.visitTopic &&
          (item.visitTopic === "ทัวร์กลาง" ||
            item.visitTopic === "ทัวร์ร้านค้า"))
      ) {
        detectedTypes.add(WORK_TYPES[11]);
      }
    }
  }

  // Match explicit section headers in objective or title
  const objectiveText = [initial?.objective, initial?.title]
    .filter(Boolean)
    .join("\n");

  if (objectiveText) {
    if (
      objectiveText.includes("[เข้าพบเกษตรกร") ||
      objectiveText.includes("เข้าพบเกษตรกร") ||
      objectiveText.includes("[เข้าพบร้านค้า") ||
      objectiveText.includes("เข้าพบร้านค้า") ||
      objectiveText.includes("Key Farmer")
    ) {
      detectedTypes.add(WORK_TYPES[0]);
    }
    if (
      objectiveText.includes("[ติดตามผลการใช้สินค้า]") ||
      objectiveText.includes("ติดตามผลการใช้สินค้า")
    ) {
      detectedTypes.add(WORK_TYPES[1]);
    }
    if (
      objectiveText.includes("[เสนอขายสินค้า]") ||
      objectiveText.includes("เสนอขายสินค้า")
    ) {
      detectedTypes.add(WORK_TYPES[2]);
    }
    if (
      objectiveText.includes("[วางบิล") ||
      objectiveText.includes("วางบิล / เก็บเงิน") ||
      objectiveText.includes("วางบิล/เก็บเงิน") ||
      objectiveText.includes("เป้ายอดเก็บเงิน")
    ) {
      detectedTypes.add(WORK_TYPES[3]);
    }
    if (
      objectiveText.includes("[สำรวจตลาด") ||
      objectiveText.includes("สำรวจตลาดของคู่แข่ง") ||
      objectiveText.includes("สำรวจตลาดคู่แข่ง")
    ) {
      detectedTypes.add(WORK_TYPES[4]);
    }
    if (
      objectiveText.includes("[ตรวจสอบเรื่องร้องเรียน") ||
      objectiveText.includes("ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา") ||
      objectiveText.includes("ตรวจสอบเรื่องร้องเรียน") ||
      objectiveText.includes("[แก้ปัญหา") ||
      objectiveText.includes("แก้ปัญหา / รับเรื่องร้องเรียน") ||
      objectiveText.includes("แก้ปัญหา/ร้องเรียน") ||
      objectiveText.includes("รับเรื่องร้องเรียน")
    ) {
      detectedTypes.add(WORK_TYPES[5]);
    }
    if (
      objectiveText.includes("[ติดตามแปลงสาธิต") ||
      objectiveText.includes("ติดตามแปลงสาธิต / ทำแปลง") ||
      objectiveText.includes("ทำแปลงสาธิต") ||
      (objectiveText.includes("แปลงสาธิต") &&
        !objectiveText.includes("Field Day") &&
        !objectiveText.includes("[Field Day]"))
    ) {
      detectedTypes.add(WORK_TYPES[6]);
    }
    if (
      objectiveText.includes("[จัดประชุม") ||
      objectiveText.includes("จัดประชุมการเกษตร") ||
      objectiveText.includes("ประชุมการเกษตร")
    ) {
      detectedTypes.add(WORK_TYPES[7]);
    }
    if (
      objectiveText.includes("[กิจกรรมหน้าร้าน]") ||
      objectiveText.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")
    ) {
      detectedTypes.add(WORK_TYPES[8]);
    }
    if (
      objectiveText.includes("[Field Day]") ||
      objectiveText.includes("Field Day") ||
      objectiveText.includes("จัดงาน Field Day")
    ) {
      detectedTypes.add(WORK_TYPES[9]);
    }
    if (
      objectiveText.includes("[ตรวจเช็กสต็อก") ||
      objectiveText.includes("ตรวจเช็กสต็อกหน้าร้าน") ||
      objectiveText.includes("เช็กสต็อกหน้าร้าน") ||
      objectiveText.includes("สต็อกหน้าร้าน")
    ) {
      detectedTypes.add(WORK_TYPES[10]);
    }
    if (
      objectiveText.includes("[ทัวร์]") ||
      objectiveText.includes("[ทัวร์กลาง]") ||
      objectiveText.includes("[ทัวร์ร้านค้า]") ||
      objectiveText.includes("ทัวร์กลาง") ||
      objectiveText.includes("ทัวร์ร้านค้า") ||
      objectiveText.includes("ทัวร์")
    ) {
      detectedTypes.add(WORK_TYPES[11]);
    }
  }

  return WORK_TYPES.filter((t) => detectedTypes.has(t));
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY RESULT STATUS LABELS (Display Mapping Single Source of Truth)
// ─────────────────────────────────────────────────────────────────────────────
export const ACTIVITY_RESULT_STATUS_LABELS: Record<string, string> = {
  COMPLETED: "ปฏิบัติงานแล้วเสร็จ",
  PARTIAL: "สำเร็จบางส่วน",
  POSTPONED: "เลื่อนกำหนดการปฏิบัติงาน",
  CANCELLED: "ยกเลิก",
  FAILED: "ไม่สำเร็จ",
};

export function getActivityResultStatusLabel(status?: string | null): string {
  if (!status) return "-";
  return ACTIVITY_RESULT_STATUS_LABELS[status] || status;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE_7A DEMO PLOT CONSTANTS (Source of Truth)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_PLOT_SPRAY_METHODS = [
  { value: "SINGLE", label: "ฉีดเดี่ยว (Single)" },
  { value: "TANK_MIXED", label: "ผสมถัง (Tank-mixed)" },
] as const;

export type DemoPlotSprayMethod = (typeof DEMO_PLOT_SPRAY_METHODS)[number]["value"];

export const EXTERNAL_CHEMICAL_FORMULAS = [
  "SL",
  "SC",
  "EC",
  "EW",
  "ZC",
  "OD",
  "WP",
  "WG",
  "อื่นๆ",
] as const;

export type ExternalChemicalFormula = (typeof EXTERNAL_CHEMICAL_FORMULAS)[number];

export const DEMO_PLOT_IRRIGATION_METHODS = [
  "น้ำหยด",
  "สายยาง",
  "สปิงเกอร์",
  "ให้ตามร่อง",
  "ปล่อยท่วม(flooding)",
  "รอน้ำฝน",
  "นาหว่านน้ำตม",
] as const;

export type DemoPlotIrrigationMethod = (typeof DEMO_PLOT_IRRIGATION_METHODS)[number];

export const DEMO_PLOT_SPRAY_EQUIPMENTS = [
  "เป้สะพายหลัง",
  "คน + สายลาก",
  "โดรน",
  "แอร์บัส",
  "อื่นๆ ระบุ..",
] as const;

export type DemoPlotSprayEquipment = (typeof DEMO_PLOT_SPRAY_EQUIPMENTS)[number];

