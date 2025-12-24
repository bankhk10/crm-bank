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
  AlertTriangle,
  FileText,
  User,
  Package,
  MapPin,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

  const { sale, stockWarnings, priceWarnings } = data;
  const canEditThis = canEdit && sale.status === "PENDING";
  const canApproveThis = canApprove && sale.status === "PENDING";
  const canManageFulfillment =
    canEdit &&
    sale.status !== "PENDING" &&
    sale.status !== "REJECTED" &&
    sale.status !== "CANCELLED";

  const paymentTermLabel =
    PaymentTermLabels[sale.paymentTerm] || sale.paymentTerm;

  if (sale.status === "COMPLETED") {
    // Original Invoice Paper Layout
    return (
      <div className="container mx-auto py-6 sm:py-8 space-y-6 max-w-5xl">
        {/* Warnings (preserved) */}
        <div className="space-y-3 print:hidden">
          {/* Same warning logic as before */}
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
                      สินค้าไม่เพียงพอ (มี {w.available} / ต้องการ {w.requested}
                      )
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
                      มีการแก้ไขราคาจาก ฿{w.originalPrice.toLocaleString()} เป็น
                      ฿{w.modifiedPrice.toLocaleString()} (
                      {w.percentageDiff > 0 ? "+" : ""}
                      {w.percentageDiff.toFixed(2)}%)
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Card className="shadow-lg border-slate-200 bg-white overflow-hidden print:shadow-none print:border-none">
          <div className="p-8 space-y-8 relative">
            <div className="absolute top-8 right-8 print:hidden">
              <Badge
                className={`${getSaleStatusColor(
                  sale.status
                )} border-none px-4 py-1.5 text-sm shadow-md backdrop-blur`}
              >
                {SaleStatusLabels[sale.status]}
              </Badge>
            </div>

            {/* Same Invoice Header Title */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-wide">
                ใบบันทึกการขาย ( Sales note )
              </h2>
              <p className="text-slate-500 font-medium">{sale.saleNumber}</p>
            </div>

            {/* Same Top Grid Info Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 border border-slate-300 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="flex flex-col">
                <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-300 font-semibold text-slate-700 text-sm">
                  ที่อยู่วางบิล
                </div>
                <div className="p-4 text-sm text-slate-600 space-y-1 flex-1">
                  <p className="font-bold text-slate-900 text-base">
                    {sale.customer.name}
                  </p>
                  <p>
                    {sale.billingAddress ||
                      [
                        sale.customer.billingAddressLine ||
                          sale.customer.addressLine,
                        sale.customer.billingSubdistrict ||
                        sale.customer.subdistrict
                          ? `ต.${
                              sale.customer.billingSubdistrict ||
                              sale.customer.subdistrict
                            }`
                          : "",
                        sale.customer.billingDistrict || sale.customer.district
                          ? `อ.${
                              sale.customer.billingDistrict ||
                              sale.customer.district
                            }`
                          : "",
                        sale.customer.billingProvince || sale.customer.province
                          ? `จ.${
                              sale.customer.billingProvince ||
                              sale.customer.province
                            }`
                          : "",
                        sale.customer.billingPostalCode ||
                          sale.customer.postalCode,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                  </p>
                  <div>
                    {sale.customer.taxId && (
                      <p>Tax ID: {sale.customer.taxId}</p>
                    )}
                    {sale.customer.phone && <p>Tel: {sale.customer.phone}</p>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-300 font-semibold text-slate-700 text-sm">
                  ที่อยู่จัดส่ง
                </div>
                <div className="p-4 text-sm text-slate-600 whitespace-pre-wrap flex-1">
                  {sale.shippingAddress || "ตามที่อยู่ลูกค้า"}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-300 font-semibold text-slate-700 text-sm">
                  ข้อมูลอ้างอิง
                </div>
                <div className="divide-y divide-slate-200">
                  <div className="flex justify-between p-2 px-4 text-sm">
                    <span className="text-slate-500">วันที่:</span>
                    <span className="font-medium text-slate-900">
                      {format(new Date(sale.saleDate), "dd/MM/yyyy", {
                        locale: th,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 px-4 text-sm">
                    <span className="text-slate-500">เลขที่:</span>
                    <span className="font-medium text-slate-900">
                      {sale.saleNumber}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 px-4 text-sm">
                    <span className="text-slate-500">เงื่อนไขการชำระเงิน:</span>
                    <span className="font-medium text-slate-900">
                      {paymentTermLabel}
                    </span>
                  </div>
                  {sale.creditDueDate && (
                    <div className="flex justify-between p-2 px-4 text-sm">
                      <span className="text-slate-500">วันที่ครบกำหนด:</span>
                      <span className="font-medium text-red-600">
                        {format(new Date(sale.creditDueDate!), "dd/MM/yyyy", {
                          locale: th,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between p-2 px-4 text-sm">
                    <span className="text-slate-500">ผู้ขาย:</span>
                    <span className="font-medium text-slate-900">
                      {sale.employee.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Same Product Table */}
            <div className="border border-slate-300">
              <table className="w-full text-sm">
                <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3 text-left border-r border-slate-300 w-32">
                      รหัสสินค้า
                    </th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">
                      รายละเอียดสินค้า
                    </th>
                    <th className="py-2 px-3 text-right border-r border-slate-300 w-20">
                      จำนวน
                    </th>
                    <th className="py-2 px-3 text-right border-r border-slate-300 w-32">
                      ราคาต่อหน่วย
                    </th>
                    <th className="py-2 px-3 text-right w-32">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-3 text-slate-600 border-r border-slate-300 align-top">
                        {item.product.productCode}
                      </td>
                      <td className="py-3 px-3 text-slate-900 border-r border-slate-300 align-top">
                        <div>{item.product.name}</div>
                        {item.priceModified && (
                          <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1 rounded inline-block mt-1">
                            *ราคาพิเศษ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 border-r border-slate-300 align-top">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 border-r border-slate-300 align-top">
                        {Number(item.unitPrice).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 font-medium align-top">
                        {Number(item.totalPrice).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Same Footer Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {sale.notes && (
                  <div className="border border-slate-300 rounded-sm p-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                      หมายเหตุ
                    </h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {sale.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 max-w-sm ml-auto w-full">
                <div className="flex justify-between items-center p-2 border border-slate-300 rounded-sm">
                  <span className="font-semibold text-slate-600 text-sm">
                    รวมเป็นเงิน
                  </span>
                  <span className="font-bold text-slate-900">
                    {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {Number(sale.shippingCost) > 0 && (
                  <div className="flex justify-between items-center p-2 border border-slate-300 rounded-sm">
                    <span className="font-semibold text-slate-600 text-sm">
                      ส่วนค่าขนส่ง
                    </span>
                    <span className="font-bold text-red-500">
                      -
                      {Number(sale.shippingCost).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}

                {Number(sale.otherCosts) > 0 && (
                  <div className="flex justify-between items-center p-2 border border-slate-300 rounded-sm">
                    <span className="font-semibold text-slate-600 text-sm">
                      ส่วนลดหน้าบิล
                    </span>
                    <span className="font-bold text-red-500">
                      -
                      {Number(sale.otherCosts).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center p-3 bg-slate-100 border border-slate-300 rounded-sm mt-2">
                  <span className="font-bold text-slate-800 text-base">
                    รวมเป็นเงิน
                  </span>
                  <span className="font-bold text-blue-700 text-xl">
                    {Number(sale.totalAmount).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-center print:hidden">
          <Button
            variant="outline"
            className="text-slate-500 hover:text-slate-900"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ย้อนกลับ
          </Button>
        </div>
      </div>
    );
  }

  // Modern Product Detail Style Layout (For non-completed statuses)
  return (
    <div className="min-h-screen from-slate-50 to-blue-50">
      {/* Hero Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <Link
            href="/sales"
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับไปหน้ารายการขาย
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-8 w-8" />
                <h1 className="text-3xl lg:text-4xl font-bold">
                  {sale.saleNumber}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>ลูกค้า: {sale.customer.name}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Badge
                    className={`${getSaleStatusColor(
                      sale.status
                    )} border-none shadow-none text-white bg-transparent p-0`}
                  >
                    {SaleStatusLabels[sale.status]}
                  </Badge>
                </div>
              </div>
            </div>
            {/* Actions for this view could go here if needed, keeping it simple for now */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warnings */}
        <div className="space-y-3 mb-8">
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
                      สินค้าไม่เพียงพอ (มี {w.available} / ต้องการ {w.requested}
                      )
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
                      มีการแก้ไขราคาจาก ฿{w.originalPrice.toLocaleString()} เป็น
                      ฿{w.modifiedPrice.toLocaleString()} (
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

        <div className="space-y-8">
          {/* Bottom Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-blue-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  ข้อมูลลูกค้า
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <DetailItem
                  icon={<User className="h-4 w-4" />}
                  label="ชื่อลูกค้า"
                  value={sale.customer.name}
                />
                <DetailItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Tax ID"
                  value={sale.customer.taxId}
                />
                <DetailItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="ที่อยู่"
                  value={sale.customer.addressLine}
                />
              </div>
            </div>

            {/* Sale Details */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-purple-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  ข้อมูลการขาย
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <DetailItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="วันที่ขาย"
                  value={format(new Date(sale.saleDate), "dd/MM/yyyy", {
                    locale: th,
                  })}
                />
                <DetailItem
                  icon={<CreditCard className="h-4 w-4" />}
                  label="เงื่อนไขชำระเงิน"
                  value={paymentTermLabel}
                />
                <DetailItem
                  icon={<User className="h-4 w-4" />}
                  label="พนักงานขาย"
                  value={sale.employee.name}
                />
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-green-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  การจัดส่ง
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <DetailItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="ที่อยู่จัดส่ง"
                  value={sale.shippingAddress || "ตามที่อยู่ลูกค้า"}
                />
              </div>
            </div>
          </div>

          {/* Main Content (Items & Totals) */}
          <div className="space-y-6">
            {/* Items Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-blue-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-600" />
                  รายการสินค้า
                </h2>
              </div>
              <div className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium text-base">
                    <tr>
                      <th className="py-3 px-4 text-left">สินค้า</th>
                      <th className="py-3 px-4 text-right">จำนวน</th>
                      <th className="py-3 px-4 text-right">ราคา/หน่วย</th>
                      <th className="py-3 px-4 text-right">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sale.items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-4 px-4 align-top">
                          <div className="font-medium text-gray-900">
                            {item.product.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {item.product.productCode}
                          </div>
                          {item.priceModified && (
                            <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded inline-block mt-1">
                              ราคาพิเศษ
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-700 align-top">
                          {item.quantity}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-700 align-top">
                          {Number(item.unitPrice).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 align-top">
                          {Number(item.totalPrice).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Totals Section inside Items Card */}
              <div className="bg-gray-50 p-6 border-t border-gray-100">
                <div className="flex flex-col gap-3 ml-auto max-w-xs">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">รวมเป็นเงิน</span>
                    <span className="font-medium text-gray-900">
                      {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {Number(sale.shippingCost) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ส่วนค่าขนส่ง</span>
                      <span className="font-medium text-red-600">
                        -
                        {Number(sale.shippingCost).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  {Number(sale.otherCosts) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ส่วนลดหน้าบิล</span>
                      <span className="font-medium text-red-600">
                        -
                        {Number(sale.otherCosts).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 my-2 pt-3 flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">
                      ยอดสุทธิ
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      {Number(sale.totalAmount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            {sale.notes && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100 bg-amber-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    หมายเหตุ
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {sale.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      {icon && <div className="text-gray-400 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <dt className="text-xs font-medium text-gray-500 mb-0.5">{label}</dt>
        <dd className="text-sm text-gray-900 font-medium break-words">
          {value || "-"}
        </dd>
      </div>
    </div>
  );
}
