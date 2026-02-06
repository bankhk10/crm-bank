"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  CreditCard,
  User,
  Calendar,
  TrendingDown,
  Truck,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { FormTextarea } from "@/components/custom/FormTextarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePermission } from "@/hooks/use-permission";
import type { SaleDetailResponse } from "@/types/sales";
import { PaymentTermLabels } from "@/types/sales";

export default function ApproveSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { allowed, isLoading } = usePermission("sale.approve");

  const [data, setData] = useState<SaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: approveNotes }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      router.push(`/sales/${id}`);
    } catch (err: any) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return setError("กรุณาระบุเหตุผลในการไม่อนุมัติ");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      router.push(`/sales/${id}`);
    } catch (err: any) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  /* Loading ------------------------------------------------------------------------------------------------------*/
  if (isLoading || loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin h-14 w-14 border-4 border-blue-300 border-t-blue-700 rounded-full"></div>
        <p className="text-gray-600 ml-4 text-lg">กำลังโหลดข้อมูล...</p>
      </div>
    );

  if (!allowed)
    return (
      <div className="p-10 max-w-xl mx-auto">
        <Alert
          variant="destructive"
          className="border-l-4 border-red-600 text-base p-4"
        >
          <AlertTriangle className="mr-2" /> ไม่มีสิทธิ์เข้าถึงหน้านี้
        </Alert>
      </div>
    );

  if (!data) return null;

  const { sale, priceWarnings, stockWarnings, creditInfo } = data;

  if (sale.status !== "PENDING_APPROVAL")
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <Card className="border-l-4 border-yellow-500 shadow-md">
          <CardContent className="py-6">
            <AlertTriangle className="text-yellow-600 mx-auto h-8 w-8" />
            <p className="mt-4 text-gray-700 font-medium">
              รายการนี้ไม่ได้อยู่ในสถานะรออนุมัติ
            </p>
          </CardContent>
        </Card>
        <Button
          onClick={() => router.push(`/sales/${sale.id}`)}
          className="mt-6"
        >
          <ArrowLeft className="mr-2 h-4" /> กลับสู่หน้ารายละเอียด
        </Button>
      </div>
    );

  /* MAIN UI ------------------------------------------------------------------------------------------------------*/

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Sale Summary Card */}
      <Card className="!py-0 rounded-3xl shadow-2xl bg-white border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 sm:p-8 rounded-t-3xl">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="inline-flex items-center text-blue-100 hover:text-white transition-colors group hover:bg-white/10 w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับไปหน้ารายการขาย
          </Button>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                  พิจารณาอนุมัติรายการขาย
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base">
                  <span className="font-mono font-bold text-blue-100 bg-white/10 px-3 py-1 rounded-lg w-fit">
                    {sale.saleNumber}
                  </span>
                  <span className="text-blue-100 hidden sm:inline">•</span>
                  <span className="text-blue-50 font-medium truncate">
                    {sale.customer.name}
                  </span>
                </div>
              </div>
            </div>
            <Badge className="px-4 py-2 bg-amber-400 text-amber-900 border-0 text-sm font-bold shadow-lg w-fit">
              รอการอนุมัติ
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-5 border border-purple-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-purple-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-purple-700 font-bold uppercase tracking-wide">
                  ลูกค้า
                </span>
              </div>
              <p
                className="font-bold text-gray-900 text-base sm:text-lg truncate"
                title={sale.customer.name}
              >
                {sale.customer.name}
              </p>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 border border-green-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-green-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-green-700 font-bold uppercase tracking-wide">
                  พนักงานขาย
                </span>
              </div>
              <p
                className="font-bold text-gray-900 text-base sm:text-lg truncate"
                title={sale.employee.name}
              >
                {sale.employee.name}
              </p>
            </div>

            <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-blue-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-blue-700 font-bold uppercase tracking-wide">
                  เงื่อนไขชำระ
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-sm font-bold px-3 py-1.5 bg-white border-blue-300 text-blue-700 max-w-full"
                title={PaymentTermLabels[sale.paymentTerm]}
              >
                <span className="truncate block">
                  {PaymentTermLabels[sale.paymentTerm]}
                </span>
              </Badge>
            </div>

            <div className="group bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-5 border border-orange-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-orange-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-orange-700 font-bold uppercase tracking-wide">
                  วันที่ขาย
                </span>
              </div>
              <p className="font-bold text-gray-900 text-base sm:text-lg truncate">
                {format(new Date(sale.saleDate), "dd MMM yyyy", {
                  locale: th,
                })}
              </p>
            </div>
          </div>

          {/* Notes Section */}
          {sale.notes && (
            <div className="mt-6 group">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 rounded-2xl p-5 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-red-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-red-600 font-bold uppercase tracking-wide">
                    หมายเหตุ
                  </span>
                </div>

                <p className="text-red-600 whitespace-pre-wrap text-lg leading-relaxed">
                  {sale.notes}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Change Warning */}
      {priceWarnings.length > 0 && (
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50 to-amber-50 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-3 text-lg text-orange-900">
              <div className="p-2 bg-orange-100 rounded-xl">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              พบการเปลี่ยนแปลงราคา
            </CardTitle>
            <p className="text-sm text-orange-800">
              กรุณาตรวจสอบรายการด้านล่างก่อนอนุมัติ
              ระบบตรวจพบการแก้ไขราคาจากค่ามาตรฐาน
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {priceWarnings.map((w, i) => {
              const original = Number(w.originalPrice ?? 0);
              const modified = Number(w.modifiedPrice ?? 0);
              const diff = modified - original;
              const diffPercent = original ? (diff / original) * 100 : 0;
              const diffPositive = diff >= 0;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-orange-200 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-base">
                      {w.productName}
                    </p>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs w-fit">
                      ปรับราคา
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
                    <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                      <span className="text-gray-500 text-xs">ราคาเดิม</span>
                      <p className="text-gray-700 font-semibold line-through">
                        ฿
                        {original.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="rounded-xl bg-orange-50 p-3 border border-orange-100">
                      <span className="text-gray-500 text-xs">
                        ราคาปัจจุบัน
                      </span>
                      <p className="text-orange-700 font-bold">
                        ฿
                        {modified.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 border border-orange-100">
                      <span className="text-gray-500 text-xs">ส่วนต่าง</span>
                      <p
                        className={`font-bold ${diffPositive ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        {diffPositive ? "+" : ""}
                        {diff.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        บาท
                        <span className="text-xs block text-gray-500">
                          ({diffPercent.toFixed(2)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Stock Warning */}
      {stockWarnings.length > 0 && (
        <Alert className="border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900 text-sm p-4 leading-relaxed block">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold">สินค้าบางรายการสต็อกไม่พอ</span>
          </div>
          <div className="space-y-1 ml-6">
            {stockWarnings.map((w, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-1">
                <span>•</span>
                <span className="font-medium">{w.productName}</span>
                <span>เหลือ</span>
                <span className="font-semibold text-red-600">
                  {w.available}
                </span>
                <span>ต้องใช้</span>
                <span className="font-semibold text-red-600">
                  {w.requested}
                </span>
              </div>
            ))}
          </div>
        </Alert>
      )}

      {/* 💳 Credit Information — Glass Premium UI */}
      {sale.paymentTerm !== "PREPAID" && (
        <Card
          className={`backdrop-blur-lg rounded-2xl p-6 shadow-sm border-2 ${creditInfo.willExceedLimit
            ? "border-red-300 bg-red-50/60"
            : "border-green-300 bg-green-50/60"
            }`}
        >
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <CreditCard className="text-blue-600" /> ข้อมูลวงเงินเครดิต
            {creditInfo.willExceedLimit && (
              <Badge variant="destructive" className="ml-2 text-xs px-2 py-1">
                เกินวงเงิน
              </Badge>
            )}
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-sm text-gray-600">วงเงิน</span>
              <p className="font-bold text-xl text-gray-900 mt-1">
                ฿{creditInfo.creditLimit.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-sm text-gray-600">คงเหลือ</span>
              <p
                className={`font-bold text-xl mt-1 ${creditInfo.willExceedLimit ? "text-red-600" : "text-green-600"
                  }`}
              >
                ฿{creditInfo.availableCredit.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-sm text-gray-600">ยอดขายนี้</span>
              <p className="font-bold text-xl text-purple-600 mt-1">
                ฿{creditInfo.currentSaleAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ========================== 📦 รายการสินค้า ========================== */}
      <Card className="!py-0 rounded-3xl shadow-xl border-2 border-blue-100 overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="p-6 border-b-2 border-blue-100 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-3xl">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-white">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
              <Package className="h-6 w-6 text-white" />
            </div>
            รายการสินค้า
          </CardTitle>
        </CardHeader>

        {/* 📱 Mobile Card View */}
        <div className="block lg:hidden">
          <div className="p-4 space-y-3">
            {sale.items.map((item, i) => {
              const currentUnitPrice = Number(item.unitPrice ?? 0);
              const quantity = Number(item.quantity ?? 0);
              const currentTotal = Number(
                item.totalPrice ?? currentUnitPrice * quantity,
              );
              const priceChanged = Boolean(item.priceModified);

              const packSize = parseFloat(item.product.packageSizePerBox || "1");
              const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
              const cartonPrice = currentUnitPrice * multiplier;

              return (
                <div
                  key={item.id ?? i}
                  className={`rounded-2xl border-2 p-4 transition-all shadow-sm ${priceChanged
                    ? "bg-orange-50/70 border-orange-300"
                    : "bg-white border-gray-100"
                    }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.product.productCode}
                      </p>
                      {priceChanged && (
                        <Badge className="mt-2 bg-orange-100 text-orange-700 border-orange-200 text-xs">
                          รายการพิเศษ
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Row 1: Package Size & Quantity */}
                    <div className="bg-gray-50 rounded-lg p-2">
                      <span className="text-gray-500 text-xs block mb-1">
                        บรรจุ
                      </span>
                      <p className="font-bold text-gray-900">
                        {item.product.packageSizePerBox || "-"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <span className="text-gray-500 text-xs block mb-1">
                        จำนวน
                      </span>
                      <p className="font-bold text-gray-900">{item.quantity} ลัง</p>
                    </div>

                    {/* Row 2: Unit Price & Carton Price */}
                    <div className="bg-gray-50 rounded-lg p-2">
                      <span className="text-gray-500 text-xs block mb-1">
                        ราคา/หน่วย
                      </span>
                      <p
                        className={`font-bold ${priceChanged ? "text-orange-700" : "text-gray-900"
                          }`}
                      >
                        {currentUnitPrice.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <span className="text-gray-500 text-xs block mb-1">
                        ราคา/ลัง
                      </span>
                      <p className="font-bold text-gray-900">
                        {cartonPrice.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {/* Row 3: Total */}
                    <div className="col-span-2 bg-blue-50/50 rounded-lg p-3 text-right">
                      <span className="text-gray-500 text-xs block mb-1">
                        ราคารวม
                      </span>
                      <p
                        className={`font-bold text-lg ${priceChanged ? "text-orange-700" : "text-blue-600"
                          }`}
                      >
                        {currentTotal.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-t-2 border-blue-200 p-5 space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                รวมเป็นเงิน
              </span>
              <span className="text-base font-bold text-gray-900">
                {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {Number(sale.shippingCost) > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">ส่วนค่าขนส่ง</span>
                <span className="text-base font-semibold text-red-600">
                  -
                  {Number(sale.shippingCost).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            {Number(sale.otherCosts) > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">ส่วนลดหน้าบิล</span>
                <span className="text-base font-semibold text-red-600">
                  -
                  {Number(sale.otherCosts).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t-2 border-blue-300">
              <span className="text-lg font-bold text-gray-900">ยอดสุทธิ</span>
              <span className="text-2xl font-bold text-blue-700">
                {Number(sale.totalAmount).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* 💻 Desktop Table View */}
        <div className="hidden lg:block">
          <div className="p-6 space-y-3">
            <div className="grid grid-cols-12 gap-4 px-5 py-2 text-sm text-gray-500 font-semibold border-b border-gray-100">
              <div className="col-span-4">สินค้า</div>
              <div className="col-span-2 text-center">บรรจุ</div>
              <div className="col-span-1 text-center">จำนวน</div>
              <div className="col-span-2 text-right">ราคา/หน่วย</div>
              <div className="col-span-2 text-right">ราคา/ลัง</div>
              <div className="col-span-1 text-right">รวม</div>
            </div>
            {sale.items.map((item, i) => {
              const originalUnitPrice = Number(
                item.originalPrice ?? item.unitPrice ?? 0
              );
              const currentUnitPrice = Number(item.unitPrice ?? 0);
              const quantity = Number(item.quantity ?? 0);
              const currentTotal = Number(
                item.totalPrice ?? currentUnitPrice * quantity
              );
              const originalTotal = originalUnitPrice * quantity;
              const priceChanged = Boolean(item.priceModified);

              const packSize = parseFloat(item.product.packageSizePerBox || "1");
              const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
              const cartonPrice = currentUnitPrice * multiplier;

              return (
                <div
                  key={item.id ?? i}
                  className={`rounded-2xl border-2 p-4 transition-all shadow-sm hover:shadow-md ${priceChanged
                    ? "bg-orange-50/70 border-orange-300"
                    : "bg-white border-gray-100"
                    }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Product Info */}
                    <div className="col-span-4">
                      <div className="flex items-start gap-3">
                        <div>
                          <p className="font-bold text-gray-900 text-base">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.product.productCode}
                          </p>
                          {priceChanged && (
                            <Badge className="mt-2 bg-orange-100 text-orange-700 border-orange-200 text-xs">
                              รายการพิเศษ
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Package Size */}
                    <div className="col-span-2 text-center">
                      <p className="text-gray-900">
                        {item.product.packageSizePerBox || "-"}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 text-center">
                      <p className="font-bold text-gray-900 text-lg">
                        {item.quantity}
                      </p>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2 text-right">
                      <p
                        className={`font-bold text-lg ${priceChanged ? "text-orange-700" : "text-gray-900"
                          }`}
                      >
                        {currentUnitPrice.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      {priceChanged && (
                        <p className="text-xs text-gray-500 line-through mt-1">
                          {originalUnitPrice.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Carton Price */}
                    <div className="col-span-2 text-right">
                      <p className="font-bold text-gray-900 text-lg">
                        {cartonPrice.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {/* Total */}
                    <div className="col-span-1 text-right">
                      <p
                        className={`font-bold text-xl ${priceChanged ? "text-orange-700" : "text-blue-600"
                          }`}
                      >
                        {currentTotal.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      {priceChanged && (
                        <p className="text-xs text-gray-500 line-through mt-1">
                          {originalTotal.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-t-2 border-blue-200 p-6">
            <div className="max-w-md ml-auto">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  รวมเป็นเงิน
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {Number(sale.shippingCost) > 0 && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">ส่วนค่าขนส่ง</span>
                  <span className="text-lg font-semibold text-red-600">
                    -
                    {Number(sale.shippingCost).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {Number(sale.otherCosts) > 0 && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">ส่วนลดหน้าบิล</span>
                  <span className="text-lg font-semibold text-red-600">
                    -
                    {Number(sale.otherCosts).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t-2 border-blue-300">
                <span className="text-xl font-bold text-gray-900">
                  ยอดสุทธิ
                </span>
                <span className="text-3xl font-bold text-blue-700">
                  {Number(sale.totalAmount).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 🧊 Sticky Bottom Action Bar Modern Glass UI */}
      <div className="sticky bottom-24 sm:bottom-6 z-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-row justify-center items-center gap-3 sm:gap-4">
          <Button
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
            className="flex-1 sm:flex-none sm:w-auto relative bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-4 sm:px-8 h-12 rounded-xl font-semibold min-w-0 sm:min-w-[160px] shadow-lg hover:shadow-xl transition-all overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <XCircle className="h-5 w-5 mr-2 relative z-10" />
            <span className="relative z-10">ไม่อนุมัติ</span>
          </Button>

          <Button
            onClick={() => setShowApproveDialog(true)}
            className="flex-1 sm:flex-none sm:w-auto relative bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 sm:px-8 h-12 rounded-xl font-semibold min-w-0 sm:min-w-[160px] shadow-lg hover:shadow-xl transition-all overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <CheckCircle className="h-5 w-5 mr-2 relative z-10" />
            <span className="relative z-10">อนุมัติ</span>
          </Button>
        </div>
      </div>
      {/* APPROVE DIALOG */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center">
              <CheckCircle className="text-green-600" /> ยืนยันอนุมัติ
            </DialogTitle>
            <DialogDescription>
              อนุมัติรายการเลข <b>{sale.saleNumber}</b> มูลค่า
              <b className="text-green-600">
                {" "}
                ฿{sale.totalAmount.toLocaleString()}
              </b>
            </DialogDescription>
          </DialogHeader>

          <FormTextarea
            label="หมายเหตุ"
            value={approveNotes}
            onChange={(e) => setApproveNotes(e.target.value)}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 text-white">
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT  DIALOG */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center text-red-600">
              <XCircle /> ไม่อนุมัติรายการ
            </DialogTitle>
          </DialogHeader>

          <FormTextarea
            label="เหตุผล (*)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            error={!rejectReason.trim() ? "จำเป็นต้องระบุ" : ""}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim()}
              onClick={handleReject}
            >
              ยืนยันไม่อนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
