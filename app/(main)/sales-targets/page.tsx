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

  // Sync Filters from URL
  useEffect(() => {
    setYear(queryFilters.year);
    setMonthFilter(queryFilters.month);
    setEmployeeFilter(queryFilters.employeeId);
    setShopFilter(queryFilters.shopId);
  }, [queryFilters]);

  // Sync URL from Filters
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("year", year.toString());
    if (monthFilter !== "all") {
      params.set("month", monthFilter.toString());
    }
    if (employeeFilter) {
      params.set("employeeId", employeeFilter);
    }
    if (shopFilter) {
      params.set("shopId", shopFilter);
    }
    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(`/sales-targets?${nextQuery}`, { scroll: false });
    }
  }, [employeeFilter, monthFilter, router, searchParams, shopFilter, year]);

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
    setYear(CURRENT_YEAR);
    setMonthFilter("all");
    setEmployeeFilter("");
    setShopFilter("");
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
            onChangeYear={setYear}
            onChangeMonth={setMonthFilter}
            onChangeEmployee={setEmployeeFilter}
            onChangeShop={setShopFilter}
            onClear={handleClearFilters}
          />
        </div>
      </div>
    </div>
  );
}
