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
import { TrendingDown } from "lucide-react";

interface SlowProductsTableProps {
  products: {
    id: string;
    code: string;
    name: string;
    productGroup: string | null;
    totalSales: number;
    totalQuantity: number;
    totalVolumeLiters: number;
    totalPackageSold: number;
    packageUnit: string;
    packageSizeUnit: string;
    orderCount: number;
  }[];
  volumeUnit: string;
  formatTHB: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatVolume: (v: number) => string;
  formatPackSize: (value: number, unit?: string) => string;
}

export function SlowProductsTable({
  products,
  volumeUnit,
  formatTHB,
  formatNumber,
  formatVolume,
  formatPackSize,
}: SlowProductsTableProps) {
  return (
    <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-amber-500" />
          สินค้าขายช้า (ตามช่วงเวลาที่เลือก)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>ลำดับ</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead className="text-center">ยอดขาย</TableHead>
                <TableHead className="text-center">จำนวนที่ขาย</TableHead>
                <TableHead className="text-center">ขนาดบรรจุรวมที่ขายได้</TableHead>
                <TableHead className="text-center">จำนวนออเดอร์</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, idx) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        idx < 3
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : ""
                      }
                    >
                      {idx + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-amber-600 font-medium">
                    {formatTHB(product.totalSales)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatNumber(product.totalQuantity)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-amber-700">
                      {formatPackSize(
                        product.totalPackageSold,
                        product.packageUnit,
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{product.orderCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
