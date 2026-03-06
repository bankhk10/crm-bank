"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomTable from "@/components/custom/custom-table";
import { useShippingCompanyColumns } from "./use-shipping-company-columns";
import { deleteShippingCompanyAction } from "../../server/actions";
import { Truck, Search, PlusCircle } from "lucide-react";
import type { ShippingCompanyRecord } from "../../types";

// Helper to convert DateRange to string key for comparison
const mkRangeKey = (r?: DateRange) =>
    r?.from?.toISOString() + "|" + r?.to?.toISOString();

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------
function ShippingCompanyToolbar({
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
}: {
    canCreate: boolean;
    searchValue: string;
    onSearchChange: (val: string) => void;
    onSearchSubmit: () => void;
}) {
    return (
        <div className="rounded-md border bg-background/60 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative w-full sm:max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="ค้นหาชื่อบริษัทขนส่ง"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onSearchSubmit();
                        }
                    }}
                    className="pl-9 bg-white"
                />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 ml-auto">
                {canCreate && (
                    <Button asChild className="bg-orange-600 hover:bg-orange-700">
                        <Link href="/shipping-companies/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            เพิ่มบริษัทขนส่ง
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

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
        hasPermission("shipping-company.manage") ||
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

    // Sync props to state if needed
    useEffect(() => {
        setFilterDraft({
            query: initialQ,
            dateRange: initialDateRange,
        });
    }, [initialQ, initialDateRange]);

    const isTyping =
        filterDraft.query !== initialQ ||
        mkRangeKey(filterDraft.dateRange) !== mkRangeKey(initialDateRange);

    const handleApplyFilters = React.useCallback((newParams: { q?: string; page?: number; perPage?: number; from?: string; to?: string }) => {
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

    const handleSearchSubmit = React.useCallback(() => {
        handleApplyFilters({
            q: filterDraft.query,
            page: 1,
            from: filterDraft.dateRange?.from?.toISOString(),
            to: filterDraft.dateRange?.to?.toISOString(),
        });
    }, [filterDraft.query, filterDraft.dateRange, handleApplyFilters]);

    // auto-apply filters (debounced)
    useEffect(() => {
        const delay = 500;

        // Skip if nothing changed from current URL params
        if (!isTyping) {
            return;
        }

        const id = setTimeout(() => {
            handleSearchSubmit();
        }, delay);

        return () => clearTimeout(id);
    }, [handleSearchSubmit, isTyping]);

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

    if (!canView) {
        return (
            <Alert variant="destructive">
                <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัทขนส่ง</AlertDescription>
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
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-3">
                            <Truck className="w-9 h-9 text-orange-600" />
                            <h1 className="text-3xl font-bold tracking-tight">
                                ข้อมูลบริษัทขนส่ง
                            </h1>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <CustomTable
                            data={initialShippingCompanies}
                            columns={columns}
                            loading={isPending}
                            pagination={{
                                page: initialPage,
                                perPage: initialPerPage,
                                total,
                                onPageChange: (nextPage) => handleApplyFilters({ page: nextPage }),
                                onPerPageChange: (nextPerPage) => handleApplyFilters({ perPage: nextPerPage, page: 1 }),
                                perPageOptions: [6, 12, 24, 48],
                            }}
                            toolbar={
                                <ShippingCompanyToolbar
                                    canCreate={canCreate}
                                    searchValue={filterDraft.query}
                                    onSearchChange={(val) =>
                                        setFilterDraft((prev) => ({ ...prev, query: val }))
                                    }
                                    onSearchSubmit={handleSearchSubmit}
                                />
                            }
                            emptyState={{
                                title: "ไม่พบข้อมูลบริษัทขนส่ง",
                                description: "ลองปรับคำค้นหา หรือเพิ่มบริษัทขนส่งใหม่",
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
