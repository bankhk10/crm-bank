/**
 * Shared Type Definitions for Type 1 (เข้าพบร้านค้า / Key Farmer)
 */

export interface Type1ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  rawFile?: File;
  targetId?: string;
  storeId?: string;
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

export interface Type1TargetEntity {
  id: string;
  activityPlanId: string;
  visitPurpose: string;
  storeId?: string | null;
  province: string;
  isUnregisteredFarmer: boolean;
  unregisteredFarmerName?: string | null;
  unregisteredFarmerPhone?: string | null;
  topic?: string | null;
  notes?: string | null;
  store?: any | null;
  products?: Type1ProductEntity[];
  result?: Type1ResultEntity | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Type1ProductEntity {
  id: string;
  activityPlanId: string;
  targetId: string;
  productId: string;
  productName?: string | null;
  product?: any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Type1ResultEntity {
  id: string;
  activityPlanId: string;
  targetId?: string | null;
  productAdvice?: string | null;
  discussionResult?: string | null;
  salesOpportunity?: string | null;
  nextAction?: string | null;
  nextMeetingDate?: Date | string | null;
  farmerHomeAddress?: string | null;
  plotLatitude?: number | string | any | null;
  plotLongitude?: number | string | any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
