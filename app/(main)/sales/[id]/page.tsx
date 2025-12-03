"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ArrowLeft, Edit, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { usePermission } from "@/hooks/use-permission";
import type { SaleDetailResponse } from "@/types/sales";
import { SaleStatusLabels, PaymentTermLabels, getSaleStatusColor } from "@/types/sales";

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "ไม่พบข้อมูลรายการขาย"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { sale, stockWarnings, priceWarnings, creditInfo } = data;
  const canEditThis = canEdit && sale.status === "PENDING";
  const canApproveThis = canApprove && sale.status === "PENDING";

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            ย้อนกลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold">รายการขาย {sale.saleNumber}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getSaleStatusColor(sale.status)}>
                {SaleStatusLabels[sale.status]}
              </Badge>
              <Badge variant="outline">{PaymentTermLabels[sale.paymentTerm]}</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canEditThis && (
            <Link href={`/sales/${sale.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                แก้ไข
              </Button>
            </Link>
          )}
          {canApproveThis && (
            <Link href={`/sales/${sale.id}/approve`}>
              <Button>
                <CheckCircle className="h-4 w-4 mr-2" />
                พิจารณาอนุมัติ
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Warnings */}
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

      {priceWarnings.length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>คำเตือนราคา:</strong>
            <ul className="list-disc pl-5 mt-2">
              {priceWarnings.map((w, i) => (
                <li key={i}>
                  {w.productName}: ราคาถูกแก้ไขจาก ฿{w.originalPrice.toLocaleString()} เป็น ฿
                  {w.modifiedPrice.toLocaleString()} ({w.percentageDiff > 0 ? "+" : ""}
                  {w.percentageDiff.toFixed(2)}%)
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Customer & Employee Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลลูกค้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">ชื่อลูกค้า:</span>
              <p className="font-medium">{sale.customer.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">รหัสลูกค้า:</span>
              <p>{sale.customer.customerCode}</p>
            </div>
            {sale.customer.phone && (
              <div>
                <span className="text-sm text-gray-500">เบอร์โทร:</span>
                <p>{sale.customer.phone}</p>
              </div>
            )}
            {sale.customer.email && (
              <div>
                <span className="text-sm text-gray-500">อีเมล:</span>
                <p>{sale.customer.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>พนักงานขาย</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">ชื่อพนักงาน:</span>
              <p className="font-medium">{sale.employee.name}</p>
            </div>
            {sale.employee.employeeCode && (
              <div>
                <span className="text-sm text-gray-500">รหัสพนักงาน:</span>
                <p>{sale.employee.employeeCode}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment & Date Info */}
      <Card>
        <CardHeader>
          <CardTitle>เงื่อนไขการชำระเงินและวันที่</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-500">เงื่อนไขการชำระ:</span>
            <p className="font-medium">{PaymentTermLabels[sale.paymentTerm]}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">วันที่ขาย:</span>
            <p>{format(new Date(sale.saleDate), "dd MMMM yyyy", { locale: th })}</p>
          </div>
          {sale.deliveryDate && (
            <div>
              <span className="text-sm text-gray-500">วันที่จัดส่ง:</span>
              <p>{format(new Date(sale.deliveryDate), "dd MMMM yyyy", { locale: th })}</p>
            </div>
          )}
          {sale.paymentTerm === "CREDIT" && (
            <>
              <div>
                <span className="text-sm text-gray-500">เครดิต:</span>
                <p>{sale.creditDays} วัน</p>
              </div>
              {sale.creditDueDate && (
                <div>
                  <span className="text-sm text-gray-500">ครบกำหนดชำระ:</span>
                  <p>{format(new Date(sale.creditDueDate), "dd MMMM yyyy", { locale: th })}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Credit Info */}
      {sale.paymentTerm === "CREDIT" && (
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลวงเงินเครดิต</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="font-medium text-green-600">
                ฿{creditInfo.availableCredit.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">ยอดขายนี้:</span>
              <p className="font-medium">฿{creditInfo.currentSaleAmount.toLocaleString()}</p>
            </div>
            {sale.usePromotionalCredit && creditInfo.promotionalCredit && (
              <>
                <div>
                  <span className="text-sm text-gray-500">วงเงินส่งเสริมการขาย:</span>
                  <p>฿{creditInfo.promotionalCredit.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ใช้วงเงินส่งเสริม:</span>
                  <p>฿{(creditInfo.promotionalCreditUsed || 0).toLocaleString()}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sale.billingAddress && (
          <Card>
            <CardHeader>
              <CardTitle>ที่อยู่วางบิล</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{sale.billingAddress}</p>
            </CardContent>
          </Card>
        )}

        {sale.shippingAddress && (
          <Card>
            <CardHeader>
              <CardTitle>ที่อยู่จัดส่ง</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{sale.shippingAddress}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า</CardTitle>
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
                          <Badge variant="outline" className="mt-1 text-xs">
                            ราคาปรับ
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

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปยอดรวม</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>รวมเป็นเงิน:</span>
            <span>
              ฿{Number(sale.subtotalAmount).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>ค่าขนส่ง:</span>
            <span>
              ฿{Number(sale.shippingCost).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          {sale.otherCosts > 0 && (
            <div className="flex justify-between">
              <span>
                ค่าใช้จ่ายอื่นๆ
                {sale.otherCostsDescription && ` (${sale.otherCostsDescription})`}:
              </span>
              <span>
                ฿{Number(sale.otherCosts).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-xl font-bold">
            <span>ยอดเงินสุทธิ:</span>
            <span className="text-blue-600">
              ฿{Number(sale.totalAmount).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {sale.notes && (
        <Card>
          <CardHeader>
            <CardTitle>หมายเหตุ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{sale.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason */}
      {sale.status === "REJECTED" && sale.rejectionReason && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>เหตุผลที่ไม่อนุมัติ:</strong>
            <p className="mt-2">{sale.rejectionReason}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Approval Info */}
      {sale.approvedBy && (
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการอนุมัติ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">ผู้อนุมัติ:</span>
              <p className="font-medium">{sale.approvedBy.name}</p>
            </div>
            {sale.approvedAt && (
              <div>
                <span className="text-sm text-gray-500">วันที่อนุมัติ:</span>
                <p>
                  {format(new Date(sale.approvedAt), "dd MMMM yyyy HH:mm", { locale: th })} น.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Info */}
      {sale.paymentDate && (
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการชำระเงิน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">วันที่ชำระเงิน:</span>
              <p>{format(new Date(sale.paymentDate), "dd MMMM yyyy", { locale: th })}</p>
            </div>
            {sale.paymentNotes && (
              <div>
                <span className="text-sm text-gray-500">หมายเหตุการชำระเงิน:</span>
                <p className="whitespace-pre-wrap">{sale.paymentNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Created By */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการสร้าง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">สร้างโดย:</span>
            <p className="font-medium">{sale.createdBy.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">วันที่สร้าง:</span>
            <p>{format(new Date(sale.createdAt), "dd MMMM yyyy HH:mm", { locale: th })} น.</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">แก้ไขล่าสุด:</span>
            <p>{format(new Date(sale.updatedAt), "dd MMMM yyyy HH:mm", { locale: th })} น.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
