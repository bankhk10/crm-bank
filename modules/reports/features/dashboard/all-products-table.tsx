"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.code.toLowerCase().includes(lowerQuery),
    );
  }, [products, searchQuery]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
      <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">
            ข้อมูลการขายสินค้าทั้งหมด (ตามช่วงเวลาที่เลือก)
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหารหัสสินค้า, ชื่อสินค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 border-slate-200 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[450px] overflow-auto">
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>ลำดับ</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead className="text-center">ยอดขาย</TableHead>
                    <TableHead className="text-center">จำนวนที่ขาย</TableHead>
                    <TableHead className="text-center">จำนวนออเดอร์</TableHead>
                    <TableHead className="text-center">ขนาดบรรจุรวมที่ขายได้</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, idx) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              idx < 3 && !searchQuery
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
                        <TableCell className="text-center font-medium">
                          {formatTHB(product.totalSales)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatNumber(product.totalQuantity)}
                        </TableCell>
                        <TableCell className="text-center text-slate-700 font-medium">
                          {formatNumber(product.orderCount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-red-700">
                            {formatPackSize(
                              product.totalPackageSold,
                              product.packageUnit,
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <p>ไม่พบข้อมูลสินค้าที่ค้นหา</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
