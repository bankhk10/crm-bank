// ===== Mock Data for Combined Report Page =====

// ---- Report 1: Activity Log (รายงานประวัติการเข้าปฏิบัติงาน) ----
export interface ActivityLogMock {
  id: string;
  activityDate: string; // วันที่ปฏิบัติงาน
  responsible: string; // พนักงาน
  activityType: string; // ประเภทกิจกรรม
  customerOrPlot: string; // ชื่อลูกค้า / เข้าพบแปลง
  detail: string; // รายละเอียด / ผลการปฏิบัติงาน
  salesOpportunity: "สูง" | "กลาง" | "ต่ำ" | "-"; // โอกาสขาย
  nextAction: string; // สิ่งต้องดำเนินการต่อ
  nextAppointmentDate: string | null; // วันที่นัดหมายครั้งถัดไป
}

export const mockActivityLogs: ActivityLogMock[] = [
  {
    id: "AL-001",
    activityDate: "20/07/2026",
    responsible: "สมชาย ใจดี",
    activityType: "เข้าพบร้านค้า / เกษตรกร",
    customerOrPlot: "ลุงชัย (ทุเรียนชัย)",
    detail:
      "เข้าพบเกษตรกรแปลงทุเรียน สอบถามปัญหาและแนะนำปุ๋ยสูตรใหม่สำหรับระยะออกดอก",
    salesOpportunity: "สูง",
    nextAction: "ส่งตัวอย่างปุ๋ยและนัดดูผล",
    nextAppointmentDate: "25/07/2026",
  },
  {
    id: "AL-002",
    activityDate: "20/07/2026",
    responsible: "สมปอง คำดี",
    activityType: "ติดตามตลาดคู่แข่ง",
    customerOrPlot: "ลุงชัย (ทุเรียนชัย)",
    detail:
      "ตรวจสอบราคาและโปรโมชั่นคู่แข่งในพื้นที่ตลาดชุมชน บันทึกรายละเอียดเพื่อวิเคราะห์",
    salesOpportunity: "-",
    nextAction: "นัดพบผู้จัดการเขต",
    nextAppointmentDate: "15/08/2026",
  },
  {
    id: "AL-003",
    activityDate: "19/07/2026",
    responsible: "สมหญิง รักดี",
    activityType: "เสนอสินค้าใหม่",
    customerOrPlot: "ร้านจิตรเจริญ",
    detail: "นำเสนอสินค้าใหม่ กลุ่มยาฆ่าแมลงชีวภาพ และราคาพิเศษช่วงฤดูกาล",
    salesOpportunity: "ต่ำ",
    nextAction: "ติดตามตลาดเพิ่มเติมและเสนอราคาใหม่",
    nextAppointmentDate: "26/07/2026",
  },
  {
    id: "AL-004",
    activityDate: "18/07/2026",
    responsible: "สมเกียรติ โชคดี",
    activityType: "วางบิล / เก็บเงิน",
    customerOrPlot: "	ร้านจิตรเจริญ สาขา2",
    detail: "วนเก็บเงินลูกหนี้ค้างชำระจาก 3 ร้าน รวมยอดที่เก็บได้ 85,000 บาท",
    salesOpportunity: "-",
    nextAction: "เร่งเบิกเดิมและดำเนินการต่อ",
    nextAppointmentDate: null,
  },
  {
    id: "AL-005",
    activityDate: "18/07/2026",
    responsible: "พิมพ์ใจ เรียนเก่ง",
    activityType: "เข้าพบร้านค้า / เกษตรกร",
    customerOrPlot: "แปลงข้าวโพด พื้นที่ 45 ไร่",
    detail: "ติดตามแปลงข้าวโพดระยะออกช่อดอก พบการระบาดของหนอนเจาะลำต้น",
    salesOpportunity: "สูง",
    nextAction: "นำเสนอสารกำจัดแมลงและติดตามผล",
    nextAppointmentDate: "22/07/2026",
  },
  {
    id: "AL-006",
    activityDate: "17/07/2026",
    responsible: "ปรีชา ขยันงาน",
    activityType: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    customerOrPlot: "ร้านเกษตรไทยรุ่งเรือง",
    detail: "จัดโปรโมชั่นหน้าร้าน ลดราคาปุ๋ยเกรด A 15% มีลูกค้าสนใจกว่า 30 ราย",
    salesOpportunity: "สูง",
    nextAction: "ติดตามออเดอร์และจัดส่งสินค้า",
    nextAppointmentDate: "20/07/2026",
  },
  {
    id: "AL-007",
    activityDate: "16/07/2026",
    responsible: "สมชาย ใจดี",
    activityType: " จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
    customerOrPlot: "สมาคมเกษตรกรจังหวัด",
    detail:
      "ร่วม จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์เกษตร นำเสนอผลิตภัณฑ์ปุ๋ยอินทรีย์ให้ผู้เข้าร่วม 60 ราย",
    salesOpportunity: "กลาง",
    nextAction: "ส่งแคตตาล็อกสินค้าให้ผู้สนใจ",
    nextAppointmentDate: "01/08/2026",
  },
  {
    id: "AL-008",
    activityDate: "15/07/2026",
    responsible: "สมปอง คำดี",
    activityType: "เข้าพบร้านค้า / เกษตรกร",
    customerOrPlot: "แปลงมันสำปะหลัง นายวิชัย",
    detail: "ตรวจสอบแปลงมันสำปะหลัง พบปัญหาขาดธาตุแมกนีเซียม แนะนำปุ๋ยเสริม",
    salesOpportunity: "กลาง",
    nextAction: "ส่งใบเสนอราคาและนัดส่งสินค้า",
    nextAppointmentDate: "18/07/2026",
  },
];

