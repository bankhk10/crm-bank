"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  inputClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightIconInteractive?: boolean;
}

const defaultLabelClass = "text-base font-medium mx-2";
const defaultInputClass = "mt-1 h-11 text-base placeholder:text-gray-500";

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      value,
      onChange,
      onBlur,
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
      ...props
    },
    ref
  ) => {
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
              ref={ref}
              type={type}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
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
              {...props}
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
            ref={ref}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(defaultInputClass, inputClassName, className)}
            onWheel={onWheel}
            {...props}
          />
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }
);
FormInput.displayName = "FormInput";
