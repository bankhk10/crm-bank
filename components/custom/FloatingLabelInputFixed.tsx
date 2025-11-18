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
  // enable a search box inside the dropdown
  searchable?: boolean;
  // error message text
  error?: string;
  roundedClass?: string;
};

interface SelectListboxProps {
  id: string;
  options: SelectOption[];
  value: string | number | undefined;
  placeholder?: string;
  onChange?: (e: any) => void;
  disabled?: boolean;
  searchable?: boolean;
  inputClassName: string;
  hasError: boolean;
}

const SelectListbox: React.FC<SelectListboxProps> = ({
  id,
  options,
  value,
  placeholder,
  onChange,
  disabled,
  searchable,
  inputClassName,
  hasError,
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleDoc(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", handleDoc);
    return () => document.removeEventListener("mousedown", handleDoc);
  }, []);

  const filteredOptions = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selected = options.find((o) => String(o.value) === String(value));

  const selectOption = (optValue: string | number) => {
    if (onChange) onChange({ target: { value: String(optValue) } });
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(filteredOptions.length - 1);
      } else {
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && filteredOptions[activeIndex]) {
        selectOption(filteredOptions[activeIndex].value);
      } else {
        setOpen((o) => !o);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        className={`${inputClassName} relative flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          handleKeyDown(e);
        }}
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
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-hidden rounded-lg bg-white border border-gray-200 shadow-lg text-sm">
          {searchable ? (
            <div className="p-2">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="ค้นหา..."
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          ) : null}

          <ul role="listbox" aria-labelledby={id} className="max-h-52 overflow-auto py-1">
            {filteredOptions.length ? (
              filteredOptions.map((opt, idx) => (
                <li
                  key={String(opt.value)}
                  role="option"
                  aria-selected={String(opt.value) === String(value)}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => selectOption(opt.value)}
                  className={`cursor-pointer px-4 py-2 ${String(opt.value) === String(value) ? "bg-blue-50 text-blue-700" : idx === activeIndex ? "bg-gray-100" : "text-gray-700"}`}
                >
                  {opt.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">ไม่พบรายการ</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// Error icon
const ErrorIcon = () => (
  <svg className="h-5 w-5 shrink-0 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0v2a1 1 0 11-2 0v-2zm1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

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
  const inputId = (props as any).id || (props as any).name || `input-${label.replace(/\s+/g, "-")}`;
  const hasError = !!error;

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

  const stateClasses = hasError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500";

  const layoutClasses = [prefix ? "rounded-l-none" : "", suffix || type === "select" ? "pr-16" : ""].filter(Boolean);

  const selectSpecificClasses = type === "select" ? ["appearance-none"] : [];

  const inputClassName = [...baseInputClasses, stateClasses, ...layoutClasses, ...selectSpecificClasses].join(" ");

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

  const colorLabelClasses = hasError ? "text-red-500" : "text-gray-600 peer-focus:text-blue-500";
  const labelClassName = [...baseLabelClasses, colorLabelClasses].join(" ");

  return (
    <div className={`${prefix ? "flex" : ""} mb-6`}>
      {prefix && (
        <span
          className={`flex h-[50px] items-center border border-r-0 border-gray-300 bg-gray-50 px-4 text-gray-600 ${
            roundedClass ? (roundedClass as string).replace(/^rounded-/, "rounded-l-") : "rounded-l-lg"
          }`}
        >
          {prefix}
        </span>
      )}

      <div className="w-full">
        <div className="relative w-full">
          {type === "select" ? (
            <SelectListbox
              id={inputId}
              options={options}
              value={(props as any).value}
              placeholder={(props as any).placeholder}
              onChange={(props as any).onChange}
              disabled={(props as any).disabled}
              searchable={(props as any).searchable}
              inputClassName={inputClassName}
              hasError={hasError}
            />
          ) : (
            <input className={inputClassName} id={inputId} type={type} placeholder=" " {...(props as InputProps)} />
          )}

          <label className={labelClassName} htmlFor={inputId}>
            {label}
          </label>

          {suffix && <div className="absolute right-4 top-1/2 z-20 -translate-y-1/2">{suffix}</div>}
        </div>

        {hasError && (
          <div className="mt-2 flex items-center rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            <ErrorIcon />
            <span className="ml-2">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingLabelInput;