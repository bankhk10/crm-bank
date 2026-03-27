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
import { Archive, Package } from "lucide-react";

interface StagnantProductsTableProps {
  products: {
    id: string;
    code: string;
    name: string;
    stock: number;
    daysSinceLastSale: number;
    lastSoldDate?: string | null;
  }[];
  formatNumber: (num: number) => string;
}

export function StagnantProductsTable({
  products,
  formatNumber,
}: StagnantProductsTableProps) {
  return (
    <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Archive className="h-5 w-5 text-purple-500" />
          สินค้าค้างสต๊อก (ไม่มียอดขายใน 90 วัน)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!products || products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>ไม่มีสินค้าค้างสต๊อก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead className="text-center">สต๊อกคงเหลือ</TableHead>
                  <TableHead className="text-center">จำนวนวัน</TableHead>
                  <TableHead>ขายล่าสุด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {formatNumber(product.stock)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 font-medium">
                        {product.daysSinceLastSale === 999
                          ? "ไม่เคยขาย"
                          : `${product.daysSinceLastSale} วัน`}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.lastSoldDate || "-"}
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
