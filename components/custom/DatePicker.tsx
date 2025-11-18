"use client"

import * as React from "react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"

type DatePickerProps = {
  value?: string // YYYY-MM-DD
  onChange?: (val?: string) => void
  disabled?: boolean
  placeholder?: string
  label?: string
  roundedClass?: string
}

function toDate(value?: string) {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function toYMD(date?: Date) {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function DatePicker({
  value,
  onChange,
  disabled,
  placeholder,
  label,
  roundedClass,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Date | undefined>(() => toDate(value))

  const effectiveRounded = roundedClass || "rounded-lg"

  const baseInputClasses = [
    "peer block w-full h-[50px] px-5 text-lg bg-white",
    "border text-gray-900",
    effectiveRounded,
    "placeholder-transparent",
    "outline-none focus:outline-none focus:ring-0 focus-visible:ring-0",
    "border-gray-300 focus:border-blue-500",
  ]

  const inputClassName = baseInputClasses.join(" ")

  

  React.useEffect(() => {
    setSelected(toDate(value))
  }, [value])

  return (
    <div className="mb-6">
      <div className="relative w-full">
        <Popover open={open} onOpenChange={(v) => setOpen(v)}>
          <div className="flex flex-col">
            <PopoverTrigger asChild>
              <div>
                <Input
                  className={inputClassName}
                  readOnly
                  value={selected ? format(selected, "dd/MM/yyyy") : ""}
                  onClick={() => !disabled && setOpen(true)}
                  placeholder={" "}
                  disabled={disabled}
                />
              </div>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0">
              <div className="p-2">
                <Calendar
                  mode="single"
                  selected={selected}
                  onSelect={(d) => {
                    const dt = Array.isArray(d) ? d[0] : d
                    setSelected(dt as Date | undefined)
                    onChange?.(toYMD(dt as Date | undefined))
                    setOpen(false)
                  }}
                />
              </div>
            </PopoverContent>
          </div>
        </Popover>

        {label && (
          <label
            className={`absolute px-1 bg-white transition-all duration-200 ease-in-out pointer-events-none left-[15px] peer-placeholder-shown:top-[15px] peer-placeholder-shown:text-[15px] -top-2.5 text-[13px] text-gray-600 peer-focus:text-blue-500`}
          >
            {label}
          </label>
        )}
      </div>
    </div>
  )
}
