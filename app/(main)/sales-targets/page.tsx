"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Target, ChevronLeft, Loader2 } from "lucide-react";
import NextLink from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ProductGroupTargetsTab,
  RegionTargetsTab,
  ProductTargetsTab,
  YearlyTargetCard,
  DetailedTargetsTable,
  SalesTargetFilters,
} from "@/features/sales-targets";
import { useSalesTargets } from "@/features/sales-targets";
import { CURRENT_YEAR, YEARS } from "@/features/sales-targets/_lib/constants";
import { DetailedTarget } from "@/src/core/sales-targets/sales-target.types";

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

  // Hook Usage
  const {
    loading,
    saving,
    monthlyTargets,
    productGroupTargets,
    regionTargets,
    productTargets,
    detailedTargets,
    products,
    setProductGroupTargets,
    setRegionTargets,
    setProductTargets,
    setProducts,
    fetchTargets,
    saveProductGroupTargets,
    saveRegionTargets,
    saveProductTargets,
    deleteTarget,
    searchProducts,
  } = useSalesTargets();

  // Local UI State
  const [activeTab, setActiveTab] = useState("monthly");
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
  const [productGroups, setProductGroups] = useState<
    { value: string; label: string }[]
  >([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(detailedTargets.length / itemsPerPage);
  const paginatedTargets = detailedTargets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

  // Load Filter Options (Employees, Customers, ProductGroups)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [empRes, custRes, groupsRes] = await Promise.all([
          fetch("/api/employee"),
          fetch("/api/customers?perPage=100"),
          fetch("/api/products/groups?perPage=100"),
        ]);

        if (empRes.ok) {
          const data = await empRes.json();
          setFilterEmployees(data.employees || data);
        }
        if (custRes.ok) {
          const data = await custRes.json();
          setFilterCustomers(data.customers || data);
        }
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          setProductGroups(
            groupsData.groups.map(
              (g: { code: string; description: string }) => ({
                value: g.code,
                label: g.description,
              }),
            ),
          );
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
  }, [fetchTargets, year, monthFilter, employeeFilter, shopFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [detailedTargets]);

  // --- Handlers ---

  const handleClearFilters = () => {
    setYear(CURRENT_YEAR);
    setMonthFilter("all");
    setEmployeeFilter("");
    setShopFilter("");
  };

  const handleSaveProductGroup = async () => {
    const targets: any[] = [];
    Object.entries(productGroupTargets).forEach(([productGroup, months]) => {
      Object.entries(months).forEach(([month, amount]) => {
        if (amount > 0) {
          targets.push({
            productGroup,
            month: parseInt(month),
            targetAmount: amount,
          });
        }
      });
    });

    const success = await saveProductGroupTargets(targets, year);
    if (success) {
      setSuccessMessage("บันทึกเป้าหมายกลุ่มสินค้าสำเร็จ");
      setSuccessDialogOpen(true);
    }
  };

  const handleSaveRegion = async () => {
    const targets: any[] = [];
    Object.entries(regionTargets).forEach(([region, months]) => {
      Object.entries(months).forEach(([month, amount]) => {
        if (amount > 0) {
          targets.push({
            region,
            month: parseInt(month),
            targetAmount: amount,
          });
        }
      });
    });

    const success = await saveRegionTargets(targets, year);
    if (success) {
      setSuccessMessage("บันทึกเป้าหมายรายภาคสำเร็จ");
      setSuccessDialogOpen(true);
    }
  };

  const handleSaveProduct = async () => {
    const targets: any[] = [];
    Object.entries(productTargets).forEach(([productId, months]) => {
      Object.entries(months).forEach(([month, amount]) => {
        if (amount > 0) {
          targets.push({
            productId,
            month: parseInt(month),
            targetAmount: amount,
          });
        }
      });
    });

    const success = await saveProductTargets(targets, year);
    if (success) {
      setSuccessMessage("บันทึกเป้าหมายรายสินค้าสำเร็จ");
      setSuccessDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!deletingTargetId) return;
    const success = await deleteTarget(deletingTargetId);
    if (success) {
      fetchTargets({
        year,
        month: monthFilter,
        employeeId: employeeFilter,
        shopId: shopFilter,
      });
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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px] bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50">
          <TabsTrigger value="monthly" className="rounded-xl">
            รายเดือน
          </TabsTrigger>
          <TabsTrigger value="productGroup" className="rounded-xl">
            กลุ่มสินค้า
          </TabsTrigger>
          <TabsTrigger value="product" className="rounded-xl">
            รายสินค้า
          </TabsTrigger>
          <TabsTrigger value="region" className="rounded-xl">
            รายภาค
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <YearlyTargetCard
            year={year}
            totalTarget={calculateMonthlyTotal()}
          />
          <DetailedTargetsTable
            targets={detailedTargets}
            paginatedTargets={paginatedTargets}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onView={(target) => {
              setViewingTarget(target);
              setIsDetailDialogOpen(true);
            }}
            onDelete={setDeletingTargetId}
          />
        </TabsContent>

        <TabsContent value="productGroup" className="space-y-6">
          <ProductGroupTargetsTab
            productGroups={productGroups}
            targets={productGroupTargets}
            onChange={(group, month, value) =>
              setProductGroupTargets((prev) => ({
                ...prev,
                [group]: { ...prev[group], [month]: value },
              }))
            }
            onSave={handleSaveProductGroup}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="product" className="space-y-6">
          <ProductTargetsTab
            products={products}
            targets={productTargets}
            onChange={(productId, month, value) =>
              setProductTargets((prev) => ({
                ...prev,
                [productId]: { ...prev[productId], [month]: value },
              }))
            }
            onSave={handleSaveProduct}
            saving={saving}
            onSearch={searchProducts}
            onAddProducts={(newProducts) => {
              setProducts((prev) => [...prev, ...newProducts]);
            }}
          />
        </TabsContent>

        <TabsContent value="region" className="space-y-6">
          <RegionTargetsTab
            targets={regionTargets}
            onChange={(region, month, value) =>
              setRegionTargets((prev) => ({
                ...prev,
                [region]: { ...prev[region], [month]: value },
              }))
            }
            onSave={handleSaveRegion}
            saving={saving}
          />
        </TabsContent>
      </Tabs>

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
