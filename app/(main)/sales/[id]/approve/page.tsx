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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/custom/Textarea";
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

  if (sale.status !== "PENDING")
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
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="border-b bg-white/50 backdrop-blur p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <FileText className="h-4 w-4 sm:h-10 sm:w-10 text-blue-600" />
            </div>
            <span className="text-base sm:text-xl px-5">
              <h1 className="text-2xl font-bold text-gray-900">
                พิจารณาอนุมัติรายการขาย
              </h1>
              <div className="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm sm:text-base">
                <span className="font-mono font-semibold text-blue-600 truncate">
                  {sale.saleNumber}
                </span>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <span className="text-gray-500 truncate">
                  {sale.customer.name}
                </span>
              </div>
            </span>
            <Badge className="px-3 py-1.5 bg-amber-100 text-amber-700 border-amber-200 text-sm justify-end ml-auto">
              รอการอนุมัติ
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  ลูกค้า
                </span>
              </div>
              <p
                className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg truncate"
                title={sale.customer.name}
              >
                {sale.customer.name}
              </p>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  พนักงานขาย
                </span>
              </div>
              <p
                className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg truncate"
                title={sale.employee.name}
              >
                {sale.employee.name}
              </p>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  เงื่อนไขชำระ
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-sm sm:text-base px-2 sm:px-3 py-0.5 sm:py-1 font-semibold"
              >
                {PaymentTermLabels[sale.paymentTerm]}
              </Badge>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  วันที่ขาย
                </span>
              </div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg">
                {format(new Date(sale.saleDate), "dd MMM yyyy", {
                  locale: th,
                })}
              </p>
            </div>
          </div>
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
              กรุณาตรวจสอบรายการด้านล่างก่อนอนุมัติ ระบบตรวจพบการแก้ไขราคาจากค่ามาตรฐาน
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
                        ฿{original.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-xl bg-orange-50 p-3 border border-orange-100">
                      <span className="text-gray-500 text-xs">ราคาปัจจุบัน</span>
                      <p className="text-orange-700 font-bold">
                        ฿{modified.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 border border-orange-100">
                      <span className="text-gray-500 text-xs">ส่วนต่าง</span>
                      <p
                        className={`font-bold ${diffPositive ? "text-green-600" : "text-red-600"}`}
                      >
                        {diffPositive ? "+" : ""}
                        {diff.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
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
        <Alert className="border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900 text-sm p-4 leading-relaxed">
          <Package className="mr-2" /> สินค้าบางรายการสต็อกไม่พอ
          {stockWarnings.map((w, i) => (
            <p key={i} className="mt-1">
              • {w.productName} เหลือ {w.available} ต้องใช้ {w.requested}
            </p>
          ))}
        </Alert>
      )}

      {/* 💳 Credit Information — Glass Premium UI */}
      {sale.paymentTerm === "CREDIT" && (
        <Card
          className={`backdrop-blur-lg rounded-2xl p-6 shadow-sm border-2 ${
            creditInfo.willExceedLimit
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-sm text-gray-600">วงเงิน</span>
              <p className="font-bold text-xl text-gray-900 mt-1">
                ฿{creditInfo.creditLimit.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-sm text-gray-600">ใช้ไปแล้ว</span>
              <p className="font-bold text-xl text-orange-600 mt-1">
                ฿{creditInfo.usedCredit.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-sm text-gray-600">คงเหลือ</span>
              <p
                className={`font-bold text-xl mt-1 ${
                  creditInfo.willExceedLimit ? "text-red-600" : "text-green-600"
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
      <Card className="rounded-2xl shadow-sm border overflow-hidden">
        <CardHeader className="p-5 border-b bg-gradient-to-r from-slate-50 to-blue-50/40">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5 text-blue-600" />
            รายการสินค้า
            <Badge className="ml-2 text-xs bg-blue-100 text-blue-700 border-blue-300">
              {sale.items.length} รายการ
            </Badge>
          </CardTitle>
        </CardHeader>

        {/* 📱 Mobile Card View */}
        <div className="block lg:hidden divide-y">
          {sale.items.map((item, i) => {
            const originalUnitPrice = Number(item.originalPrice ?? item.unitPrice ?? 0);
            const currentUnitPrice = Number(item.unitPrice ?? 0);
            const quantity = Number(item.quantity ?? 0);
            const currentTotal = Number(item.totalPrice ?? currentUnitPrice * quantity);
            const originalTotal = originalUnitPrice * quantity;
            const priceChanged = Boolean(item.priceModified);

            return (
              <div
                key={item.id ?? i}
                className={`p-4 transition-all ${
                  priceChanged ? "bg-orange-50/70 border-l-4 border-orange-300" : ""
                }`}
              >
                <p className="font-semibold text-gray-900">{item.product.name}</p>
                <p className="text-xs text-gray-500 mb-3">
                  {item.product.productCode}
                </p>

                <div className="grid grid-cols-2 text-sm gap-2">
                  <div>
                    <span className="text-gray-500 text-xs">จำนวน</span>
                    <p className="font-medium">
                      {item.quantity} {item.product.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">ราคา/หน่วย</span>
                    <p className={`font-semibold ${priceChanged ? "text-orange-700" : ""}`}>
                      ฿
                      {currentUnitPrice.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="col-span-2 pt-1 border-t">
                    <p className="text-gray-500 text-xs">รวม</p>
                    <p className={`text-base font-bold ${priceChanged ? "text-orange-700" : "text-blue-600"}`}>
                      ฿
                      {currentTotal.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                {priceChanged && (
                  <div className="mt-3 rounded-xl border border-orange-200 bg-white/80 p-3 text-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-700">
                      <TrendingDown className="h-3 w-3" /> มีการปรับราคา
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="block">ราคาเดิม</span>
                        <span className="font-semibold line-through">
                          ฿
                          {originalUnitPrice.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block">ราคาปัจจุบัน</span>
                        <span className="font-semibold text-orange-700">
                          ฿
                          {currentUnitPrice.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-600">
                      <span>รวมเดิม</span>
                      <span className="line-through">
                        ฿
                        {originalTotal.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-orange-700">
                      <span>รวมใหม่</span>
                      <span>
                        ฿
                        {currentTotal.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Summary */}
        <div className="block lg:hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-t-2 border-blue-200">
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                รวมเป็นเงิน
              </span>
              <span className="text-base font-semibold text-gray-900">
                ฿
                {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                ค่าขนส่ง
              </span>
              <span className="text-base font-medium text-gray-700">
                ฿
                {Number(sale.shippingCost).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {sale.otherCosts > 0 && (
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
                <span className="text-sm text-gray-600">ค่าใช้จ่ายอื่นๆ</span>
                <span className="text-base font-medium text-gray-700">
                  ฿
                  {Number(sale.otherCosts).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 pb-2">
              <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                ยอดเงินสุทธิ
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ฿
                {Number(sale.totalAmount).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* 💻 Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left p-4 font-semibold text-gray-600">
                  สินค้า
                </th>
                <th className="text-center p-4 font-semibold text-gray-600">
                  จำนวน
                </th>
                <th className="text-right p-4 font-semibold text-gray-600">
                  ราคา/หน่วย
                </th>
                <th className="text-right p-4 font-semibold text-gray-700">
                  ราคารวม
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {sale.items.map((item, i) => {
                const originalUnitPrice = Number(item.originalPrice ?? item.unitPrice ?? 0);
                const currentUnitPrice = Number(item.unitPrice ?? 0);
                const quantity = Number(item.quantity ?? 0);
                const currentTotal = Number(item.totalPrice ?? currentUnitPrice * quantity);
                const originalTotal = originalUnitPrice * quantity;
                const priceChanged = Boolean(item.priceModified);

                return (
                  <tr
                    key={item.id ?? i}
                    className={`transition ${
                      priceChanged ? "bg-orange-50/70" : ""
                    } hover:bg-blue-50/40`}
                  >
                    <td className="p-4 align-top">
                      <p className="font-semibold text-gray-900">
                        {item.product.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {item.product.productCode}
                      </span>
                      {priceChanged && (
                        <div className="mx-4 mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                          <TrendingDown className="h-3 w-3" /> ราคาเดิม ฿
                          {originalUnitPrice.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      )}
                    </td>
                    <td className="text-center p-4 font-medium align-middle">
                      {item.quantity} {item.product.unit}
                    </td>
                    <td className="text-right p-4 align-middle">
                      <div className="flex flex-col items-end">
                        <span className={`font-semibold ${priceChanged ? "text-orange-700" : ""}`}>
                          ฿
                          {currentUnitPrice.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        {priceChanged && (
                          <span className="text-xs text-gray-500 line-through">
                            ฿
                            {originalUnitPrice.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right p-4 align-middle">
                      <div className="flex flex-col items-end">
                        <span className={`font-bold ${priceChanged ? "text-orange-700" : "text-blue-600"}`}>
                          ฿
                          {currentTotal.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        {priceChanged && (
                          <span className="text-xs text-gray-500 line-through">
                            ฿
                            {originalTotal.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Summary Rows */}
              <tr className="bg-blue-50/60">
                <td
                  colSpan={3}
                  className="text-left p-4 font-semibold text-gray-700"
                >
                  รวมเป็นเงิน
                </td>
                <td className="text-right p-4 font-bold text-gray-900">
                  ฿
                  {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
              <tr className="bg-blue-50/40">
                <td
                  colSpan={3}
                  className="text-right p-4 font-medium text-gray-600"
                >
                  <span className="inline-flex items-center gap-2 justify-start w-full">
                    <Truck className="h-4 w-4 text-blue-600" />
                    ค่าขนส่ง
                  </span>
                </td>
                <td className="text-right p-4 font-semibold text-gray-700">
                  ฿
                  {Number(sale.shippingCost).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
              {sale.otherCosts > 0 && (
                <tr className="bg-blue-50/40">
                  <td
                    colSpan={3}
                    className="text-left p-4 font-medium text-gray-600"
                  >
                    ค่าใช้จ่ายอื่นๆ
                  </td>
                  <td className="text-right p-4 font-semibold text-gray-700">
                    ฿
                    {Number(sale.otherCosts).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              )}
              <tr className="bg-blue-50/40">
                <td
                  colSpan={3}
                  className="text-left p-4 font-bold text-gray-900"
                >
                  ยอดเงินสุทธิ
                </td>
                <td className="text-right p-4 text-blue-700 text-xl font-bold">
                  ฿
                  {Number(sale.totalAmount).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* 🧊 Sticky Bottom Action Bar Modern Glass UI */}
      <div className="sticky bottom-0 z-50 backdrop-blur-xl border-t bg-white/90 shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.08)] px-6 py-4 rounded-t-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:bg-gray-100 px-6 py-5 text-base rounded-xl flex items-center gap-2"
          >
            <ArrowLeft className="h-5" /> กลับ
          </Button>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              className="border-red-300 text-red-600 hover:bg-red-50 px-7 py-4 rounded-xl font-semibold"
            >
              <XCircle className="h-5 mr-2" /> ไม่อนุมัติ
            </Button>

            <Button
              onClick={() => setShowApproveDialog(true)}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-7 py-4 rounded-xl shadow-lg hover:brightness-110 font-semibold"
            >
              <CheckCircle className="h-5 mr-2" /> อนุมัติ
            </Button>
          </div>
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

          <Textarea
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

          <Textarea
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