// ---- Report 2: Stock & Competitor (รายงานสถานะสต็อกและสินค้าคู่แข่ง) ----
export interface StockCheckMock {
  id: string;
  checkDate: string; // วันที่ตรวจสอบ
  responsible: string; // พนักงาน
  storeName: string; // ชื่อร้านค้า
  storeType: string; // ประเภทร้านค้า (ดีลเลอร์/ซับดีลเลอร์)
  ourProductsStock: string; // ราคาสินค้าตรวจสอบ (ของเรา)
  stockStatus: "ปกติ" | "ขาดสต็อก" | "ใกล้หมด" | "สต็อกเกิน"; // สถานะสต็อก
  stockQty: number | null; // จำนวนสต็อก (ชิ้น)
  stockUnit: string | null; // หน่วย
  competitorBrand: string | null; // แบรนด์คู่แข่ง
  competitorPromotion: string | null; // โปรโมชั่นคู่แข่ง
  photoAvailable: boolean; // มีรูปภาพ
}

export const mockStockChecks: StockCheckMock[] = [
  {
    id: "SC-001",
    checkDate: "20/07/2026",
    responsible: "สมชาย ใจดี",
    storeName: "ร้านส่งเสริมหายนะ",
    storeType: "ดีลเลอร์",
    ourProductsStock: "ยาสูตร X",
    stockStatus: "ปกติ",
    stockQty: 120,
    stockUnit: "ลัง",
    competitorBrand: null,
    competitorPromotion: null,
    photoAvailable: true,
  },
  {
    id: "SC-002",
    checkDate: "20/07/2026",
    responsible: "สมชาย ใจดี",
    storeName: "ร้านส่งเสริมหายนะ",
    storeType: "ดีลเลอร์",
    ourProductsStock: "-",
    stockStatus: "ขาดสต็อก",
    stockQty: 0,
    stockUnit: null,
    competitorBrand: "แบรนด์ A",
    competitorPromotion: "ซื้อ 5 ลัง ลดเพิ่มอีก 5%",
    photoAvailable: true,
  },
  {
    id: "SC-003",
    checkDate: "21/07/2026",
    responsible: "สมหญิง รักดี",
    storeName: "ร้านเกษตรภาคเหนือ",
    storeType: "ซับดีลเลอร์",
    ourProductsStock: "ยาสูตร Y",
    stockStatus: "ใกล้หมด",
    stockQty: 5,
    stockUnit: "ลัง",
    competitorBrand: "แบรนด์ B",
    competitorPromotion: "ปกติ",
    photoAvailable: true,
  },
  {
    id: "SC-004",
    checkDate: "21/07/2026",
    responsible: "สมเกียรติ โชคดี",
    storeName: "เกษตรกร สุรัตน์ Z",
    storeType: "ซับดีลเลอร์",
    ourProductsStock: "ยาสูตร Z",
    stockStatus: "ปกติ",
    stockQty: 30,
    stockUnit: "ลัง",
    competitorBrand: null,
    competitorPromotion: null,
    photoAvailable: true,
  },
  {
    id: "SC-005",
    checkDate: "19/07/2026",
    responsible: "พิมพ์ใจ เรียนเก่ง",
    storeName: "ร้านค้าเกษตรใต้",
    storeType: "ดีลเลอร์",
    ourProductsStock: "ยาสูตร A",
    stockStatus: "สต็อกเกิน",
    stockQty: 500,
    stockUnit: "ลัง",
    competitorBrand: null,
    competitorPromotion: null,
    photoAvailable: false,
  },
  {
    id: "SC-006",
    checkDate: "18/07/2026",
    responsible: "ปรีชา ขยันงาน",
    storeName: "ร้านวิทยาเกษตร",
    storeType: "ดีลเลอร์",
    ourProductsStock: "ยาดี B",
    stockStatus: "ขาดสต็อก",
    stockQty: 0,
    stockUnit: null,
    competitorBrand: "แบรนด์ C",
    competitorPromotion: "แจกของแถมพิเศษ",
    photoAvailable: true,
  },
  {
    id: "SC-007",
    checkDate: "17/07/2026",
    responsible: "สมชาย ใจดี",
    storeName: "ร้านสมบูรณ์พูนสุข",
    storeType: "ซับดีลเลอร์",
    ourProductsStock: "ยาดี C",
    stockStatus: "ปกติ",
    stockQty: 80,
    stockUnit: "ลัง",
    competitorBrand: null,
    competitorPromotion: null,
    photoAvailable: true,
  },
  {
    id: "SC-008",
    checkDate: "16/07/2026",
    responsible: "สมปอง คำดี",
    storeName: "ร้านไทยเกษตร",
    storeType: "ดีลเลอร์",
    ourProductsStock: "ยาดี D",
    stockStatus: "ใกล้หมด",
    stockQty: 8,
    stockUnit: "ลัง",
    competitorBrand: "แบรนด์ D",
    competitorPromotion: "ลด 20% เฉพาะช่วงนี้",
    photoAvailable: false,
  },
];

