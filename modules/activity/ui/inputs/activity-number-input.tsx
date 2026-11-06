"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { cn } from "@/lib/utils";

export interface ActivityNumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "prefix"
  > {
  /**
   * Numeric or string value.
   */
  value?: number | string | null;

  /**
   * Callback fired when value changes. Returns numeric value (or 0 if empty) and raw string.
   */
  onChangeValue?: (value: number, rawString: string) => void;

  /**
   * Standard React onChange handler.
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Minimum allowed value.
   */
  min?: number;

  /**
   * Maximum allowed value.
   */
  max?: number;

  /**
   * Whether decimal numbers are allowed.
   * If false, values are parsed as integers.
   * Default: true
   */
  allowDecimals?: boolean;

  /**
   * When user blurs out leaving the field empty, what number to revert to.
   * Set to `null` to allow leaving the field empty.
   * Default: 0
   */
  defaultValueOnBlur?: number | null;

  /**
   * Whether to automatically select all text when the input is focused.
   * Allows users to immediately type a new number without pressing backspace.
   * Default: true
   */
  autoSelectOnFocus?: boolean;

  /**
   * Prefix icon or symbol (e.g. "฿").
   */
  prefix?: React.ReactNode;

  /**
   * Suffix text or symbol (e.g. "บาท", "%").
   */
  suffix?: React.ReactNode;

  /**
   * Text alignment. Default: "right"
   */
  align?: "left" | "center" | "right";

  /**
   * Optional wrapper class name when prefix or suffix is present.
   */
  containerClassName?: string;
}

/**
 * ActivityNumberInput
 *
 * Dedicated reusable numeric input component for Activity Plans and Budgets.
 * Solves the common React issue where deleting leading zeros shows "012".
 * Supports auto-selection on focus, empty-string editing, safe blur defaults, and prefix/suffix icons.
 */
export const ActivityNumberInput = forwardRef<
  HTMLInputElement,
  ActivityNumberInputProps
>(
  (
    {
      value,
      onChangeValue,
      onChange,
      onFocus,
      onBlur,
      min,
      max,
      step = "any",
      allowDecimals = true,
      defaultValueOnBlur = 0,
      autoSelectOnFocus = true,
      prefix,
      suffix,
      align = "right",
      containerClassName,
      className,
      disabled,
      readOnly,
      placeholder,
      ...restProps
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const isFocusedRef = useRef(false);

    // Format initial or external value to string representation
    const formatValueToString = useCallback((v: unknown): string => {
      if (v === null || v === undefined || v === "") return "";
      const num = Number(v);
      if (isNaN(num)) return "";
      return String(v);
    }, []);

    const [displayValue, setDisplayValue] = useState<string>(() =>
      formatValueToString(value),
    );

    // Synchronize external value changes
    useEffect(() => {
      if (!isFocusedRef.current) {
        setDisplayValue(formatValueToString(value));
      } else {
        // If focused, sync if parent value changed externally to a non-zero value
        const currentNum = allowDecimals
          ? parseFloat(displayValue)
          : parseInt(displayValue, 10);
        const externalNum = Number(value);

        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !isNaN(externalNum) &&
          externalNum !== currentNum &&
          !(displayValue === "" && externalNum === 0)
        ) {
          setDisplayValue(String(value));
        }
      }
    }, [value, formatValueToString, allowDecimals, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Allow empty string while typing so user can clear the field completely
      if (raw === "") {
        setDisplayValue("");
        onChangeValue?.(0, "");
        onChange?.(e);
        return;
      }

      const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);

      if (isNaN(parsed)) {
        setDisplayValue(raw);
        onChangeValue?.(0, raw);
      } else {
        setDisplayValue(raw);
        onChangeValue?.(parsed, raw);
      }

      onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true;
      if (autoSelectOnFocus) {
        setTimeout(() => {
          inputRef.current?.select();
        }, 0);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;

      let nextVal = displayValue.trim();
      let num = allowDecimals ? parseFloat(nextVal) : parseInt(nextVal, 10);

      // Handle empty / invalid value on blur
      if (nextVal === "" || isNaN(num)) {
        if (defaultValueOnBlur !== null && defaultValueOnBlur !== undefined) {
          num = defaultValueOnBlur;
          nextVal = String(defaultValueOnBlur);
          setDisplayValue(nextVal);
          onChangeValue?.(num, nextVal);
        } else {
          setDisplayValue("");
          onChangeValue?.(0, "");
        }
        onBlur?.(e);
        return;
      }

      // Handle min boundary
      if (min !== undefined && num < min) {
        num = min;
        nextVal = String(min);
      }

      // Handle max boundary
      if (max !== undefined && num > max) {
        num = max;
        nextVal = String(max);
      }

      if (nextVal !== displayValue) {
        setDisplayValue(nextVal);
        onChangeValue?.(num, nextVal);
      }

      onBlur?.(e);
    };

    const inputElement = (
      <input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          "w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs",
          "text-slate-800 placeholder:text-slate-300 font-medium",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
          "disabled:bg-slate-100/70 disabled:text-slate-400 disabled:cursor-not-allowed",
          readOnly && "cursor-default",
          align === "right" && "text-right font-bold",
          align === "center" && "text-center",
          align === "left" && "text-left",
          prefix && "pl-6",
          suffix && "pr-7",
          className,
        )}
        {...restProps}
      />
    );

    if (prefix || suffix) {
      return (
        <div
          className={cn(
            "relative flex items-center w-full",
            containerClassName,
          )}
        >
          {prefix && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-semibold pointer-events-none select-none">
              {prefix}
            </span>
          )}
          {inputElement}
          {suffix && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none select-none">
              {suffix}
            </span>
          )}
        </div>
      );
    }

    return inputElement;
  },
);

ActivityNumberInput.displayName = "ActivityNumberInput";

