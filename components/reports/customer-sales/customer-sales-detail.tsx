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
import { ArrowLeft, CalendarDays, Package, ShoppingBag } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { CustomerSalesShopDetail } from "@/lib/data/report-customer-sales";

interface CustomerSalesDetailProps {
  initialData: CustomerSalesShopDetail;
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

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  APPROVED: { label: "อนุมัติ", variant: "default" },
  PENDING: { label: "รอดำเนินการ", variant: "secondary" },
  DELIVERED: { label: "ส่งแล้ว", variant: "default" },
  REJECTED: { label: "ปฏิเสธ", variant: "destructive" },
  CANCELLED: { label: "ยกเลิก", variant: "destructive" },
  EXPIRED: { label: "หมดอายุ", variant: "outline" },
};

export function CustomerSalesDetail({ initialData }: CustomerSalesDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState({
    from: parseISO(initialData.range.from),
    to: parseISO(initialData.range.to),
  });
  const [page, setPage] = useState(initialData.orders.page);

  const rangeLabel = useMemo(
    () =>
      `${format(range.from, "dd/MM/yyyy")} - ${format(
        range.to,
        "dd/MM/yyyy",
      )}`,
    [range.from, range.to],
  );

  const totalPages = Math.max(1, Math.ceil(data.orders.total / data.orders.pageSize));

  const fetchData = (nextRange = range, nextPage = page) => {
    startTransition(async () => {
      const params = new URLSearchParams({
        from: format(nextRange.from, "yyyy-MM-dd"),
        to: format(nextRange.to, "yyyy-MM-dd"),
        page: String(nextPage),
      });

      const response = await fetch(
        `/api/reports/customer-sales/shops/${data.shop.id}?${params.toString()}`,
      );
      const json = await response.json();
      setData(json);
      setPage(json.orders.page);
      router.replace(
        `/reports/customer-sales/${data.shop.id}?${params.toString()}`,
        { scroll: false },
      );
    });
  };

  const handleRangeChange = (nextRange: { from: Date; to: Date }) => {
    setRange(nextRange);
    setPage(1);
    fetchData(nextRange, 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports/customer-sales">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              {data.shop.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.shop.code} • ช่วงเวลา {rangeLabel}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit">
          ออเดอร์ทั้งหมด {data.summary.totalOrders}
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
              onClick={() => {
                setPage(1);
                fetchData(range, 1);
              }}
              disabled={isPending}
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
                  handleRangeChange(next);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border bg-white/70">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>ยอดขายรวม</span>
                <ShoppingBag className="h-4 w-4" />
              </div>
              <p className="text-xl font-semibold text-emerald-600">
                {formatTHB(data.summary.totalSales)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border bg-white/70">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>ค่าเฉลี่ย/ออเดอร์</span>
                <Package className="h-4 w-4" />
              </div>
              <p className="text-xl font-semibold">
                {formatTHB(data.summary.avgOrderValue)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border bg-white/70">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>ออเดอร์ทั้งหมด</span>
                <ShoppingBag className="h-4 w-4" />
              </div>
              <p className="text-xl font-semibold">{data.summary.totalOrders}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border bg-white/70">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>ซื้อล่าสุด</span>
                <CalendarDays className="h-4 w-4" />
              </div>
              <p className="text-xl font-semibold">
                {data.summary.lastPurchaseDate
                  ? format(parseISO(data.summary.lastPurchaseDate), "dd/MM/yyyy")
                  : "-"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="top-products">
        <TabsList className="bg-white/60 p-2 rounded-xl h-auto w-full flex-wrap gap-2 sm:w-fit">
          <TabsTrigger value="top-products" className="rounded-lg px-4 py-2">
            สินค้าที่ซื้อบ่อย
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg px-4 py-2">
            การเงิน
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-4 py-2">
            ประวัติการซื้อ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top-products" className="mt-6">
          <Card className="rounded-2xl border bg-white/70">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ไม่มีข้อมูลสินค้าที่ซื้อในช่วงเวลานี้
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>สินค้า</TableHead>
                        <TableHead className="text-right">จำนวน</TableHead>
                        <TableHead className="text-right">ยอดขาย</TableHead>
                        <TableHead>ซื้อล่าสุด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.code} {product.brand ? `• ${product.brand}` : ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {product.totalQuantity}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 font-semibold">
                            {formatTHB(product.totalSales)}
                          </TableCell>
                          <TableCell>
                            {product.lastBoughtDate
                              ? format(parseISO(product.lastBoughtDate), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-6">
          <Card className="rounded-2xl border bg-white/70">
            <CardHeader>
              <CardTitle>ยอดขายตามช่วงเวลา</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.finance.series.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ไม่มีข้อมูลการเงินในช่วงเวลานี้
                </p>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.finance.series}>
                        <XAxis dataKey="label" hide />
                        <YAxis hide />
                        <Tooltip
                          formatter={(value: number) => [formatTHB(value), "ยอดขาย"]}
                          labelFormatter={(label) =>
                            data.finance.granularity === "daily"
                              ? `วันที่ ${label}`
                              : `เดือน ${label}`
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="totalSales"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            {data.finance.granularity === "daily"
                              ? "วันที่"
                              : "เดือน"}
                          </TableHead>
                          <TableHead className="text-right">ยอดขาย</TableHead>
                          <TableHead className="text-right">ออเดอร์</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.finance.series.map((item) => (
                          <TableRow key={item.label}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell className="text-right text-emerald-600 font-semibold">
                              {formatTHB(item.totalSales)}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.orderCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="rounded-2xl border bg-white/70">
            <CardHeader>
              <CardTitle>ประวัติการซื้อ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.orders.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ไม่มีรายการสั่งซื้อในช่วงเวลานี้
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>วันที่</TableHead>
                        <TableHead>เลขที่ออเดอร์</TableHead>
                        <TableHead className="text-right">จำนวนสินค้า</TableHead>
                        <TableHead className="text-right">ยอดสุทธิ</TableHead>
                        <TableHead>สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.data.map((order) => {
                        const statusInfo = statusLabels[order.status] || {
                          label: order.status,
                          variant: "outline",
                        };
                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              {format(parseISO(order.saleDate), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>{order.saleNumber}</TableCell>
                            <TableCell className="text-right">
                              {order.totalItems}
                            </TableCell>
                            <TableCell className="text-right text-emerald-600 font-semibold">
                              {formatTHB(order.totalAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant}>
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  หน้า {page} จาก {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isPending}
                    onClick={() => {
                      const nextPage = Math.max(1, page - 1);
                      setPage(nextPage);
                      fetchData(range, nextPage);
                    }}
                  >
                    ก่อนหน้า
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isPending}
                    onClick={() => {
                      const nextPage = Math.min(totalPages, page + 1);
                      setPage(nextPage);
                      fetchData(range, nextPage);
                    }}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
