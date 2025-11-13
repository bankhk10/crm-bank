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
  error?: boolean;
};

/**
 * Reusable Floating Label Input Component (Converted to Tailwind CSS)
 * - Uses 'peer' utilities for floating label animation.
 * - Supports 'prefix', 'suffix', and 'error' states.
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

  // --- 1. สร้าง Class List สำหรับ Input/Select ---

  // Base classes สำหรับ input และ select
  const baseInputClasses = [
    "peer",
    "block",
    "w-full",
    "h-[50px]",
    "px-5", // Layout & Sizing (h-[50px] จาก original)
    "text-lg",
    "text-gray-900", // Typography (text-lg จาก 18px)
    "bg-white",
    "border",
    "rounded-full", // Appearance (rounded-full จาก 20px/9999px)
    "focus:outline-none",
    "focus:ring-1", // Focus state
    "placeholder-transparent", // สำคัญ: ทำให้ placeholder " " โปร่งใส แต่ยังคงอยู่
  ];

  // Classes ตามสถานะ (Error)
  const stateClasses = error
    ? "border-red-500 focus:ring-red-500" // สีแดงเมื่อ error
    : "border-gray-300 focus:ring-blue-500"; // สีปกติ (focus-color จาก #c62828)

  // Classes ตาม Layout (Prefix/Suffix)
  const layoutClasses = [
    prefix ? "rounded-l-none" : "", // ลบขอบมนด้านซ้ายถ้ามี prefix
    suffix ? "pr-12" : "", // เพิ่ม padding ขวาถ้ามี suffix (48px)
  ].filter(Boolean);

  // Classes เฉพาะสำหรับ <select>
  const selectSpecificClasses =
    type === "select"
      ? [
          "appearance-none", // ปิด UI เริ่มต้นของ browser
          "bg-no-repeat",
          "bg-[right_15px_top_50%]", // ตำแหน่งลูกศร
          // SVG Icon (เหมือนใน original CSS)
          `bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='6' viewBox='0 0 8 6'%3E%3Cpath d='M371,294l4,6,4-6Z' transform='translate(-371 -294)' fill='%23003d71'/%3E%3C/svg%3E%0A")]`,
        ]
      : [];

  // รวม classes ทั้งหมด
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
    "bg-white", // Layout and appearance
    "transition-all",
    "duration-200",
    "ease-in-out", // Animation
    "pointer-events-none",
    "z-10", // Interaction
    "left-[15px]", // ตำแหน่ง (สอดคล้องกับ padding-left 15px+5px)

    // --- จุดสำคัญของ Floating Label ---
    // 1. สถานะ "ลอยขึ้น" (Default)
    "top-[-10px]",
    "text-[13px]",

    // 2. สถานะ "ลอยลง" (เมื่อ placeholder แสดงอยู่ = input ว่างและไม่ focus)
    "peer-placeholder-shown:top-[15px]", // (สำหรับ h-[50px])
    "peer-placeholder-shown:text-[15px]",

    // 3. สถานะ "Focus" (บังคับให้ลอยขึ้น + เปลี่ยนสี)
    "peer-focus:top-[-10px]",
    "peer-focus:text-[13px]",
  ];

  // Classes สีสำหรับ Label
  const colorLabelClasses = error
    ? "text-red-500" // สีแดงเมื่อ error
    : "text-gray-600 peer-focus:text-blue-500"; // สีปกติ และสีตอน focus

  const labelClassName = [...baseLabelClasses, colorLabelClasses].join(" ");

  // --- 3. JSX Structure ---
  return (
    // Wrapper หลัก: จัดการ layout ของ prefix และ margin
    <div className={`${prefix ? "flex" : ""} mb-6`}>
      {" "}
      {/* mb-6 จาก 24px */}
      {/* ส่วนของ Prefix (ถ้ามี) */}
      {prefix && (
        <span className="flex h-[50px] items-center rounded-l-full border border-r-0 border-gray-300 bg-gray-50 px-4 text-gray-600">
          {prefix}
        </span>
      )}
      {/* Wrapper ใหม่: สำหรับ Input + Label + Suffix เพื่อให้ absolute positioning ทำงานถูกต้อง */}
      <div className="relative w-full">
        {type === "select" ? (
          <select
            className={inputClassName}
            id={inputId}
            placeholder=" " /* ⭐️ สำคัญ: ต้องมี placeholder (แม้จะเป็น " ") */
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
            placeholder=" " /* ⭐️ สำคัญ: ต้องมี placeholder (แม้จะเป็น " ") */
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
    </div>
  );
};

export default FloatingLabelInput;
