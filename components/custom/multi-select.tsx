"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    onValueChange: (value: string[]) => void;
    defaultValue?: string[];
    placeholder?: string;
    searchable?: boolean;
    hideSelectAll?: boolean;
    emptyIndicator?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    animationConfig?: {
        badgeAnimation?: "fade" | "scale" | "slide";
        popoverAnimation?: "fade" | "scale" | "slide";
    };
}

export function MultiSelect({
    options,
    onValueChange,
    defaultValue = [],
    placeholder = "Select options",
    searchable = true,
    hideSelectAll = false,
    emptyIndicator,
    className,
    disabled = false,
    animationConfig = {
        badgeAnimation: "fade",
        popoverAnimation: "scale",
    },
}: MultiSelectProps) {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    const handleUnselect = (value: string) => {
        const newSelectedValues = selectedValues.filter((v) => v !== value);
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
    };

    const handleToggle = (value: string) => {
        const newSelectedValues = selectedValues.includes(value)
            ? selectedValues.filter((v) => v !== value)
            : [...selectedValues, value];
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
    };

    const handleClearAll = () => {
        setSelectedValues([]);
        onValueChange([]);
    };

    const handleClose = () => {
        setIsPopoverOpen(false);
    };

    const badgeAnimationClass = {
        fade: "animate-in fade-in-0",
        scale: "animate-in zoom-in-95",
        slide: "animate-in slide-in-from-left-2",
    }[animationConfig.badgeAnimation || "fade"];

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPopoverOpen}
                    className={cn(
                        "w-full justify-between min-h-[44px] h-auto mt-1",
                        selectedValues.length > 0 ? "h-auto" : "h-11",
                        className
                    )}
                    disabled={disabled}
                >
                    <div className="flex gap-1 flex-wrap">
                        {selectedValues.length > 0 ? (
                            selectedValues.map((value) => {
                                const option = options.find((o) => o.value === value);
                                const IconComponent = option?.icon;
                                return (
                                    <Badge
                                        key={value}
                                        variant="secondary"
                                        className={cn("mr-1 mb-1", badgeAnimationClass)}
                                    >
                                        {IconComponent && (
                                            <IconComponent className="h-4 w-4 mr-2" />
                                        )}
                                        {option?.label}
                                        <span
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleUnselect(value);
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleUnselect(value);
                                            }}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </span>
                                    </Badge>
                                );
                            })
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    {searchable && (
                        <CommandInput placeholder="Search..." className="h-9" />
                    )}
                    <CommandList>
                        <CommandEmpty>
                            {emptyIndicator || "ไม่พบข้อมูล"}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => handleToggle(option.value)}
                                        className="cursor-pointer group"
                                    >
                                        <div className="relative mr-3 inline-block">
                                            <div className={cn(
                                                "relative w-5 h-5 transition-transform duration-200 ease-out",
                                                "group-hover:scale-105 group-active:scale-95"
                                            )}>
                                                {/* Background */}
                                                <div className={cn(
                                                    "absolute inset-0 rounded-lg border-2 transition-all duration-200 ease-out",
                                                    isSelected
                                                        ? "bg-green-600 border-green-600"
                                                        : "bg-white border-green-200"
                                                )}>
                                                </div>

                                                {/* Checkmark SVG with animation */}
                                                <svg
                                                    className={cn(
                                                        "absolute inset-0 m-auto w-[80%] h-[80%] text-white transition-all duration-200 ease-out",
                                                        isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
                                                    )}
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline
                                                        points="20 6 9 17 4 12"
                                                        className={cn(
                                                            "transition-all duration-300 ease-out",
                                                            isSelected
                                                                ? "[stroke-dasharray:40] [stroke-dashoffset:0]"
                                                                : "[stroke-dasharray:40] [stroke-dashoffset:40]"
                                                        )}
                                                        style={{
                                                            transitionDelay: isSelected ? '100ms' : '0ms'
                                                        }}
                                                    />
                                                </svg>

                                                {/* Focus ring effect */}
                                                {isSelected && (
                                                    <div className="absolute inset-0 rounded-lg bg-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10 scale-110"></div>
                                                )}
                                            </div>
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>

                    {/* Clear and Close buttons at bottom */}
                    <div className="flex border-t">
                        <Button
                            variant="ghost"
                            onClick={(e) => {
                                e.preventDefault();
                                handleClearAll();
                            }}
                            className="flex-1 rounded-none border-r"
                        >
                            ลบทั้งหมด
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={(e) => {
                                e.preventDefault();
                                handleClose();
                            }}
                            className="flex-1 rounded-none"
                        >
                            ตกลง
                        </Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