// ---- Report 3: Plot Health & Issue (รายงานติดตามปัญหาและสภาพแปลง) ----
export interface PlotHealthMock {
  id: string;
  visitDate: string; // วันที่ลงพื้นที่
  responsible: string; // พนักงาน/ผู้รับผิดชอบ (SPO)
  plotName: string; // ชื่อแปลง (ไร่)
  plotSizeRai: number; // พื้นที่ (ไร่)
  cropType: string; // สินค้าที่สนใจ/ชนิดพืช (ไร่)
  cropQty: string; // พื้นที่รวม ปลูกพืช (ไร่) / จำนวน
  healthStatus: "สมบูรณ์" | "ปานกลาง" | "ทรุดโทรม"; // สภาพพืชรวม
  growthResult: "ตามเป้า" | "ต่ำกว่าเป้า" | "เกินเป้า"; // ผลสรุปสภาพ
  issue: string | null; // ปัญหาที่พบ (รวม)
  photoAvailable: boolean; // มีรูปภาพ
}

export const mockPlotHealths: PlotHealthMock[] = [
  {
    id: "PH-001",
    visitDate: "15/07/2026",
    responsible: "สมปอง คำดี",
    plotName: "แปลง 1 (ร้อยเอ็ด)",
    plotSizeRai: 3,
    cropType: "ผูกนิด Z",
    cropQty: "50 กระสอบ/ปี",
    healthStatus: "สมบูรณ์",
    growthResult: "ตามเป้า",
    issue: null,
    photoAvailable: true,
  },
  {
    id: "PH-002",
    visitDate: "18/07/2026",
    responsible: "สมปอง คำดี",
    plotName: "แปลง 2 (บ้าง)",
    plotSizeRai: 1,
    cropType: "ยายเอ็ต F",
    cropQty: "20 ลัง/ปี 20 ลัง",
    healthStatus: "ทรุดโทรม",
    growthResult: "ต่ำกว่าเป้า",
    issue: "พบเพลี้ยกระโดดระบาด, แนะนำสารฆ่าแมลง",
    photoAvailable: true,
  },
  {
    id: "PH-003",
    visitDate: "19/07/2026",
    responsible: "สมเกียรติ โชคดี",
    plotName: "แปลง 3 (จุดที่ 3)",
    plotSizeRai: 45,
    cropType: "ผูกนิต A",
    cropQty: "30 ลัง/ปี 20 ลัง",
    healthStatus: "ปานกลาง",
    growthResult: "ต่ำกว่าเป้า",
    issue: "ขาดน้ำชั่วคราว ต้องเร่งให้ปุ๋ยน้ำ",
    photoAvailable: true,
  },
  {
    id: "PH-004",
    visitDate: "20/07/2026",
    responsible: "สมหญิง รักดี",
    plotName: "แปลง 4 (มัดดุ)",
    plotSizeRai: 5,
    cropType: "ผอรัต B",
    cropQty: "100 ลัง/ปี 20 ลัง",
    healthStatus: "สมบูรณ์",
    growthResult: "ตามเป้า",
    issue: null,
    photoAvailable: true,
  },
  {
    id: "PH-005",
    visitDate: "14/07/2026",
    responsible: "ปรีชา ขยันงาน",
    plotName: "แปลง 5 (นครพนม)",
    plotSizeRai: 12,
    cropType: "ข้าวหอมมะลิ",
    cropQty: "80 กระสอบ/ปี",
    healthStatus: "ปานกลาง",
    growthResult: "ตามเป้า",
    issue: "พบโรคไหม้คอรวงในบางจุด",
    photoAvailable: false,
  },
  {
    id: "PH-006",
    visitDate: "13/07/2026",
    responsible: "สมชาย ใจดี",
    plotName: "แปลง 6 (สุรินทร์)",
    plotSizeRai: 8,
    cropType: "มันสำปะหลัง",
    cropQty: "200 ลัง/ปี",
    healthStatus: "ทรุดโทรม",
    growthResult: "ต่ำกว่าเป้า",
    issue: "พบโรคใบด่างระบาด ต้องรีบตัดทิ้งและใช้ยา",
    photoAvailable: true,
  },
  {
    id: "PH-007",
    visitDate: "12/07/2026",
    responsible: "พิมพ์ใจ เรียนเก่ง",
    plotName: "แปลง 7 (ยโสธร)",
    plotSizeRai: 6,
    cropType: "อ้อย",
    cropQty: "150 ตัน/ปี",
    healthStatus: "สมบูรณ์",
    growthResult: "เกินเป้า",
    issue: null,
    photoAvailable: true,
  },
  {
    id: "PH-008",
    visitDate: "11/07/2026",
    responsible: "สมปอง คำดี",
    plotName: "แปลง 8 (กาฬสินธุ์)",
    plotSizeRai: 20,
    cropType: "ข้าวโพดหวาน",
    cropQty: "60 กระสอบ/ปี",
    healthStatus: "ปานกลาง",
    growthResult: "ตามเป้า",
    issue: "พบหนอนเจาะฝักในบางจุด",
    photoAvailable: false,
  },
];

