// components/custom/FloatingLabelInput.tsx

import React from "react";

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
};

// [⭐️ เพิ่ม] คอมโพเนนต์ไอคอนสำหรับแสดงในกล่อง error
// (สไตล์คล้ายในรูปภาพ แต่ใช้ SVG มาตรฐานจาก Heroicons)
const ErrorIcon = () => (
  <svg
    className="h-5 w-5 flex-shrink-0 text-red-600" // ไอคอนสีแดง
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
  ...props
}) => {
  const inputId =
    (props as any).id ||
    (props as any).name ||
    `input-${label.replace(/\s+/g, "-")}`;

  // [⭐️ แก้ไข] เช็คว่ามี error (เป็น string ที่มีความยาว) หรือไม่
  const hasError = !!error;

  // --- 1. สร้าง Class List สำหรับ Input/Select ---

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
    "rounded-full",
    "focus:outline-none",
    "focus:ring-1",
    "placeholder-transparent",
  ];

  // Classes ตามสถานะ (Error)
  const stateClasses = hasError // [⭐️ แก้ไข] ใช้ hasError
    ? "border-red-500 focus:ring-red-500" // สีแดงเมื่อ error
    : "border-gray-300 focus:ring-blue-500";

  const layoutClasses = [
    prefix ? "rounded-l-none" : "",
    suffix ? "pr-12" : "",
  ].filter(Boolean);

  const selectSpecificClasses =
    type === "select"
      ? [
          "appearance-none",
          "bg-no-repeat",
          "bg-[right_15px_top_50%]",
          `bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='6' viewBox='0 0 8 6'%3E%3Cpath d='M371,294l4,6,4-6Z' transform='translate(-371 -294)' fill='%23003d71'/%3E%3C/svg%3E%0A")]`,
        ]
      : [];

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
        <span className="flex h-[50px] items-center rounded-l-full border border-r-0 border-gray-300 bg-gray-50 px-4 text-gray-600">
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
            <select
              className={inputClassName}
              id={inputId}
              placeholder=" "
              {...(props as SelectProps)}
            >
              <option value=""></option>
              {options.map((opt) => (
                <option key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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