"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

export interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
  roundedClass?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value = [],
  onChange,
  placeholder = "",
  disabled = false,
  error,
  searchable = true,
  roundedClass = "rounded-lg",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleDoc);
    return () => document.removeEventListener("mousedown", handleDoc);
  }, []);

  const filteredOptions = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selectedOptions = options.filter((opt) =>
    value.includes(opt.value)
  );

  const toggleOption = (optValue: string | number) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const removeOption = (optValue: string | number) => {
    onChange(value.filter((v) => v !== optValue));
  };

  const hasError = !!error;
  const valuePresent = value.length > 0;

  const baseInputClasses = [
    "peer block w-full min-h-[50px] px-5 py-3 text-lg bg-white",
    "border text-gray-900",
    roundedClass,
    "outline-none focus:outline-none focus:ring-0 focus-visible:ring-0",
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
    : ["top-[15px]", "text-[15px]"];

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
      <div className="relative w-full" ref={containerRef}>
        <div
          className={`${baseInputClasses} ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } relative flex flex-wrap gap-2 items-center`}
          onClick={() => !disabled && setOpen((o) => !o)}
        >
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(opt.value);
                  }}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-base">
              {placeholder}
            </span>
          )}

          <span
            className={`absolute right-4 top-1/2 z-10 -translate-y-1/2 ${
              hasError ? "text-red-500" : "text-gray-500"
            }`}
          >
            <svg
              className={`h-5 w-5 transform transition-transform duration-150 ${
                open ? "rotate-180" : "rotate-0"
              }`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </div>

        <label className={labelClassName}>{label}</label>

        {open && (
          <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-hidden rounded-lg bg-white border border-gray-200 shadow-lg text-sm focus:outline-none focus:ring-0">
            {searchable && (
              <div className="p-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหา..."
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <ul className="max-h-52 overflow-auto py-1 focus:outline-none focus:ring-0">
              {filteredOptions.length ? (
                filteredOptions.map((opt) => {
                  const isSelected = value.includes(opt.value);
                  return (
                    <li
                      key={String(opt.value)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(opt.value);
                      }}
                      className={`cursor-pointer px-4 py-2 flex items-center gap-2 ${
                        isSelected
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      {opt.label}
                    </li>
                  );
                })
              ) : (
                <li className="px-4 py-2 text-gray-500">ไม่พบรายการ</li>
              )}
            </ul>
          </div>
        )}
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

export default MultiSelect;
