"use client";

import React from "react";
import { ArrowLeft, Save, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FormActionButtonsProps {
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Alias for onBack for backward compatibility with onCancel */
  onCancel?: () => void;
  /** Optional custom callback when submit button is clicked */
  onSubmit?: () => void;
  /** Submit button type, defaults to "submit" */
  submitType?: "submit" | "button";
  /** Submit button text label, defaults to "บันทึก" */
  submitLabel?: string;
  /** Text label when loading, defaults to "กำลังบันทึก..." */
  loadingLabel?: string;
  /** Back button text label, defaults to "ย้อนกลับ" */
  backLabel?: string;
  /** Loading state indicator */
  loading?: boolean;
  /** Disable both buttons */
  disabled?: boolean;
  /** Read-only mode (hides submit button) */
  readonly?: boolean;
  /** Whether to show the back button (default: true if onBack/onCancel provided, or controlled via showBack) */
  showBack?: boolean;
  /** Whether to show the submit button (default: true if !readonly) */
  showSubmit?: boolean;
  /** Icon for the submit button (defaults to Save) */
  submitIcon?: LucideIcon;
  /** Icon for the back button (defaults to ArrowLeft) */
  backIcon?: LucideIcon;
  /** Additional classes for container */
  className?: string;
  /** Additional classes for back button */
  backButtonClassName?: string;
  /** Additional classes for submit button */
  submitButtonClassName?: string;
}

export function FormActionButtons({
  onBack,
  onCancel,
  onSubmit,
  submitType = "submit",
  submitLabel = "บันทึก",
  loadingLabel = "กำลังบันทึก...",
  backLabel = "ย้อนกลับ",
  loading = false,
  disabled = false,
  readonly = false,
  showBack,
  showSubmit,
  submitIcon: SubmitIcon = Save,
  backIcon: BackIcon = ArrowLeft,
  className,
  backButtonClassName,
  submitButtonClassName,
}: FormActionButtonsProps) {
  const handleBack = onBack || onCancel;
  const isBackVisible = showBack !== undefined ? showBack : !!handleBack;
  const isSubmitVisible = showSubmit !== undefined ? showSubmit : !readonly;
  const isButtonDisabled = loading || disabled;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 border-t border-slate-100",
        className
      )}
    >
      {isBackVisible && (
        <Button
          type="button"
          onClick={handleBack}
          disabled={isButtonDisabled}
          className={cn(
            "w-full sm:w-32 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all",
            backButtonClassName
          )}
        >
          <BackIcon className="h-4 w-4" />
          <span>{backLabel}</span>
        </Button>
      )}

      {isSubmitVisible && (
        <Button
          type={submitType}
          onClick={submitType === "button" ? onSubmit : undefined}
          disabled={isButtonDisabled}
          className={cn(
            "w-full sm:w-32 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all",
            submitButtonClassName
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SubmitIcon className="h-4 w-4 stroke-[3]" />
          )}
          <span>{loading ? loadingLabel : submitLabel}</span>
        </Button>
      )}
    </div>
  );
}

export default FormActionButtons;
