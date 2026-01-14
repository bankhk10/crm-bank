"use client";

/**
 * Form Action Buttons Component
 * Submit and cancel buttons for the form
 */

import React from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormActionButtonsProps {
  loading: boolean;
  onCancel: () => void;
}

export function FormActionButtons({
  loading,
  onCancel,
}: FormActionButtonsProps) {
  return (
    <div className="sm:pt-2 mt-8 sm:mt-8 space-y-6">
      <div className="flex justify-center sm:items-center sm:justify-center gap-4 sm:gap-6">
        <Button
          size="lg"
          className="flex-1 sm:flex-none sm:w-32 bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4" />
          ยกเลิก
        </Button>
        <Button
          size="lg"
          className="flex-1 sm:flex-none sm:w-32 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            "กำลังบันทึก..."
          ) : (
            <>
              <Save className="h-4 w-4" />
              บันทึก
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default FormActionButtons;
