/**
 * Shared types for Type-1 (เข้าพบร้านค้า / Key Farmer)
 */

export const VISIT_TOPICS = [
  "แจ้งข่าวสาร",
  "อัปเดตข้อมูลลูกค้า",
  "เพิ่มข้อมูลเกษตรกร",
  "เลี้ยงรับรอง / สังสรรค์",
  "ให้คำแนะนำการใช้สินค้า",
  "อื่นๆ",
] as const;

export type VisitTopic = (typeof VISIT_TOPICS)[number] | string;

export interface Type1ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  rawFile?: File;
}

export type ImageFile = Type1ImageFile;

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
  responsibleEmployeeId?: string | null;
  addressLine?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export interface Type1AdviceProductItem {
  id?: string;
  productId: string;
  productName: string;
  productCode?: string | null;
  targetId?: string;
}
