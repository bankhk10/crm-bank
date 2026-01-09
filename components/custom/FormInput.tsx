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
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightIconInteractive?: boolean;
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
  leftIcon,
  rightIcon,
  rightIconInteractive = false,
}: FormInputProps) {
  const hasIcon = leftIcon || rightIcon;

  return (
    <div className={cn(containerClassName)}>
      <Label className={cn(defaultLabelClass, labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {hasIcon ? (
        <div className="relative mt-1">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <Input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              "h-11 text-base placeholder:text-gray-500",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              inputClassName,
              className
            )}
            onWheel={onWheel}
          />
          {rightIcon && (
            <div
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground",
                !rightIconInteractive && "pointer-events-none"
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>
      ) : (
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
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
