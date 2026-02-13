"use client";

import React from "react";
import { FormInput } from "@/components/custom/form-components";

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

export const PhoneInput = ({
    value,
    onChange,
    error,
    label = "เบอร์โทร",
    placeholder = "08XXXXXXXX",
    disabled = false,
}: PhoneInputProps) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        if (val.length <= 10) {
            onChange(val);
        }
    };

    return (
        <FormInput
            label={label}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            error={error}
            disabled={disabled}
            type="tel"
        />
    );
};