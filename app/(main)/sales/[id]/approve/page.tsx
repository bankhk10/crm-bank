"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
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

export default function ApproveSalePage({ params }: { params: { id: string } }) {
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
    fetch(`/api/sales/${params.id}`)
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
  }, [params.id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/${params.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: approveNotes }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve sale");
      }

      router.push(`/sales/${params.id}`);
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
      const res = await fetch(`/api/sales/${params.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject sale");
      }

      router.push(`/sales/${params.id}`);
    } catch (err: any) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์อนุมัติรายการขาย</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "ไม่พบข้อมูลรายการขาย"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  const { sale, priceWarnings, stockWarnings, creditInfo } = data;

  if (sale.status !== "PENDING") {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>รายการขายนี้ไม่อยู่ในสถานะรอการอนุมัติ</AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/sales/${sale.id}`)} className="mt-4">
          กลับไปดูรายละเอียด
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            ย้อนกลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold">พิจารณาอนุมัติรายการขาย</h1>
            <p className="text-gray-500 mt-2">
              {sale.saleNumber} - {sale.customer.name}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Price Warnings */}
      {priceWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>⚠️ คำเตือน: มีการแก้ไขราคาสินค้า</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {priceWarnings.map((w, i) => (
                <li key={i}>
                  <strong>{w.productName}</strong>
                  <br />
                  <span className="text-sm">
                    ราคามาตรฐานที่กำหนดไว้ในระบบ: ฿{w.originalPrice.toLocaleString()}
                  </span>
                  <br />
                  <span className="text-sm">
                    ราคาต่อหน่วยที่แก้ไข: ฿{w.modifiedPrice.toLocaleString()}
                  </span>
                  <br />
                  <span className="text-sm font-medium">
                    ส่วนต่าง: {w.percentageDiff > 0 ? "+" : ""}
                    {w.percentageDiff.toFixed(2)}% (฿{w.difference.toLocaleString()})
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-medium">
              กรุณาตรวจสอบราคาก่อนอนุมัติรายการขาย
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Warnings */}
      {stockWarnings.length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>คำเตือนสต็อก:</strong>
            <ul className="list-disc pl-5 mt-2">
              {stockWarnings.map((w, i) => (
                <li key={i}>
                  {w.productName}: สต็อกไม่เพียงพอ (มี {w.available} ต้องการ {w.requested})
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Sale Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปรายการขาย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-500">ลูกค้า:</span>
              <p className="font-medium">{sale.customer.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">พนักงานขาย:</span>
              <p className="font-medium">{sale.employee.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">เงื่อนไขชำระ:</span>
              <Badge variant="outline">{PaymentTermLabels[sale.paymentTerm]}</Badge>
            </div>
            <div>
              <span className="text-sm text-gray-500">วันที่ขาย:</span>
              <p>{format(new Date(sale.saleDate), "dd MMM yyyy", { locale: th })}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg mb-2">
              <span>รวมเป็นเงิน:</span>
              <span>
                ฿{Number(sale.subtotalAmount).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span>ค่าขนส่ง:</span>
              <span>
                ฿{Number(sale.shippingCost).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            {sale.otherCosts > 0 && (
              <div className="flex justify-between mb-2">
                <span>ค่าใช้จ่ายอื่นๆ:</span>
                <span>
                  ฿{Number(sale.otherCosts).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between text-2xl font-bold">
              <span>ยอดเงินสุทธิ:</span>
              <span className="text-blue-600">
                ฿{Number(sale.totalAmount).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า ({sale.items.length} รายการ)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">สินค้า</th>
                  <th className="text-right py-2">จำนวน</th>
                  <th className="text-right py-2">ราคาต่อหน่วย</th>
                  <th className="text-right py-2">รวม</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">{item.product.productCode}</p>
                        {item.priceModified && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            ราคาปรับจาก ฿{Number(item.originalPrice).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      {item.quantity} {item.product.unit || ""}
                    </td>
                    <td className="text-right">
                      ฿{Number(item.unitPrice).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-right font-medium">
                      ฿{Number(item.totalPrice).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
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
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลวงเงินเครดิต</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-500">วงเงินเครดิต:</span>
                <p className="font-medium">฿{creditInfo.creditLimit.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">ใช้ไปแล้ว:</span>
                <p>฿{creditInfo.usedCredit.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">คงเหลือ:</span>
                <p className={creditInfo.willExceedLimit ? "text-red-600 font-bold" : "text-green-600 font-medium"}>
                  ฿{creditInfo.availableCredit.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">ยอดขายนี้:</span>
                <p className="font-medium">฿{creditInfo.currentSaleAmount.toLocaleString()}</p>
              </div>
            </div>
            {creditInfo.willExceedLimit && (
              <Alert variant="destructive">
                <AlertDescription>
                  ⚠️ ยอดขายเกินวงเงินเครดิตที่มีอยู่
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowRejectDialog(true)}
          disabled={actionLoading}
        >
          <XCircle className="h-5 w-5 mr-2" />
          ไม่อนุมัติ
        </Button>
        <Button
          size="lg"
          onClick={() => setShowApproveDialog(true)}
          disabled={actionLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          อนุมัติรายการขาย
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการอนุมัติรายการขาย</DialogTitle>
            <DialogDescription>
              คุณต้องการอนุมัติรายการขาย {sale.saleNumber} ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              label="หมายเหตุ (ถ้ามี)"
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={actionLoading}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? "กำลังบันทึก..." : "ยืนยันการอนุมัติ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ไม่อนุมัติรายการขาย</DialogTitle>
            <DialogDescription>
              กรุณาระบุเหตุผลในการไม่อนุมัติรายการขาย {sale.saleNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              label="เหตุผลในการไม่อนุมัติ *"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              error={!rejectReason.trim() ? "กรุณาระบุเหตุผล" : ""}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={actionLoading}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
