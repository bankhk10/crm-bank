"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";
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
  emptyIndicator?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  maxCount?: number;
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
  emptyIndicator,
  className,
  disabled = false,
  maxCount,
  animationConfig = {
    badgeAnimation: "fade",
    popoverAnimation: "scale",
  },
}: MultiSelectProps) {
  const [selectedValues, setSelectedValues] =
    React.useState<string[]>(defaultValue);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedValues(defaultValue);
  }, [defaultValue]);

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

  const visibleValues =
    maxCount && maxCount > 0 ? selectedValues.slice(0, maxCount) : selectedValues;
  const extraCount = selectedValues.length - visibleValues.length;

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isPopoverOpen}
          className={cn(
            "w-full justify-between min-h-[38px] h-auto text-xs px-3 py-1.5",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap items-center overflow-hidden flex-1">
            {selectedValues.length > 0 ? (
              <>
                {visibleValues.map((value) => {
                  const option = options.find((o) => o.value === value);
                  const IconComponent = option?.icon;
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className={cn(
                        "mr-1 max-w-[calc(100%-10px)] font-normal text-xs py-0.5 px-2 bg-secondary/80",
                        badgeAnimationClass,
                      )}
                    >
                      {IconComponent && (
                        <IconComponent className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      )}
                      <span className="truncate max-w-[140px]">{option?.label || value}</span>
                      <span
                        className="ml-1 rounded-full outline-none focus:ring-1 focus:ring-ring cursor-pointer flex-shrink-0 hover:bg-muted/80 p-0.5"
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
                })}
                {extraCount > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-semibold text-xs py-0.5 px-2 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20",
                      badgeAnimationClass,
                    )}
                  >
                    +{extraCount}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-1 shrink-0">
            {selectedValues.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClearAll();
                }}
                title="ล้างทั้งหมด"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
        align="start"
      >
        <Command>
          {searchable && (
            <CommandInput placeholder="ค้นหาสถานะ..." className="h-9 text-xs" />
          )}
          <CommandList>
            <CommandEmpty>{emptyIndicator || "ไม่พบข้อมูล"}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => handleToggle(option.value)}
                    className="cursor-pointer group"
                  >
                    <div className="relative mr-3 inline-block">
                      <div
                        className={cn(
                          "relative w-5 h-5 transition-transform duration-200 ease-out",
                          "group-hover:scale-105 group-active:scale-95",
                        )}
                      >
                        {/* Background */}
                        <div
                          className={cn(
                            "absolute inset-0 rounded-lg border-2 transition-all duration-200 ease-out",
                            isSelected
                              ? "bg-green-600 border-green-600"
                              : "bg-white border-green-600",
                          )}
                        ></div>

                        {/* Checkmark SVG with animation */}
                        <svg
                          className={cn(
                            "absolute inset-0 m-auto w-[80%] h-[80%] text-white transition-all duration-200 ease-out",
                            isSelected
                              ? "scale-100 opacity-100"
                              : "scale-0 opacity-0",
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
                                : "[stroke-dasharray:40] [stroke-dashoffset:40]",
                            )}
                            style={{
                              transitionDelay: isSelected ? "100ms" : "0ms",
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
