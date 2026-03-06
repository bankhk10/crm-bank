"use client";

import Link from "next/link";
import { Calendar, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { usePermission } from "@/hooks/use-permission";
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
    const { isLoading, hasPermission } = usePermission("menu.sales_targets");
    const canCreate = !isLoading && (hasPermission("sales_target.manage") || hasPermission("sales_target.create"));

    return (
        <Card className="rounded-md border bg-background/60 shadow-none">
            <CardContent className="p-0">
                <div className="p-4 sm:p-5 lg:p-6">
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
                        <div className="lg:col-span-2">
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

                        {/* Action Buttons */}
                        <div className="md:col-span-2 lg:col-span-3 flex items-end justify-end">
                            <Button
                                variant="outline"
                                className="w-full lg:w-auto h-10 rounded-xl border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-200 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                onClick={onClear}
                            >
                                ล้างตัวกรอง
                            </Button>
                        </div>
                    </div>

                    {/* Add Target Button Container */}
                    <div className="mt-5 flex justify-end border-t pt-5 border-border/50">
                        {canCreate ? (
                            <Link href="/sales-targets/create" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                                    <PlusCircle className="h-4 w-4" />
                                    เพิ่มเป้าหมาย
                                </Button>
                            </Link>
                        ) : (
                            <div className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto h-10 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm" variant="outline" disabled>
                                    <PlusCircle className="h-4 w-4" />
                                    เพิ่มเป้าหมาย
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
