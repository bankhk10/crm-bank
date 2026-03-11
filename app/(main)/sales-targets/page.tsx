"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Target } from "lucide-react";
import { toast } from "sonner";

// Feature Imports
import {
  SalesTargetTable,
  CURRENT_YEAR,
  YEARS,
} from "@/modules/sales-targets";
import { PageHeader } from "@/components/custom/page-header";
import {
  getSalesTargetsAction,
  deleteSalesTargetAction,
  getAvailableYearsAction,
} from "@/modules/sales-targets/server/actions";
import { DetailedTarget } from "@/modules/sales-targets";

export default function SalesTargetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL State & Filters
  const queryFilters = useMemo(() => {
    const yearParam = Number(searchParams.get("year") || CURRENT_YEAR);
    const monthParam = searchParams.get("month");
    const parsedMonth =
      monthParam && monthParam !== "all" ? Number(monthParam) : "all";

    return {
      year: Number.isNaN(yearParam) ? CURRENT_YEAR : yearParam,
      month:
        parsedMonth === "all" || Number.isNaN(parsedMonth as number)
          ? "all"
          : (parsedMonth as number | "all"),
      employeeId: searchParams.get("employeeId") || "",
      shopId: searchParams.get("shopId") || "",
    };
  }, [searchParams]);

  const [year, setYear] = useState(queryFilters.year);
  const [monthFilter, setMonthFilter] = useState<number | "all">(
    queryFilters.month,
  );
  const [employeeFilter, setEmployeeFilter] = useState(queryFilters.employeeId);
  const [shopFilter, setShopFilter] = useState(queryFilters.shopId);

  // Sync state from queryFilters if they change from navigation
  useEffect(() => {
    setYear(queryFilters.year);
    setMonthFilter(queryFilters.month);
    setEmployeeFilter(queryFilters.employeeId);
    setShopFilter(queryFilters.shopId);
  }, [queryFilters]);

  // Use a helper to update state and URL together
  const updateFilter = (updates: {
    year?: number;
    month?: number | "all";
    employeeId?: string;
    shopId?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.year !== undefined) {
      setYear(updates.year);
      params.set("year", updates.year.toString());
    }
    if (updates.month !== undefined) {
      setMonthFilter(updates.month);
      if (updates.month === "all") params.delete("month");
      else params.set("month", updates.month.toString());
    }
    if (updates.employeeId !== undefined) {
      setEmployeeFilter(updates.employeeId);
      if (updates.employeeId) params.set("employeeId", updates.employeeId);
      else params.delete("employeeId");
    }
    if (updates.shopId !== undefined) {
      setShopFilter(updates.shopId);
      if (updates.shopId) params.set("shopId", updates.shopId);
      else params.delete("shopId");
    }

    router.replace(`/sales-targets?${params.toString()}`, { scroll: false });
  };

  // Data States
  const [loading, setLoading] = useState(true);
  const [detailedTargets, setDetailedTargets] = useState<DetailedTarget[]>([]);

  // Local UI State

  // Filter Options State
  const [filterEmployees, setFilterEmployees] = useState<any[]>([]);
  const [filterCustomers, setFilterCustomers] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>(YEARS);

  // --- Fetch Data via Server Action ---
  const fetchTargets = async (filters: {
    year: number;
    month: number | "all";
    employeeId?: string;
    shopId?: string;
  }) => {
    setLoading(true);
    try {
      const result = await getSalesTargetsAction({
        year: filters.year,
        month: filters.month !== "all" ? filters.month : undefined,
        employeeId: filters.employeeId || undefined,
        shopId: filters.shopId || undefined,
      });

      if (result.success) {
        setDetailedTargets((result.detailedTargets as DetailedTarget[]) || []);
      } else {
        toast.error("ไม่สามารถโหลดข้อมูลเป้าหมายได้");
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
      toast.error("ไม่สามารถโหลดข้อมูลเป้าหมายได้");
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---

  // (URL sync effects removed to prevent navigation loop cancelling Server Actions)

  // Load Filter Options (Employees, Customers)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { getEmployeesAction } = await import("@/modules/employee/server/actions");
        const empRes = await getEmployeesAction();
        const custRes = await fetch("/api/customers?perPage=100");

        if (empRes.success) {
          setFilterEmployees(empRes.employees || []);
        }
        if (custRes.ok) {
          const data = await custRes.json();
          setFilterCustomers(data.customers || data);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchOptions();
  }, []);

  // Load Available Years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const result = await getAvailableYearsAction();
        if (result.success && result.years) {
          setAvailableYears(result.years);
        }
      } catch (error) {
        console.error("Error fetching available years:", error);
      }
    };
    fetchYears();
  }, []);

  // Fetch Data
  useEffect(() => {
    fetchTargets({
      year,
      month: monthFilter,
      employeeId: employeeFilter,
      shopId: shopFilter,
    });
  }, [year, monthFilter, employeeFilter, shopFilter]);

  // --- Handlers ---

  const handleClearFilters = () => {
    updateFilter({
      year: CURRENT_YEAR,
      month: "all",
      employeeId: "",
      shopId: "",
    });
  };

  const handleCopy = (target: DetailedTarget) => {
    router.push(`/sales-targets/copy?from=${target.id}`);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteSalesTargetAction(id);
    if (result.success) {
      toast.success("ลบข้อมูลสำเร็จ");
      fetchTargets({
        year,
        month: monthFilter,
        employeeId: employeeFilter,
        shopId: shopFilter,
      });
    } else {
      toast.error(result.error || "ไม่สามารถลบข้อมูลได้");
    }
  };

  // We now handle loading inside the table component to avoid full-page flicker

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 space-y-6 rounded-xl border border-gray-200">
      <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <PageHeader
          icon={Target}
          iconClassName="text-blue-600"
          title="ข้อมูลเป้าหมาย"
        />

        {/* Content */}
        <div className="space-y-6">
          <SalesTargetTable
            targets={detailedTargets}
            onView={(target) => {
              router.push(`/sales-targets/${target.id}`);
            }}
            onCopy={handleCopy}
            onDelete={handleDelete}
            loading={loading}
            year={year}
            month={monthFilter}
            employeeId={employeeFilter}
            shopId={shopFilter}
            years={availableYears}
            employees={filterEmployees}
            customers={filterCustomers}
            onChangeYear={(y) => updateFilter({ year: y })}
            onChangeMonth={(m) => updateFilter({ month: m })}
            onChangeEmployee={(e) => updateFilter({ employeeId: e })}
            onChangeShop={(s) => updateFilter({ shopId: s })}
            onClear={handleClearFilters}
          />
        </div>
      </div>
    </div>
  );
}
