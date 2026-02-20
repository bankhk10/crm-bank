"use client";

import React, { use, useEffect, useRef, useState } from "react";
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
  Printer,
  Download,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import SalesRecordDocument from "@/components/sales/SalesRecordDocument";
import { useSalesPdf } from "@/hooks/use-sales-pdf";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { SaleDetailResponse } from "@/types/sales";
import {
  SaleStatusLabels,
  PaymentTermLabels,
  getSaleStatusColor,
  getSaleStatusDotColor,
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
  const documentRef = useRef<HTMLDivElement>(null);
  const {
    handlePreview,
    handleDownloadPdf,
    handlePrintFromPreview,
    closePreview,
    isGenerating,
    pdfUrl,
    showPreview,
  } = useSalesPdf(documentRef);
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
      sale.status === "PENDING_APPROVAL" ||
      (sale.status === "REJECTED" && (isCreator || isAdmin)));
  const canApproveThis =
    canApprove &&
    (sale.status === "PENDING" || sale.status === "PENDING_APPROVAL");
  const paymentTermLabel =
    PaymentTermLabels[sale.paymentTerm] || sale.paymentTerm;

  // Build shipping address display
  // If deliveryMethod is CUSTOMER_PICKUP, show pickup company address
  // If deliveryMethod is COURIER, show the stored shippingAddress (address for courier)
  // If useCustomShipping is true, use the stored shippingAddress
  // Otherwise, build from customer's shipping address fields
  const getDisplayShippingAddress = () => {
    // For CUSTOMER_PICKUP, show pickup company address
    if (
      (sale as any).deliveryMethod === "CUSTOMER_PICKUP" &&
      (sale as any).pickupCompany
    ) {
      const company = (sale as any).pickupCompany;
      const addressParts = [
        company.name,
        company.addressLine,
        company.subdistrict ? `ต.${company.subdistrict}` : "",
        company.district ? `อ.${company.district}` : "",
        company.province ? `จ.${company.province}` : "",
        company.postalCode,
      ].filter(Boolean);
      return addressParts.length > 0
        ? addressParts.join(" ")
        : "ตามที่อยู่สถานที่รับสินค้า";
    }

    // For COURIER, show the stored shipping address (address for courier company)
    if ((sale as any).deliveryMethod === "COURIER" && sale.shippingAddress) {
      return sale.shippingAddress;
    }

    // For custom shipping address (SALES_DELIVERY with custom address)
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
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
          {/* Action Bar */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-slate-900"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                ย้อนกลับ
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handlePreview}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  ดูตัวอย่าง / พิมพ์
                </Button>
                <Button
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleDownloadPdf(sale.saleNumber)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  ดาวน์โหลด PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Warnings */}
          <div className="max-w-5xl mx-auto px-4 pt-4">
            <WarningsSection
              stockWarnings={stockWarnings}
              priceWarnings={priceWarnings}
            />
          </div>

          {/* Document */}
          <div className="max-w-5xl mx-auto px-4 py-6">
            <SalesRecordDocument
              ref={documentRef}
              sale={sale}
              displayShippingAddress={displayShippingAddress}
            />
          </div>
        </div>

        {/* PDF Preview Dialog */}
        {showPreview && pdfUrl && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-sm sm:text-base">
                  {sale.saleNumber}.pdf
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 gap-2"
                  onClick={handlePrintFromPreview}
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">พิมพ์</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 gap-2"
                  onClick={() => handleDownloadPdf(sale.saleNumber)}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">ดาวน์โหลด</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 ml-2"
                  onClick={closePreview}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* PDF Iframe */}
            <div className="flex-1 p-2 sm:p-4">
              <iframe
                id="pdf-preview-iframe"
                src={pdfUrl}
                className="w-full h-full rounded-lg bg-white"
                title="PDF Preview"
              />
            </div>
          </div>
        )}
      </>
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
              </div>
            </div>
            <Badge
              className={`${getSaleStatusColor(
                sale.status
              )} border-none shadow-none px-4 py-2`}
            >
              <span
                className={`mr-2 h-4 w-4 rounded-full ${getSaleStatusDotColor(
                  sale.status
                )}`}
              />
              {SaleStatusLabels[sale.status]}
            </Badge>
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
                      ? `ต.${sale.customer.billingSubdistrict ||
                      sale.customer.subdistrict
                      }`
                      : "",
                    sale.customer.billingDistrict || sale.customer.district
                      ? `อ.${sale.customer.billingDistrict ||
                      sale.customer.district
                      }`
                      : "",
                    sale.customer.billingProvince || sale.customer.province
                      ? `จ.${sale.customer.billingProvince ||
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
              <DetailItem
                icon={<Calendar className="h-4 w-4" />}
                label="วันที่จัดส่งของ"
                value={
                  (sale as any).deliveryDate
                    ? format(
                      new Date((sale as any).deliveryDate),
                      "dd/MM/yyyy",
                      {
                        locale: th,
                      }
                    )
                    : "-"
                }
              />
              {sale.paymentDate && (
                <DetailItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="วันที่ชำระเงิน"
                  value={
                    <span
                      className={`${sale.creditDueDate &&
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
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-center text-sm sm:text-base font-semibold text-gray-700 hidden sm:table-cell">
                        บรรจุ
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-right text-sm sm:text-base font-semibold text-gray-700">
                        จำนวน
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-right text-sm sm:text-base font-semibold text-gray-700 hidden lg:table-cell">
                        ราคา/หน่วย
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-right text-sm sm:text-base font-semibold text-gray-700 hidden md:table-cell">
                        ราคา/ลัง
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-right text-sm sm:text-base font-semibold text-gray-700">
                        รวม
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => {
                      const packSize = parseFloat(
                        item.product.packageSizePerBox || "1"
                      );
                      const multiplier =
                        isNaN(packSize) || packSize <= 0 ? 1 : packSize;
                      const cartonPrice = Number(item.unitPrice) * multiplier;

                      return (
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
                              <div className="lg:hidden text-xs text-gray-600 mt-1">
                                {Number(item.unitPrice).toLocaleString(
                                  "th-TH",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}{" "}
                                / หน่วย
                              </div>
                              <div className="md:hidden text-xs text-gray-600">
                                {Number(cartonPrice).toLocaleString("th-TH", {
                                  minimumFractionDigits: 2,
                                })}{" "}
                                / ลัง
                              </div>
                              {item.priceModified && (
                                <span className="text-xs font-medium text-amber-700 bg-gradient-to-r from-amber-100 to-yellow-100 px-2 sm:px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm w-fit mt-1">
                                  <Tag className="h-3 w-3" />
                                  ราคาพิเศษ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 sm:py-5 px-3 sm:px-6 text-center text-gray-600 hidden sm:table-cell">
                            {item.product.packageSizePerBox || "-"}
                          </td>
                          <td className="py-4 sm:py-5 px-3 sm:px-6 text-right">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 font-semibold rounded-lg text-sm sm:text-base">
                              {item.quantity}
                            </span>
                            <span className="ml-1 text-xs text-gray-500">
                              ลัง
                            </span>
                          </td>
                          <td className="py-4 sm:py-5 px-3 sm:px-6 text-right text-gray-700 font-medium hidden lg:table-cell">
                            ฿
                            {Number(item.unitPrice).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-4 sm:py-5 px-3 sm:px-6 text-right text-gray-700 font-medium hidden md:table-cell">
                            ฿
                            {Number(cartonPrice).toLocaleString("th-TH", {
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
                      );
                    })}
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


function getDeliveryMethodLabel(method?: string | null) {
  switch (method) {
    case "SALES_DELIVERY":
      return "พนักงานขายจัดส่งสินค้า";
    case "CUSTOMER_PICKUP":
      return "ลูกค้ามารับสินค้าเอง";
    case "COURIER":
      return "ส่งโดยบริษัทขนส่ง";
    case "FACTORY_DELIVERY":
      return "ส่งโดยรถโรงงาน";
    default:
      return method || "-";
  }
}
