// ===== Mock Data for Record Actual Activity Form =====

export interface PlanSummaryMock {
  id: string;
  activityName: string;
  activityDate: string;         // display string
  timeRange: string;            // e.g. "09:00 – 15:00"
  location: string;
  locationSub: string;
  plotTarget: string;           // e.g. "1 แปลง | 20 ต้น"
  storeSalesTarget: number | null;
  activityTypes: string[];      // which sections to show
}

// ---- Growth Stages ----
export const GROWTH_STAGE_OPTIONS = [
  "ระยะงอก / ตั้งตัว",
  "ระยะเจริญเติบโตทางใบ",
  "ระยะออกดอก",
  "ระยะติดผล / ผลพัฒนา",
  "ระยะใกล้เก็บเกี่ยว",
  "ระยะพักตัว",
];

// ---- Plant Condition options ----
export type PlantCondition = "สมบูรณ์" | "ไม่เปลี่ยน" | "ทรุดโทรม";
export const PLANT_CONDITIONS: PlantCondition[] = ["สมบูรณ์", "ไม่เปลี่ยน", "ทรุดโทรม"];

// ---- Product Result options ----
export type ProductResult = "พัฒนาสมเจ็กดี" | "ยังไม่เห็นผลชัดเจน" | "พบปัญหา";
export const PRODUCT_RESULTS: ProductResult[] = [
  "พัฒนาสมเจ็กดี",
  "ยังไม่เห็นผลชัดเจน",
  "พบปัญหา",
];

// ---- Event Format options ----
export const EVENT_FORMAT_OPTIONS = [
  "Field Day",
  "Demo Day",
  "งานแสดงสินค้า",
  "ประชุมกลุ่มเกษตรกร",
  "อบรม / สาธิต",
  "ออกบูธ",
  "จัดงานส่งเสริมการขาย",
];

// ---- Age Units ----
export const AGE_UNITS = ["วัน", "สัปดาห์", "เดือน", "ปี"];

// ---- Mock Plan Summary data (would normally come from API by plan ID) ----
export const MOCK_PLAN_SUMMARIES: PlanSummaryMock[] = [
  {
    id: "2607-001",
    activityName: "แปลงสาธิตของบ้านนา",
    activityDate: "25 ก.ค. 2568",
    timeRange: "09:00 – 15:00",
    location: "บริษัทดัดสอบ จำกัด",
    locationSub: "อ.เมือง จ.จันทบุรี",
    plotTarget: "1 แปลง | 20 ต้น",
    storeSalesTarget: 10000,
    activityTypes: ["ติดตามแปลงสาธิต / พืชป้าหมาย", "จัดกิจกรรมส่งเสริมการขายหน้าร้าน"],
  },
  {
    id: "2607-002",
    activityName: "Field Day เกษตรกรภาคเหนือ",
    activityDate: "28 ก.ค. 2568",
    timeRange: "08:00 – 16:00",
    location: "ศูนย์เรียนรู้เกษตรกร",
    locationSub: "อ.สันทราย จ.เชียงใหม่",
    plotTarget: "3 แปลง | 50 ต้น",
    storeSalesTarget: 25000,
    activityTypes: ["ติดตามแปลงสาธิต / พืชป้าหมาย", "จัดกิจกรรมส่งเสริมการขายหน้าร้าน"],
  },
];

export const DEFAULT_PLAN = MOCK_PLAN_SUMMARIES[0];
