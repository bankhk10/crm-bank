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

interface GroupPerformanceTableProps {
  groups: {
    group: string;
    totalSales: number;
    totalQuantity: number;
    totalVolumeLiters: number;
    orderCount: number;
    productCount: number;
    avgSalesPerProduct: number;
  }[];
  volumeUnit: string;
  formatTHB: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatVolume: (v: number) => string;
}

export function GroupPerformanceTable({
  groups,
  volumeUnit,
  formatTHB,
  formatNumber,
  formatVolume,
}: GroupPerformanceTableProps) {
  return (
    <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">ข้อมูลการขายแยกตามกลุ่มสินค้า (ตามช่วงเวลาที่เลือก)</CardTitle>
      </CardHeader>
      <CardContent>
        {!groups || groups.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            ไม่พบข้อมูลผลงานแต่ละกลุ่มสินค้า
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>กลุ่มสินค้า</TableHead>
                  <TableHead className="text-center">ยอดขาย</TableHead>
                  <TableHead className="text-center">จำนวนที่ขาย</TableHead>
                  <TableHead className="text-center">จำนวนออเดอร์</TableHead>
                  <TableHead className="text-center">ขนาดบรรจุรวมที่ขายได้ ({volumeUnit})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group, idx) => (
                  <TableRow key={group.group}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          idx < 3
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : ""
                        }
                      >
                        {idx + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{group.group}</TableCell>
                    <TableCell className="text-center font-semibold text-red-600">
                      {formatTHB(group.totalSales)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatNumber(group.totalQuantity)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatNumber(group.orderCount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-blue-600">
                        {formatVolume(group.totalVolumeLiters)} {volumeUnit}
                      </span>
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
