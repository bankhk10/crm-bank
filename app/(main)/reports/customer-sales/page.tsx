import Link from "next/link";
import { Users, ArrowLeft, Eye } from "lucide-react";
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
import { customerStores } from "@/app/(main)/reports/customer-sales/data";

const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);

export default function CustomerSalesReportPage() {
  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              รายงานตามลูกค้า
            </h1>
            <p className="text-muted-foreground text-sm">
              ร้านทั้งหมดและสรุปยอดขายล่าสุด
            </p>
          </div>
        </div>

        <Card className="rounded-2xl border bg-white/80 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">ร้านทั้งหมด</CardTitle>
            <p className="text-sm text-muted-foreground">
              เลือกร้านเพื่อดูรายละเอียดรายงานยอดขาย
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ร้านค้า</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>จังหวัด</TableHead>
                    <TableHead className="text-right">ยอดขายรวม</TableHead>
                    <TableHead className="text-right">
                      เฉลี่ย/ออเดอร์
                    </TableHead>
                    <TableHead className="text-right">ความถี่/เดือน</TableHead>
                    <TableHead className="text-center">ดูรายละเอียด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerStores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{store.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {store.code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{store.type}</Badge>
                      </TableCell>
                      <TableCell>{store.province}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatTHB(store.totalSales)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTHB(store.avgOrderValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {store.purchaseFrequency.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            href={`/reports/customer-sales/${store.id}`}
                            className="inline-flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" /> ดูรายละเอียด
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 lg:hidden">
              {customerStores.map((store) => (
                <Card key={store.id} className="rounded-2xl border bg-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{store.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {store.code} • {store.province}
                        </p>
                      </div>
                      <Badge variant="outline">{store.type}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">ยอดขายรวม</p>
                        <p className="font-semibold text-emerald-600">
                          {formatTHB(store.totalSales)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          เฉลี่ย/ออเดอร์
                        </p>
                        <p className="font-semibold">
                          {formatTHB(store.avgOrderValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          ความถี่/เดือน
                        </p>
                        <p className="font-semibold">
                          {store.purchaseFrequency.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <Button asChild className="w-full">
                      <Link
                        href={`/reports/customer-sales/${store.id}`}
                        className="inline-flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" /> ดูรายละเอียด
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
