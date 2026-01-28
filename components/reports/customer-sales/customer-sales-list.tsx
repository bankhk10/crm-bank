"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ArrowLeft, Eye, Store } from "lucide-react";
import type {
  CustomerSalesShopSummary,
  NormalizedDateRange,
} from "@/lib/data/report-customer-sales";

interface CustomerSalesListProps {
  initialRange: NormalizedDateRange;
  initialShops: CustomerSalesShopSummary[];
}

const quickRanges = [
  {
    label: "7 วันล่าสุด",
    getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: "30 วันล่าสุด",
    getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: "เดือนนี้",
    getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: "ปีนี้",
    getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
  },
];

const formatTHB = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export function CustomerSalesList({
  initialRange,
  initialShops,
}: CustomerSalesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [range, setRange] = useState({
    from: parseISO(initialRange.from),
    to: parseISO(initialRange.to),
  });
  const [shops, setShops] = useState<CustomerSalesShopSummary[]>(initialShops);

  const rangeLabel = useMemo(
    () =>
      `${format(range.from, "dd/MM/yyyy")} - ${format(
        range.to,
        "dd/MM/yyyy",
      )}`,
    [range.from, range.to],
  );

  const handleFetch = (nextRange = range) => {
    startTransition(async () => {
      const params = new URLSearchParams({
        from: format(nextRange.from, "yyyy-MM-dd"),
        to: format(nextRange.to, "yyyy-MM-dd"),
      });
      const response = await fetch(
        `/api/reports/customer-sales/shops?${params.toString()}`,
      );
      const data = await response.json();
      setShops(data.shops ?? []);
      router.replace(
        `/reports/customer-sales?${params.toString()}`,
        { scroll: false },
      );
    });
  };

  const createDetailHref = (shopId: string) => {
    const params = new URLSearchParams({
      from: format(range.from, "yyyy-MM-dd"),
      to: format(range.to, "yyyy-MM-dd"),
    });
    return `/reports/customer-sales/${shopId}?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              รายงานยอดขายรายร้าน
            </h1>
            <p className="text-sm text-muted-foreground">
              ร้านทั้งหมดตามช่วงเวลาที่เลือก ({rangeLabel})
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit">
          ร้านทั้งหมด {shops.length} ร้าน
        </Badge>
      </div>

      <Card className="rounded-2xl border bg-white/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ช่วงเวลา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                เลือกช่วงเวลา
              </span>
              <DateRangePicker
                from={range.from}
                to={range.to}
                onSelect={(selected) => {
                  if (selected?.from && selected?.to) {
                    setRange({ from: selected.from, to: selected.to });
                  }
                }}
              />
            </div>
            <Button
              onClick={() => handleFetch()}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              โหลดข้อมูล
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickRanges.map((preset) => (
              <Button
                key={preset.label}
                size="sm"
                variant="outline"
                onClick={() => {
                  const next = preset.getValue();
                  setRange(next);
                  handleFetch(next);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <Card className="rounded-2xl border bg-white/70">
          <CardContent className="py-16 text-center space-y-3">
            <Store className="mx-auto h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">ไม่มีข้อมูลร้านในช่วงเวลานี้</p>
              <p className="text-sm text-muted-foreground">
                ลองปรับช่วงเวลาใหม่เพื่อดูรายงาน
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:hidden">
            {shops.map((shop) => (
              <Card key={shop.id} className="rounded-2xl border bg-white/70">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold">{shop.name}</p>
                    <p className="text-xs text-muted-foreground">{shop.code}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">ยอดขายรวม</p>
                      <p className="font-semibold text-emerald-600">
                        {formatTHB(shop.totalSales)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ออเดอร์</p>
                      <p className="font-semibold">{shop.orderCount}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">ซื้อล่าสุด</p>
                      <p className="font-semibold">
                        {shop.lastPurchaseDate
                          ? format(parseISO(shop.lastPurchaseDate), "dd/MM/yyyy")
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={createDetailHref(shop.id)}>
                      <Eye className="mr-2 h-4 w-4" /> ดูรายละเอียด
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-2xl border bg-white/70 hidden sm:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ร้าน</TableHead>
                      <TableHead className="text-right">ยอดขายรวม</TableHead>
                      <TableHead className="text-right">ออเดอร์</TableHead>
                      <TableHead>ซื้อล่าสุด</TableHead>
                      <TableHead className="text-center">รายละเอียด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shops.map((shop) => (
                      <TableRow key={shop.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{shop.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {shop.code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {formatTHB(shop.totalSales)}
                        </TableCell>
                        <TableCell className="text-right">
                          {shop.orderCount}
                        </TableCell>
                        <TableCell>
                          {shop.lastPurchaseDate
                            ? format(
                                parseISO(shop.lastPurchaseDate),
                                "dd/MM/yyyy",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={createDetailHref(shop.id)}>
                              <Eye className="mr-1 h-4 w-4" /> ดูรายละเอียด
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
