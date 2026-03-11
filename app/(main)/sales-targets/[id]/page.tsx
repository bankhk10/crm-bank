"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Target, Loader2, MapPin, Calendar, Store, UserRound, Package } from "lucide-react";
import { toast } from "sonner";
import { getSalesTargetAction } from "@/modules/sales-targets/server/actions";
import { formatCurrency } from "@/lib/currency-utils";
import { MONTHS } from "@/modules/sales-targets/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, History as HistoryIcon } from "lucide-react";
import { SalesTargetHistoryTab } from "@/modules/sales-targets/features/detail-view/sales-target-history-tab";

export default function SalesTargetDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [target, setTarget] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const result = await getSalesTargetAction(id);
            if (result.success && "salesTarget" in result) {
                setTarget(result.salesTarget);
            } else {
                toast.error("ไม่พบข้อมูลเป้าหมาย");
                router.push("/sales-targets");
            }
            setLoading(false);
        }
        load();
    }, [id, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/30">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600 text-sm sm:text-base">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    if (!target) return null;

    const monthLabel = MONTHS.find((m) => m.value === target.month)?.label ?? "-";
    const totalStores = target.stores?.length ?? 0;

    const grandTotal =
        target.stores?.reduce(
            (storeSum: number, store: any) =>
                storeSum +
                (store.items?.reduce(
                    (itemSum: number, item: any) => itemSum + Number(item.targetAmount),
                    0,
                ) ?? 0),
            0,
        ) ?? 0;

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:pb-8">
                {/* Header with Glassmorphism */}
                <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 blur-3xl" />
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl shadow-blue-500/10 p-5 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <Link
                                href="/sales-targets"
                                className="group flex items-center justify-center w-12 h-12 shrink-0 rounded-2xl bg-linear-to-br from-slate-100 to-slate-50 border border-slate-200/60 hover:border-blue-300/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                            </Link>

                            <div className="flex-1">
                                <div className="flex flex-row items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-linear-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                        รายละเอียดเป้าหมายการขาย
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* General Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-900/5 rounded-2xl sm:rounded-3xl overflow-hidden">
                        <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                            <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-blue-50 text-blue-600 mt-1">
                                <UserRound className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-slate-500 mb-1">พนักงานขาย</div>
                                <div className="text-base sm:text-lg font-bold text-slate-800 truncate">{target.employee?.name}</div>
                                <div className="text-xs sm:text-sm text-slate-500 truncate">{target.employee?.employeeCode || "-"}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-900/5 rounded-2xl sm:rounded-3xl overflow-hidden">
                        <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                            <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 mt-1">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs sm:text-sm font-semibold text-slate-500 mb-1">ประจำเดือน</div>
                                <div className="text-base sm:text-lg font-bold text-slate-800">
                                    {monthLabel} {target.year + 543}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-900/5 rounded-2xl sm:rounded-3xl overflow-hidden sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                            <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 mt-1">
                                <Store className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs sm:text-sm font-semibold text-slate-500 mb-1">จำนวนร้านค้า</div>
                                <div className="text-base sm:text-lg font-bold text-slate-800">{totalStores} ร้าน</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content with Tabs */}
                <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-900/5 rounded-2xl sm:rounded-3xl overflow-hidden">
                    <Tabs defaultValue="detail" className="w-full">
                        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2 border-b border-slate-100 flex items-center justify-between">
                            <TabsList className="bg-slate-100/50 p-1">
                                <TabsTrigger value="detail" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Info className="w-4 h-4" />
                                    <span>รายละเอียด</span>
                                </TabsTrigger>
                                <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <HistoryIcon className="w-4 h-4" />
                                    <span>ประวัติการเปลี่ยนแปลง</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Detail Tab Content */}
                        <TabsContent value="detail" className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 mt-0">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-linear-to-br from-emerald-100 to-teal-100">
                                    <Store className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-800">รายละเอียดตามร้านค้า</h2>
                            </div>

                            <div className="space-y-5 sm:space-y-6">
                                {target.stores?.map((store: any, storeIdx: number) => {
                                    const storeTotal =
                                        store.items?.reduce(
                                            (sum: number, item: any) => sum + Number(item.targetAmount),
                                            0,
                                        ) ?? 0;

                                    return (
                                        <div
                                            key={store.id || storeIdx}
                                            className="border border-slate-200/60 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            {/* (Existing store rendering logic) */}
                                            {/* Store Header */}
                                            <div className="bg-slate-50/80 px-4 py-4 sm:px-5 sm:py-4 border-b border-slate-200/60 flex flex-row items-start sm:items-center justify-between gap-3">
                                                <div className="flex items-start sm:items-center gap-3">
                                                    <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm sm:text-base line-clamp-1">
                                                            {store.customer?.name || "-"}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-slate-500 font-medium">
                                                            {store.customer?.customerCode || "-"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-white shrink-0 px-2.5 py-1 text-xs sm:text-sm rounded-xl border border-slate-200 shadow-sm">
                                                    {store.items?.length || 0} สินค้า
                                                </Badge>
                                            </div>

                                            {/* Mobile Card Layout for Items */}
                                            <div className="block md:hidden bg-white p-3 space-y-3">
                                                {store.items?.map((item: any) => (
                                                    <div key={item.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                                <Package className="w-4 h-4 text-slate-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-slate-800 text-sm">{item.product?.name}</div>
                                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{item.product?.productCode}</div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-slate-100/80">
                                                            <div>
                                                                <div className="text-slate-500 text-xs mb-0.5">ราคา/หน่วย</div>
                                                                <div className="font-medium text-slate-700">{formatCurrency(Number(item.pricePerBox))}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-slate-500 text-xs mb-0.5">จำนวน</div>
                                                                <div className="font-medium text-slate-700">{item.qtyPerBox} <span className="text-xs text-slate-400">หน่วย</span></div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                                                            <div className="text-slate-500 text-xs font-medium">เป้าหมาย</div>
                                                            <div className="font-bold text-emerald-700">{formatCurrency(Number(item.targetAmount))}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!store.items || store.items.length === 0) && (
                                                    <div className="text-center py-6 text-slate-400 text-sm">
                                                        ไม่มีรายการสินค้า
                                                    </div>
                                                )}
                                            </div>

                                            {/* Desktop Table View */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-white">
                                                        <TableRow>
                                                            <TableHead className="font-semibold text-slate-700">สินค้า</TableHead>
                                                            <TableHead className="text-right font-semibold text-slate-700 w-[150px]">
                                                                ราคา/หน่วย
                                                            </TableHead>
                                                            <TableHead className="text-right font-semibold text-slate-700 w-[120px]">
                                                                จำนวน
                                                            </TableHead>
                                                            <TableHead className="text-right font-semibold text-slate-700 w-[180px]">
                                                                เป้าหมาย (บาท)
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody className="bg-white">
                                                        {store.items?.map((item: any) => (
                                                            <TableRow key={item.id} className="hover:bg-slate-50">
                                                                <TableCell>
                                                                    <div className="font-bold text-slate-800">{item.product?.name}</div>
                                                                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                                                                        {item.product?.productCode}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right font-medium text-slate-700">
                                                                    {formatCurrency(Number(item.pricePerBox))}
                                                                </TableCell>
                                                                <TableCell className="text-right font-medium text-slate-700">
                                                                    {item.qtyPerBox} <span className="text-xs text-slate-400">หน่วย</span>
                                                                </TableCell>
                                                                <TableCell className="text-right font-bold text-emerald-700">
                                                                    {formatCurrency(Number(item.targetAmount))}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {(!store.items || store.items.length === 0) && (
                                                            <TableRow>
                                                                <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                                                                    ไม่มีรายการสินค้า
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            {/* Store Subtotal */}
                                            <div className="bg-emerald-50/50 px-4 py-3 sm:px-5 sm:py-3 border-t border-emerald-100/50 flex flex-row justify-between items-center gap-2">
                                                <span className="font-bold text-slate-600 text-sm sm:text-base">รวมยอดร้านค้านี้</span>
                                                <span className="font-bold text-base sm:text-lg text-emerald-700">
                                                    {formatCurrency(storeTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {(!target.stores || target.stores.length === 0) && (
                                    <div className="text-center py-10 sm:py-12 text-sm sm:text-base text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                        ไม่มีร้านค้าถูกบันทึกไว้ในเป้าหมายนี้
                                    </div>
                                )}
                            </div>

                            {/* Grand Total */}
                            {totalStores > 0 && (
                                <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-700/50 mt-6 sm:mt-8">
                                    <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-blue-500/10 rounded-full blur-3xl" />
                                    <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500/10 rounded-full blur-3xl" />

                                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <span className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider block mb-1">
                                                รวมเป้าหมายทั้งหมด
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-slate-500">รวมจากทุกร้านค้า</span>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-emerald-400 text-base sm:text-lg font-medium">฿</span>
                                                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight break-all">
                                                    {formatCurrency(grandTotal).replace('฿', '').trim()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* History Tab Content */}
                        <TabsContent value="history" className="p-4 sm:p-6 lg:p-8 mt-0">
                            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                                <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-linear-to-br from-blue-100 to-indigo-100">
                                    <HistoryIcon className="w-4 h-4 text-blue-600" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-800">ประวัติการเปลี่ยนแปลง</h2>
                            </div>
                            <SalesTargetHistoryTab salesTargetId={id} />
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}

