export interface ImageFile {
  id: string;
  url: string;
  name: string;
}

export interface RequisitionItemSummary {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface PlanSummaryData {
  // ข้อมูลหลักของกิจกรรม (Main Activity Details)
  planNo?: string;
  title: string;
  startDateStr: string;
  endDateStr?: string;
  startTimeStr?: string;
  endTimeStr?: string;
  timeStr: string;
  locationStr: string;

  // งบประมาณและค่าใช้จ่าย (Budget & Expenses) (ถ้ามี)
  marketingBudget?: number;
  salesPromotionBudget?: number;
  extraExpenseAmount?: number;
  extraExpenseDetail?: string;

  // รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition) (ถ้ามี)
  requisitionItems?: RequisitionItemSummary[];

  // ข้อมูลเพิ่มเติม (Additional Info) (ถ้ามี)
  notes?: string;
  objective?: string;
  helperEmployeeNames?: string[];
}

export interface ActualTargetItem {
  label: string;
  value: string;
  highlight?: boolean;
  colSpan?: string;
}
