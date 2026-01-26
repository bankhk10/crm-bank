"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Target,
  Save,
  ChevronLeft,
  Calendar,
  Package,
  Map,
  Loader2,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
// Removed PRODUCT_GROUP_OPTIONS import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2, Eye } from "lucide-react";
import { SalesTargetDetailDialog } from "./SalesTargetDetailDialog";
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
import { FormCombobox } from "@/components/custom/FormCombobox";
const MONTHS = [
  { value: 1, label: "มกราคม" },
  { value: 2, label: "กุมภาพันธ์" },
  { value: 3, label: "มีนาคม" },
  { value: 4, label: "เมษายน" },
  { value: 5, label: "พฤษภาคม" },
  { value: 6, label: "มิถุนายน" },
  { value: 7, label: "กรกฎาคม" },
  { value: 8, label: "สิงหาคม" },
  { value: 9, label: "กันยายน" },
  { value: 10, label: "ตุลาคม" },
  { value: 11, label: "พฤศจิกายน" },
  { value: 12, label: "ธันวาคม" },
];

const REGIONS = [
  "ภาคเหนือ",
  "ภาคตะวันออกเฉียงเหนือ",
  "ภาคตะวันออก",
  "ภาคตะวันตก",
  "ภาคกลาง",
  "ภาคใต้",
];

interface ProductGroupTarget {
  productGroup: string;
  month: number | null;
  targetAmount: number;
  notes?: string;
}

interface RegionTarget {
  region: string;
  month: number | null;
  targetAmount: number;
  notes?: string;
}

interface ProductTarget {
  productId: string;
  month: number | null;
  targetAmount: number;
  notes?: string;
}

interface ProductInfo {
  id: string;
  productCode: string;
  name: string;
  productGroup: string | null;
}

