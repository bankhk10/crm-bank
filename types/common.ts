/**
 * Common Types
 * Shared utility types used across the application
 */

/**
 * Makes specified properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Makes all properties nullable
 */
export type Nullable<T> = { [P in keyof T]: T[P] | null };

/**
 * Deep partial - makes all nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Select option for dropdowns/selects
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * Key-value pair
 */
export interface KeyValue<K = string, V = unknown> {
  key: K;
  value: V;
}

/**
 * Entity with ID and timestamps
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft deletable entity
 */
export interface SoftDeletable {
  deletedAt: Date | null;
}

/**
 * Auditable entity
 */
export interface Auditable {
  createdById?: string | null;
  updatedById?: string | null;
}

/**
 * Address structure
 */
export interface Address {
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
}

/**
 * Contact information
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  contactPerson?: string;
}

/**
 * Geo location
 */
export interface GeoLocation {
  latitude?: string;
  longitude?: string;
}

/**
 * Money amount with currency
 */
export interface Money {
  amount: number;
  currency: string;
}

/**
 * Date range
 */
export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
