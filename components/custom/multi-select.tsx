"use client";

import * as React from "react";
import { X, Check } from "lucide-react";
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
                                        className="cursor-pointer"
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
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
