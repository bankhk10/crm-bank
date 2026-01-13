"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  Edit,
  Truck,
  AlertTriangle,
  FileText,
  User,
  Package,
  MapPin,
  Calendar,
  CreditCard,
  Tag,
  Receipt,
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }
      })
      .catch((err) => console.error("Failed to fetch session:", err));

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
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-24 sm:w-32 bg-slate-200 animate-pulse rounded" />
            <div className="h-10 w-32 sm:w-48 bg-slate-200 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="h-48 sm:h-64 bg-slate-200 animate-pulse rounded-xl" />
              <div className="h-32 sm:h-40 bg-slate-200 animate-pulse rounded-xl" />
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="h-64 sm:h-80 bg-slate-200 animate-pulse rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ผิดพลาด</AlertTitle>
          <AlertDescription>{error || "ไม่พบข้อมูลรายการขาย"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4 w-full sm:w-auto"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          ย้อนกลับ
        </Button>
      </div>
    );
  }

  const { sale, stockWarnings, priceWarnings } = data;
  const isCreator = currentUserId === sale.createdById;
  const isAdmin = hasPermission("sale.admin");
  const canEditThis =
    canEdit &&
    (sale.status === "PENDING" ||
      (sale.status === "REJECTED" && (isCreator || isAdmin)));
  const canApproveThis = canApprove && sale.status === "PENDING";
  const paymentTermLabel =
    PaymentTermLabels[sale.paymentTerm] || sale.paymentTerm;

  // Build shipping address display
  // If useCustomShipping is true, use the stored shippingAddress
  // Otherwise, build from customer's shipping address fields
  const getDisplayShippingAddress = () => {
    if ((sale as any).useCustomShipping && sale.shippingAddress) {
      return sale.shippingAddress;
    }
    // Build from customer shipping address fields (use any casting for fields not in type)
    const customer = sale.customer as any;
    const shippingParts = [
      customer.shippingAddressLine || customer.addressLine,
      customer.shippingSubdistrict
        ? `ต.${customer.shippingSubdistrict}`
        : customer.subdistrict
        ? `ต.${customer.subdistrict}`
        : "",
      customer.shippingDistrict
        ? `อ.${customer.shippingDistrict}`
        : customer.district
        ? `อ.${customer.district}`
        : "",
      customer.shippingProvince
        ? `จ.${customer.shippingProvince}`
        : customer.province
        ? `จ.${customer.province}`
        : "",
      customer.shippingPostalCode || customer.postalCode,
    ].filter(Boolean);
    return shippingParts.length > 0
      ? shippingParts.join(" ")
      : "ตามที่อยู่ลูกค้า";
  };
  const displayShippingAddress = getDisplayShippingAddress();

  if (sale.status === "COMPLETED") {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 max-w-5xl">
        <WarningsSection
          stockWarnings={stockWarnings}
          priceWarnings={priceWarnings}
        />

        <Card className="shadow-lg border-slate-200 bg-white overflow-hidden print:shadow-none print:border-none">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 uppercase tracking-wide">
                ใบบันทึกการขาย
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-medium">
                {sale.saleNumber}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 border border-slate-300 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <AddressSection
                title="ที่อยู่วางบิล"
                name={sale.customer.name}
                address={
                  sale.billingAddress ||
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
                    sale.customer.billingPostalCode || sale.customer.postalCode,
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                taxId={sale.customer.taxId}
                phone={sale.customer.phone}
              />

              <AddressSection
                title="ที่อยู่จัดส่ง"
                name={getDeliveryMethodLabel((sale as any).deliveryMethod)}
                address={displayShippingAddress}
              />

              <ReferenceSection
                saleDate={sale.saleDate}
                saleNumber={sale.saleNumber}
                paymentTerm={paymentTermLabel}
                creditDueDate={sale.creditDueDate}
                paymentDate={sale.paymentDate}
                employeeName={sale.employee.name}
              />
            </div>

            <ProductTable items={sale.items} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4 sm:space-y-6">
                {sale.notes && (
                  <div className="border border-slate-300 rounded-sm p-3 sm:p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                      หมายเหตุ
                    </h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {sale.notes}
                    </p>
                  </div>
                )}
              </div>

              <TotalsSection
                subtotal={sale.subtotalAmount}
                shippingCost={sale.shippingCost}
                otherCosts={sale.otherCosts}
                total={sale.totalAmount}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-center print:hidden">
          <Button
            variant="outline"
            className="w-full sm:w-auto text-slate-500 hover:text-slate-900"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ย้อนกลับ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8">
          <Link
            href="/sales"
            className="inline-flex items-center text-blue-100 hover:text-white mb-4 sm:mb-6 transition-colors group text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับไปหน้ารายการขาย
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">
                  {sale.saleNumber}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-blue-100">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">ลูกค้า: {sale.customer.name}</span>
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
            {canEditThis && (
              <div className="flex gap-3">
                <Link href={`/sales/${id}/edit`} className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไขข้อมูล
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <WarningsSection
          stockWarnings={stockWarnings}
          priceWarnings={priceWarnings}
          sale={sale}
        />

        <div className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <InfoCard
              title="ข้อมูลลูกค้า"
              icon={<User className="h-5 w-5 text-blue-600" />}
              bgColor="bg-blue-100"
            >
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
                label="ที่อยู่วางบิล"
                value={
                  sale.billingAddress ||
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
                    sale.customer.billingPostalCode || sale.customer.postalCode,
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              />
            </InfoCard>

            <InfoCard
              title="ข้อมูลการขาย"
              icon={<FileText className="h-5 w-5 text-purple-600" />}
              bgColor="bg-purple-100"
            >
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
              {sale.creditDueDate && (
                <DetailItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="วันที่ครบกำหนด"
                  value={format(new Date(sale.creditDueDate), "dd/MM/yyyy", {
                    locale: th,
                  })}
                />
              )}
              {sale.paymentDate && (
                <DetailItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="วันที่ชำระเงิน"
                  value={
                    <span
                      className={`${
                        sale.creditDueDate &&
                        new Date(sale.paymentDate) >
                          new Date(sale.creditDueDate)
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {format(new Date(sale.paymentDate), "dd/MM/yyyy", {
                        locale: th,
                      })}
                    </span>
                  }
                />
              )}
              <DetailItem
                icon={<User className="h-4 w-4" />}
                label="พนักงานขาย"
                value={sale.employee.name}
              />
            </InfoCard>

            <InfoCard
              title="การจัดส่ง"
              icon={<Truck className="h-5 w-5 text-green-600" />}
              bgColor="bg-green-100"
            >
              <DetailItem
                icon={<Truck className="h-4 w-4" />}
                label="วิธีการจัดส่ง"
                value={getDeliveryMethodLabel((sale as any).deliveryMethod)}
              />
              <DetailItem
                icon={<MapPin className="h-4 w-4" />}
                label="ที่อยู่จัดส่ง"
                value={displayShippingAddress}
              />
            </InfoCard>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  รายการสินค้า
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-left text-sm sm:text-base font-semibold text-gray-700">
                        สินค้า
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-right text-sm sm:text-base font-semibold text-gray-700">
                        จำนวน
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-right text-sm sm:text-base font-semibold text-gray-700 hidden sm:table-cell">
                        ราคา/หน่วย
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-right text-sm sm:text-base font-semibold text-gray-700">
                        รวม
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200"
                      >
                        <td className="py-4 sm:py-5 px-3 sm:px-6">
                          <div className="flex flex-col gap-1 sm:gap-2">
                            <div className="font-semibold text-gray-900 text-sm sm:text-base">
                              {item.product.name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block w-fit">
                              {item.product.productCode}
                            </div>
                            <div className="sm:hidden text-xs text-gray-600">
                              ฿
                              {Number(item.unitPrice).toLocaleString("th-TH", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            {item.priceModified && (
                              <span className="text-xs font-medium text-amber-700 bg-gradient-to-r from-amber-100 to-yellow-100 px-2 sm:px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm w-fit">
                                <Tag className="h-3 w-3" />
                                ราคาพิเศษ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 sm:py-5 px-3 sm:px-6 text-right">
                          <span className="inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 font-semibold rounded-lg text-sm sm:text-base">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-4 sm:py-5 px-3 sm:px-6 text-right text-gray-700 font-medium hidden sm:table-cell">
                          ฿
                          {Number(item.unitPrice).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 sm:py-5 px-3 sm:px-6 text-right">
                          <span className="text-base sm:text-lg font-bold text-gray-900">
                            ฿
                            {Number(item.totalPrice).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gradient-to-br p-4 sm:p-6 lg:p-8 border-t border-gray-200">
                <div className="max-w-md ml-auto space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-gray-600 font-medium">
                      รวมเป็นเงิน
                    </span>
                    <span className="font-semibold text-gray-900">
                      ฿
                      {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {Number(sale.shippingCost) > 0 && (
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-gray-600 font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        ส่วนลดค่าขนส่ง
                      </span>
                      <span className="font-semibold text-red-500">
                        -฿
                        {Number(sale.shippingCost).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {Number(sale.otherCosts) > 0 && (
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-gray-600 font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        ส่วนลดหน้าบิล
                      </span>
                      <span className="font-semibold text-red-500">
                        -฿
                        {Number(sale.otherCosts).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 sm:pt-4 border-t-2 border-gray-300">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-bold text-white">
                          ยอดสุทธิ
                        </span>
                        <span className="text-2xl sm:text-3xl font-bold text-white">
                          ฿
                          {Number(sale.totalAmount).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pb-20 sm:pb-1"></div>
                </div>
              </div>
            </div>

            {sale.notes && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-400 to-orange-500">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    หมายเหตุ
                  </h2>
                </div>
                <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-amber-200">
                    <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {sale.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function WarningsSection({ stockWarnings, priceWarnings, sale }: any) {
  if (
    stockWarnings.length === 0 &&
    priceWarnings.length === 0 &&
    (!sale || sale.status !== "REJECTED")
  ) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6 sm:mb-8 print:hidden">
      {sale && sale.status === "REJECTED" && sale.rejectionReason && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>รายการนี้ไม่ได้รับการอนุมัติ</AlertTitle>
          <AlertDescription>
            <strong>เหตุผล:</strong> {sale.rejectionReason}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function InfoCard({ title, icon, bgColor, children }: any) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      <div className={`p-4 sm:p-6 border-b border-gray-100 ${bgColor}`}>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h2>
      </div>
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">{children}</div>
    </div>
  );
}

function DetailItem({ icon, label, value }: any) {
  return (
    <div className="flex gap-2 sm:gap-3 py-2 border-b border-gray-100 last:border-0">
      {icon && <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <dt className="text-xs font-medium text-gray-500 mb-0.5">{label}</dt>
        <dd className="text-sm text-gray-900 font-medium break-words">
          {value || "-"}
        </dd>
      </div>
    </div>
  );
}

function AddressSection({ title, name, address, taxId, phone }: any) {
  return (
    <div className="flex flex-col">
      <div className="bg-slate-100/80 px-3 sm:px-4 py-2 border-b border-slate-300 font-semibold text-slate-700 text-xs sm:text-sm">
        {title}
      </div>
      <div className="p-3 sm:p-4 text-xs sm:text-sm text-slate-600 space-y-1 flex-1">
        <p className="font-bold text-slate-900 text-sm sm:text-base">{name}</p>
        <p className="break-words">{address}</p>
        {taxId && <p>Tax ID: {taxId}</p>}
        {phone && <p>Tel: {phone}</p>}
      </div>
    </div>
  );
}

function ReferenceSection({
  saleDate,
  saleNumber,
  paymentTerm,
  creditDueDate,
  paymentDate,
  employeeName,
}: any) {
  return (
    <div className="flex flex-col">
      <div className="bg-slate-100/80 px-3 sm:px-4 py-2 border-b border-slate-300 font-semibold text-slate-700 text-xs sm:text-sm">
        ข้อมูลอ้างอิง
      </div>
      <div className="divide-y divide-slate-200">
        <div className="flex justify-between p-2 px-3 sm:px-4 text-xs sm:text-sm">
          <span className="text-slate-500">วันที่:</span>
          <span className="font-medium text-slate-900">
            {format(new Date(saleDate), "dd/MM/yyyy", { locale: th })}
          </span>
        </div>
        <div className="flex justify-between p-2 px-3 sm:px-4 text-xs sm:text-sm">
          <span className="text-slate-500">เลขที่:</span>
          <span className="font-medium text-slate-900 truncate ml-2">
            {saleNumber}
          </span>
        </div>
        <div className="flex justify-between p-2 px-3 sm:px-4 text-xs sm:text-sm">
          <span className="text-slate-500">เงื่อนไขการชำระเงิน:</span>
          <span className="font-medium text-slate-900 text-right ml-2">
            {(() => {
              const match = paymentTerm.match(/^(.+?)\s*(\(.+?\))$/);
              if (match) {
                return (
                  <>
                    <span className="block">{match[1]}</span>
                    <span className="block text-slate-600">{match[2]}</span>
                  </>
                );
              }
              return paymentTerm;
            })()}
          </span>
        </div>
        {creditDueDate && (
          <div className="flex justify-between p-2 px-3 sm:px-4 text-xs sm:text-sm">
            <span className="text-slate-500">วันที่ครบกำหนด:</span>
            <span className="font-medium">
              {format(new Date(creditDueDate), "dd/MM/yyyy", { locale: th })}
            </span>
          </div>
        )}
        {paymentDate && (
          <div className="flex justify-between p-2 px-3 sm:px-4 text-xs sm:text-sm">
            <span className="text-slate-500">วันที่ชำระเงิน:</span>
            <span
              className={`font-medium ${
                creditDueDate && new Date(paymentDate) > new Date(creditDueDate)
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {format(new Date(paymentDate), "dd/MM/yyyy", { locale: th })}
            </span>
          </div>
        )}
        <div className="flex justify-between p-2 px-3 sm:px-4 text-xs sm:text-sm">
          <span className="text-slate-500">ผู้ขาย:</span>
          <span className="font-medium text-slate-900 truncate ml-2">
            {employeeName}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductTable({ items }: any) {
  return (
    <div className="border border-slate-300 overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-300">
          <tr>
            <th className="py-2 px-2 sm:px-3 text-left border-r border-slate-300 w-20 sm:w-32">
              รหัสสินค้า
            </th>
            <th className="py-2 px-2 sm:px-3 text-left border-r border-slate-300">
              รายละเอียดสินค้า
            </th>
            <th className="py-2 px-2 sm:px-3 text-right border-r border-slate-300 w-16 sm:w-20">
              จำนวน
            </th>
            <th className="py-2 px-2 sm:px-3 text-right border-r border-slate-300 w-24 sm:w-32 hidden sm:table-cell">
              ราคาต่อหน่วย
            </th>
            <th className="py-2 px-2 sm:px-3 text-right w-24 sm:w-32">รวม</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item: any) => (
            <tr key={item.id}>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-slate-600 border-r border-slate-300 align-top text-xs">
                {item.product.productCode}
              </td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-slate-900 border-r border-slate-300 align-top">
                <div>{item.product.name}</div>
                <div className="sm:hidden text-xs text-gray-600 mt-1">
                  ฿
                  {Number(item.unitPrice).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                {item.priceModified && (
                  <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1 rounded inline-block mt-1">
                    *ราคาพิเศษ
                  </span>
                )}
              </td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-slate-900 border-r border-slate-300 align-top">
                {item.quantity}
              </td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-slate-900 border-r border-slate-300 align-top hidden sm:table-cell">
                {Number(item.unitPrice).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-slate-900 font-medium align-top">
                {Number(item.totalPrice).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TotalsSection({ subtotal, shippingCost, otherCosts, total }: any) {
  return (
    <div className="flex flex-col gap-2 max-w-sm ml-auto w-full">
      <div className="flex justify-between items-center p-2 sm:p-3 border border-slate-300 rounded-sm text-sm sm:text-base">
        <span className="font-semibold text-slate-600">รวมเป็นเงิน</span>
        <span className="font-bold text-slate-900">
          {Number(subtotal).toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })}
        </span>
      </div>

      {Number(shippingCost) > 0 && (
        <div className="flex justify-between items-center p-2 sm:p-3 border border-slate-300 rounded-sm text-sm sm:text-base">
          <span className="font-semibold text-slate-600">ส่วนลดค่าขนส่ง</span>
          <span className="font-bold text-red-500">
            -
            {Number(shippingCost).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      {Number(otherCosts) > 0 && (
        <div className="flex justify-between items-center p-2 sm:p-3 border border-slate-300 rounded-sm text-sm sm:text-base">
          <span className="font-semibold text-slate-600">ส่วนลดหน้าบิล</span>
          <span className="font-bold text-red-500">
            -
            {Number(otherCosts).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center p-3 sm:p-4 bg-slate-100 border border-slate-300 rounded-sm mt-2">
        <span className="font-bold text-slate-800 text-sm sm:text-base">
          รวมเป็นเงิน
        </span>
        <span className="font-bold text-blue-700 text-lg sm:text-xl">
          {Number(total).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

function getDeliveryMethodLabel(method?: string | null) {
  switch (method) {
    case "SALES_DELIVERY":
      return "พนักงานขายจัดส่งสินค้า";
    case "CUSTOMER_PICKUP":
      return "ลูกค้ามารับสินค้าเอง";
    case "COURIER":
      return "ส่งผ่านบริษัทขนส่ง";
    default:
      return method || "-";
  }
}