// ---- Report 4: Event ROI (รายงานสรุป ROI ยอดขายจากกิจกรรม) ----
export interface EventROIMock {
  id: string;
  eventDate: string; // วันที่จัดกิจกรรม
  organizer: string; // ผู้จัดกิจกรรม
  eventName: string; // รูปแบบกิจกรรม
  budgetType: string; // ประเภทงบ
  budgetUsed: number; // งบที่ใช้ (บาท)
  participants: number; // คนที่เข้าร่วม (คน)
  actualSales: number; // ยอดขายรวมสุทธิ (บาท)
  photoAvailable: boolean; // มีรูปภาพ
}

export const mockEventROIs: EventROIMock[] = [
  {
    id: "EV-001",
    eventDate: "10/07/2026",
    organizer: "สมชาย ใจดี",
    eventName: "Field Day",
    budgetType: "งบการตลาด",
    budgetUsed: 15000,
    participants: 55,
    actualSales: 150000,
    photoAvailable: true,
  },
  {
    id: "EV-002",
    eventDate: "12/07/2026",
    organizer: "สมหญิง รักดี",
    eventName: "จัดหน้าร้าน",
    budgetType: "งบส่งเสริมการขาย",
    budgetUsed: 5000,
    participants: 30,
    actualSales: 45000,
    photoAvailable: false,
  },
  {
    id: "EV-003",
    eventDate: "15/07/2026",
    organizer: "สมชาย ใจดี",
    eventName: "แจกสินค้าทดลอง",
    budgetType: "งบส่งเสริมการขาย",
    budgetUsed: 3500,
    participants: 40,
    actualSales: 32000,
    photoAvailable: true,
  },
  {
    id: "EV-004",
    eventDate: "18/07/2026",
    organizer: "สมเกียรติ โชคดี",
    eventName: "จัดประชุมอบรม",
    budgetType: "งบการตลาด",
    budgetUsed: 10000,
    participants: 25,
    actualSales: 80000,
    photoAvailable: true,
  },
  {
    id: "EV-005",
    eventDate: "05/07/2026",
    organizer: "พิมพ์ใจ เรียนเก่ง",
    eventName: "สาธิตผลิตภัณฑ์",
    budgetType: "งบการตลาด",
    budgetUsed: 4000,
    participants: 35,
    actualSales: 68000,
    photoAvailable: true,
  },
  {
    id: "EV-006",
    eventDate: "08/07/2026",
    organizer: "ปรีชา ขยันงาน",
    eventName: "ออกบูธงานเกษตร",
    budgetType: "งบส่งเสริมการตลาด",
    budgetUsed: 7500,
    participants: 120,
    actualSales: 275000,
    photoAvailable: true,
  },
  {
    id: "EV-007",
    eventDate: "02/07/2026",
    organizer: "สมปอง คำดี",
    eventName: "Field Day",
    budgetType: "งบการตลาด",
    budgetUsed: 8000,
    participants: 60,
    actualSales: 95000,
    photoAvailable: false,
  },
  {
    id: "EV-008",
    eventDate: "20/06/2026",
    organizer: "สมชาย ใจดี",
    eventName: "จัดประชุมอบรม",
    budgetType: "งบส่งเสริมการขาย",
    budgetUsed: 12000,
    participants: 48,
    actualSales: 105000,
    photoAvailable: true,
  },
];
