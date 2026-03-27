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
import { AlertTriangle, Package } from "lucide-react";

interface LowStockTableProps {
  products: {
    id: string;
    code: string;
    name: string;
    physicalBalance: number;
    reservedQuantity: number;
    availableQuantity: number;
  }[];
  formatNumber: (num: number) => string;
}

export function LowStockTable({ products, formatNumber }: LowStockTableProps) {
  return (
    <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          สินค้าใกล้หมด (คงเหลือ &lt; 50)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!products || products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>ไม่มีสินค้าใกล้หมด</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[780px]">
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead className="text-right">คงเหลือจริง</TableHead>
                  <TableHead className="text-right">จอง</TableHead>
                  <TableHead className="text-right">พร้อมขาย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.code}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(product.physicalBalance)}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      {formatNumber(product.reservedQuantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          product.availableQuantity <= 10
                            ? "bg-red-100 text-red-800 border-red-300"
                            : product.availableQuantity <= 30
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : ""
                        }
                      >
                        {formatNumber(product.availableQuantity)}
                      </Badge>
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
