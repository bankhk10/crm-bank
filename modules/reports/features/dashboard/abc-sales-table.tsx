"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AbcSalesTableProps {
  abcSales: {
    id: string;
    code: string;
    name: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    productCount: number;
    salesNoteSales?: number;
    salesNoteQuantity?: number;
    salesNoteOrderCount?: number;
    invoiceSales?: number;
    invoiceQuantity?: number;
    invoiceOrderCount?: number;
  }[];
  formatTHB: (amount: number) => string;
  formatNumber: (num: number) => string;
}

export function AbcSalesTable({
  abcSales,
  formatTHB,
  formatNumber,
}: AbcSalesTableProps) {
  const [viewMode, setViewMode] = useState<"salesNote" | "invoice">("salesNote");

  return (
    <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <CardHeader className="mt-4 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="text-lg">
            ยอดขายตามประเภท (ABC Code) (ตามช่วงเวลาที่เลือก)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            {viewMode === "salesNote" ? (
              <>
                <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>แสดงมูลค่ายอดสั่งซื้อรวมทั้งหมดในใบสั่งขาย (Sales Note)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>แสดงเฉพาะออเดอร์ที่ออกใบแจ้งหนี้ / จัดส่งสำเร็จแล้ว (ตรงกับหน้าภาพรวมแดชบอร์ด)</span>
              </>
            )}
          </p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0 self-start sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("salesNote")}
            className={cn(
              "h-8 px-3 text-xs font-semibold rounded-lg transition-all gap-1.5",
              viewMode === "salesNote"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            ยอดสั่งซื้อ (Sales Note)
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("invoice")}
            className={cn(
              "h-8 px-3 text-xs font-semibold rounded-lg transition-all gap-1.5",
              viewMode === "invoice"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            ยอด Invoice (ส่งแล้ว)
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!abcSales || abcSales.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            ไม่พบข้อมูลยอดขายตามประเภท (ABC Code)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-center">
                    {viewMode === "salesNote" ? "ยอดขาย (Sales Note)" : "ยอดขาย (Invoice)"}
                  </TableHead>
                  <TableHead className="text-center">จำนวน</TableHead>
                  <TableHead className="text-center">จำนวนออเดอร์</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abcSales.map((row, idx) => {
                  const salesAmount =
                    viewMode === "salesNote"
                      ? (row.salesNoteSales ?? row.totalSales)
                      : (row.invoiceSales ?? 0);
                  const quantity =
                    viewMode === "salesNote"
                      ? (row.salesNoteQuantity ?? row.totalQuantity)
                      : (row.invoiceQuantity ?? 0);
                  const orderCount =
                    viewMode === "salesNote"
                      ? (row.salesNoteOrderCount ?? row.orderCount)
                      : (row.invoiceOrderCount ?? 0);

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            idx < 3
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : ""
                          }
                        >
                          {idx + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-sm text-emerald-700">
                            {row.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-emerald-600 tabular-nums">
                        {formatTHB(salesAmount)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {formatNumber(quantity)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {formatNumber(orderCount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
