import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag, ShoppingCart, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  customerSalesDetails,
  customerStores,
} from "@/app/(main)/reports/customer-sales/data";

const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);

type CustomerSalesDetailPageProps = {
  params: { customerId: string };
};

export default function CustomerSalesDetailPage({
  params,
}: CustomerSalesDetailPageProps) {
  const store = customerStores.find((item) => item.id === params.customerId);
  const detail = customerSalesDetails[params.customerId];

  if (!store || !detail) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <Link href="/reports/customer-sales">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                {store.name}
              </h1>
              <Badge variant="outline">{store.type}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {store.code} • {store.province}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border bg-white/80">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">ยอดขายรวม</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-semibold text-emerald-600">
                {formatTHB(detail.totalSales)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border bg-white/80">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">ค่าเฉลี่ย/ออเดอร์</p>
                <ShoppingCart className="h-4 w-4 text-sky-500" />
              </div>
              <p className="text-2xl font-semibold">
                {formatTHB(detail.avgPerOrder)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border bg-white/80">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  ซื้อเฉลี่ย 0.1 ครั้ง/เดือน
                </p>
                <Badge className="bg-amber-100 text-amber-700">0.1</Badge>
              </div>
              <p className="text-2xl font-semibold">
                {detail.avgMonthlyPurchase.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="rounded-2xl border bg-white/80">
            <CardHeader>
              <CardTitle className="text-base">สินค้าที่ซื้อบ่อย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {detail.frequentProducts.map((product) => (
                <div
                  key={product}
                  className="flex items-center justify-between rounded-xl border border-dashed p-3"
                >
                  <span className="font-medium">{product}</span>
                  <Badge variant="outline">ยอดนิยม</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border bg-white/80">
            <CardHeader>
              <CardTitle className="text-base">สินค้าที่เคยสั่งซื้อ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {detail.purchasedProducts.map((product) => (
                  <Badge key={product} variant="secondary">
                    {product}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border bg-white/80">
          <CardHeader>
            <CardTitle className="text-base">ประวัติการซื้อ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เลขที่ออเดอร์</TableHead>
                    <TableHead className="text-right">จำนวนรายการ</TableHead>
                    <TableHead className="text-right">มูลค่า</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.purchaseHistory.map((order) => (
                    <TableRow key={order.orderNo}>
                      <TableCell>{order.date}</TableCell>
                      <TableCell className="font-medium">
                        {order.orderNo}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.items}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatTHB(order.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
