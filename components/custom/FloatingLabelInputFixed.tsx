import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    suffix?: React.ReactNode;
}

const FloatingLabelInput = React.forwardRef<
    HTMLInputElement,
    FloatingLabelInputProps
>(({ id, label, className, type, suffix, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    // Handle focus/blur events
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        setHasValue(!!e.target.value);
        props.onBlur?.(e);
    };

    // Handle value changes to keep label floating if needed
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasValue(!!e.target.value);
        props.onChange?.(e);
    };

    return (
        <div className="relative group">
            <Input
                id={id}
                ref={ref}
                type={type}
                className={cn(
                    "w-full px-4 pt-5 pb-1 text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                    className
                )}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder=" " // Important for CSS placeholder-shown trick if we used CSS-only solution, but here we use JS state
                {...props}
            />

            {/* Label */}
            <label
                htmlFor={id}
                className={cn(
                    "absolute left-4 transition-all duration-200 pointer-events-none text-gray-500",
                    isFocused || hasValue || props.value
                        ? "top-1 text-xs text-blue-600 font-medium translate-y-0"
                        : "top-1/2 -translate-y-1/2 text-base"
                )}
            >
                {label}
            </label>

            {/* Suffix Icon/Button (e.g. eye toggle) */}
            {suffix && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {suffix}
                </div>
            )}
        </div>
    );
});

FloatingLabelInput.displayName = "FloatingLabelInput";

export default FloatingLabelInput;
