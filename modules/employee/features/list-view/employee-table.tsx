"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { Employee } from "../../types";
import { useEmployeeColumns } from "./use-employee-columns";
import { EmployeeCards } from "./employee-cards";

type EmployeeTableProps = {
    employees: Employee[];
    loading?: boolean;
    total?: number;
    page?: number;
    perPage?: number;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    onSearchSubmit?: () => void;
    dateRange?: { from?: Date; to?: Date };
    onDateRangeChange?: (range: { from?: Date; to?: Date } | undefined) => void;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canView?: boolean;
    onDelete?: (employee: Employee) => void;
};

export function EmployeeTable({
    employees,
    loading,
    total = 0,
    page = 1,
    perPage = 10,
    onPageChange,
    onPerPageChange,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    canCreate = false,
    canEdit = false,
    canDelete = false,
    canView = false,
    onDelete,
}: EmployeeTableProps) {
    const columns = useEmployeeColumns(
        (emp) => onDelete?.(emp),
        canDelete,
        canEdit,
        canView,
    );

    const toolbar = (
        <div className="space-y-4 mb-6">
            <TableToolbar
                searchPlaceholder="รหัสพนักงาน, ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์"
                searchValue={searchValue ?? ""}
                onSearchChange={onSearchChange ?? (() => { })}
                onSearchSubmit={onSearchSubmit}
            />
            <div className="flex justify-end">
                {canCreate ? (
                    <Link href="/employee/new" className="w-full sm:w-auto">
                        <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium">
                            <PlusCircle className="h-5 w-5" />
                            เพิ่มพนักงาน
                        </Button>
                    </Link>
                ) : (
                    <Button className="w-full sm:w-auto" variant="outline" disabled>
                        <PlusCircle className="h-5 w-5" />
                        เพิ่มพนักงาน
                    </Button>
                )}
            </div>
        </div>
    );

    const pagination = {
        page,
        perPage,
        total,
        onPageChange: onPageChange ?? (() => { }),
        onPerPageChange: onPerPageChange ?? (() => { }),
        perPageOptions: [10, 20, 30, 50],
    };

    return (
        <div className="space-y-6">
            <ResponsiveDataView
                breakpoint="xl"
                toolbar={toolbar}
                cards={
                    <EmployeeCards
                        data={employees}
                        loading={loading ?? false}
                        canDelete={canDelete}
                        canEdit={canEdit}
                        canView={canView}
                        onDeleteRequest={(emp) => onDelete?.(emp)}
                        pagination={pagination}
                    />
                }
                table={
                    <CustomTable
                        columns={columns}
                        data={employees}
                        loading={loading ?? false}
                        pagination={pagination}
                        toolbar={<></>}
                        emptyState={{
                            title: "ไม่พบข้อมูลพนักงาน",
                            description: "ลองปรับคำค้นหา หรือเพิ่มพนักงานใหม่",
                        }}
                        className="w-full"
                    />
                }
            />
        </div>
    );
}
