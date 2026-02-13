"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Save, LucideIcon } from "lucide-react";

interface FormActionsProps {
    loading?: boolean;
    disabled?: boolean;
    onCancel?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    className?: string;
    saveIcon?: LucideIcon;
    cancelIcon?: LucideIcon;
}

export default function FormActions({
    loading = false,
    disabled = false,
    onCancel,
    submitLabel = "บันทึก",
    cancelLabel = "ยกเลิก",
    className,
    saveIcon: SaveIcon = Save,
    cancelIcon: CancelIcon = X,
}: FormActionsProps) {
    const router = useRouter();

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            router.back();
        }
    };

    const isDisabled = loading || disabled;

    return (
        <>
            <div className={`sm:pt-2 mt-8 sm:mt-8 space-y-6 ${className || ""}`}>
                <div className="flex justify-center sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-6">
                    <Button
                        size="lg"
                        className="flex-1 sm:flex-none sm:w-32 bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl gap-2"
                        type="button"
                        onClick={handleCancel}
                        disabled={isDisabled}
                    >
                        <CancelIcon className="h-4 w-4" />
                        {cancelLabel}
                    </Button>
                    <Button
                        size="lg"
                        className="flex-1 sm:flex-none sm:w-32 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl gap-2"
                        type="submit"
                        disabled={isDisabled}
                    >
                        {loading ? (
                            <span>กำลังบันทึก...</span>
                        ) : (
                            <>
                                <SaveIcon className="h-4 w-4" />
                                <span>{submitLabel}</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
            <div className="w-full h-12 sm:hidden"></div>
        </>
    );
}
