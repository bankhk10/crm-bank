/**
 * Dev-Only Configuration
 *
 * ศูนย์กลางควบคุมการแสดงผล features ที่ใช้เฉพาะ development เท่านั้น
 * ใน production, tree-shaking จะลบ code เหล่านี้ออกจาก bundle โดยอัตโนมัติ
 *
 * วิธีใช้งาน:
 * 1. ตั้งค่า environment variable: NEXT_PUBLIC_SHOW_DEV_FEATURES=true
 * 2. import { canShowDevFeatures } from '@/lib/dev-only/config'
 *
 * การควบคุม:
 * - NEXT_PUBLIC_SHOW_DEV_FEATURES=true  → เปิด dev features
 * - NEXT_PUBLIC_SHOW_DEV_FEATURES=false → ปิด dev features (แม้ใน dev mode)
 * - ไม่ตั้งค่า                         → เปิดอัตโนมัติใน dev mode
 */

const envShowDevFeatures = process.env.NEXT_PUBLIC_SHOW_DEV_FEATURES;

/**
 * ตรวจสอบว่าเป็น development mode หรือไม่
 * build time constant - tree-shakable
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * ตรวจสอบว่า env variable ถูกตั้งค่าเป็น false อย่างชัดเจน
 */
const isExplicitlyDisabled = envShowDevFeatures === "false";

/**
 * ตรวจสอบว่า env variable ถูกตั้งค่าเป็น true
 */
const isExplicitlyEnabled = envShowDevFeatures === "true";

/**
 * สามารถแสดง dev features ได้หรือไม่
 * - ถ้าตั้งค่า env = false อย่างชัดเจน → ปิด
 * - ถ้าตั้งค่า env = true อย่างชัดเจน → เปิด
 * - ถ้าไม่ตั้งค่า → เปิดอัตโนมัติใน development mode
 */
export const canShowDevFeatures = isExplicitlyDisabled
  ? false
  : isExplicitlyEnabled || isDevelopment;

// Backward compatibility
export const isDevFeaturesEnabled = canShowDevFeatures;

/**
 * Feature flags สำหรับ dev-only features
 */
export const devFeatures = {
  debugPanel: isDevelopment && !isExplicitlyDisabled,
  performanceMonitor: isDevelopment && !isExplicitlyDisabled,
} as const;
