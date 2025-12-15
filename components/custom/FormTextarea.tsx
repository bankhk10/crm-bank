"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormTextareaProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    rows?: number;
    error?: string;
    className?: string;
    textareaClassName?: string;
    labelClassName?: string;
    containerClassName?: string;
}

const defaultLabelClass = "text-base font-medium mx-2 mb-2";
const defaultTextareaClass =
    "w-full border rounded-xl px-3 py-2 text-base text-gray-900 placeholder:text-gray-400";

export function FormTextarea({
    label,
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    readOnly = false,
    rows = 3,
    error,
    className,
    textareaClassName,
    labelClassName,
    containerClassName,
}: FormTextareaProps) {
    return (
        <div className={cn(containerClassName)}>
            <Label className={cn(defaultLabelClass, labelClassName)}>{label}</Label>
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                rows={rows}
                className={cn(defaultTextareaClass, textareaClassName, className)}
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}
