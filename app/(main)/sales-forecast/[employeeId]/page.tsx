"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Package, Building2, CalendarDays, UserRound, Search, Filter, X, ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";
import { getSalesForecastAction } from "@/modules/sales-forecast/server/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  // UI Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

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

            <CardContent className="p-0">
              {/* Search and Filters Bar */}
              <div className="px-4 sm:px-6 py-4 bg-slate-50/30 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="ค้นหาชื่อร้านค้า หรือสินค้า..."
                    className="pl-9 bg-white border-slate-200 focus:ring-blue-500/20 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-600 shrink-0">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">เดือน:</span>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0 shadow-none font-bold text-blue-600">
                        <SelectValue placeholder="เลือกเดือน" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกเดือน</SelectItem>
                        {months.map(m => (
                          <SelectItem key={m} value={m.toString()}>เดือน{getMonthName(m)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-8">
                <TabsContent value="products" className="mt-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products
                      .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((p, i) => (
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
                    {(products.length === 0 || products.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0) && (
                      <div className="col-span-full py-12 text-center text-slate-500 border rounded-2xl border-dashed">
                        ไม่มีข้อมูลสินค้า{searchTerm ? ` ที่ตรงกับ "${searchTerm}"` : ""}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="shops" className="mt-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {shops
                      .filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((s, i) => (
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
                    {(shops.length === 0 || shops.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0) && (
                      <div className="col-span-full py-12 text-center text-slate-500 border rounded-2xl border-dashed">
                        ไม่มีข้อมูลร้านค้า{searchTerm ? ` ที่ตรงกับ "${searchTerm}"` : ""}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="months" className="mt-0 focus-visible:outline-none">
                  <Accordion type="multiple" defaultValue={months.length > 0 ? [months[0].toString()] : []} className="space-y-6">
                    {months
                      .filter(m => selectedMonth === "all" || m.toString() === selectedMonth)
                      .map(m => {
                        const monthItems = monthMap.get(m)!;
                        const monthTotal = monthItems.reduce((acc, item) => acc + item.amount, 0);
                        const monthQty = monthItems.reduce((acc, item) => acc + item.quantity, 0);

                        // Group items by shop for this month
                        const shopGroups = new Map<string, {
                          shopName: string;
                          items: DetailItem[];
                          totalAmount: number;
                          totalQty: number
                        }>();

                        monthItems.forEach(item => {
                          if (!shopGroups.has(item.shopId)) {
                            shopGroups.set(item.shopId, {
                              shopName: item.shopName,
                              items: [],
                              totalAmount: 0,
                              totalQty: 0
                            });
                          }
                          const group = shopGroups.get(item.shopId)!;
                          group.items.push(item);
                          group.totalAmount += item.amount;
                          group.totalQty += item.quantity;
                        });

                        // Filter shops based on search term
                        const filteredShopsInMonth = Array.from(shopGroups.values()).filter(shop => {
                          if (!searchTerm) return true;
                          const nameMatch = shop.shopName.toLowerCase().includes(searchTerm.toLowerCase());
                          const productMatch = shop.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
                          return nameMatch || productMatch;
                        });

                        // If searching and this month has no matches, don't show it
                        if (searchTerm && filteredShopsInMonth.length === 0) return null;

                        return (
                          <AccordionItem key={m} value={m.toString()} className="border-0">
                            <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden">
                              <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 text-left group">
                                <div>
                                  <h4 className="font-black text-slate-900 flex items-center gap-3 text-2xl group-hover:text-blue-600 transition-colors">
                                    <CalendarDays className="w-7 h-7 text-blue-600" />
                                    เดือน{getMonthName(m)}
                                    <ChevronDownIcon className="w-5 h-5 text-slate-300 group-data-[state=open]:rotate-180 transition-transform" />
                                  </h4>
                                  <p className="text-slate-500 mt-1">สรุปรายละเอียดเป้าหมายการขายและร้านค้าประจำเดือน</p>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 min-w-[130px]">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight mb-0.5">ราคารวมทั้งเดือน</p>
                                    <p className="text-base font-black text-blue-700 leading-none">{formatCurrency(monthTotal)}</p>
                                  </div>
                                  <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 min-w-[130px]">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight mb-0.5">ราคาสินค้ารวม</p>
                                    <p className="text-base font-black text-indigo-700 leading-none">{formatCurrency(monthTotal)}</p>
                                  </div>
                                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 min-w-[130px]">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight mb-0.5">จำนวนรวมสินค้า</p>
                                    <p className="text-base font-black text-emerald-700 leading-none">{monthQty.toLocaleString()} <small className="font-medium text-[10px]">ชิ้น</small></p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 min-w-[130px]">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight mb-0.5">จำนวนร้านค้า</p>
                                    <p className="text-base font-black text-slate-700 leading-none">{filteredShopsInMonth.length} <small className="font-medium text-[10px]">ร้าน</small></p>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>

                            <AccordionContent className="pt-6 pb-2">
                              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
                                <Table>
                                  <TableHeader className="bg-slate-50/80">
                                    <TableRow className="hover:bg-transparent border-slate-200">
                                      <TableHead className="w-[220px] font-bold text-slate-800">ชื่อร้านค้า</TableHead>
                                      <TableHead className="font-bold text-slate-800">รายละเอียดสินค้า</TableHead>
                                      <TableHead className="text-right font-bold text-slate-800">จำนวน</TableHead>
                                      <TableHead className="text-right font-bold text-slate-800">ยอดเป้าหมายสินค้า</TableHead>
                                      <TableHead className="text-right font-black text-blue-700 bg-blue-50/40 border-l border-blue-100">ยอดเป้าหมายร้านค้า</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredShopsInMonth.map((shop, sIdx) => (
                                      shop.items.map((item, iIdx) => (
                                        <TableRow key={`${sIdx}-${iIdx}`} className="group hover:bg-slate-50/30 transition-colors border-slate-100">
                                          {iIdx === 0 && (
                                            <TableCell
                                              rowSpan={shop.items.length}
                                              className="font-bold text-slate-900 align-top border-r border-slate-100 py-6"
                                            >
                                              <div className="flex items-start gap-2.5">
                                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                                  <Building2 className="w-4 h-4" />
                                                </div>
                                                <span className="leading-tight pt-1">{shop.shopName || "ไม่ระบุชื่อร้านค้า"}</span>
                                              </div>
                                            </TableCell>
                                          )}
                                          <TableCell className="py-4">
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                                              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                                                {item.productName}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right font-bold text-slate-600">
                                            {item.quantity.toLocaleString()} <span className="text-[10px] font-medium text-slate-400 ml-0.5">ชิ้น</span>
                                          </TableCell>
                                          <TableCell className="text-right font-black text-slate-800">
                                            {formatCurrency(item.amount)}
                                          </TableCell>
                                          {iIdx === 0 && (
                                            <TableCell
                                              rowSpan={shop.items.length}
                                              className="text-right align-middle bg-blue-50/20 border-l border-blue-100"
                                            >
                                              <div className="flex flex-col items-end">
                                                <p className="text-lg font-black text-blue-700">
                                                  {formatCurrency(shop.totalAmount)}
                                                </p>
                                              </div>
                                            </TableCell>
                                          )}
                                        </TableRow>
                                      ))
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                  </Accordion>

                  {((months.filter(m => selectedMonth === "all" || m.toString() === selectedMonth).length === 0) || (searchTerm && months.every(m => {
                    const items = monthMap.get(m)!;
                    const filteredItems = items.filter(item =>
                      item.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    return filteredItems.length === 0;
                  }))) && (
                      <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                          <CalendarDays className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-2xl font-black text-slate-400">ไม่พบข้อมูล</p>
                        <p className="text-slate-400 mt-2 max-w-xs mx-auto">
                          {searchTerm ? `ไม่พบข้อมูลที่ตรงกับ "${searchTerm}"` : "ยังไม่มีการกำหนดเป้าหมายการขาย"}
                        </p>
                      </div>
                    )}
                </TabsContent>
              </div>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
