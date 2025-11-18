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
  placeholder = "เลือกวัน",
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

  React.useEffect(() => {
    setDate(toDate(value));
  }, [value]);

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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
    }
    if (!selectedData) {
      setDate(undefined);
      if (onChange) onChange(undefined);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[250px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? `${format(date, "dd/MM")}/${getYear(date) + 543}` : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex justify-between p-2">
          <Select
            onValueChange={handleMonthChange}
            value={months[getMonth(date ?? new Date())]}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Month" />
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
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Year" />
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
          onMonthChange={setDate}
        />
      </PopoverContent>
    </Popover>
  )
}

    export default DatePicker