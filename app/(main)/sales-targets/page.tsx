"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Target, ChevronLeft, Loader2 } from "lucide-react";
import NextLink from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Feature Imports
import {
  SalesTargetDetailDialog,
  YearlyTargetCard,
  SalesTargetTable,
  SalesTargetFilters,
  CURRENT_YEAR,
  YEARS,
} from "@/modules/sales-targets";
import {
  getSalesTargetsAction,
  deleteSalesTargetAction,
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
  const [monthlyTargets, setMonthlyTargets] = useState<
    Record<number | string, number>
  >({});
  const [detailedTargets, setDetailedTargets] = useState<DetailedTarget[]>([]);

  // Local UI State
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [viewingTarget, setViewingTarget] = useState<DetailedTarget | null>(
    null,
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [deletingTargetId, setDeletingTargetId] = useState<string | null>(null);

  // Filter Options State
  const [filterEmployees, setFilterEmployees] = useState<any[]>([]);
  const [filterCustomers, setFilterCustomers] = useState<any[]>([]);



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
        // Process monthly targets
        const monthlyMap: Record<number | string, number> = {};
        if (result.monthlyTargets) {
          (result.monthlyTargets as any[]).forEach(
            (t: { month: number | null; targetAmount: string }) => {
              if (t.month !== null) {
                monthlyMap[t.month] = Number(t.targetAmount);
              }
            },
          );
        }
        setMonthlyTargets(monthlyMap);
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

  const handleDelete = async () => {
    if (!deletingTargetId) return;
    const result = await deleteSalesTargetAction(deletingTargetId);
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
    setDeletingTargetId(null);
  };

  const calculateMonthlyTotal = () => {
    if (detailedTargets.length > 0) {
      return detailedTargets.reduce((sum, target) => {
        return (
          sum +
          (target.items?.reduce(
            (s: number, i: any) => s + Number(i.amount),
            0,
          ) || 0)
        );
      }, 0);
    }
    return Object.values(monthlyTargets).reduce(
      (sum, val) => sum + (val || 0),
      0,
    );
  };

  if (loading && !detailedTargets.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <NextLink
              href="/dashboard/admin"
              className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm border border-slate-200/60 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </NextLink>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                ตั้งเป้าหมายยอดขาย
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <SalesTargetFilters
        year={year}
        month={monthFilter}
        employeeId={employeeFilter}
        shopId={shopFilter}
        years={YEARS}
        employees={filterEmployees}
        customers={filterCustomers}
        onChangeYear={setYear}
        onChangeMonth={setMonthFilter}
        onChangeEmployee={setEmployeeFilter}
        onChangeShop={setShopFilter}
        onClear={handleClearFilters}
      />

      {/* Content */}
      <div className="space-y-6">
        <YearlyTargetCard year={year} totalTarget={calculateMonthlyTotal()} />
        <SalesTargetTable
          targets={detailedTargets}
          onView={(target) => {
            setViewingTarget(target);
            setIsDetailDialogOpen(true);
          }}
          onCopy={handleCopy}
          onDelete={setDeletingTargetId}
        />
      </div>

      {/* Dialogs */}
      <SalesTargetDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        target={viewingTarget}
      />

      <AlertDialog
        open={!!deletingTargetId}
        onOpenChange={(open) => !open && setDeletingTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบเป้าหมายการขายรายการนี้ใช่หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              ลบข้อมูล
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent className="max-w-[400px] rounded-2xl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 animate-in zoom-in-50 duration-300">
                <Target className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold text-slate-800">
              บันทึกสำเร็จ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-600">
              {successMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => setSuccessDialogOpen(false)}
              className="w-full sm:w-auto min-w-[120px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
            >
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
