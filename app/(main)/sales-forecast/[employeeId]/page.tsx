"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Package, Building2, CalendarDays, UserRound } from "lucide-react";
import { toast } from "sonner";
import { getSalesForecastAction } from "@/modules/sales-forecast/server/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface DetailItem {
  productId: string;
  productName: string;
  month: number;
  shopId: string;
  shopName: string;
  amount: number;
  quantity: number;
}

export default function EmployeeForecastPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [details, setDetails] = useState<DetailItem[]>([]);

  useEffect(() => {
    async function fetchForecast() {
      try {
        const result = await getSalesForecastAction(year);
        const employeeDataList = result.personal.filter((e) => e.employeeId === employeeId);
        
        if (employeeDataList.length > 0) {
          setEmployeeName(employeeDataList[0].employeeName);
          const allDetails = employeeDataList.flatMap((e: any) => e.details || []);
          setDetails(allDetails);
        } else {
          toast.error("ไม่พบข้อมูลคาดการณ์ของพนักงานนี้");
          router.push("/sales-forecast");
        }
      } catch (err) {
        toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchForecast();
  }, [employeeId, year, router]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/30">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Aggregate by Product
  const productMap = new Map<string, { name: string; amount: number; qty: number }>();
  // Aggregate by Shop
  const shopMap = new Map<string, { name: string; amount: number; qty: number }>();
  // Aggregate by Month -> Shop -> Product
  const monthMap = new Map<number, DetailItem[]>();

  details.forEach((item) => {
    // Products
    if (!productMap.has(item.productId)) {
      productMap.set(item.productId, { name: item.productName, amount: 0, qty: 0 });
    }
    const p = productMap.get(item.productId)!;
    p.amount += item.amount;
    p.qty += item.quantity;

    // Shops
    if (!shopMap.has(item.shopId)) {
      shopMap.set(item.shopId, { name: item.shopName, amount: 0, qty: 0 });
    }
    const s = shopMap.get(item.shopId)!;
    s.amount += item.amount;
    s.qty += item.quantity;

    // Months
    if (!monthMap.has(item.month)) {
      monthMap.set(item.month, []);
    }
    monthMap.get(item.month)!.push(item);
  });

  const products = Array.from(productMap.values()).sort((a, b) => b.amount - a.amount);
  const shops = Array.from(shopMap.values()).sort((a, b) => b.amount - a.amount);
  const months = Array.from(monthMap.keys()).sort((a, b) => a - b);
  const totalAmount = products.reduce((acc, p) => acc + p.amount, 0);

  const getMonthName = (m: number) => {
    const d = new Date();
    d.setMonth(m - 1);
    return d.toLocaleString('th-TH', { month: 'long' });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:pb-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 blur-3xl" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl shadow-blue-500/10 p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Link
                  href="/sales-forecast"
                  className="group flex items-center justify-center w-12 h-12 shrink-0 rounded-2xl bg-linear-to-br from-slate-100 to-slate-50 border border-slate-200/60 hover:border-blue-300/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                </Link>

                <div className="flex-1">
                  <div className="flex flex-row items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                      <UserRound className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-linear-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                        รายละเอียดเป้าหมายการขาย
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-slate-500">ปี {year}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-blue-600 font-semibold">{employeeName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 sm:pr-8 sm:text-right shrink-0">
                <p className="text-xs font-semibold text-blue-600/70 mb-1 uppercase tracking-wider">
                  เป้าหมายรวมทั้งหมด
                </p>
                <div className="text-2xl sm:text-3xl font-black text-blue-700">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-900/5 rounded-2xl sm:rounded-3xl overflow-hidden">
          <Tabs defaultValue="products" className="w-full flex flex-col">
            <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
              <TabsList className="bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200/60 p-1.5 rounded-xl h-auto flex w-max">
                <TabsTrigger value="products" className="rounded-lg px-5 py-2.5 flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  <Package className="w-4 h-4" /> สินค้า ({products.length})
                </TabsTrigger>
                <TabsTrigger value="shops" className="rounded-lg px-5 py-2.5 flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  <Building2 className="w-4 h-4" /> ร้านค้า ({shops.length})
                </TabsTrigger>
                <TabsTrigger value="months" className="rounded-lg px-5 py-2.5 flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  <CalendarDays className="w-4 h-4" /> รายเดือน
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-4 sm:p-6 lg:p-8">
              <TabsContent value="products" className="mt-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map((p, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                      <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-slate-800 line-clamp-2" title={p.name}>{p.name}</p>
                      </div>
                      <div className="mt-auto grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">ยอดรวม</p>
                          <p className="text-lg font-bold text-blue-600">{formatCurrency(p.amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 font-medium mb-1">จำนวน</p>
                          <p className="text-sm font-semibold text-slate-700">{p.qty.toLocaleString()} ชิ้น</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border rounded-2xl border-dashed">
                      ไม่มีข้อมูลสินค้า
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="shops" className="mt-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {shops.map((s, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 line-clamp-2 mb-3" title={s.name}>{s.name || 'ไม่ระบุชื่อร้านค้า'}</p>
                          <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <div>
                              <p className="text-xs text-slate-500 font-medium mb-0.5">ยอดรวมร้านค้า</p>
                              <p className="text-base font-bold text-indigo-700">{formatCurrency(s.amount)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 font-medium mb-0.5">รวมสินค้า</p>
                              <p className="text-sm font-semibold text-slate-700">{s.qty.toLocaleString()} ชิ้น</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {shops.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border rounded-2xl border-dashed">
                      ไม่มีข้อมูลร้านค้า
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="months" className="mt-0 focus-visible:outline-none space-y-6 sm:space-y-8">
                {months.map(m => {
                  const monthItems = monthMap.get(m)!;
                  const monthTotal = monthItems.reduce((acc, item) => acc + item.amount, 0);
                  
                  return (
                    <div key={m} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                          <CalendarDays className="w-5 h-5 text-blue-600" />
                          เดือน{getMonthName(m)}
                        </h4>
                        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                          <span className="text-sm text-slate-500 font-medium mr-2">ยอดรวมเดือนนี้:</span>
                          <span className="font-bold text-blue-600">{formatCurrency(monthTotal)}</span>
                        </div>
                      </div>
                      
                      <div className="divide-y divide-slate-100">
                        {monthItems.map((item, idx) => (
                          <div key={idx} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <p className="font-bold text-slate-800 text-sm">{item.productName}</p>
                                <p className="text-xs font-medium text-indigo-600 flex items-center gap-1.5 bg-indigo-50 w-max px-2 py-0.5 rounded-md border border-indigo-100">
                                  <Building2 className="w-3.5 h-3.5" />
                                  <span className="truncate">{item.shopName || 'ไม่ระบุชื่อร้านค้า'}</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 grid grid-cols-2 sm:block gap-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-semibold sm:hidden mb-1 text-left">ยอดคาดการณ์</p>
                                <p className="font-bold text-blue-700 text-left sm:text-right text-sm sm:text-base">{formatCurrency(item.amount)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-semibold sm:hidden mb-1 text-right">จำนวน</p>
                                <p className="text-xs font-medium text-slate-500 text-right">{item.quantity.toLocaleString()} ชิ้น</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {months.length === 0 && (
                  <div className="py-12 text-center text-slate-500 border rounded-2xl border-dashed">
                    ไม่มีข้อมูลรายเดือน
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
