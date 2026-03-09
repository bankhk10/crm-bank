"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2, PlusCircle } from "lucide-react";

import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { usePermission } from "@/hooks/use-permission";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { DetailedTarget } from "../../types";
import { useSalesTargetColumns } from "./use-sales-target-columns";
import { SalesTargetCards } from "./sales-target-cards";
import { MONTHS } from "../../constants";

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------
interface SalesTargetTableProps {
    targets: DetailedTarget[];
    onView: (target: DetailedTarget) => void;
    onDelete: (id: string) => void;
    onCopy: (target: DetailedTarget) => void;

    // Filters
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

export function SalesTargetTable({
    targets,
    onView,
    onDelete,
    onCopy,
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
}: SalesTargetTableProps) {
    const { allowed, isLoading, hasPermission } = usePermission("menu.sales_targets");

    const canEdit =
        hasPermission("sales_target.manage") || hasPermission("sales_target.edit");
    const canDelete =
        hasPermission("sales_target.manage") || hasPermission("sales_target.delete");
    const canView =
        hasPermission("menu.sales_targets") || hasPermission("sales_target.view");
    const canCreate = !isLoading && (hasPermission("sales_target.manage") || hasPermission("sales_target.create"));

    // -------------------------------------------------------------------------
    // Local state
    // -------------------------------------------------------------------------
    const [currentPage, setCurrentPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

    // Filter
    const filteredData = React.useMemo(() => {
        // Here we just use targets directly, as the actual filtering is done server-side 
        // using year, month, employeeId, shopId. We previously had a local search box,
        // but now the filters handle it all.
        return targets;
    }, [targets]);

    // Pagination
    const totalItems = filteredData.length;
    const paginatedData = React.useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage, perPage]);

    // Reset page when targets change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [targets]);

    const paginationInfo = {
        page: currentPage,
        perPage,
        total: totalItems,
        onPageChange: setCurrentPage,
        onPerPageChange: (n: number) => {
            setPerPage(n);
            setCurrentPage(1);
        },
        perPageOptions: [5, 10, 20, 50],
    };

    const columns = useSalesTargetColumns(
        onView,
        onCopy,
        (id) => setDeleteTargetId(id),
        canDelete,
        canEdit,
        canView,
    );

    // -------------------------------------------------------------------------
    // Guard: loading / no permission
    // -------------------------------------------------------------------------
    if (isLoading)
        return (
            <div className="p-8 text-center text-slate-500">กรุณารอสักครู่...</div>
        );

    if (!allowed) {
        return (
            <Card className="p-8 text-center">
                <div className="text-red-600 font-semibold text-lg">
                    คุณไม่มีสิทธิ์เข้าถึงหน้านี้
                </div>
            </Card>
        );
    }

    const toolbar = (
        <div className="space-y-4">
            <TableToolbar
                showSearch={false}
                actionPosition="bottom"
                filters={
                    <div className="flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-row gap-4 items-end w-full">
                        <div className="w-full lg:w-32">
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
                        <div className="w-full lg:w-40">
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
                        <div className="w-full lg:flex-1">
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
                        <div className="w-full lg:flex-1">
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
                        <div className="w-full lg:w-auto">
                            <Button
                                variant="outline"
                                className="w-full lg:w-28 h-10 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-200 px-2"
                                onClick={onClear}
                            >
                                ล้างตัวกรอง
                            </Button>
                        </div>
                    </div>
                }
            />
            <div className="flex justify-end">
                {canCreate ? (
                    <Link href="/sales-targets/create" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:translate-y-[-1px]">
                            <span className="inline-flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" />
                                เพิ่มเป้าหมาย
                            </span>
                        </Button>
                    </Link>
                ) : (
                    <div className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto h-10 gap-2" variant="outline" disabled>
                            <PlusCircle className="h-4 w-4" />
                            เพิ่มเป้าหมาย
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <ResponsiveDataView
                breakpoint="xl"
                toolbar={toolbar}
                cards={
                    <SalesTargetCards
                        data={paginatedData}
                        loading={false}
                        canDelete={canDelete}
                        canEdit={canEdit}
                        canView={canView}
                        onView={onView}
                        onCopy={onCopy}
                        onDelete={(id) => setDeleteTargetId(id)}
                        pagination={paginationInfo}
                    />
                }
                table={
                    <CustomTable
                        columns={columns}
                        data={paginatedData}
                        loading={false}
                        pagination={paginationInfo}
                        toolbar={<></>}
                        emptyState={{
                            title: "ไม่พบข้อมูลเป้าหมาย",
                            description: "ลองปรับตัวกรอง หรือเพิ่มเป้าหมายใหม่",
                        }}
                        className="w-full"
                    />
                }
            />

            {/* Delete Confirm Dialog */}
            <Dialog
                open={Boolean(deleteTargetId)}
                onOpenChange={(open) => {
                    if (!open) setDeleteTargetId(null);
                }}
            >
                <DialogContent className="sm:max-w-[420px] rounded-lg border-0 shadow-2xl">
                    <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> ลบเป้าหมาย
                    </DialogTitle>
                    <DialogDescription className="text-base text-slate-600">
                        คุณต้องการลบเป้าหมายรายการนี้ใช่หรือไม่ ?
                    </DialogDescription>
                    <DialogFooter className="mt-6 gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTargetId(null)}
                            className="rounded-full"
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteTargetId) {
                                    onDelete(deleteTargetId);
                                    setDeleteTargetId(null);
                                }
                            }}
                            className="rounded-full bg-red-600 hover:bg-red-700"
                        >
                            ยืนยันการลบ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
