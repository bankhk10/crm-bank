import type { CustomerOption, ProductOption, Type7aImageFile } from "../../shared/types";
import type { Type7aTargetItem } from "./planned.types";

/**
 * รายการสินค้าที่เบิกตามแผน พร้อมข้อมูลการใช้จริง
 */
export interface Type7aPlannedProductActualItem {
  productId: string;
  productName: string;
  withdrawnQuantity: number; // จำนวนที่เบิกตามแผน
  actualQuantity: number | string; // จำนวนที่ใช้จริง (ขวด)
  extraQuantity: number | string; // ปริมาณที่ใช้เพิ่ม
  extraUnit: "ซีซี" | "กรัม" | string; // ซีซี (ขวด) หรือ กรัม (ซอง)
  applicationRate: string; // อัตราการใช้ (ผู้ใช้กรอกเอง)
}

/**
 * รายการสินค้าเพิ่มเติมหน้างาน กรณีไม่ได้ใช้ยาที่เบิกไปหรือใช้ยาเพิ่ม
 */
export interface Type7aAdditionalProductItem {
  id?: string;
  productId: string;
  productName: string;
  actualQuantity: number | string;
  extraQuantity: number | string;
  extraUnit: "ซีซี" | "กรัม" | string;
  applicationRate: string;
}

/**
 * รายการยาภายนอก กรณีเลือกผสมถัง (Tank-mixed)
 */
export interface Type7aExternalChemicalItem {
  id?: string;
  company: string;
  productName: string;
  activeIngredient: string;
  formula: "SL" | "SC" | "EC" | "อื่นๆ" | string;
  customFormula?: string;
  applicationRate: string;
}

export interface Type7aActualRecord {
  // เกษตรกร & ที่อยู่
  t7SelectedProvince?: string;
  t7FarmerProvince?: string;
  t7FarmerDistrict?: string;
  t7FarmerSubdistrict?: string;
  t7FarmerCustomerId?: string | null;
  t7FarmerName?: string;
  t7FarmerPhone?: string;
  t7IsUnregisteredFarmer?: boolean;
  t7DealerName?: string;
  t7DealerCode?: string;

  // พิกัด & แปลง
  t7Latitude?: number;
  t7Longitude?: number;
  t7PlotName?: string;
  t7District?: string;
  t7CropCategory?: string;
  t7CropName?: string;
  t7CustomCropName?: string;
  t7AreaRai?: string | number | null;
  t7TreeCount?: string | number | null;
  t7PlotObjective?: string;

  // สภาพแปลงเริ่มต้น (Initial Plot Condition & Observations)
  t7MainCropInfo?: string; // ข้อมูลพืชประธาน
  t7ExperimentDetail?: string; // วิธีการทดลอง
  t7Irrigations?: string[]; // ระบบน้ำ (เลือกได้หลายข้อ)
  t7PlantingDate?: string; // วันที่เริ่มปลูกจริง
  t7InitialSprayDate?: string; // วันที่ฉีดพ่นครั้งแรก
  t7NextSprayDate?: string; // กำหนดฉีดพ่นครั้งต่อไป
  t7NextFollowUpDate?: string;
  t7CropAgeValue?: string | number; // อายุพืช (วันหลังปลูก)
  t7CropAgeUnit?: string; // วัน หรือ เดือน
  t7GrowthStage?: string; // ระยะการเจริญเติบโต
  t7Notes?: string; // ข้อมูลเพิ่มเติม

  // วิธีการฉีดพ่น & ยาภายนอก
  t7SprayMethod?: "SINGLE" | "TANK_MIXED" | string; // วิธีการฉีดพ่น
  t7HasExternalChemicals?: boolean; // มียาภายนอก
  t7ExternalProducts?: Type7aExternalChemicalItem[]; // รายการยาภายนอก

  // อุปกรณ์ที่ใช้ฉีดพ่น
  t7SprayEquipment?: string;
  t7OtherEquipment?: string;

  // สินค้าที่ใช้จริง
  t7PlannedProducts?: Type7aPlannedProductActualItem[]; // สินค้าตามแผน
  t7AdditionalProducts?: Type7aAdditionalProductItem[]; // สินค้าเพิ่มเติม

  // รูปถ่าย
  t7InitialPhotos?: Type7aImageFile[]; // รูปถ่ายสภาพแปลงเริ่มต้น (สูงสุด 10 รูป)
  t7PlotImages?: Type7aImageFile[];
  t7CropImages?: Type7aImageFile[];

  // Field เดิมสำหรับ Backward Compatibility
  t7CropCondition?: string;
  t7CropProblemDesc?: string;
  t7CropProblemDescription?: string;
  t7ProblemDescription?: string;
  t7ProductResponse?: string;
  t7DemoProducts?: any[];
  t7UsageMethod?: string;
  t7PlantingAreaCondition?: string;
  t7DemoPlotId?: string | null;
  t7DemoResults?: any[];
  t7PlannedProductId?: string | null;
  t7ActualProductId?: string | null;
  t7DemoProductQuantity?: string | number | null;
  t7PlannedProductName?: string | null;
  t7ActualProductName?: string | null;
  t7ChangeReason?: string | null;
  t7PlotStatus?: string;
  t7FinalYieldKg?: string;
  t7ControlYieldKg?: string;
  t7YieldIncreasePercent?: string;
  t7FarmerSatisfaction?: number;
}

export interface Type7aActualFormProps {
  isVisible?: boolean;
  planType?: string;
  target?: Type7aTargetItem;
  targets?: Type7aTargetItem[];
  customers?: CustomerOption[];
  products?: ProductOption[];
  actualState?: Type7aActualRecord;
  onUpdateField?: (field: keyof Type7aActualRecord, value: any) => void;
  // Specific helper handlers
  onUpdatePlannedProduct?: (
    index: number,
    field: keyof Type7aPlannedProductActualItem,
    value: any,
  ) => void;
  onAddAdditionalProduct?: (product?: Partial<Type7aAdditionalProductItem>) => void;
  onUpdateAdditionalProduct?: (
    index: number,
    field: keyof Type7aAdditionalProductItem,
    value: any,
  ) => void;
  onRemoveAdditionalProduct?: (index: number) => void;
  onAddExternalProduct?: (product?: Partial<Type7aExternalChemicalItem>) => void;
  onUpdateExternalProduct?: (
    index: number,
    field: keyof Type7aExternalChemicalItem,
    value: any,
  ) => void;
  onRemoveExternalProduct?: (index: number) => void;
  readonly?: boolean;
}

export type ActualType7NewDemoProps = Type7aActualFormProps;

export interface Type7aDetailViewProps {
  isVisible?: boolean;
  target?: Type7aTargetItem;
  targets?: Type7aTargetItem[];
  actualResult?: any;
  attachments?: any[];
}

export type DetailType7NewDemoProps = Type7aDetailViewProps;

export interface Type7aApprovalCardProps {
  isVisible?: boolean;
  plan?: any;
  target?: Type7aTargetItem;
  targets?: Type7aTargetItem[];
}

export type ApprovalType7aDemoProps = Type7aApprovalCardProps;
