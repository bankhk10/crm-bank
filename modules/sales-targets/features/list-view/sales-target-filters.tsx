"use client";

import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { MONTHS } from "../../constants";

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
        <Card className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden border border-white/20">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">ตัวกรองเป้าหมาย</CardTitle>
                            <p className="text-xs text-slate-500 font-medium">เลือกเงื่อนไขเพื่อดูข้อมูลที่ต้องการ</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-5 sm:p-6 lg:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
                        {/* Year */}
                        <div className="lg:col-span-2">
                            <FormCombobox
                                label="ปี"
                                value={year.toString()}
                                onChange={(val) => onChangeYear(Number(val))}
                                options={years.map((y) => ({
                                    value: y.toString(),
                                    label: (y + 543).toString(),
                                }))}
                                placeholder="เลือกปี"
                                searchPlaceholder="ค้นหาปี..."
                                emptyText="ไม่พบปี"
                            />
                        </div>

                        {/* Month */}
                        <div className="lg:col-span-2">
                            <FormCombobox
                                label="เดือน"
                                value={month === "all" ? "all" : month.toString()}
                                onChange={(val) =>
                                    onChangeMonth(val === "all" ? "all" : Number(val))
                                }
                                options={[
                                    { value: "all", label: "ทั้งหมด" },
                                    ...MONTHS.map((m) => ({
                                        value: m.value.toString(),
                                        label: m.label,
                                    })),
                                ]}
                                placeholder="เดือนทั้งหมด"
                                searchPlaceholder="ค้นหาเดือน..."
                                emptyText="ไม่พบเดือน"
                            />
                        </div>

                        {/* Employee */}
                        <div className="lg:col-span-3">
                            <FormCombobox
                                label="พนักงาน"
                                value={employeeId}
                                onChange={(val) => onChangeEmployee(val)}
                                options={employees.map((emp) => ({
                                    value: emp.id,
                                    label: `${emp.name}`,
                                }))}
                                placeholder="พนักงานทั้งหมด"
                                searchPlaceholder="ค้นหาพนักงาน..."
                                emptyText="ไม่พบพนักงาน"
                            />
                        </div>

                        {/* Shop */}
                        <div className="lg:col-span-3">
                            <FormCombobox
                                label="ร้านค้า"
                                value={shopId}
                                onChange={(val) => onChangeShop(val)}
                                options={customers.map((customer) => ({
                                    value: customer.id,
                                    label: `${customer.name}`,
                                }))}
                                placeholder="ร้านค้าทั้งหมด"
                                searchPlaceholder="ค้นหาร้านค้า..."
                                emptyText="ไม่พบร้านค้า"
                            />
                        </div>

                        {/* Clear Button */}
                        <div className="md:col-span-2 lg:col-span-2 flex items-end">
                            <Button
                                variant="outline"
                                className="w-25 h-10 rounded-xl border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-200 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                onClick={onClear}
                            >
                                ล้างตัวกรอง
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
