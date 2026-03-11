"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency-utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, History, Info } from "lucide-react";
import { MONTHS } from "../../constants";
import { SalesTargetHistoryTab } from "./sales-target-history-tab";

interface SalesTargetDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: any;
}

export function SalesTargetDetailDialog({
    open,
    onOpenChange,
    target,
}: SalesTargetDetailDialogProps) {
    if (!target) return null;

    const monthLabel =
        MONTHS.find((m) => m.value === target.month)?.label ?? "-";

    const grandTotal =
        target.stores?.reduce(
            (storeSum: number, store: any) =>
                storeSum +
                (store.items?.reduce(
                    (itemSum: number, item: any) =>
                        itemSum + Number(item.targetAmount),
                    0,
                ) ?? 0),
            0,
        ) ?? 0;

    const totalStores = target.stores?.length ?? 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="text-lg font-bold">
                        รายละเอียดเป้าหมายการขาย
                    </DialogTitle>
                    {/* Summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mt-3">
                        <div className="space-y-0.5">
                            <div className="font-semibold text-slate-500 text-xs">พนักงานขาย</div>
                            <div className="text-base font-medium">
                                {target.employee?.name}
                            </div>
                            <div className="text-slate-500 text-xs">
                                {target.employee?.employeeCode || "-"}
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <div className="font-semibold text-slate-500 text-xs">ประจำเดือน</div>
                            <div className="text-base font-medium">
                                {monthLabel} {target.year + 543}
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <div className="font-semibold text-slate-500 text-xs">จำนวนร้านค้า</div>
                            <div className="text-base font-medium">
                                {totalStores} ร้าน
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Tabs */}
                <Tabs defaultValue="detail" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="mx-6 mt-1 shrink-0 w-fit">
                        <TabsTrigger value="detail" className="gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            รายละเอียด
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-1.5">
                            <History className="w-3.5 h-3.5" />
                            ประวัติการเปลี่ยนแปลง
                        </TabsTrigger>
                    </TabsList>

                    {/* Detail Tab */}
                    <TabsContent
                        value="detail"
                        className="flex-1 overflow-y-auto px-6 pb-6 mt-0 data-[state=inactive]:hidden"
                    >
                        <div className="grid gap-4 pt-4">
                            {/* Stores & Items */}
                            <div className="space-y-4">
                                {target.stores?.map((store: any, storeIdx: number) => {
                                    const storeTotal =
                                        store.items?.reduce(
                                            (sum: number, item: any) =>
                                                sum + Number(item.targetAmount),
                                            0,
                                        ) ?? 0;

                                    return (
                                        <div
                                            key={store.id || storeIdx}
                                            className="border rounded-xl overflow-hidden"
                                        >
                                            {/* Store Header */}
                                            <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                                    <span className="font-semibold text-slate-800">
                                                        {store.customer?.name || "-"}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        ({store.customer?.customerCode || "-"})
                                                    </span>
                                                </div>
                                                <Badge variant="secondary">
                                                    {store.items?.length || 0} สินค้า
                                                </Badge>
                                            </div>

                                            {/* Items Table */}
                                            <div className="max-h-[300px] overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>สินค้า</TableHead>
                                                            <TableHead className="text-right w-[110px]">
                                                                ราคา/ลัง
                                                            </TableHead>
                                                            <TableHead className="text-right w-[80px]">
                                                                จำนวน
                                                            </TableHead>
                                                            <TableHead className="text-right w-[130px]">
                                                                เป้าหมาย (บาท)
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {store.items?.map((item: any) => (
                                                            <TableRow key={item.id}>
                                                                <TableCell>
                                                                    <div className="font-medium">
                                                                        {item.product?.name}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">
                                                                        {item.product?.productCode}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {formatCurrency(
                                                                        Number(item.pricePerBox),
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {item.qtyPerBox}
                                                                </TableCell>
                                                                <TableCell className="text-right font-semibold text-emerald-700">
                                                                    {formatCurrency(
                                                                        Number(item.targetAmount),
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {(!store.items ||
                                                            store.items.length === 0) && (
                                                                <TableRow>
                                                                    <TableCell
                                                                        colSpan={4}
                                                                        className="text-center py-6 text-slate-400"
                                                                    >
                                                                        ไม่มีรายการสินค้า
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            {/* Store subtotal */}
                                            <div className="bg-slate-50/50 px-4 py-2 border-t flex justify-between items-center text-sm">
                                                <span className="text-slate-600">
                                                    รวมร้านนี้
                                                </span>
                                                <span className="font-semibold text-emerald-700">
                                                    {formatCurrency(storeTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {(!target.stores || target.stores.length === 0) && (
                                    <div className="text-center py-8 text-slate-400 border rounded-xl">
                                        ไม่มีร้านค้า
                                    </div>
                                )}
                            </div>

                            {/* Grand Total */}
                            <div className="bg-slate-900 rounded-xl px-4 py-4 flex justify-between items-center">
                                <span className="text-slate-300 font-medium">
                                    รวมทั้งหมด
                                </span>
                                <span className="text-emerald-400 text-xl font-bold">
                                    {formatCurrency(grandTotal)}
                                </span>
                            </div>
                        </div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent
                        value="history"
                        className="flex-1 overflow-y-auto px-6 pb-6 mt-0 data-[state=inactive]:hidden"
                    >
                        <div className="pt-4">
                            <SalesTargetHistoryTab salesTargetId={target.id} />
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
