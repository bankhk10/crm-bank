"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CompaniesTable } from "./companies-table";
import { Building2 } from "lucide-react";
import type { CompanyRecord } from "@/modules/companies/types/types";
import { deleteCompanyAction } from "@/modules/companies/server/actions";

// Helper to convert DateRange to string key for comparison
const mkRangeKey = (r?: DateRange) =>
    r?.from?.toISOString() + "|" + r?.to?.toISOString();

interface CompaniesViewProps {
    initialCompanies: CompanyRecord[];
    total: number;
    initialPage: number;
    initialPerPage: number;
    initialQ: string;
    initialDateRange?: DateRange;
}

export function CompaniesView({
    initialCompanies,
    total,
    initialPage,
    initialPerPage,
    initialQ,
    initialDateRange,
}: CompaniesViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams(); // To read current params if needed (mostly redundant with props from server)

    const { hasPermission, allowed, isLoading } = usePermission("menu.companies");
    const canCreate = hasPermission("company.create");
    const canEdit = hasPermission("company.edit");
    const canView = (!isLoading && allowed) && hasPermission("company.view");

    // Local state for UI responsiveness (optimistic updates/debounced inputs)
    const [filterDraft, setFilterDraft] = useState<{
        query: string;
        dateRange?: DateRange;
    }>({
        query: initialQ,
        dateRange: initialDateRange,
    });

    const [deleteCandidate, setDeleteCandidate] = useState<CompanyRecord | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Sync props to state if needed (when URL changes from outside, e.g. back button)
    useEffect(() => {
        setFilterDraft({
            query: initialQ,
            dateRange: initialDateRange,
        });
    }, [initialQ, initialDateRange]);

    const isTyping =
        filterDraft.query !== initialQ ||
        mkRangeKey(filterDraft.dateRange) !== mkRangeKey(initialDateRange);

    const handleApplyFilters = (newParams: { q?: string; page?: number; perPage?: number; from?: string; to?: string }) => {
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
    };

    const handleSearchSubmit = () => {
        handleApplyFilters({
            q: filterDraft.query,
            page: 1, // Reset page on search
            from: filterDraft.dateRange?.from?.toISOString(),
            to: filterDraft.dateRange?.to?.toISOString(),
        });
    };

    const handleDelete = async () => {
        if (!deleteCandidate) return;
        setActionLoading(true);
        try {
            const res = await deleteCompanyAction(deleteCandidate.id);
            if (!res.success) throw new Error(res.error || "Delete failed");

            // Refresh data doesn't manually need router.refresh() if revalidatePath is used, but it's safe.
            setDeleteCandidate(null);
        } catch (error) {
            const err = error as Error;
            setError(err.message || String(err));
        } finally {
            setActionLoading(false);
        }
    };

    if (!canView) {
        return (
            <Alert variant="destructive">
                <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัท</AlertDescription>
            </Alert>
        );
    }

    return (
        <section className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Delete confirm dialog */}
            {deleteCandidate && (
                <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center">
                    <div
                        className="bg-black/50 absolute inset-0"
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
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-9 h-9 text-blue-600" />
                            <h1 className="text-3xl font-bold tracking-tight">
                                ข้อมูลบริษัท
                            </h1>
                        </div>
                    </div>

                    <CompaniesTable
                        data={initialCompanies}
                        loading={isPending} // Show loading state during transition
                        canCreate={canCreate}
                        canEdit={canEdit}
                        canDelete={hasPermission("company.delete")}
                        onDeleteRequest={setDeleteCandidate}
                        searchValue={filterDraft.query}
                        onSearchChange={(value) =>
                            setFilterDraft((prev) => ({ ...prev, query: value }))
                        }
                        isTyping={isTyping}
                        onSearchSubmit={handleSearchSubmit}
                        dateRange={filterDraft.dateRange}
                        onDateRangeChange={(range) =>
                            setFilterDraft((prev) => ({
                                ...prev,
                                dateRange: range ?? undefined,
                            }))
                        }
                        pagination={{
                            page: initialPage,
                            perPage: initialPerPage,
                            total,
                            onPageChange: (nextPage) => handleApplyFilters({ page: nextPage }),
                            onPerPageChange: (nextPerPage) => handleApplyFilters({ perPage: nextPerPage, page: 1 }),
                            perPageOptions: [6, 12, 24, 48],
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
