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
  FileText
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
import { SaleStatusLabels, PaymentTermLabels } from "@/types/sales";

export default function ApproveSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("sale.approve");

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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve sale");
      }

      router.push(`/sales/${id}`);
    } catch (err: any) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("กรุณาระบุเหตุผลในการไม่อนุมัติ");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject sale");
      }

      router.push(`/sales/${id}`);
    } catch (err: any) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <CheckCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-6 text-gray-700 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive" className="border-l-4 border-red-600">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="ml-2">
            <strong>ไม่มีสิทธิ์เข้าถึง</strong> - คุณไม่มีสิทธิ์อนุมัติรายการขาย
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive" className="border-l-4 border-red-600">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="ml-2">
            <strong>เกิดข้อผิดพลาด</strong> - {error || "ไม่พบข้อมูลรายการขาย"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  const { sale, priceWarnings, stockWarnings, creditInfo } = data;

  if (sale.status !== "PENDING") {
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <Card className="border-l-4 border-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">ไม่สามารถดำเนินการได้</h3>
                <p className="text-gray-600">รายการขายนี้ไม่อยู่ในสถานะรอการอนุมัติ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={() => router.push(`/sales/${sale.id}`)} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปดูรายละเอียด
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="hover:bg-white/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              ย้อนกลับ
            </Button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      พิจารณาอนุมัติรายการขาย
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                      <span className="font-mono font-semibold text-blue-600">{sale.saleNumber}</span>
                      <span className="text-gray-300">•</span>
                      <span>{sale.customer.name}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="px-4 py-2 text-sm bg-amber-100 text-amber-800 border-amber-200">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  รอการอนุมัติ
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-l-4 border-red-600 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {/* Price Warnings */}
          {priceWarnings.length > 0 && (
            <Alert variant="destructive" className="border-l-4 border-red-600 bg-red-50">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <strong className="text-base block mb-3">⚠️ คำเตือน: มีการแก้ไขราคาสินค้า</strong>
                    <div className="space-y-4">
                      {priceWarnings.map((w, i) => (
                        <div key={i} className="bg-white rounded-lg p-4 border border-red-200">
                          <p className="font-semibold text-gray-900 mb-2">{w.productName}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">ราคามาตรฐาน:</span>
                              <p className="font-semibold text-gray-900">
                                ฿{w.originalPrice.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">ราคาที่แก้ไข:</span>
                              <p className="font-semibold text-orange-600">
                                ฿{w.modifiedPrice.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">ส่วนต่าง:</span>
                              <p className={`font-bold ${w.percentageDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {w.percentageDiff > 0 ? "+" : ""}
                                {w.percentageDiff.toFixed(2)}% 
                                <span className="text-sm ml-1">
                                  (฿{w.difference.toLocaleString()})
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm font-medium text-red-800 bg-red-100 rounded-lg p-3 border border-red-200">
                      💡 กรุณาตรวจสอบราคาให้ถูกต้องก่อนอนุมัติรายการขาย
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Stock Warnings */}
          {stockWarnings.length > 0 && (
            <Alert className="border-l-4 border-amber-500 bg-amber-50">
              <Package className="h-5 w-5 text-amber-600" />
              <AlertDescription className="ml-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <strong className="text-base text-amber-900 block mb-3">คำเตือนสต็อกสินค้า</strong>
                    <div className="space-y-2">
                      {stockWarnings.map((w, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border border-amber-200">
                          <p className="font-medium text-gray-900">
                            <Package className="h-4 w-4 inline mr-2 text-amber-600" />
                            {w.productName}
                          </p>
                          <p className="text-sm text-amber-800 mt-1">
                            สต็อกไม่เพียงพอ: มีอยู่ <span className="font-bold">{w.available}</span> หน่วย 
                            • ต้องการ <span className="font-bold">{w.requested}</span> หน่วย
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Sale Summary */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="border-b bg-white/50 backdrop-blur">
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                สรุปรายการขาย
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">ลูกค้า</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-lg">{sale.customer.name}</p>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">พนักงานขาย</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-lg">{sale.employee.name}</p>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">เงื่อนไขชำระ</span>
                  </div>
                  <Badge variant="outline" className="text-base px-3 py-1 font-semibold">
                    {PaymentTermLabels[sale.paymentTerm]}
                  </Badge>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">วันที่ขาย</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {format(new Date(sale.saleDate), "dd MMM yyyy", { locale: th })}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-700 font-medium">รวมเป็นเงิน</span>
                    <span className="font-semibold text-gray-900">
                      ฿{Number(sale.subtotalAmount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      ค่าขนส่ง
                    </span>
                    <span className="font-medium text-gray-700">
                      ฿{Number(sale.shippingCost).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  
                  {sale.otherCosts > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">ค่าใช้จ่ายอื่นๆ</span>
                      <span className="font-medium text-gray-700">
                        ฿{Number(sale.otherCosts).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t-2 border-blue-200 pt-4 flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                      ยอดเงินสุทธิ
                    </span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ฿{Number(sale.totalAmount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>
                รายการสินค้า
                <Badge variant="secondary" className="ml-2 text-sm">
                  {sale.items.length} รายการ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b-2 border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">สินค้า</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">จำนวน</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">ราคาต่อหน่วย</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sale.items.map((item, idx) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-blue-50/50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 mt-1">
                              <Package className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{item.product.name}</p>
                              <p className="text-sm text-gray-500 font-mono mt-0.5">
                                {item.product.productCode}
                              </p>
                              {item.priceModified && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="destructive" className="text-xs">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    ราคาปรับจาก ฿{Number(item.originalPrice).toLocaleString()}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-4 px-6">
                          <span className="font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            {item.product.unit || "หน่วย"}
                          </span>
                        </td>
                        <td className="text-right py-4 px-6">
                          <span className="font-medium text-gray-700">
                            ฿{Number(item.unitPrice).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="text-right py-4 px-6">
                          <span className="font-bold text-blue-600 text-lg">
                            ฿{Number(item.totalPrice).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Credit Info for CREDIT payment */}
          {sale.paymentTerm === "CREDIT" && (
            <Card className={`border-2 shadow-lg ${
              creditInfo.willExceedLimit 
                ? 'border-red-300 bg-red-50/50' 
                : 'border-green-300 bg-green-50/50'
            }`}>
              <CardHeader className="bg-white/80 backdrop-blur border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    creditInfo.willExceedLimit ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <CreditCard className={`h-5 w-5 ${
                      creditInfo.willExceedLimit ? 'text-red-600' : 'text-green-600'
                    }`} />
                  </div>
                  ข้อมูลวงเงินเครดิต
                  {creditInfo.willExceedLimit && (
                    <Badge variant="destructive" className="ml-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      เกินวงเงิน
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600 font-medium">วงเงินเครดิต</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ฿{creditInfo.creditLimit.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600 font-medium">ใช้ไปแล้ว</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      ฿{creditInfo.usedCredit.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className={`h-4 w-4 ${
                        creditInfo.willExceedLimit ? 'text-red-600' : 'text-green-600'
                      }`} />
                      <span className="text-sm text-gray-600 font-medium">คงเหลือ</span>
                    </div>
                    <p className={`text-2xl font-bold ${
                      creditInfo.willExceedLimit ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ฿{creditInfo.availableCredit.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600 font-medium">ยอดขายนี้</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      ฿{creditInfo.currentSaleAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {creditInfo.willExceedLimit && (
                  <Alert variant="destructive" className="border-2 border-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertDescription className="ml-2">
                      <strong className="text-base">⚠️ คำเตือน: ยอดขายเกินวงเงินเครดิต</strong>
                      <p className="mt-2 text-sm">
                        ยอดขายนี้จะทำให้ลูกค้าเกินวงเงินเครดิตที่กำหนดไว้ กรุณาพิจารณาอย่างรอบคอบก่อนอนุมัติ
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t-2 border-gray-200 p-6 rounded-2xl shadow-2xl">
            <div className="flex gap-4 justify-end max-w-7xl mx-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRejectDialog(true)}
                disabled={actionLoading}
                className="border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 px-8 py-6 text-lg font-semibold"
              >
                <XCircle className="h-5 w-5 mr-2" />
                ไม่อนุมัติ
              </Button>
              <Button
                size="lg"
                onClick={() => setShowApproveDialog(true)}
                disabled={actionLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                อนุมัติรายการขาย
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              ยืนยันการอนุมัติรายการขาย
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              คุณต้องการอนุมัติรายการขาย{" "}
              <span className="font-semibold text-blue-600">{sale.saleNumber}</span>{" "}
              ยอดเงิน{" "}
              <span className="font-bold text-green-600">
                ฿{Number(sale.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>{" "}
              ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 เมื่ออนุมัติแล้ว รายการขายจะถูกบันทึกและไม่สามารถแก้ไขได้
              </p>
            </div>
            <Textarea
              label="หมายเหตุ (ถ้ามี)"
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              rows={3}
              placeholder="ระบุหมายเหตุเพิ่มเติม..."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={actionLoading}
              className="border-2"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={actionLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {actionLoading ? "กำลังบันทึก..." : "ยืนยันการอนุมัติ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              ไม่อนุมัติรายการขาย
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              กรุณาระบุเหตุผลในการไม่อนุมัติรายการขาย{" "}
              <span className="font-semibold text-blue-600">{sale.saleNumber}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>การไม่อนุมัติจะทำให้รายการขายถูกยกเลิก และต้องระบุเหตุผลที่ชัดเจน</span>
              </p>
            </div>
            <Textarea
              label="เหตุผลในการไม่อนุมัติ *"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              error={!rejectReason.trim() ? "กรุณาระบุเหตุผล" : ""}
              placeholder="เช่น ราคาสินค้าไม่ถูกต้อง, เกินวงเงินเครดิต, ข้อมูลไม่ครบถ้วน..."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={actionLoading}
              className="border-2"
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {actionLoading ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
