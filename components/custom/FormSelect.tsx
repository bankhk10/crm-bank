"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectOption {
    value: string;
    label: string;
}

interface FormSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    groupLabel?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
    triggerClassName?: string;
    labelClassName?: string;
    containerClassName?: string;
}

const defaultLabelClass = "text-base font-medium mx-2";
const defaultTriggerClass = "mt-1 h-11 text-base w-full";

export function FormSelect({
    label,
    value,
    onChange,
    options,
    placeholder = "เลือก",
    groupLabel,
    disabled = false,
    required = false,
    error,
    className,
    triggerClassName,
    labelClassName,
    containerClassName,
}: FormSelectProps) {
    return (
        <div className={cn(containerClassName)}>
            <Label className={cn(defaultLabelClass, labelClassName)}>{label}</Label>
            <Select value={value} onValueChange={onChange} disabled={disabled} required={required}>
                <SelectTrigger className={cn(defaultTriggerClass, triggerClassName, className)}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {groupLabel && <SelectLabel>{groupLabel}</SelectLabel>}
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}
