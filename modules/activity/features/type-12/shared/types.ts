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
  province?: string | null;
  district?: string | null;
  responsibleEmployeeId?: string | null;
  customerType?: string | null;
}

export type EditCustomerOption = CustomerOption;

import type { ImageFile } from "@/modules/activity/application/media/image-uploader";

export type { ImageFile as Type12ImageFile };

export interface Type12TourRecord {
  tourType: TourType;
  tourSize?: TourSize | null;
  country?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  destination?: string | null;
}
