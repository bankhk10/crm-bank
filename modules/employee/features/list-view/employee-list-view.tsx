"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmployeeTable } from "./employee-table";
import { PageHeader } from "@/components/custom/page-header";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Users, Trash2 } from "lucide-react";
import { deleteEmployeeAction } from "@/modules/employee/server/actions";
import { toast } from "sonner";
import { useEmployeeList } from "./use-employee-list";

export default function EmployeeListView() {
    const router = useRouter();

    const { hasPermission, allowed, isLoading: checkingPermission } = usePermission("menu.employees");
    const canCreate = hasPermission("employee.create");
    const canEdit = hasPermission("employee.edit");
    const canDelete = hasPermission("employee.delete");
    const canView = (!checkingPermission && allowed) || hasPermission("employee.view");

    const {
        data,
        total,
        loading,
        error,
        isPending,
        page,
        perPage,
        filterDraft,
        setFilterDraft,
        handleApplyFilters,
        handleSearchSubmit,
    } = useEmployeeList(canView);

    const [deleteCandidate, setDeleteCandidate] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const handleDelete = async () => {
        if (!deleteCandidate) return;
        setActionLoading(true);
        try {
            const res = await deleteEmployeeAction(deleteCandidate.id);
            if (!res.success) throw new Error(res.error || "Delete failed");
            toast.success("ลบข้อมูลพนักงานเรียบร้อยแล้ว");
            setDeleteCandidate(null);
            router.refresh();
        } catch (error: any) {
            setError(error.message || String(error));
        } finally {
            setActionLoading(false);
        }
    };

    if (checkingPermission) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-slate-500">กำลังตรวจสอบสิทธิ์...</p>
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลพนักงาน</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <section className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <PageHeader
                        icon={Users}
                        iconClassName="text-blue-600"
                        title="ข้อมูลพนักงาน"
                    />

                    <EmployeeTable 
                        employees={data} 
                        loading={loading || isPending}
                        total={total}
                        page={page}
                        perPage={perPage}
                        onPageChange={(nextPage: number) => handleApplyFilters({ page: nextPage })}
                        onPerPageChange={(nextPerPage: number) => handleApplyFilters({ perPage: nextPerPage, page: 1 })}
                        searchValue={filterDraft.query}
                        onSearchChange={(value: string) => setFilterDraft(prev => ({ ...prev, query: value }))}
                        onSearchSubmit={handleSearchSubmit}
                        dateRange={filterDraft.dateRange}
                        onDateRangeChange={(range: any) => setFilterDraft(prev => ({ ...prev, dateRange: range }))}
                        canCreate={canCreate}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canView={canView}
                        onDelete={(emp) => setDeleteCandidate(emp)}
                    />
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog 
                open={Boolean(deleteCandidate)} 
                onOpenChange={(open) => {
                    if (!open) setDeleteCandidate(null);
                }}
            >
                <DialogContent className="sm:max-w-[420px] rounded-lg border-0 shadow-2xl">
                    <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> ลบพนักงาน
                    </DialogTitle>
                    <DialogDescription className="text-base text-slate-600">
                        คุณต้องการลบพนักงาน <b>{deleteCandidate?.name}</b> ใช่หรือไม่? <br />
                        การกระทำนี้ไม่สามารถย้อนกลับได้
                    </DialogDescription>
                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteCandidate(null)}
                            disabled={actionLoading}
                            className="rounded-full"
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={actionLoading}
                            className="rounded-full bg-red-600 hover:bg-red-700"
                        >
                            {actionLoading ? "กำลังลบ..." : "ยืนยันการลบ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
