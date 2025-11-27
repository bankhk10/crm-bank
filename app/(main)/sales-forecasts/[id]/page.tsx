"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SalesForecast, SalesForecastStatus } from "@/types/sales-forecast";

const statusConfig: Record<SalesForecastStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" }> = {
  DRAFT: { label: "ร่าง", variant: "secondary" },
  SUBMITTED: { label: "ส่งแล้ว", variant: "default" },
  APPROVED: { label: "อนุมัติแล้ว", variant: "success" },
  REJECTED: { label: "ปฏิเสธ", variant: "warning" },
};

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export default function SalesForecastDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [forecast, setForecast] = useState<SalesForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sales-forecasts/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch forecast");

        const data = await response.json();
        setForecast(data);
      } catch (error) {
        console.error("Error fetching forecast:", error);
        alert("ไม่สามารถโหลดข้อมูลการพยากรณ์การขายได้");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchForecast();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">กำลังโหลด...</div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">ไม่พบข้อมูลการพยากรณ์การขาย</div>
      </div>
    );
  }

  const status = statusConfig[forecast.status];

  // Group monthly details by month
  const detailsByMonth = forecast.monthlyDetails?.reduce((acc, detail) => {
    if (!acc[detail.month]) {
      acc[detail.month] = [];
    }
    acc[detail.month].push(detail);
    return acc;
  }, {} as Record<number, typeof forecast.monthlyDetails>) || {};

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>
        {forecast.status === "DRAFT" && (
          <Button asChild>
            <Link href={`/sales-forecasts/${params.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              แก้ไข
            </Link>
          </Button>
        )}
      </div>

      {/* Header Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>การพยากรณ์การขายปี {forecast.year}</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">พนักงานขาย</div>
              <div className="font-medium">{forecast.employee?.name}</div>
              {forecast.employee?.employeeCode && (
                <div className="text-sm text-muted-foreground">
                  รหัส: {forecast.employee.employeeCode}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm text-muted-foreground">ยอดรวมทั้งหมด</div>
              <div className="text-2xl font-bold text-blue-600">
                {Number(forecast.totalAmount).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                บาท
              </div>
            </div>

            {forecast.submittedAt && (
              <div>
                <div className="text-sm text-muted-foreground">วันที่ส่ง</div>
                <div>{new Date(forecast.submittedAt).toLocaleDateString("th-TH")}</div>
              </div>
            )}

            {forecast.approvedAt && (
              <div>
                <div className="text-sm text-muted-foreground">วันที่อนุมัติ</div>
                <div>{new Date(forecast.approvedAt).toLocaleDateString("th-TH")}</div>
              </div>
            )}

            {forecast.notes && (
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground">หมายเหตุ</div>
                <div>{forecast.notes}</div>
              </div>
            )}

            {forecast.rejectionReason && (
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground">เหตุผลที่ปฏิเสธ</div>
                <div className="text-destructive">{forecast.rejectionReason}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Details */}
      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดการขายรายเดือน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(detailsByMonth).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              ยังไม่มีรายละเอียดการขาย
            </div>
          ) : (
            Object.entries(detailsByMonth)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([month, details]) => {
                const monthTotal = details.reduce(
                  (sum, d) => sum + Number(d.totalAmount),
                  0
                );

                return (
                  <div key={month} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">
                        {MONTHS[parseInt(month) - 1]}
                      </h3>
                      <div className="text-sm font-medium">
                        ยอดรวม:{" "}
                        <span className="text-blue-600">
                          {monthTotal.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          บาท
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">สินค้า</th>
                            <th className="text-left py-2 px-4">ลูกค้า</th>
                            <th className="text-right py-2 px-4">จำนวน</th>
                            <th className="text-right py-2 px-4">ราคา/หน่วย</th>
                            <th className="text-right py-2 px-4">ยอดรวม</th>
                            <th className="text-left py-2 px-4">หมายเหตุ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.map((detail) => (
                            <tr key={detail.id} className="border-b">
                              <td className="py-2 px-4">
                                <div>{detail.product?.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {detail.product?.productCode}
                                </div>
                              </td>
                              <td className="py-2 px-4">
                                <div>{detail.customer?.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {detail.customer?.customerCode}
                                </div>
                              </td>
                              <td className="py-2 px-4 text-right">
                                {detail.quantity} {detail.product?.unit || ""}
                              </td>
                              <td className="py-2 px-4 text-right">
                                {Number(detail.unitPrice).toLocaleString("th-TH", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-2 px-4 text-right font-medium">
                                {Number(detail.totalAmount).toLocaleString("th-TH", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-2 px-4 text-sm text-muted-foreground">
                                {detail.notes || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
