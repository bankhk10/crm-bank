"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/src/shared/utils/currency.utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>รายละเอียดเป้าหมายการขาย</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <div className="font-semibold text-slate-500">พนักงานขาย</div>
                            <div className="text-base font-medium">
                                {target.employee?.name}
                            </div>
                            <div className="text-slate-500">
                                {target.employee?.employeeCode || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="font-semibold text-slate-500">ลูกค้า/ร้านค้า</div>
                            <div className="text-base font-medium">
                                {target.customer?.name}
                            </div>
                            <div className="text-slate-500">
                                {target.customer?.customerCode || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="font-semibold text-slate-500">ประจำเดือน</div>
                            <div className="text-base font-medium">
                                {target.month}/{target.year}
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b font-medium text-sm flex justify-between items-center">
                            <span>รายการสินค้าเป้าหมาย</span>
                            <Badge variant="secondary">
                                {target.items?.length || 0} รายการ
                            </Badge>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>สินค้า</TableHead>
                                        <TableHead className="text-right w-[100px]">
                                            จำนวน
                                        </TableHead>
                                        <TableHead className="text-right w-[150px]">
                                            ยอดเงิน (บาท)
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {target.items?.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.product?.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    {item.product?.productCode}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(Number(item.amount))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!target.items || target.items.length === 0) && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                className="text-center py-8 text-slate-400"
                                            >
                                                ไม่มีรายการสินค้า
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="bg-slate-50 px-4 py-3 border-t flex justify-between items-center font-semibold">
                            <span>รวมทั้งหมด</span>
                            <span className="text-emerald-600 text-lg">
                                {formatCurrency(
                                    target.items?.reduce(
                                        (sum: number, item: any) => sum + Number(item.amount),
                                        0,
                                    ),
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
