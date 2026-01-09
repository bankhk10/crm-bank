"use client";

import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { canShowDevFeatures } from "@/lib/dev-only/config";
import { Dices } from "lucide-react";
import { type VariantProps } from "class-variance-authority";

// Define Button props type based on the actual Button component signature
type ButtonBaseProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface RandomFillButtonProps extends ButtonBaseProps {
  /**
   * กำลังสร้างข้อมูลอยู่หรือไม่
   */
  isGenerating?: boolean;
  /**
   * แสดง loading state
   */
  showLoadingState?: boolean;
}

/**
 * RandomFillButton - ปุ่มสำหรับกรอกข้อมูลแบบสุ่ม
 *
 * Features:
 * - ซ่อนใน production โดยอัตโนมัติ
 * - รองรับ loading state
 * - ใช้ได้กับทุก form
 *
 * Usage:
 * ```tsx
 * const { isEnabled, isGenerating, triggerRandomFill } = useRandomFill({...});
 *
 * {isEnabled && (
 *   <RandomFillButton
 *     onClick={triggerRandomFill}
 *     isGenerating={isGenerating}
 *   />
 * )}
 * ```
 *
 * หรือใช้ DevOnlyWrapper:
 * ```tsx
 * <DevOnlyWrapper>
 *   <RandomFillButton onClick={handleRandomFill} />
 * </DevOnlyWrapper>
 * ```
 */
export function RandomFillButton({
  children,
  isGenerating = false,
  showLoadingState = true,
  disabled,
  ...props
}: RandomFillButtonProps) {
  // ซ่อนใน production
  if (!canShowDevFeatures) return null;

  const isDisabled = disabled || (showLoadingState && isGenerating);

  return (
    <Button type="button" disabled={isDisabled} {...props}>
      <Dices className="h-4 w-4 mr-2" />
      {showLoadingState && isGenerating
        ? "กำลังสร้าง..."
        : children || "🎲 กรอกข้อมูลแบบสุ่ม"}
    </Button>
  );
}

export default RandomFillButton;
