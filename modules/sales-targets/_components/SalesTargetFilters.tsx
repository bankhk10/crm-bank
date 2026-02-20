"use client";

import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { MONTHS } from "@/features/sales-targets/_lib/constants";

interface SalesTargetFiltersProps {
    year: number;
    month: number | "all";
    employeeId: string;
    shopId: string;
    years: number[];
    employees: any[];
    customers: any[];
    onChangeYear: (year: number) => void;
    onChangeMonth: (month: number | "all") => void;
    onChangeEmployee: (id: string) => void;
    onChangeShop: (id: string) => void;
    onClear: () => void;
}

export function SalesTargetFilters({
    year,
    month,
    employeeId,
    shopId,
    years,
    employees,
    customers,
    onChangeYear,
    onChangeMonth,
    onChangeEmployee,
    onChangeShop,
    onClear,
}: SalesTargetFiltersProps) {
    return (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
            <CardHeader className="border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">ตัวกรองเป้าหมายรายเดือน</CardTitle>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-7">
                <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
                        <div className="p-4 sm:p-5">
                            {/* ✅ one row on lg, equal height, clean alignment */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[140px_160px_1.2fr_1.2fr_auto] gap-4 lg:gap-5 items-end">
                                {/* Year */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold tracking-wide text-slate-600">
                                        ปี
                                    </Label>
                                    <Select
                                        value={year.toString()}
                                        onValueChange={(value) => onChangeYear(Number(value))}
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow transition-shadow focus:ring-2 focus:ring-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {years.map((y) => (
                                                <SelectItem key={y} value={y.toString()}>
                                                    {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Month */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold tracking-wide text-slate-600">
                                        เดือน
                                    </Label>
                                    <Select
                                        value={month === "all" ? "all" : month.toString()}
                                        onValueChange={(value) =>
                                            onChangeMonth(value === "all" ? "all" : Number(value))
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow transition-shadow focus:ring-2 focus:ring-slate-200">
                                            <SelectValue placeholder="ทั้งหมด" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all">ทั้งหมด</SelectItem>
                                            {MONTHS.map((m) => (
                                                <SelectItem key={m.value} value={m.value.toString()}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Employee */}
                                <div className="space-y-2">
                                    <FormCombobox
                                        label="พนักงาน"
                                        value={employeeId}
                                        onChange={(val) => onChangeEmployee(val)}
                                        options={employees.map((emp) => ({
                                            value: emp.id,
                                            label: `${emp.name} (${emp.employeeCode || "-"})`,
                                        }))}
                                        placeholder="พนักงานทั้งหมด"
                                        searchPlaceholder="ค้นหาพนักงาน..."
                                        emptyText="ไม่พบพนักงาน"
                                    />
                                </div>

                                {/* Shop */}
                                <div className="space-y-2">
                                    <FormCombobox
                                        label="ร้านค้า"
                                        value={shopId}
                                        onChange={(val) => onChangeShop(val)}
                                        options={customers.map((customer) => ({
                                            value: customer.id,
                                            label: `${customer.name} (${customer.customerCode || "-"})`,
                                        }))}
                                        placeholder="ร้านค้าทั้งหมด"
                                        searchPlaceholder="ค้นหาร้านค้า..."
                                        emptyText="ไม่พบร้านค้า"
                                    />
                                </div>

                                {/* Clear */}
                                <div className="flex lg:justify-end">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="
      h-11 rounded-xl px-4
      border-red-200
      bg-red-50
      text-red-600
      hover:bg-red-100
      hover:text-red-700
      hover:border-red-300
      shadow-sm hover:shadow
      transition-all
    "
                                        onClick={onClear}
                                    >
                                        ล้างตัวกรอง
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
