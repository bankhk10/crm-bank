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

interface AllProductsTableProps {
  products: {
    id: string;
    code: string;
    name: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    totalPackageSold: number;
    packageUnit: string;
    packageSizeUnit: string;
  }[];
  formatTHB: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatPackSize: (value: number, unit?: string) => string;
}

export function AllProductsTable({
  products,
  formatTHB,
  formatNumber,
  formatPackSize,
}: AllProductsTableProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
      <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">รายละเอียดสินค้าทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[450px] overflow-auto">
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>ลำดับ</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead className="text-right">ยอดขาย</TableHead>
                    <TableHead className="text-right">จำนวนที่ขาย</TableHead>
                    <TableHead className="text-right">จำนวนออเดอร์</TableHead>
                    <TableHead className="text-right">บรรจุขายได้</TableHead>
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
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatTHB(product.totalSales)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(product.totalQuantity)}
                      </TableCell>
                      <TableCell className="text-right text-slate-700 font-medium">
                        {formatNumber(product.orderCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-red-700">
                          {formatPackSize(
                            product.totalPackageSold,
                            product.packageUnit,
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
