"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CompaniesTable } from "./companies-table";
import { PageHeader } from "@/components/custom/page-header";
import { Building2 } from "lucide-react";
import type { CompanyRecord } from "@/modules/companies/types/types";
import { deleteCompanyAction, findCompaniesAction } from "@/modules/companies/server/actions";
import { toast } from "sonner";
import { PAGINATION } from "@/lib/constants";

export default function CompaniesListView() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { hasPermission, allowed, isLoading: checkingPermission } = usePermission("menu.companies");
    const canCreate = hasPermission("company.create");
    const canEdit = hasPermission("company.edit");
    const canView = (!checkingPermission && allowed) && hasPermission("company.view");

    const [data, setData] = useState<CompanyRecord[]>([]);
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
        return pp ? Math.max(1, parseInt(pp)) : 12; // Companies often use 12 for grid
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
    const [deleteCandidate, setDeleteCandidate] = useState<CompanyRecord | null>(null);
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
                const res = await findCompaniesAction({
                    page,
                    perPage,
                    q: appliedFilters.query,
                    from: appliedFilters.dateRange?.from,
                    to: appliedFilters.dateRange?.to,
                });
                if (mounted) {
                    if (res.success) {
                        setData(res.companies as CompanyRecord[]);
                        setTotal(res.total);
                    } else {
                        setError(res.error || "Failed to fetch companies");
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
            const res = await deleteCompanyAction(deleteCandidate.id);
            if (!res.success) throw new Error(res.error || "Delete failed");
            toast.success("ลบข้อมูลบริษัทเรียบร้อยแล้ว");
            setDeleteCandidate(null);
            router.refresh(); // Refresh to update list
        } catch (error: any) {
            setError(error.message || String(error));
        } finally {
            setActionLoading(false);
        }
    };

    if (checkingPermission) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500">กำลังตรวจสอบสิทธิ์...</p>
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัท</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <section className="space-y-6 pb-24 md:pb-8">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {deleteCandidate && (
                <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center">
                    <div
                        className="bg-black/50 absolute inset-0 text-white"
                        onClick={() => setDeleteCandidate(null)}
                    />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-semibold">ยืนยันการลบ</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            คุณต้องการลบบริษัท <strong>{deleteCandidate.name}</strong>{" "}
                            ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                        </p>
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDeleteCandidate(null)}>
                                ยกเลิก
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "กำลังลบ..." : "ลบบริษัท"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <PageHeader
                        icon={Building2}
                        iconClassName="text-blue-600"
                        title="ข้อมูลบริษัท"
                    />
                    <div className="space-y-6">
                        <CompaniesTable
                            data={data}
                            loading={loading || isPending}
                            canCreate={canCreate}
                            canEdit={canEdit}
                            canDelete={hasPermission("company.delete")}
                            onDeleteRequest={setDeleteCandidate}
                            searchValue={filterDraft.query}
                            onSearchChange={(value) =>
                                setFilterDraft((prev) => ({ ...prev, query: value }))
                            }
                            isTyping={filterDraft.query !== appliedFilters.query}
                            onSearchSubmit={handleSearchSubmit}
                            dateRange={filterDraft.dateRange}
                            onDateRangeChange={(range) =>
                                setFilterDraft((prev) => ({
                                    ...prev,
                                    dateRange: range ?? undefined,
                                }))
                            }
                            pagination={{
                                page,
                                perPage,
                                total,
                                onPageChange: (nextPage) => handleApplyFilters({ page: nextPage }),
                                onPerPageChange: (nextPerPage) => handleApplyFilters({ perPage: nextPerPage, page: 1 }),
                                perPageOptions: [6, 12, 24, 48],
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
