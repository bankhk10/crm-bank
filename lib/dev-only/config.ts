/**
 * Dev-Only Configuration
 *
 * ศูนย์กลางควบคุมการแสดงผล features ที่ใช้เฉพาะ development เท่านั้น
 * ใน production, tree-shaking จะลบ code เหล่านี้ออกจาก bundle โดยอัตโนมัติ
 *
 * วิธีใช้งาน:
 * 1. ตั้งค่า environment variable: NEXT_PUBLIC_SHOW_DEV_FEATURES=true
 * 2. import { isDevFeaturesEnabled } from '@/lib/dev-only/config'
 */

// ใช้ NEXT_PUBLIC_ prefix เพื่อให้ client-side อ่านได้
export const isDevFeaturesEnabled =
  process.env.NEXT_PUBLIC_SHOW_DEV_FEATURES === "true" ||
  process.env.NEXT_PUBLIC_SHOW_RANDOM_FILL === "true"; // backward compatibility

/**
 * ตรวจสอบว่าเป็น development mode หรือไม่
 * build time constant - tree-shakable
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * สามารถแสดง dev features ได้หรือไม่
 * - ต้องอยู่ใน development mode หรือ
 * - ตั้ง NEXT_PUBLIC_SHOW_DEV_FEATURES=true
 */
export const canShowDevFeatures = isDevelopment || isDevFeaturesEnabled;

/**
 * Feature flags สำหรับ dev-only features
 */
export const devFeatures = {
  randomFill: canShowDevFeatures,
  debugPanel: isDevelopment,
  performanceMonitor: isDevelopment,
} as const;
