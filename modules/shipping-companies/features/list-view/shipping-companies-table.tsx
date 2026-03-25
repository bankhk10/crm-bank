"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { PageHeader } from "@/components/custom/page-header";
import { useShippingCompanyColumns } from "./use-shipping-company-columns";
import { deleteShippingCompanyAction } from "../../server/actions";
import { Truck, PlusCircle } from "lucide-react";
import type { ShippingCompanyRecord } from "../../types";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const mkRangeKey = (r?: DateRange) =>
    r?.from?.toISOString() + "|" + r?.to?.toISOString();

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------
interface ShippingCompaniesTableProps {
    initialShippingCompanies: ShippingCompanyRecord[];
    total: number;
    initialPage: number;
    initialPerPage: number;
    initialQ: string;
    initialDateRange?: DateRange;
}

export function ShippingCompaniesTable({
    initialShippingCompanies,
    total,
    initialPage,
    initialPerPage,
    initialQ,
    initialDateRange,
}: ShippingCompaniesTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { hasPermission, allowed, isLoading } = usePermission("menu.shipping-companies");
    const canCreate =
        hasPermission("shipping-company.create") ||
        hasPermission("menu.shipping-companies");
    const canView = !isLoading && allowed;
    const canDelete = hasPermission("shipping-company.delete");

    const [filterDraft, setFilterDraft] = useState<{
        query: string;
        dateRange?: DateRange;
    }>({
        query: initialQ,
        dateRange: initialDateRange,
    });

    const [deleteCandidate, setDeleteCandidate] = useState<ShippingCompanyRecord | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Sync props → state on URL changes (e.g. back button)
    useEffect(() => {
        setFilterDraft({
            query: initialQ,
            dateRange: initialDateRange,
        });
    }, [initialQ, initialDateRange]);

    const isTyping =
        filterDraft.query !== initialQ ||
        mkRangeKey(filterDraft.dateRange) !== mkRangeKey(initialDateRange);

    // ───────── URL-based filter helpers ──────────
    const handleApplyFilters = React.useCallback(
        (newParams: { q?: string; page?: number; perPage?: number; from?: string; to?: string }) => {
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
        },
        [pathname, router, searchParams]
    );

    const handleSearchSubmit = React.useCallback(() => {
        handleApplyFilters({
            q: filterDraft.query,
            page: 1,
            from: filterDraft.dateRange?.from?.toISOString(),
            to: filterDraft.dateRange?.to?.toISOString(),
        });
    }, [filterDraft.query, filterDraft.dateRange, handleApplyFilters]);

    // Auto-apply filters (debounced)
    useEffect(() => {
        if (!isTyping) return;
        const id = setTimeout(() => handleSearchSubmit(), 500);
        return () => clearTimeout(id);
    }, [handleSearchSubmit, isTyping]);

    // ───────── Delete handler ──────────
    const handleDelete = async () => {
        if (!deleteCandidate) return;
        setActionLoading(true);
        try {
            const result = await deleteShippingCompanyAction(deleteCandidate.id);
            if (!result.success) throw new Error(result.error || "Delete failed");
            setDeleteCandidate(null);
        } catch (error) {
            const err = error as Error;
            setError(err.message || String(err));
        } finally {
            setActionLoading(false);
        }
    };

    const columns = useShippingCompanyColumns(setDeleteCandidate, canDelete);

    // ───────── Permission guard ──────────
    if (!canView) {
        return (
            <Alert variant="destructive">
                <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัทขนส่ง</AlertDescription>
            </Alert>
        );
    }

    // ───────── Render ──────────
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
                            คุณต้องการลบบริษัทขนส่ง <strong>{deleteCandidate.name}</strong>{" "}
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
                                {actionLoading ? "กำลังลบ..." : "ลบบริษัทขนส่ง"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    {/* ✅ PageHeader */}
                    <PageHeader
                        icon={Truck}
                        iconClassName="text-blue-600"
                        title="ข้อมูลบริษัทขนส่ง"
                    />

                    {/* ✅ CustomTable + TableToolbar */}
                    <CustomTable
                        data={initialShippingCompanies}
                        columns={columns}
                        loading={isPending}
                        pagination={{
                            page: initialPage,
                            perPage: initialPerPage,
                            total,
                            onPageChange: (nextPage) => handleApplyFilters({ page: nextPage }),
                            onPerPageChange: (nextPerPage) =>
                                handleApplyFilters({ perPage: nextPerPage, page: 1 }),
                            perPageOptions: [6, 12, 24],
                        }}
                        toolbar={
                            <div className="space-y-4 mb-6">
                                <TableToolbar
                                    searchPlaceholder="ค้นหาชื่อบริษัทขนส่ง"
                                    searchValue={filterDraft.query}
                                    onSearchChange={(val) =>
                                        setFilterDraft((prev) => ({ ...prev, query: val }))
                                    }
                                    onSearchSubmit={handleSearchSubmit}
                                />
                                {canCreate && (
                                    <div className="flex justify-end">
                                        <Button asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                                            <Link href="/shipping-companies/new">
                                                <PlusCircle className="h-5 w-5" />
                                                เพิ่มบริษัทขนส่ง
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        }
                        emptyState={{
                            title: "ไม่พบข้อมูลบริษัทขนส่ง",
                            description: "ลองปรับคำค้นหา หรือเพิ่มบริษัทขนส่งใหม่",
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
