export type TourType =
  | "ทัวร์กลาง"
  | "ทัวร์ร้านค้า"
  | "CENTRAL"
  | "STORE"
  | string;

export type TourSize =
  | "ทัวร์เล็ก"
  | "ทัวร์ใหญ่"
  | "SMALL"
  | "LARGE"
  | string;

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface Type12TourDataPayload {
  tourType: "STORE" | "CENTRAL";
  tourSize: "LARGE" | "SMALL" | null;
  country: string | null;
  storeId: string | null;
  destination: string | null;
}
