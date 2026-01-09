"use client";

import { useCallback, useState } from "react";
import { canShowDevFeatures } from "@/lib/dev-only/config";

export interface UseRandomFillOptions<T> {
  /**
   * Function ที่สร้างข้อมูลแบบสุ่ม
   * ควร wrap ด้วย dynamic import เพื่อ tree-shaking
   */
  generator: () => T | Promise<T>;
  /**
   * Callback เมื่อได้ข้อมูลสุ่มแล้ว
   */
  onGenerated: (data: T) => void;
}

export interface UseRandomFillReturn {
  /**
   * ว่าสามารถแสดง random fill button ได้หรือไม่
   */
  isEnabled: boolean;
  /**
   * กำลังสร้างข้อมูลอยู่หรือไม่
   */
  isGenerating: boolean;
  /**
   * Function สำหรับ trigger random fill
   */
  triggerRandomFill: () => Promise<void>;
}

/**
 * useRandomFill - Hook สำหรับจัดการ random fill ใน form
 *
 * Features:
 * - ใน production, isEnabled = false เสมอ
 * - รองรับ async generators
 * - มี loading state
 *
 * Usage:
 * ```tsx
 * const { isEnabled, isGenerating, triggerRandomFill } = useRandomFill({
 *   generator: async () => {
 *     const { generateRandomProduct } = await import('@/lib/random-fill/product');
 *     return generateRandomProduct();
 *   },
 *   onGenerated: (data) => setFormData(data),
 * });
 * ```
 */
export function useRandomFill<T>({
  generator,
  onGenerated,
}: UseRandomFillOptions<T>): UseRandomFillReturn {
  const [isGenerating, setIsGenerating] = useState(false);

  const triggerRandomFill = useCallback(async () => {
    // Double check - ไม่ควร run ใน production
    if (!canShowDevFeatures) return;

    setIsGenerating(true);
    try {
      const data = await generator();
      onGenerated(data);
    } catch (error) {
      console.error("[useRandomFill] Error generating random data:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [generator, onGenerated]);

  return {
    isEnabled: canShowDevFeatures,
    isGenerating,
    triggerRandomFill,
  };
}

export default useRandomFill;
