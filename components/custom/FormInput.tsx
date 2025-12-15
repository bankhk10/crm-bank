"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormInputProps {
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: "text" | "email" | "number" | "tel" | "password" | "url";
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    error?: string;
    className?: string;
    inputClassName?: string;
    labelClassName?: string;
    containerClassName?: string;
    onWheel?: (e: React.WheelEvent<HTMLInputElement>) => void;
}

const defaultLabelClass = "text-base font-medium mx-2";
const defaultInputClass = "mt-1 h-11 text-base placeholder:text-gray-500";

export function FormInput({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    required = false,
    disabled = false,
    readOnly = false,
    error,
    className,
    inputClassName,
    labelClassName,
    containerClassName,
    onWheel,
}: FormInputProps) {
    return (
        <div className={cn(containerClassName)}>
            <Label className={cn(defaultLabelClass, labelClassName)}>{label}</Label>
            <Input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                className={cn(defaultInputClass, inputClassName, className)}
                onWheel={onWheel}
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}
