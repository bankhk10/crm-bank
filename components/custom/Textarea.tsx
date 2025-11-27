"use client";

import React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  roundedClass?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  roundedClass = "rounded-lg",
  ...props
}) => {
  const textareaId =
    props.id || props.name || `textarea-${label.replace(/\s+/g, "-")}`;
  const hasError = !!error;

  const valuePresent = Boolean(props.value || props.defaultValue);

  const baseTextareaClasses = [
    "peer block w-full min-h-[100px] px-5 py-3 text-lg bg-white",
    "border text-gray-900",
    roundedClass,
    "placeholder-transparent",
    "outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 resize-y",
    hasError
      ? "border-red-500 focus:border-red-500"
      : "border-gray-300 focus:border-blue-500",
  ].join(" ");

  const baseLabelShared = [
    "absolute px-1 bg-white transition-all duration-200 ease-in-out pointer-events-none z-10",
    "left-[15px]",
  ];

  const labelClasses = valuePresent
    ? ["top-[-10px]", "text-[13px]"]
    : [
        "top-[15px]",
        "text-[15px]",
        "peer-placeholder-shown:top-[15px]",
        "peer-placeholder-shown:text-[15px]",
        "peer-focus:top-[-10px]",
        "peer-focus:text-[13px]",
      ];

  const colorLabelClasses = hasError
    ? "text-red-500"
    : "text-gray-600 peer-focus:text-blue-500";

  const labelClassName = [
    ...baseLabelShared,
    ...labelClasses,
    colorLabelClasses,
  ].join(" ");

  return (
    <div className="mb-2">
      <div className="relative w-full">
        <textarea
          className={baseTextareaClasses}
          id={textareaId}
          placeholder=" "
          {...props}
        />

        <label className={labelClassName} htmlFor={textareaId}>
          {label}
        </label>
      </div>

      {hasError && (
        <div
          className="mt-2 flex items-center rounded-lg bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          <svg
            className="h-5 w-5 shrink-0 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0v2a1 1 0 11-2 0v-2zm1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="ml-2">{error}</span>
        </div>
      )}
    </div>
  );
};

export default Textarea;
