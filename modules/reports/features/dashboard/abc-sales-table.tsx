"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AbcSalesTableProps {
  abcSales: {
    id: string;
    name: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    productCount: number;
  }[];
  formatTHB: (amount: number) => string;
  formatNumber: (num: number) => string;
}

export function AbcSalesTable({
  abcSales,
  formatTHB,
  formatNumber,
}: AbcSalesTableProps) {
  return (
    <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">ยอดขายตามประเภท (ABC Code)</CardTitle>
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
                  <TableHead className="text-right">ยอดขาย</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">จำนวนออเดอร์</TableHead>
                  <TableHead className="text-right">จำนวนสินค้า</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abcSales.map((row, idx) => (
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
                    <TableCell className="font-bold text-emerald-700">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatTHB(row.totalSales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(row.totalQuantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(row.orderCount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.productCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
