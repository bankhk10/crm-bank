// components/custom/FloatingLabelInput.tsx

import React, { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
}

type InputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

type SelectProps = React.DetailedHTMLProps<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
>;

export type FloatingLabelInputProps = (InputProps | SelectProps) & {
  label: string;
  type?: "text" | "select" | "email" | "password" | "number";
  options?: SelectOption[];
  prefix?: string;
  suffix?: React.ReactNode;
  // [⭐️ แก้ไข] เปลี่ยนจาก boolean เป็น string เพื่อรับ "ข้อความ" error
  error?: string;
  // Tailwind rounded class to control corner radius (e.g. 'rounded-md', 'rounded-lg', 'rounded-full')
  roundedClass?: string;
};

// [⭐️ เพิ่ม] คอมโพเนนต์ไอคอนสำหรับแสดงในกล่อง error
// (สไตล์คล้ายในรูปภาพ แต่ใช้ SVG มาตรฐานจาก Heroicons)
const ErrorIcon = () => (
  <svg
    className="h-5 w-5 shrink-0 text-red-600" // ไอคอนสีแดง
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0v2a1 1 0 11-2 0v-2zm1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Reusable Floating Label Input Component (Converted to Tailwind CSS)
 * - Uses 'peer' utilities for floating label animation.
 * - Supports 'prefix', 'suffix', and 'error' states.
 * - [อัปเดต] ตอนนี้รองรับการแสดงผล error message ที่มีสไตล์
 */
export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  type = "text",
  options = [],
  prefix,
  suffix,
  error,
  roundedClass,
  ...props
}) => {
  const inputId =
    (props as any).id ||
    (props as any).name ||
    `input-${label.replace(/\s+/g, "-")}`;

  // [⭐️ แก้ไข] เช็คว่ามี error (เป็น string ที่มีความยาว) หรือไม่
  const hasError = !!error;

  // --- 1. สร้าง Class List สำหรับ Input/Select ---

  // allow overriding rounding via prop, default to 'rounded-lg' for a slightly larger corner radius
  const effectiveRounded = roundedClass || "rounded-lg";

  const baseInputClasses = [
    "peer",
    "block",
    "w-full",
    "h-[50px]",
    "px-5",
    "text-lg",
    "text-gray-900",
    "bg-white",
    "border",
    effectiveRounded,
    "focus:outline-none",
    "focus:ring-1",
    "placeholder-transparent",
  ];

  // Classes ตามสถานะ (Error)
  const stateClasses = hasError // [⭐️ แก้ไข] ใช้ hasError
    ? "border-red-500 focus:ring-red-500" // สีแดงเมื่อ error
    : "border-gray-300 focus:ring-blue-500";

  // add right padding when there's a suffix or when this is a select (for the arrow)
  // increase padding so the arrow sits a bit further from the edge
  const layoutClasses = [prefix ? "rounded-l-none" : "", suffix || type === "select" ? "pr-16" : ""].filter(Boolean);

  // for selects we use native appearance-none and render our own SVG arrow
  const selectSpecificClasses = type === "select" ? ["appearance-none"] : [];

  const inputClassName = [
    ...baseInputClasses,
    stateClasses,
    ...layoutClasses,
    ...selectSpecificClasses,
  ].join(" ");

  // --- 2. สร้าง Class List สำหรับ Label ---

  const baseLabelClasses = [
    "absolute",
    "px-1",
    "bg-white",
    "transition-all",
    "duration-200",
    "ease-in-out",
    "pointer-events-none",
    "z-10",
    "left-[15px]",
    "top-[-10px]",
    "text-[13px]",
    "peer-placeholder-shown:top-[15px]",
    "peer-placeholder-shown:text-[15px]",
    "peer-focus:top-[-10px]",
    "peer-focus:text-[13px]",
  ];

  // Classes สีสำหรับ Label
  const colorLabelClasses = hasError // [⭐️ แก้ไข] ใช้ hasError
    ? "text-red-500" // สีแดงเมื่อ error
    : "text-gray-600 peer-focus:text-blue-500";

  const labelClassName = [...baseLabelClasses, colorLabelClasses].join(" ");

  // --- 3. JSX Structure ---
  return (
    // Wrapper หลัก: จัดการ layout ของ prefix และ margin (mb-6)
    <div className={`${prefix ? "flex" : ""} mb-6`}>
      {/* ส่วนของ Prefix (ถ้ามี) */}
      {prefix && (
        <span
          className={`flex h-[50px] items-center border border-r-0 border-gray-300 bg-gray-50 px-4 text-gray-600 ${
            // convert rounded-* -> rounded-l-* for the prefix left rounding
            roundedClass ? (roundedClass as string).replace(/^rounded-/, "rounded-l-") : "rounded-l-lg"
          }`}
        >
          {prefix}
        </span>
      )}

      {/* [⭐️ แก้ไข] Wrapper ใหม่สำหรับ Input + Suffix + Error Message 
        เพื่อให้ w-full ทำงานถูกต้องกับ prefix และ error message อยู่ใต้อินพุต
      */}
      <div className="w-full">
        {/* Wrapper เดิม: สำหรับ Input + Label + Suffix เพื่อให้ absolute positioning ทำงานถูกต้อง */}
        <div className="relative w-full">
          {type === "select" ? (
            // Custom listbox to allow full styling of the opened dropdown
            (() => {
              const value = (props as any).value ?? "";
              const placeholder = (props as any).placeholder ?? "";
              const onChange = (props as any).onChange as ((e: any) => void) | undefined;

              const [open, setOpen] = useState(false);
              const [activeIndex, setActiveIndex] = useState<number>(-1);
              const containerRef = useRef<HTMLDivElement | null>(null);

              useEffect(() => {
                function handleDoc(e: MouseEvent) {
                  if (!containerRef.current) return;
                  if (!containerRef.current.contains(e.target as Node)) {
                    setOpen(false);
                  }
                }

                document.addEventListener("mousedown", handleDoc);
                return () => document.removeEventListener("mousedown", handleDoc);
              }, []);

              const selectOption = (optValue: string | number) => {
                if (onChange) {
                  // create a minimal synthetic event with target.value
                  onChange({ target: { value: String(optValue) } });
                }
                setOpen(false);
              };

              const handleKeyDown = (e: React.KeyboardEvent) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (!open) {
                    setOpen(true);
                    setActiveIndex(0);
                  } else {
                    setActiveIndex((i) => Math.min(i + 1, options.length - 1));
                  }
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (!open) {
                    setOpen(true);
                    setActiveIndex(options.length - 1);
                  } else {
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  }
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (open && activeIndex >= 0 && options[activeIndex]) {
                    selectOption(options[activeIndex].value);
                  } else {
                    setOpen((o) => !o);
                  }
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              };

              const selected = options.find((o) => String(o.value) === String(value));

              return (
                <div className="relative" ref={containerRef}>
                  <div
                    id={inputId}
                    tabIndex={0}
                    role="button"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className={`${inputClassName} relative flex items-center justify-between cursor-pointer`}
                    onClick={() => setOpen((o) => !o)}
                    onKeyDown={handleKeyDown}
                  >
                    <span className={`${selected ? "text-gray-900" : "text-muted-foreground"}`}>
                      {selected ? selected.label : placeholder}
                    </span>
                    <span className={`absolute right-4 top-1/2 z-10 -translate-y-1/2 ${hasError ? "text-red-500" : "text-gray-500"}`}>
                      <svg className={`h-5 w-5 transform transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>

                  {open && (
                    <ul
                      role="listbox"
                      aria-labelledby={inputId}
                      className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-auto rounded-lg bg-white border border-gray-200 shadow-lg py-1 text-sm"
                    >
                      {options.map((opt, idx) => {
                        const isSelected = String(opt.value) === String(value);
                        const isActive = idx === activeIndex;
                        return (
                          <li
                            key={String(opt.value)}
                            role="option"
                            aria-selected={isSelected}
                            onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => selectOption(opt.value)}
                            className={`cursor-pointer px-4 py-2 ${isSelected ? "bg-blue-50 text-blue-700" : isActive ? "bg-gray-100" : "text-gray-700"}`}
                          >
                            {opt.label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })()
          ) : (
            <input
              className={inputClassName}
              id={inputId}
              type={type}
              placeholder=" "
              {...(props as InputProps)}
            />
          )}

          {/* Label (ใช้ peer-*) */}
          <label className={labelClassName} htmlFor={inputId}>
            {label}
          </label>

          {/* ส่วนของ Suffix (ถ้ามี) */}
          {suffix && (
            <div className="absolute right-4 top-1/2 z-20 -translate-y-1/2">
              {suffix}
            </div>
          )}

          {/* Removed duplicate non-interactive arrow — custom listbox renders its own arrow */}
        </div>

        {/* [⭐️ เพิ่ม] ส่วนแสดงผล Error Message
          - จะแสดงผลต่อเมื่อมี 'error' (string) ส่งเข้ามา
          - mt-2: เว้นระยะห่างจาก input ด้านบน
          - bg-red-50: พื้นหลังสีชมพูอ่อน (เหมือนในรูป)
          - text-red-700: ข้อความสีแดงเข้ม
          - rounded-lg: ขอบมน (เหมือนกล่อง error ในรูป)
        */}
        {hasError && (
          <div
            className="mt-2 flex items-center rounded-lg bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            <ErrorIcon />
            <span className="ml-2">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingLabelInput;