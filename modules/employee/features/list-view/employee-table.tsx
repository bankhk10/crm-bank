"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { usePermission } from "@/hooks/use-permission";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { useClientSearch } from "@/hooks/use-client-search";
import { Employee } from "../../types";
import { useEmployeeColumns } from "./use-employee-columns";
import { EmployeeCards } from "./employee-cards";
import {
    deleteEmployeeAction,
    getEmployeesAction,
} from "../../server/actions";

type EmployeesGridProps = {
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
    dateRange,
    onDateRangeChange,
}: EmployeesGridProps) {
    const router = useRouter();
    const { allowed, isLoading, hasPermission } = usePermission("menu.employees");
    const canCreate = !isLoading && hasPermission("employee.create");
    const canEdit = !isLoading && hasPermission("employee.edit");
    const canDelete = !isLoading && hasPermission("employee.delete");
    const canView =
        hasPermission("menu.employees") || hasPermission("employee.view");

    const [deleteTarget, setDeleteTarget] = React.useState<Employee | null>(null);

    // Handle Delete
    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await deleteEmployeeAction(deleteTarget.id);
            if (res.success) {
                setDeleteTarget(null);
                router.refresh();
            } else {
                console.error("Failed to delete", res.error);
            }
        } catch (err) {
            console.error(err);
            setDeleteTarget(null);
        }
    };

    const columns = useEmployeeColumns(
        (emp) => setDeleteTarget(emp),
        canDelete,
        canEdit,
        canView,
    );

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
        <div className="space-y-4 mb-6">
            <TableToolbar
                searchPlaceholder="รหัสพนักงาน, ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์"
                searchValue={searchValue ?? ""}
                onSearchChange={onSearchChange ?? (() => {})}
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
        onPageChange: onPageChange ?? (() => {}),
        onPerPageChange: onPerPageChange ?? (() => {}),
        perPageOptions: [5, 10, 20, 50],
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
                        onDeleteRequest={(emp) => setDeleteTarget(emp)}
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

            {/* Delete Dialog */}
            <Dialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <DialogContent className="sm:max-w-[420px] rounded-lg border-0 shadow-2xl">
                    <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> ลบพนักงาน
                    </DialogTitle>
                    <DialogDescription className="text-base text-slate-600">
                        คุณต้องการลบพนักงาน <b>{deleteTarget?.name}</b> ใช่หรือไม่? <br />
                        การกระทำนี้ไม่สามารถย้อนกลับได้
                    </DialogDescription>
                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            className="rounded-full"
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
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
