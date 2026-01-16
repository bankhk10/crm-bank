"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Target,
  Save,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  Map,
  TrendingUp,
  Loader2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { PRODUCT_GROUP_OPTIONS } from "@/types/product";

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

interface MonthlyTarget {
  month: number | null;
  targetAmount: number;
  notes?: string;
}

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
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("monthly");

  // Monthly targets state
  const [monthlyTargets, setMonthlyTargets] = useState<
    Record<number | string, number>
  >({});
  const [yearlyTarget, setYearlyTarget] = useState<number>(0);

  // Product group targets state
  const [productGroupTargets, setProductGroupTargets] = useState<
    Record<string, Record<number, number>>
  >({});

  // Region targets state
  const [regionTargets, setRegionTargets] = useState<
    Record<string, Record<number, number>>
  >({});

  // Product targets state
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [productTargets, setProductTargets] = useState<
    Record<string, Record<number, number>>
  >({});
  const [productSearch, setProductSearch] = useState("");

  // Fetch existing targets
  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sales-targets?year=${year}`);
      if (!response.ok) throw new Error("Failed to fetch targets");

      const data = await response.json();

      // Process monthly targets
      const monthlyMap: Record<number | string, number> = {};
      data.monthlyTargets?.forEach(
        (t: { month: number | null; targetAmount: string }) => {
          if (t.month === null) {
            // Yearly target
            setYearlyTarget(Number(t.targetAmount));
          } else {
            monthlyMap[t.month] = Number(t.targetAmount);
          }
        }
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
        }
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
        }
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
        }
      );
      setProductTargets(productMap);
      if (productList.length > 0) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProducts = productList.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
      toast.error("ไม่สามารถโหลดข้อมูลเป้าหมายได้");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  // Save monthly targets
  const saveMonthlyTargets = async () => {
    setSaving(true);
    try {
      const targets: MonthlyTarget[] = [];

      // Add yearly target
      if (yearlyTarget > 0) {
        targets.push({
          month: null,
          targetAmount: yearlyTarget,
        });
      }

      // Add monthly targets
      MONTHS.forEach((m) => {
        const amount = monthlyTargets[m.value] || 0;
        if (amount > 0) {
          targets.push({
            month: m.value,
            targetAmount: amount,
          });
        }
      });

      const response = await fetch("/api/sales-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "monthly",
          targets: targets.map((t) => ({ ...t, year })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("บันทึกเป้าหมายรายเดือนสำเร็จ");
    } catch (error) {
      console.error("Error saving monthly targets:", error);
      toast.error("ไม่สามารถบันทึกเป้าหมายได้");
    } finally {
      setSaving(false);
    }
  };

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

      toast.success("บันทึกเป้าหมายกลุ่มสินค้าสำเร็จ");
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

      toast.success("บันทึกเป้าหมายรายภาคสำเร็จ");
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

  const calculateMonthlyTotal = () => {
    return Object.values(monthlyTargets).reduce(
      (sum, val) => sum + (val || 0),
      0
    );
  };

  const calculateProductGroupTotal = (productGroup: string) => {
    return Object.values(productGroupTargets[productGroup] || {}).reduce(
      (sum, val) => sum + (val || 0),
      0
    );
  };

  const calculateRegionTotal = (region: string) => {
    return Object.values(regionTargets[region] || {}).reduce(
      (sum, val) => sum + (val || 0),
      0
    );
  };

  const calculateProductTotal = (productId: string) => {
    return Object.values(productTargets[productId] || {}).reduce(
      (sum, val) => sum + (val || 0),
      0
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

      toast.success("บันทึกเป้าหมายรายสินค้าสำเร็จ");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
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
              <p className="text-slate-500 text-sm">
                กำหนดเป้าหมายยอดขายรายเดือน กลุ่มสินค้า และภาค
              </p>
            </div>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-slate-200/60">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-lg">{year}</span>
          </div>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 h-14 p-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60">
          <TabsTrigger
            value="monthly"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-xl transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">เป้าหมายรายเดือน</span>
            <span className="sm:hidden">รายเดือน</span>
          </TabsTrigger>
          <TabsTrigger
            value="productGroup"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-xl transition-all"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">เป้าหมายกลุ่มสินค้า</span>
            <span className="sm:hidden">กลุ่มสินค้า</span>
          </TabsTrigger>
          <TabsTrigger
            value="product"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-xl transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">เป้าหมายรายสินค้า</span>
            <span className="sm:hidden">รายสินค้า</span>
          </TabsTrigger>
          <TabsTrigger
            value="region"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-xl transition-all"
          >
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline">เป้าหมายรายภาค</span>
            <span className="sm:hidden">รายภาค</span>
          </TabsTrigger>
        </TabsList>

        {/* Monthly Targets Tab */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Yearly Target Card */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">
                      เป้าหมายรวมทั้งปี {year}
                    </CardTitle>
                    <p className="text-slate-400 text-sm">
                      กำหนดเป้าหมายยอดขายรวมของปี
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <Input
                    type="number"
                    value={yearlyTarget || ""}
                    onChange={(e) =>
                      setYearlyTarget(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-xl font-bold h-14"
                  />
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">รวมเป้าหมายรายเดือน</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ฿{formatCurrency(calculateMonthlyTotal())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Targets Grid */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle>เป้าหมายรายเดือน</CardTitle>
                </div>
                <Button
                  onClick={saveMonthlyTargets}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {MONTHS.map((month) => (
                  <div
                    key={month.value}
                    className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 hover:shadow-md transition-all"
                  >
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                      {month.label}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                        ฿
                      </span>
                      <Input
                        type="number"
                        value={monthlyTargets[month.value] || ""}
                        onChange={(e) =>
                          setMonthlyTargets((prev) => ({
                            ...prev,
                            [month.value]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                        className="pl-8 bg-white border-slate-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                {PRODUCT_GROUP_OPTIONS.map((group) => (
                  <div key={group.value} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-violet-600" />
                        {group.label}
                      </h3>
                      <span className="text-sm font-medium text-purple-600">
                        รวม: ฿
                        {formatCurrency(
                          calculateProductGroupTotal(group.value)
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
                          !products.find((ep) => ep.id === p.id)
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
    </div>
  );
}
