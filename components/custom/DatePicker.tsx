"use client";

import * as React from "react";
import {
  format,
  getMonth,
  getYear,
  setMonth,
  setYear,
  parseISO,
} from "date-fns";
import { Calendar as CalendarIcon, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/custom/select";

interface DatePickerProps {
  startYear?: number;
  endYear?: number;
  value?: string | Date | undefined;
  onChange?: (val?: string) => void; // emits YYYY-MM-DD or undefined
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  id?: string;
  error?: string;
}
function DatePicker({
  startYear = getYear(new Date()) - 100,
  endYear = getYear(new Date()) + 100,
  value,
  onChange,
  label,
  placeholder = "",
  disabled = false,
  className,
  required = false,
  id,
  error,
}: DatePickerProps) {
  const toDate = (v?: string | Date) => {
    if (!v) return undefined;
    if (v instanceof Date) return v;
    try {
      return parseISO(v);
    } catch (e) {
      return undefined;
    }
  };

  const toYMD = (d: Date) => format(d, "yyyy-MM-dd");

  const [date, setDate] = React.useState<Date | undefined>(() => toDate(value));
  const [open, setOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    setDate(toDate(value));
  }, [value]);

  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  const handleMonthChange = (month: string) => {
    const base = date ?? new Date();
    const newDate = setMonth(base, months.indexOf(month));
    setDate(newDate);
    if (onChange) onChange(toYMD(newDate));
  };

  const handleYearChange = (year: string) => {
    const base = date ?? new Date();
    const newDate = setYear(base, parseInt(year));
    setDate(newDate);
    if (onChange) onChange(toYMD(newDate));
  };

  const handleSelect = (selectedData: Date | undefined) => {
    if (selectedData) {
      setDate(selectedData);
      if (onChange) onChange(toYMD(selectedData));
      // close popover after selecting a date
      setOpen(false);
    }
    if (!selectedData) {
      setDate(undefined);
      if (onChange) onChange(undefined);
    }
  };
  const thaiDisplay = date
    ? `${format(date, "dd/MM")}/${getYear(date) + 543}`
    : placeholder;

  const handleClear = () => {
    setDate(undefined);
    if (onChange) onChange(undefined);
  };

  const handleConfirm = () => {
    if (date && onChange) onChange(toYMD(date));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => !disabled && setOpen(newOpen)}
    >
      <div className="w-full">
        {label && (
          <Label
            id={`datepicker-label-${label.replace(/\s+/g, "-")}`}
            className="mx-2 mb-1 font-medium text-base text-gray-900"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}

        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              id={id}
              readOnly
              value={date ? thaiDisplay : ""}
              placeholder={placeholder}
              className={cn(
                "pr-10 h-11 text-base !bg-white",
                error && "border-red-500 focus-visible:ring-red-500 bg-red-50/10",
                className
              )}
              disabled={disabled}
              title={label ? `${label}: ${thaiDisplay}` : thaiDisplay}
              aria-labelledby={
                label
                  ? `datepicker-label-${label.replace(/\s+/g, "-")}`
                  : undefined
              }
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </PopoverTrigger>
      </div>
      <PopoverContent
        className="w-auto p-0"
        aria-label={label ? `ปฏิทินสำหรับ ${label}` : "ปฏิทินเลือกวันที่"}
      >
        <div className="flex justify-between p-2">
          <Select
            onValueChange={handleMonthChange}
            value={months[getMonth(date ?? new Date())]}
          >
            <SelectTrigger
              className="w-[110px]"
              aria-label={label ? `เลือกเดือน ${label}` : "เลือกเดือน"}
              title={label ? `เลือกเดือน ${label}` : "เลือกเดือน"}
            >
              <SelectValue placeholder="เดือน" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleYearChange}
            value={getYear(date ?? new Date()).toString()}
          >
            <SelectTrigger
              className="w-[110px]"
              aria-label={label ? `เลือกปี ${label}` : "เลือกปี"}
              title={label ? `เลือกปี ${label}` : "เลือกปี"}
            >
              <SelectValue placeholder="ปี" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year + 543}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          month={date}
          aria-label={
            label ? `ปฏิทินเลือกวันที่สำหรับ ${label}` : "ปฏิทินเลือกวันที่"
          }
          onMonthChange={setDate}
        />
        <div className="flex items-center justify-between gap-2 p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground pl-0"
            onClick={handleClear}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> ล้างช่วงวันที่
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            ยืนยัน
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
