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
          สินค้าขายช้า (ยอดขายต่ำสุดในช่วงเวลา)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>กลุ่มสินค้า</TableHead>
                <TableHead className="text-right">ยอดขาย</TableHead>
                <TableHead className="text-right">จำนวนที่ขาย</TableHead>
                <TableHead className="text-right">ปริมาณ ({volumeUnit})</TableHead>
                <TableHead className="text-right">บรรจุขายได้</TableHead>
                <TableHead className="text-right">หน่วยบรรจุ</TableHead>
                <TableHead className="text-right">จำนวนออเดอร์</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, idx) => (
                <TableRow key={product.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{product.code}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.productGroup || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-amber-600 font-medium">
                    {formatTHB(product.totalSales)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(product.totalQuantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-blue-600">
                      {formatVolume(product.totalVolumeLiters)} {volumeUnit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-amber-700">
                      {formatPackSize(
                        product.totalPackageSold,
                        product.packageUnit,
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {product.packageSizeUnit || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{product.orderCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
