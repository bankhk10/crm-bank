"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Truck,
  User,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  AlertTriangle,
  Package,
  MapPin,
  DollarSign,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { usePermission } from "@/hooks/use-permission";
import type { SaleDetailResponse } from "@/types/sales";
import {
  SaleStatusLabels,
  PaymentTermLabels,
  getSaleStatusColor,
} from "@/types/sales";

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermission("menu.sales");
  const canEdit = hasPermission("sale.edit");
  const canApprove = hasPermission("sale.approve");

  const [data, setData] = useState<SaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sales/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sale");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-32 bg-slate-200 animate-pulse rounded" />
            <div className="h-10 w-48 bg-slate-200 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />
              <div className="h-40 bg-slate-200 animate-pulse rounded-xl" />
            </div>
            <div className="space-y-6">
              <div className="h-80 bg-slate-200 animate-pulse rounded-xl" />
              <div className="h-40 bg-slate-200 animate-pulse rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ผิดพลาด</AlertTitle>
          <AlertDescription>{error || "ไม่พบข้อมูลรายการขาย"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          ย้อนกลับ
        </Button>
      </div>
    );
  }

  const { sale, stockWarnings, priceWarnings, creditInfo } = data;
  const canEditThis = canEdit && sale.status === "PENDING";
  const canApproveThis = canApprove && sale.status === "PENDING";
  const canManageFulfillment =
    canEdit &&
    sale.status !== "PENDING" &&
    sale.status !== "REJECTED" &&
    sale.status !== "CANCELLED";

  const paymentTermLabel = (
    PaymentTermLabels[sale.paymentTerm] || sale.paymentTerm
  ).replace(/\s*\(.*?\)/, "");

  return (
    <div className="container mx-auto py-6 sm:py-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-slate-500 hover:text-slate-900"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ย้อนกลับไปหน้ารายการ
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {sale.saleNumber}
            </h1>
            <Badge className={getSaleStatusColor(sale.status)}>
              {SaleStatusLabels[sale.status]}
            </Badge>
          </div>
          <div className="flex items-center text-sm text-slate-500 gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              วันที่ขาย:{" "}
              {format(new Date(sale.saleDate), "dd MMMM yyyy", { locale: th })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEditThis && (
            <Link href={`/sales/${sale.id}/edit`}>
              <Button variant="outline" className="shadow-sm">
                <Edit className="h-4 w-4 mr-2" />
                แก้ไข
              </Button>
            </Link>
          )}
          {canApproveThis && (
            <Link href={`/sales/${sale.id}/approve`}>
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                พิจารณาอนุมัติ
              </Button>
            </Link>
          )}
          {canManageFulfillment && (
            <Link href={`/sales/${sale.id}/fulfillment`}>
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
              >
                <Truck className="h-4 w-4 mr-2" />
                จัดการสถานะและการจัดส่ง
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Warnings */}
      <div className="space-y-3">
        {stockWarnings.length > 0 && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              แจ้งเตือนสินค้าคงคลัง
            </AlertTitle>
            <AlertDescription className="text-red-700">
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                {stockWarnings.map((w, i) => (
                  <li key={i}>
                    <span className="font-medium">{w.productName}</span>:
                    สินค้าไม่เพียงพอ (มี {w.available} / ต้องการ {w.requested})
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {priceWarnings.length > 0 && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">
              แจ้งเตือนราคาขาย
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                {priceWarnings.map((w, i) => (
                  <li key={i}>
                    <span className="font-medium">{w.productName}</span>:
                    มีการแก้ไขราคาจาก ฿{w.originalPrice.toLocaleString()} เป็น ฿
                    {w.modifiedPrice.toLocaleString()} (
                    {w.percentageDiff > 0 ? "+" : ""}
                    {w.percentageDiff.toFixed(2)}%)
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {sale.status === "REJECTED" && sale.rejectionReason && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>รายการนี้ไม่ได้รับการอนุมัติ</AlertTitle>
            <AlertDescription>
              <strong>เหตุผล:</strong> {sale.rejectionReason}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items, Addresses, Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Section */}
          <Card className="overflow-hidden shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">รายการสินค้า</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 font-medium">สินค้า</th>
                      <th className="py-3 px-4 text-right font-medium">
                        จำนวน
                      </th>
                      <th className="py-3 px-4 text-right font-medium">
                        ราคา/หน่วย
                      </th>
                      <th className="py-3 px-4 text-right font-medium">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-900">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.product.productCode}
                            </p>
                            {item.priceModified && (
                              <Badge
                                variant="secondary"
                                className="mt-1 text-[10px] h-5 px-1.5 font-normal bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              >
                                ราคาพิเศษ
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right align-top text-slate-700 font-medium">
                          {item.quantity} {item.product.unit || ""}
                        </td>
                        <td className="py-4 px-4 text-right align-top text-slate-600">
                          ฿
                          {Number(item.unitPrice).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 px-4 text-right align-top font-bold text-slate-900">
                          ฿
                          {Number(item.totalPrice).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {sale.items.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.product.productCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          ฿
                          {Number(item.totalPrice).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">
                          ราคา/หน่วย
                        </span>
                        <span>฿{Number(item.unitPrice).toLocaleString()}</span>
                      </div>
                      <div className="h-8 w-px bg-slate-200 mx-2" />
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400">จำนวน</span>
                        <span className="font-medium">
                          {item.quantity} {item.product.unit}
                        </span>
                      </div>
                    </div>

                    {item.priceModified && (
                      <div className="flex justify-start">
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-yellow-50 text-yellow-700 border-yellow-100"
                        >
                          มีการปรับราคา
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-4 w-4" />
                  <CardTitle className="text-base">ที่อยู่วางบิล</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {[
                    sale.customer.addressLine,
                    sale.customer.subdistrict
                      ? `ต.${sale.customer.subdistrict}`
                      : "",
                    sale.customer.district ? `อ.${sale.customer.district}` : "",
                    sale.customer.province ? `จ.${sale.customer.province}` : "",
                    sale.customer.postalCode,
                  ]
                    .filter(Boolean)
                    .join(" ") || "-"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Truck className="h-4 w-4" />
                  <CardTitle className="text-base">ที่อยู่จัดส่ง</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {sale.shippingAddress || "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-slate-700">
                <FileText className="h-4 w-4" />
                <CardTitle className="text-base">หมายเหตุ</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {sale.notes || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary, Customer, Employee, etc. */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="shadow-md border-blue-100 bg-white">
            <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-50">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                <DollarSign className="h-5 w-5" />
                สรุปยอดรวม
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex justify-between text-slate-600">
                <span>รวมเป็นเงิน</span>
                <span>
                  ฿
                  {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ค่าขนส่ง</span>
                <span>
                  ฿
                  {Number(sale.shippingCost).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {Number(sale.otherCosts) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    ค่าใช้จ่ายอื่นๆ
                    {sale.otherCostsDescription && (
                      <span title={sale.otherCostsDescription}>
                        <Info className="h-3 w-3 text-slate-400" />
                      </span>
                    )}
                  </span>
                  <span>
                    ฿
                    {Number(sale.otherCosts).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              <Separator className="my-3" />
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-semibold text-slate-900">
                  สุทธิ
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  ฿
                  {Number(sale.totalAmount).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                ข้อมูลลูกค้า
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-slate-900 text-lg">
                  {sale.customer.name}
                </p>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      {sale.customer.customerCode}
                    </Badge>
                    {sale.customer.taxId && (
                      <span className="text-xs text-slate-500">
                        Tax ID: {sale.customer.taxId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm text-slate-600">
                {sale.customer.phone && (
                  <div className="flex items-start gap-2">
                    <span className="w-16 text-slate-400 shrink-0">โทร</span>
                    <span>{sale.customer.phone}</span>
                  </div>
                )}
                {sale.customer.email && (
                  <div className="flex items-start gap-2">
                    <span className="w-16 text-slate-400 shrink-0">อีเมล</span>
                    <span className="truncate">{sale.customer.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Info Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                การชำระเงิน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                <span className="text-slate-500">เงื่อนไข</span>
                <span className="font-medium text-slate-900">
                  {paymentTermLabel}
                </span>
              </div>

              {sale.paymentTerm !== "PREPAID" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">เครดิต</span>
                    <span>{sale.creditDays} วัน</span>
                  </div>
                  {sale.creditDueDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">ครบกำหนด</span>
                      <span className="text-red-600 font-medium">
                        {format(new Date(sale.creditDueDate), "dd MMM yyyy", {
                          locale: th,
                        })}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Credit Info */}
          {sale.paymentTerm !== "PREPAID" && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  ข้อมูลวงเงินเครดิต
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-xs">
                      วงเงินเครดิต
                    </span>
                    <span className="font-medium">
                      ฿{creditInfo.creditLimit.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">
                      คงเหลือ
                    </span>
                    <span className="font-medium text-green-600">
                      ฿{creditInfo.availableCredit.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">
                      ใช้ไปแล้ว
                    </span>
                    <span>฿{creditInfo.usedCredit.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">
                      ยอดขายนี้
                    </span>
                    <span>
                      ฿{creditInfo.currentSaleAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {sale.usePromotionalCredit && creditInfo.promotionalCredit && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 block text-xs">
                          วงเงินโปรโมชั่น
                        </span>
                        <span>
                          ฿{creditInfo.promotionalCredit.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs">
                          ใช้โปรโมชั่น
                        </span>
                        <span>
                          ฿
                          {(
                            creditInfo.promotionalCreditUsed || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Employee Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                ผู้ดูแลการขาย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {sale.employee.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {sale.employee.employeeCode || "ไม่มีรหัสพนักงาน"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Info */}
          <Card className="shadow-sm border-slate-200 bg-slate-50/50">
            <CardContent className="p-4 space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>สร้างเมื่อ</span>
                <span>
                  {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: th,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>สร้างโดย</span>
                <span>{sale.createdBy.name}</span>
              </div>
              <div className="flex justify-between">
                <span>แก้ไขล่าสุด</span>
                <span>
                  {format(new Date(sale.updatedAt), "dd/MM/yyyy HH:mm", {
                    locale: th,
                  })}
                </span>
              </div>
              {sale.approvedBy && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-green-700">
                    <span>อนุมัติโดย</span>
                    <span>{sale.approvedBy.name}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>วันที่อนุมัติ</span>
                    <span>
                      {sale.approvedAt
                        ? format(
                            new Date(sale.approvedAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: th }
                          )
                        : "-"}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