export default function SalesTargetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);
  }, [currentYear]);
  const queryFilters = useMemo(() => {
    const yearParam = Number(searchParams.get("year") || currentYear);
    const monthParam = searchParams.get("month");
    const parsedMonth =
      monthParam && monthParam !== "all" ? Number(monthParam) : "all";

    return {
      year: Number.isNaN(yearParam) ? currentYear : yearParam,
      month:
        parsedMonth === "all" || Number.isNaN(parsedMonth as number)
          ? "all"
          : (parsedMonth as number),
      employeeId: searchParams.get("employeeId") || "",
      shopId: searchParams.get("shopId") || "",
    };
  }, [currentYear, searchParams]);

  const [year, setYear] = useState(queryFilters.year);
  const [monthFilter, setMonthFilter] = useState<number | "all">(
    queryFilters.month,
  );
  const [employeeFilter, setEmployeeFilter] = useState(queryFilters.employeeId);
  const [shopFilter, setShopFilter] = useState(queryFilters.shopId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("monthly");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Monthly targets state
  const [monthlyTargets, setMonthlyTargets] = useState<
    Record<number | string, number>
  >({});

  // Product group targets state
  const [productGroupTargets, setProductGroupTargets] = useState<
    Record<string, Record<number, number>>
  >({});

  // Region targets state
  const [regionTargets, setRegionTargets] = useState<
    Record<string, Record<number, number>>
  >({});
  const [productGroups, setProductGroups] = useState<
    { value: string; label: string }[]
  >([]);

  // Product targets state
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [productTargets, setProductTargets] = useState<
    Record<string, Record<number, number>>
  >({});
  const [productSearch, setProductSearch] = useState("");

  // Detailed targets state
  const [detailedTargets, setDetailedTargets] = useState<any[]>([]);

  // Detail View State
  const [viewingTarget, setViewingTarget] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Delete State
  const [deletingTargetId, setDeletingTargetId] = useState<string | null>(null);
  const [filterEmployees, setFilterEmployees] = useState<any[]>([]);
  const [filterCustomers, setFilterCustomers] = useState<any[]>([]);

  useEffect(() => {
    setYear(queryFilters.year);
    setMonthFilter(queryFilters.month);
    setEmployeeFilter(queryFilters.employeeId);
    setShopFilter(queryFilters.shopId);
  }, [queryFilters]);

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

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [empRes, custRes] = await Promise.all([
          fetch("/api/employee"),
          fetch("/api/customers?perPage=100"),
        ]);
        if (empRes.ok) {
          const data = await empRes.json();
          setFilterEmployees(data.employees || data);
        }
        if (custRes.ok) {
          const data = await custRes.json();
          setFilterCustomers(data.customers || data);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleClearFilters = () => {
    setYear(currentYear);
    setMonthFilter("all");
    setEmployeeFilter("");
    setShopFilter("");
  };

  // Fetch existing targets
  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: year.toString() });
      if (monthFilter !== "all") {
        params.set("month", monthFilter.toString());
      }
      if (employeeFilter) {
        params.set("employeeId", employeeFilter);
      }
      if (shopFilter) {
        params.set("shopId", shopFilter);
      }
      const response = await fetch(`/api/sales-targets?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch targets");

      const data = await response.json();

      // Process monthly targets
      const monthlyMap: Record<number | string, number> = {};
      data.monthlyTargets?.forEach(
        (t: { month: number | null; targetAmount: string }) => {
          if (t.month !== null) {
            monthlyMap[t.month] = Number(t.targetAmount);
          }
        },
      );
      setMonthlyTargets(monthlyMap);

      // Process product group targets
      const pgMap: Record<string, Record<number, number>> = {};
      data.productGroupTargets?.forEach(
        (t: {
          productGroup: string;
          month: number | null;
          targetAmount: string;
        }) => {
          if (!pgMap[t.productGroup]) pgMap[t.productGroup] = {};
          if (t.month !== null) {
            pgMap[t.productGroup][t.month] = Number(t.targetAmount);
          }
        },
      );
      setProductGroupTargets(pgMap);

      // Process region targets
      const regionMap: Record<string, Record<number, number>> = {};
      data.regionTargets?.forEach(
        (t: { region: string; month: number | null; targetAmount: string }) => {
          if (!regionMap[t.region]) regionMap[t.region] = {};
          if (t.month !== null) {
            regionMap[t.region][t.month] = Number(t.targetAmount);
          }
        },
      );
      setRegionTargets(regionMap);

      // Process product targets
      const productMap: Record<string, Record<number, number>> = {};
      const productList: ProductInfo[] = [];
      const seenProducts = new Set<string>();
      data.productTargets?.forEach(
        (t: {
          productId: string;
          month: number | null;
          targetAmount: string;
          product: ProductInfo;
        }) => {
          if (!productMap[t.productId]) productMap[t.productId] = {};
          if (t.month !== null) {
            productMap[t.productId][t.month] = Number(t.targetAmount);
          }
          if (!seenProducts.has(t.productId)) {
            seenProducts.add(t.productId);
            productList.push(t.product);
          }
        },
      );
      setProductTargets(productMap);
      if (productList.length > 0) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProducts = productList.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      }

      // Process detailed targets
      setDetailedTargets(data.detailedTargets || []);

      // Fetch product groups
      const groupsRes = await fetch("/api/products/groups?perPage=100");
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setProductGroups(
          groupsData.groups.map((g: { code: string; description: string }) => ({
            value: g.code,
            label: g.description,
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
      toast.error("ไม่สามารถโหลดข้อมูลเป้าหมายได้");
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, monthFilter, shopFilter, year]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  // Save product group targets
  const saveProductGroupTargets = async () => {
    setSaving(true);
    try {
      const targets: ProductGroupTarget[] = [];

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

      const response = await fetch("/api/sales-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "productGroup",
          targets: targets.map((t) => ({ ...t, year })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setSuccessMessage("บันทึกเป้าหมายกลุ่มสินค้าสำเร็จ");
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error("Error saving product group targets:", error);
      toast.error("ไม่สามารถบันทึกเป้าหมายได้");
    } finally {
      setSaving(false);
    }
  };

  // Save region targets
  const saveRegionTargets = async () => {
    setSaving(true);
    try {
      const targets: RegionTarget[] = [];

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

      const response = await fetch("/api/sales-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "region",
          targets: targets.map((t) => ({ ...t, year })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setSuccessMessage("บันทึกเป้าหมายรายภาคสำเร็จ");
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error("Error saving region targets:", error);
      toast.error("ไม่สามารถบันทึกเป้าหมายได้");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH").format(value);
  };

  const handleDeleteTarget = async () => {
    if (!deletingTargetId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/sales-targets?id=${deletingTargetId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("ลบข้อมูลสำเร็จ");
      fetchTargets();
    } catch (error) {
      toast.error("ไม่สามารถลบข้อมูลได้");
      console.error(error);
    } finally {
      setSaving(false);
      setDeletingTargetId(null);
    }
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

  const calculateProductGroupTotal = (productGroup: string) => {
    return Object.values(productGroupTargets[productGroup] || {}).reduce(
      (sum, val) => sum + (val || 0),
      0,
    );
  };

  const calculateRegionTotal = (region: string) => {
    return Object.values(regionTargets[region] || {}).reduce(
      (sum, val) => sum + (val || 0),
      0,
    );
  };

  const calculateProductTotal = (productId: string) => {
    return Object.values(productTargets[productId] || {}).reduce(
      (sum, val) => sum + (val || 0),
      0,
    );
  };

  // Fetch products for selection
  const fetchProducts = async (search: string) => {
    try {
      const params = new URLSearchParams({
        search,
        limit: "20",
        status: "ACTIVE",
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  // Save product targets
  const saveProductTargets = async () => {
    setSaving(true);
    try {
      const targets: ProductTarget[] = [];

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

      const response = await fetch("/api/sales-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "product",
          targets: targets.map((t) => ({ ...t, year })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setSuccessMessage("บันทึกเป้าหมายรายสินค้าสำเร็จ");
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error("Error saving product targets:", error);
      toast.error("ไม่สามารถบันทึกเป้าหมายได้");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            <Link
              href="/dashboard/admin"
              className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm border border-slate-200/60 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Link>
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
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  ตัวกรองเป้าหมายรายเดือน
                </CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-7">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
              <div className="p-4 sm:p-5">
                {/* ✅ one row on lg, equal height, clean alignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[140px_160px_1.2fr_1.2fr_auto] gap-4 lg:gap-5 items-end">
                  {/* Year */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold tracking-wide text-slate-600">
                      ปี
                    </Label>
                    <Select
                      value={year.toString()}
                      onValueChange={(value) => setYear(Number(value))}
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow transition-shadow focus:ring-2 focus:ring-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {years.map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Month */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold tracking-wide text-slate-600">
                      เดือน
                    </Label>
                    <Select
                      value={
                        monthFilter === "all" ? "all" : monthFilter.toString()
                      }
                      onValueChange={(value) =>
                        setMonthFilter(value === "all" ? "all" : Number(value))
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow transition-shadow focus:ring-2 focus:ring-slate-200">
                        <SelectValue placeholder="ทั้งหมด" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employee */}
                  <div className="space-y-2">
                    <FormCombobox
                      label="พนักงาน"
                      value={employeeFilter}
                      onChange={(val) => setEmployeeFilter(val)}
                      options={filterEmployees.map((emp) => ({
                        value: emp.id,
                        label: `${emp.name} (${emp.employeeCode || "-"})`,
                      }))}
                      placeholder="พนักงานทั้งหมด"
                      searchPlaceholder="ค้นหาพนักงาน..."
                      emptyText="ไม่พบพนักงาน"
                    />
                  </div>

                  {/* Shop */}
                  <div className="space-y-2">
                    <FormCombobox
                      label="ร้านค้า"
                      value={shopFilter}
                      onChange={(val) => setShopFilter(val)}
                      options={filterCustomers.map((customer) => ({
                        value: customer.id,
                        label: `${customer.name} (${customer.customerCode || "-"})`,
                      }))}
                      placeholder="ร้านค้าทั้งหมด"
                      searchPlaceholder="ค้นหาร้านค้า..."
                      emptyText="ไม่พบร้านค้า"
                      // ✅ ถ้ารองรับ:
                      // className="w-full"
                      // triggerClassName="h-11 rounded-xl"
                    />
                  </div>

                  {/* Clear */}
                  <div className="flex lg:justify-end">
                    <Button
                      variant="outline"
                      size="lg"
                      className="
      h-11 rounded-xl px-4
      border-red-200
      bg-red-50
      text-red-600
      hover:bg-red-100
      hover:text-red-700
      hover:border-red-300
      shadow-sm hover:shadow
      transition-all
    "
                      onClick={handleClearFilters}
                    >
                      ล้างตัวกรอง
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-200/70 px-4 sm:px-5 py-3">
                {loading && (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังโหลดข้อมูล...
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        {/* Monthly Targets Tab */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Yearly Target Card */}
          <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
            {/* Decorative Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
            <CardHeader className="relative pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-emerald-400 blur-md opacity-30" />
                    <div className="relative p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30">
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <CardTitle className="text-lg font-semibold tracking-tight">
                      เป้าหมายรวมทั้งปี {year}
                    </CardTitle>
                    <p className="text-sm text-slate-400">
                      กำหนดเป้าหมายยอดขายรวมของปี
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                {/* KPI Value */}
                <div>
                  <p className="text-sm text-slate-400 mb-1">
                    รวมเป้าหมายทั้งปี
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-emerald-400 tracking-tight">
                      ฿{formatCurrency(calculateMonthlyTotal())}
                    </span>
                    <span className="text-xs text-slate-500">THB</span>
                  </div>
                </div>

                {/* Hint / Status */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-300">
                    คำนวณจากเป้าหมายรายเดือน
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Targets List (Detailed) */}
          <Card className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_-12px_rgba(2,6,23,0.25)]">
            <CardHeader className="border-b border-slate-200/60 bg-gradient-to-r from-white/40 to-slate-50/40">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center size-10 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 ring-1 ring-blue-500/15">
                    <Calendar className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="leading-tight">
                    <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                      รายการเป้าหมายรายเดือน
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500">
                      สรุปเป้าหมายรายเดือนแยกตามพนักงานและร้านค้า
                    </p>
                  </div>
                </div>

                <Link href="/sales-targets/create" className="shrink-0">
                  <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 focus-visible:ring-2 focus-visible:ring-blue-500/40">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    เพิ่มเป้าหมาย
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* ===== Mobile ===== */}
              <div className="sm:hidden">
                {detailedTargets.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-slate-100">
                      <Calendar className="h-5 w-5 text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      ยังไม่มีข้อมูลเป้าหมาย
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      กด “เพิ่มเป้าหมาย” เพื่อเริ่มต้น
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/60">
                    {detailedTargets.map((target) => {
                      const totalQty =
                        target.items?.reduce(
                          (s: number, i: any) => s + i.quantity,
                          0,
                        ) ?? 0;
                      const totalAmount =
                        target.items?.reduce(
                          (s: number, i: any) => s + Number(i.amount),
                          0,
                        ) ?? 0;

                      return (
                        <div key={target.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">เดือน</p>
                              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                                {
                                  MONTHS.find((m) => m.value === target.month)
                                    ?.label
                                }
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                                  👤 {target.employee?.name}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                                  🏪 {target.customer?.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl hover:bg-slate-100"
                                onClick={() => {
                                  setViewingTarget(target);
                                  setIsDetailDialogOpen(true);
                                }}
                                aria-label="ดูรายละเอียด"
                              >
                                <Eye className="h-4 w-4 text-slate-600" />
                              </Button>

                              <Link href={`/sales-targets/${target.id}/edit`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-xl hover:bg-blue-50"
                                  aria-label="แก้ไข"
                                >
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => setDeletingTargetId(target.id)}
                                aria-label="ลบ"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/60">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-slate-500">จำนวนสินค้า</div>
                              <div className="text-right font-semibold text-slate-900">
                                {totalQty}
                                <span className="ml-1 text-xs font-normal text-slate-500">
                                  รายการ
                                </span>
                              </div>

                              <div className="text-slate-500">ยอดรวม</div>
                              <div className="text-right font-semibold text-emerald-700">
                                {formatCurrency(totalAmount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ===== Desktop ===== */}
              <div className="hidden sm:block">
                <div className="overflow-x-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow className="bg-slate-50/60">
                        <TableHead className="text-base font-semibold  pl-6">
                          เดือน
                        </TableHead>
                        <TableHead className="text-base font-semibold ">
                          พนักงาน
                        </TableHead>
                        <TableHead className="text-base font-semibold">
                          ร้านค้า
                        </TableHead>
                        <TableHead className="text-right text-base font-semibold">
                          จำนวนสินค้า
                        </TableHead>
                        <TableHead className="text-right text-base font-semibold">
                          ยอดรวม (บาท)
                        </TableHead>
                        <TableHead className="w-[132px]" />
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {detailedTargets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center">
                            <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-slate-100">
                              <Calendar className="h-5 w-5 text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">
                              ยังไม่มีข้อมูลเป้าหมาย
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              กด “เพิ่มเป้าหมาย” เพื่อเริ่มต้น
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        detailedTargets.map((target) => {
                          const totalQty =
                            target.items?.reduce(
                              (s: number, i: any) => s + i.quantity,
                              0,
                            ) ?? 0;
                          const totalAmount =
                            target.items?.reduce(
                              (s: number, i: any) => s + Number(i.amount),
                              0,
                            ) ?? 0;

                          return (
                            <TableRow
                              key={target.id}
                              className="transition-colors hover:bg-slate-50/70"
                            >
                              <TableCell className="font-medium text-slate-900 pl-6">
                                {
                                  MONTHS.find((m) => m.value === target.month)
                                    ?.label
                                }
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="grid size-9 place-items-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/10">
                                    <span className="text-xs font-semibold text-blue-700">
                                      {(target.employee?.name ?? "?").slice(
                                        0,
                                        1,
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-900">
                                      {target.employee?.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {target.employee?.employeeCode}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900">
                                    {target.customer?.name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {target.customer?.customerCode}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell className="text-right">
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                                  {totalQty} รายการ
                                </span>
                              </TableCell>

                              <TableCell className="text-right font-semibold text-emerald-700">
                                {formatCurrency(totalAmount)}
                              </TableCell>

                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-xl hover:bg-slate-100"
                                    onClick={() => {
                                      setViewingTarget(target);
                                      setIsDetailDialogOpen(true);
                                    }}
                                    aria-label="ดูรายละเอียด"
                                  >
                                    <Eye className="h-4 w-4 text-slate-600" />
                                  </Button>

                                  <Link
                                    href={`/sales-targets/${target.id}/edit`}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-xl hover:bg-blue-50"
                                      aria-label="แก้ไข"
                                    >
                                      <Pencil className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </Link>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                    onClick={() =>
                                      setDeletingTargetId(target.id)
                                    }
                                    aria-label="ลบ"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  onClick={handleDeleteTarget}
                  className="bg-red-600 hover:bg-red-700"
                >
                  ลบข้อมูล
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Product Group Targets Tab */}
        <TabsContent value="productGroup" className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <CardTitle>เป้าหมายตามกลุ่มสินค้า</CardTitle>
                </div>
                <Button
                  onClick={saveProductGroupTargets}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg shadow-purple-500/25"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  บันทึก
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {productGroups.map((group) => (
                  <div key={group.value} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-violet-600" />
                        {group.label}
                      </h3>
                      <span className="text-sm font-medium text-purple-600">
                        รวม: ฿
                        {formatCurrency(
                          calculateProductGroupTotal(group.value),
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                      {MONTHS.map((month) => (
                        <div
                          key={`${group.value}-${month.value}`}
                          className="p-2 rounded-lg bg-purple-50/50 border border-purple-100"
                        >
                          <Label className="text-xs text-slate-500 block mb-1">
                            {month.label.slice(0, 3)}.
                          </Label>
                          <Input
                            type="number"
                            onWheel={(e) => e.currentTarget.blur()}
                            value={
                              productGroupTargets[group.value]?.[month.value] ||
                              ""
                            }
                            onChange={(e) =>
                              setProductGroupTargets((prev) => ({
                                ...prev,
                                [group.value]: {
                                  ...prev[group.value],
                                  [month.value]:
                                    parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                            placeholder="0"
                            className="h-9 text-sm bg-white border-purple-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Targets Tab */}
        <TabsContent value="product" className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
                    <ShoppingBag className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle>เป้าหมายตามสินค้า</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      ค้นหาและเพิ่มสินค้าที่ต้องการตั้งเป้าหมาย
                    </p>
                  </div>
                </div>
                <Button
                  onClick={saveProductTargets}
                  disabled={saving}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  บันทึก
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Product Search */}
              <div className="mb-6">
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                  ค้นหาสินค้า
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="พิมพ์รหัสสินค้าหรือชื่อสินค้า..."
                    className="flex-1 bg-white border-teal-200"
                  />
                  <Button
                    onClick={async () => {
                      if (!productSearch.trim()) {
                        toast.info("กรุณาระบุคำค้นหา");
                        return;
                      }
                      const results = await fetchProducts(productSearch);
                      if (results.length === 0) {
                        toast.info("ไม่พบสินค้าที่ค้นหา");
                        return;
                      }
                      // Add all found products
                      const newProducts = results.filter(
                        (p: ProductInfo) =>
                          !products.find((ep) => ep.id === p.id),
                      );
                      if (newProducts.length === 0) {
                        toast.info("สินค้าที่ค้นหาถูกเพิ่มแล้ว");
                        return;
                      }
                      setProducts((prev) => [...prev, ...newProducts]);
                      newProducts.forEach((p: ProductInfo) => {
                        setProductTargets((prev) => ({
                          ...prev,
                          [p.id]: prev[p.id] || {},
                        }));
                      });
                      setProductSearch("");
                      toast.success(`เพิ่ม ${newProducts.length} สินค้าแล้ว`);
                    }}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    ค้นหา
                  </Button>
                </div>
              </div>

              {/* Product List */}
              {products.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>ยังไม่มีสินค้าที่ต้องการตั้งเป้าหมาย</p>
                  <p className="text-sm mt-1">
                    ค้นหาและเพิ่มสินค้าจากช่องค้นหาด้านบน
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {products.map((product) => (
                    <div key={product.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600" />
                          <span className="text-xs font-mono bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                            {product.productCode}
                          </span>
                          {product.name}
                        </h3>
                        <span className="text-sm font-medium text-teal-600">
                          รวม: ฿
                          {formatCurrency(calculateProductTotal(product.id))}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                        {MONTHS.map((month) => (
                          <div
                            key={`${product.id}-${month.value}`}
                            className="p-2 rounded-lg bg-teal-50/50 border border-teal-100"
                          >
                            <Label className="text-xs text-slate-500 block mb-1">
                              {month.label.slice(0, 3)}.
                            </Label>
                            <Input
                              type="number"
                              onWheel={(e) => e.currentTarget.blur()}
                              value={
                                productTargets[product.id]?.[month.value] || ""
                              }
                              onChange={(e) =>
                                setProductTargets((prev) => ({
                                  ...prev,
                                  [product.id]: {
                                    ...prev[product.id],
                                    [month.value]:
                                      parseFloat(e.target.value) || 0,
                                  },
                                }))
                              }
                              placeholder="0"
                              className="h-9 text-sm bg-white border-teal-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Region Targets Tab */}
        <TabsContent value="region" className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                    <Map className="w-5 h-5 text-orange-600" />
                  </div>
                  <CardTitle>เป้าหมายตามภาค</CardTitle>
                </div>
                <Button
                  onClick={saveRegionTargets}
                  disabled={saving}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/25"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  บันทึก
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {REGIONS.map((region) => (
                  <div key={region} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-600" />
                        {region}
                      </h3>
                      <span className="text-sm font-medium text-orange-600">
                        รวม: ฿{formatCurrency(calculateRegionTotal(region))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                      {MONTHS.map((month) => (
                        <div
                          key={`${region}-${month.value}`}
                          className="p-2 rounded-lg bg-orange-50/50 border border-orange-100"
                        >
                          <Label className="text-xs text-slate-500 block mb-1">
                            {month.label.slice(0, 3)}.
                          </Label>
                          <Input
                            type="number"
                            onWheel={(e) => e.currentTarget.blur()}
                            value={regionTargets[region]?.[month.value] || ""}
                            onChange={(e) =>
                              setRegionTargets((prev) => ({
                                ...prev,
                                [region]: {
                                  ...prev[region],
                                  [month.value]:
                                    parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                            placeholder="0"
                            className="h-9 text-sm bg-white border-orange-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent className="max-w-[400px] rounded-2xl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
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
