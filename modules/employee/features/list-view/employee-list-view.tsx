"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
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
import { getEmployeesAction, deleteEmployeeAction } from "@/modules/employee/server/actions";
import { toast } from "sonner";
import { PAGINATION } from "@/lib/constants";

export default function EmployeeListView() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { hasPermission, allowed, isLoading: checkingPermission } = usePermission("menu.employees");
    const canCreate = hasPermission("employee.create");
    const canEdit = hasPermission("employee.edit");
    const canDelete = hasPermission("employee.delete");
    const canView = (!checkingPermission && allowed) || hasPermission("employee.view");

    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const [page, setPage] = useState<number>(() => {
        const p = searchParams.get("page");
        return p ? Math.max(1, parseInt(p)) : PAGINATION.DEFAULT_PAGE;
    });
    
    const [perPage, setPerPage] = useState<number>(() => {
        const pp = searchParams.get("perPage");
        return pp ? Math.max(1, parseInt(pp)) : PAGINATION.DEFAULT_PER_PAGE;
    });

    const [filterDraft, setFilterDraft] = useState<{
        query: string;
        dateRange?: DateRange;
    }>(() => {
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        return {
            query: searchParams.get("q") || "",
            dateRange: from || to ? { 
                from: from ? new Date(from) : undefined, 
                to: to ? new Date(to) : undefined 
            } : undefined,
        };
    });

    const [appliedFilters, setAppliedFilters] = useState(filterDraft);
    const [deleteCandidate, setDeleteCandidate] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Sync state with URL if it changes from outside
    useEffect(() => {
        const q = searchParams.get("q") || "";
        const p = searchParams.get("page");
        const pp = searchParams.get("perPage");
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        setFilterDraft({
            query: q,
            dateRange: from || to ? { 
                from: from ? new Date(from) : undefined, 
                to: to ? new Date(to) : undefined 
            } : undefined,
        });
        setAppliedFilters({
            query: q,
            dateRange: from || to ? { 
                from: from ? new Date(from) : undefined, 
                to: to ? new Date(to) : undefined 
            } : undefined,
        });
        if (p) setPage(Math.max(1, parseInt(p)));
        if (pp) setPerPage(Math.max(1, parseInt(pp)));
    }, [searchParams]);

    const handleApplyFilters = useCallback((newParams: { q?: string; page?: number; perPage?: number; from?: string; to?: string }) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newParams.q !== undefined) {
            if (newParams.q) params.set("q", newParams.q);
            else params.delete("q");
        }

        if (newParams.page !== undefined) params.set("page", String(newParams.page));
        if (newParams.perPage !== undefined) params.set("perPage", String(newParams.perPage));

        if (newParams.from !== undefined) {
            if (newParams.from) params.set("from", newParams.from);
            else params.delete("from");
        }

        if (newParams.to !== undefined) {
            if (newParams.to) params.set("to", newParams.to);
            else params.delete("to");
        }

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }, [pathname, router, searchParams]);

    const handleSearchSubmit = useCallback(() => {
        handleApplyFilters({
            q: filterDraft.query,
            page: 1,
            from: filterDraft.dateRange?.from?.toISOString(),
            to: filterDraft.dateRange?.to?.toISOString(),
        });
    }, [filterDraft, handleApplyFilters]);

    // Debounce search
    useEffect(() => {
        const isTyping = filterDraft.query !== appliedFilters.query || 
                         filterDraft.dateRange?.from?.toISOString() !== appliedFilters.dateRange?.from?.toISOString() ||
                         filterDraft.dateRange?.to?.toISOString() !== appliedFilters.dateRange?.to?.toISOString();
        
        if (!isTyping) return;

        const delay = 500;
        const id = setTimeout(() => {
            handleSearchSubmit();
        }, delay);
        return () => clearTimeout(id);
    }, [filterDraft, appliedFilters, handleSearchSubmit]);

    // Data fetching
    useEffect(() => {
        if (!canView) return;

        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const res = await getEmployeesAction({
                    page,
                    perPage,
                    q: appliedFilters.query,
                    from: appliedFilters.dateRange?.from,
                    to: appliedFilters.dateRange?.to,
                });
                if (mounted) {
                    if (res.success) {
                        setData(res.employees);
                        setTotal(res.total || 0);
                    } else {
                        setError((res as any).error || "Failed to fetch employees");
                    }
                }
            } catch (err: any) {
                if (mounted) setError(err.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [page, perPage, appliedFilters, canView]);

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
