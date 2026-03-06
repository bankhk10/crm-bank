"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

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
import { DetailedTarget } from "../../types";
import { useSalesTargetColumns } from "./use-sales-target-columns";
import { SalesTargetCards } from "./sales-target-cards";

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------
interface SalesTargetTableProps {
    targets: DetailedTarget[];
    onView: (target: DetailedTarget) => void;
    onDelete: (id: string) => void;
    onCopy: (target: DetailedTarget) => void;
}

export function SalesTargetTable({
    targets,
    onView,
    onDelete,
    onCopy,
}: SalesTargetTableProps) {
    const { allowed, isLoading, hasPermission } = usePermission("menu.sales_targets");

    const canEdit =
        hasPermission("sales_target.manage") || hasPermission("sales_target.edit");
    const canDelete =
        hasPermission("sales_target.manage") || hasPermission("sales_target.delete");
    const canView =
        hasPermission("menu.sales_targets") || hasPermission("sales_target.view");

    // -------------------------------------------------------------------------
    // Local state
    // -------------------------------------------------------------------------
    const [query, setQuery] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

    // Filter
    const filteredData = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return targets;
        return targets.filter((t) =>
            [
                t.employee?.name,
                t.employee?.employeeCode,
                ...(t.stores?.flatMap((s) => [
                    s.customer?.name,
                    s.customer?.customerCode,
                ]) ?? []),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q),
        );
    }, [targets, query]);

    // Pagination
    const totalItems = filteredData.length;
    const paginatedData = React.useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage, perPage]);

    // Reset page when filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [query, targets]);

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
        <TableToolbar
            searchPlaceholder="ค้นหาพนักงาน หรือชื่อร้านค้าส่วนตัว..."
            searchValue={query}
            onSearchChange={(v) => {
                setQuery(v);
                setCurrentPage(1);
            }}
            actions={null}
        />
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
                        คุณต้องการลบเป้าหมายรายการนี้ใช่หรือไม่? <br />
                        การกระทำนี้ไม่สามารถย้อนกลับได้
                    </DialogDescription>
                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
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
