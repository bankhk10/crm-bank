"use client"

import * as React from "react"
import { format, getMonth, getYear, setMonth, setYear, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/custom/select"

interface DatePickerProps {
  startYear?: number;
  endYear?: number;
  value?: string | Date | undefined;
  onChange?: (val?: string) => void; // emits YYYY-MM-DD or undefined
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
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
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
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
  }

  const handleYearChange = (year: string) => {
    const base = date ?? new Date();
    const newDate = setYear(base, parseInt(year));
    setDate(newDate)
    if (onChange) onChange(toYMD(newDate));
  }

  const handleSelect = (selectedData: Date | undefined) => {
    if (selectedData) {
      setDate(selectedData)
      if (onChange) onChange(toYMD(selectedData));
      // close popover after selecting a date
      setOpen(false);
    }
    if (!selectedData) {
      setDate(undefined);
      if (onChange) onChange(undefined);
    }
  }
  const thaiDisplay = date ? `${format(date, "dd/MM")}/${getYear(date) + 543}` : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full">
        {/* Floating label */}
        {label && (
          <label
            id={`datepicker-label-${label.replace(/\s+/g, "-")}`}
            className={cn(
              "absolute px-1 bg-white transition-all duration-200 ease-in-out pointer-events-none z-10 left-[15px]",
              (date || open) ? "-top-2 text-[13px]" : "top-[15px] text-[15px]",
              date ? "text-gray-700" : "text-gray-600"
            )}
          >
            {label}
          </label>
        )}

        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "relative w-full h-[50px] px-5 pr-12 text-lg justify-start text-left font-normal rounded-lg",
              !date && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            title={label ? `${label}: ${thaiDisplay}` : thaiDisplay}
            aria-labelledby={label ? `datepicker-label-${label.replace(/\s+/g, "-")}` : undefined}
          >
            <span className="truncate">{date ? thaiDisplay : <span>{placeholder}</span>}</span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" aria-label={label ? `ปฏิทินสำหรับ ${label}` : "ปฏิทินเลือกวันที่"}>
        <div className="flex justify-between p-2">
          <Select
            onValueChange={handleMonthChange}
            value={months[getMonth(date ?? new Date())]}
          >
            <SelectTrigger className="w-[110px]" aria-label={label ? `เลือกเดือน ${label}` : "เลือกเดือน"} title={label ? `เลือกเดือน ${label}` : "เลือกเดือน"}>
              <SelectValue placeholder="เดือน" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleYearChange}
            value={(getYear(date ?? new Date())).toString()}
          >
            <SelectTrigger className="w-[110px]" aria-label={label ? `เลือกปี ${label}` : "เลือกปี"} title={label ? `เลือกปี ${label}` : "เลือกปี"}>
              <SelectValue placeholder="ปี" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year + 543}</SelectItem>
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
          aria-label={label ? `ปฏิทินเลือกวันที่สำหรับ ${label}` : "ปฏิทินเลือกวันที่"}
          onMonthChange={setDate}
        />
      </PopoverContent>
    </Popover>
  )
}

    export default DatePicker