import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { getEmployeesAction } from "@/modules/employee/server/actions";
import { PAGINATION } from "@/lib/constants";

export function useEmployeeList(canView: boolean) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

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

    return {
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
    };
}
