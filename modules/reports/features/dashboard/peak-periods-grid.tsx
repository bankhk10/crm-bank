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
import { Clock } from "lucide-react";

interface PeakPeriodsGridProps {
  peakPeriods: {
    productId: string;
    productName: string;
    peakMonth: string;
    peakSales: number;
  }[];
  formatTHB: (amount: number) => string;
}

export function PeakPeriodsGrid({
  peakPeriods,
  formatTHB,
}: PeakPeriodsGridProps) {
  return (
    <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          ช่วงเวลาขายดีที่สุดของสินค้า (ตามช่วงเวลาที่เลือก)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>ลำดับ</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead className="text-center">ช่วงเวลาที่ขายดีที่สุด</TableHead>
                <TableHead className="text-center">ยอดขายสูงสุด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peakPeriods?.map((item, idx) => (
                <TableRow key={item.productId}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        idx < 3
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : ""
                      }
                    >
                      {idx + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <p className="font-medium text-sm">{item.productName}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {item.peakMonth}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-red-600">
                      {formatTHB(item.peakSales)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
