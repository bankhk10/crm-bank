"use client";

import React from "react";
import { canShowDevFeatures } from "@/lib/dev-only/config";

export interface DevOnlyWrapperProps {
  children: React.ReactNode;
  /**
   * Fallback content to show in production (optional)
   * Default: null (renders nothing)
   */
  fallback?: React.ReactNode;
}

/**
 * DevOnlyWrapper - แสดง children เฉพาะใน development mode
 *
 * ข้อดี:
 * - ไม่ render อะไรเลยใน production
 * - tree-shakable - code ที่ไม่ใช้จะถูกลบออก
 * - ง่ายต่อการใช้งาน
 *
 * Usage:
 * ```tsx
 * <DevOnlyWrapper>
 *   <DebugPanel />
 * </DevOnlyWrapper>
 * ```
 */
export function DevOnlyWrapper({
  children,
  fallback = null,
}: DevOnlyWrapperProps) {
  // ใน production, return early
  if (!canShowDevFeatures) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default DevOnlyWrapper;
