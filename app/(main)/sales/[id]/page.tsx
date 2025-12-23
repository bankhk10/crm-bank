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

  const paymentTermLabel = (
    PaymentTermLabels[sale.paymentTerm] || sale.paymentTerm
  ).replace(/\s*\(.*?\)/, "");

  return (
    <div className="container mx-auto py-6 sm:py-8 space-y-6 max-w-5xl">
      {/* Action Header - Keep outside the invoice paper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-slate-500 hover:text-slate-900"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ย้อนกลับ
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              รายละเอียดการขาย
            </h1>
            <Badge className={getSaleStatusColor(sale.status)}>
              {SaleStatusLabels[sale.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <div className="space-y-3 print:hidden">
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

      {/* Invoice Paper Layout */}
      <Card className="shadow-lg border-slate-200 bg-white overflow-hidden print:shadow-none print:border-none">
        <div className="p-8 space-y-8">
          {/* Invoice Header Title */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-wide">
              ใบบันทึกการขาย ( Sales note )
            </h2>
            <p className="text-slate-500 font-medium">{sale.saleNumber}</p>
          </div>

          {/* Top Grid Info Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-slate-300 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            {/* Invoice To */}
            <div className="flex flex-col">
              <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-300 font-semibold text-slate-700 text-sm">
                ที่อยู่วางบิล
              </div>
              <div className="p-4 text-sm text-slate-600 space-y-1 flex-1">
                <p className="font-bold text-slate-900 text-base">
                  {sale.customer.name}
                </p>
                <p>
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
                    .join(" ")}
                </p>
                {sale.customer.taxId && <p>Tax ID: {sale.customer.taxId}</p>}
                {sale.customer.phone && <p>Tel: {sale.customer.phone}</p>}
              </div>
            </div>

            {/* Deliver To */}
            <div className="flex flex-col">
              <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-300 font-semibold text-slate-700 text-sm">
                ที่อยู่จัดส่ง
              </div>
              <div className="p-4 text-sm text-slate-600 whitespace-pre-wrap flex-1">
                {sale.shippingAddress || "ตามที่อยู่ลูกค้า"}
              </div>
            </div>

            {/* Reference Info */}
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

          {/* Product Table */}
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
                {/* Empty rows filler if needed, or just let it be dynamic */}
              </tbody>
            </table>
          </div>

          {/* Footer Section (Notes & Totals) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Notes & Signatures */}
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

            {/* Right Column: Totals */}
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

              <div className="flex justify-between items-center p-2 border border-slate-300 rounded-sm">
                <span className="font-semibold text-slate-600 text-sm">
                  Shipping / ค่าขนส่ง
                </span>
                <span className="font-bold text-slate-900">
                  {Number(sale.shippingCost).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {Number(sale.otherCosts) > 0 && (
                <div className="flex justify-between items-center p-2 border border-slate-300 rounded-sm">
                  <span className="font-semibold text-slate-600 text-sm">
                    {sale.otherCostsDescription || "Other Costs"}
                  </span>
                  <span className="font-bold text-slate-900">
                    {Number(sale.otherCosts).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* VAT Row if applicable - placeholder logic as VAT isn't explicit in schema yet but implied in invoice */}
              {/* <div className="flex justify-between items-center p-2 border border-slate-300 rounded-sm">
                <span className="font-semibold text-slate-600 text-sm">
                  Total VAT (7%)
                </span>
                <span className="font-bold text-slate-900">0.00</span>
              </div> */}

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
    </div>
  );
}
