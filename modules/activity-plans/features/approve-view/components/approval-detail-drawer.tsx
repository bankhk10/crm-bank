"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityStatusBadge } from "../../../ui/activity-status-badge";
import { DetailViewHeader } from "../../detail-view/components/detail-view-header";
import { DetailType12Tour } from "../../detail-view/components/work-types/detail-type12-tour";
import { getWorkTypeName } from "../../../constants";
import type { ActivityPlanWithRelations } from "../../../types";
import {
  Calendar,
  MapPin,
  Target,
  FileText,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  History,
  User,
  Layers,
  Package,
  Store as StoreIcon,
  Clock,
  ShieldCheck,
  Tag,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ActivityPlanWithRelations | null;
  canApproveThisPlan?: boolean;
  onTriggerAction?: (
    plan: ActivityPlanWithRelations,
    type: "APPROVE" | "REJECT" | "REQUEST_CORRECTION",
  ) => void;
}

export function ApprovalDetailDrawer({
  open,
  onOpenChange,
  plan,
  canApproveThisPlan = true,
  onTriggerAction,
}: ApprovalDetailDrawerProps) {
  if (!plan) return null;

  const planCode = plan.code || plan.id.slice(0, 8);
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);

  const salesPromo = plan.salesPromotionBudgetRequested
    ? Number(plan.salesPromotionBudgetRequested)
    : 0;
  const marketing = plan.marketingBudgetRequested
    ? Number(plan.marketingBudgetRequested)
    : 0;
  const budgetTotal = salesPromo + marketing;

  const isPending =
    plan.status === "PENDING_LINE_APPROVAL" ||
    plan.status === "PENDING_BUDGET_APPROVAL" ||
    plan.status === "PENDING_HELPER_APPROVAL";

  // 1. Resolve Work Types from Normalized Relation
  const resolvedWorkTypes: Array<{ code: string; name: string }> = [];
  if (plan.workTypes && plan.workTypes.length > 0) {
    for (const wt of plan.workTypes) {
      if (wt.activityType) {
        resolvedWorkTypes.push({
          code: wt.activityType.code,
          name: wt.activityType.name || getWorkTypeName(wt.activityType.code),
        });
      }
    }
  } else if (plan.activityType) {
    resolvedWorkTypes.push({
      code: plan.activityType.code,
      name: plan.activityType.name || getWorkTypeName(plan.activityType.code),
    });
  }

  // 2. Resolve Tour (TYPE_12) from Normalized Relation
  const isTourPlan = Boolean(
    plan.tour ||
    plan.activityType?.code === "TYPE_12" ||
    plan.activityType?.name === "ทัวร์" ||
    plan.workTypes?.some(
      (wt) => wt.activityType?.code === "TYPE_12" || wt.activityType?.name === "ทัวร์"
    )
  );

  const tourData = plan.tour;
  const item0 = (plan.items?.[0] || {}) as Record<string, any>;
  const tourType = tourData?.tourType ?? (item0.visitTopic === "ทัวร์ร้านค้า" ? "STORE" : "CENTRAL");
  const tourSize = tourData?.tourSize ?? item0.tourSize ?? null;
  const tourCountry = tourData?.country ?? item0.country ?? item0.detail ?? null;
  const tourStoreName = tourData?.store?.name ?? item0.customerName ?? item0.store ?? null;
  const tourDestination = tourData?.destination ?? item0.destination ?? item0.location ?? item0.detail ?? null;

  // 3. Resolve Stores from Normalized Relation
  const normalizedStores = plan.stores && plan.stores.length > 0
    ? plan.stores.map((s) => ({
        id: s.id,
        name: s.store?.name || s.storeName || "ไม่ระบุชื่อร้านค้า",
        code: s.store?.customerCode || null,
        location: [s.store?.district ? `อ.${s.store.district}` : "", s.store?.province ? `จ.${s.store.province}` : ""].filter(Boolean).join(" ") || null,
        workTypeCode: s.workTypeCode,
        workTypeName: getWorkTypeName(s.workTypeCode),
        remarks: s.remarks,
      }))
    : [];

  // Fallback / Supplementary stores from tour or items if not in plan.stores
  const allStoreNames = new Set(normalizedStores.map((s) => s.name));
  const additionalStores: Array<{ id?: string; name: string; code: string | null; location: string | null; workTypeName: string; remarks: string | null }> = [];

  if (plan.tour?.store && !allStoreNames.has(plan.tour.store.name)) {
    allStoreNames.add(plan.tour.store.name);
    additionalStores.push({
      id: plan.tour.store.id,
      name: plan.tour.store.name,
      code: plan.tour.store.customerCode || null,
      location: plan.tour.store.province ? `จ.${plan.tour.store.province}` : null,
      workTypeName: "ทัวร์ร้านค้า",
      remarks: null,
    });
  }

  if (normalizedStores.length === 0 && plan.items && plan.items.length > 0) {
    for (const item of plan.items) {
      const storeName = item.customerName || item.surveyStoreName;
      if (storeName && !allStoreNames.has(storeName)) {
        allStoreNames.add(storeName);
        additionalStores.push({
          id: item.id,
          name: storeName,
          code: null,
          location: null,
          workTypeName: item.workTypeCode ? getWorkTypeName(item.workTypeCode) : "ร้านค้าเป้าหมาย",
          remarks: item.detail || null,
        });
      }
    }
  }

  const combinedStores = [...normalizedStores, ...additionalStores];

  // 4. Resolve Products from Normalized Relation
  const normalizedProducts = plan.products && plan.products.length > 0
    ? plan.products.map((p) => ({
        id: p.id,
        name: p.product?.name || p.productName || "ไม่ระบุชื่อสินค้า",
        code: p.product?.productCode || null,
        storeName: p.store?.name || null,
        storeCode: p.store?.customerCode || null,
        workTypeCode: p.workTypeCode,
        workTypeName: getWorkTypeName(p.workTypeCode),
        targetQuantity: p.targetQuantity,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : (p.product?.price ? Number(p.product.price) : null),
        targetAmount: p.targetAmount ? Number(p.targetAmount) : null,
      }))
    : [];

  // Fallback supplementary products from items if not in plan.products
  const additionalProducts: Array<{ id?: string; name: string; code: string | null; storeName: string | null; workTypeName: string; targetQuantity: number | null; unitPrice: number | null; targetAmount: number | null }> = [];
  if (normalizedProducts.length === 0 && plan.items && plan.items.length > 0) {
    for (const item of plan.items) {
      const prodName = item.saleProductName || item.plotProductName || item.followupProductName || item.storeProductName;
      if (prodName) {
        additionalProducts.push({
          id: item.id,
          name: prodName,
          code: null,
          storeName: item.customerName || null,
          workTypeName: item.workTypeCode ? getWorkTypeName(item.workTypeCode) : "สินค้าเป้าหมาย",
          targetQuantity: item.saleQuantity || item.storeQuantityCases || null,
          unitPrice: item.saleUnitPrice ? Number(item.saleUnitPrice) : (item.storePricePerCase ? Number(item.storePricePerCase) : null),
          targetAmount: item.saleTotalPrice ? Number(item.saleTotalPrice) : (item.storeTotalAmount ? Number(item.storeTotalAmount) : null),
        });
      }
    }
  }

  const combinedProducts = [...normalizedProducts, ...additionalProducts];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-slate-200">
        <DialogTitle className="sr-only">
          ตรวจสอบรายละเอียดแผนงาน ( Trip Plan Approval ) - {planCode}
        </DialogTitle>
        <DialogDescription className="sr-only">
          ตรวจสอบรายละเอียดความถูกต้องของแผนงานก่อนดำเนินการอนุมัติ
        </DialogDescription>

        {/* Top Header - Reusing DetailViewHeader */}
        <div className="p-4 sm:p-6 pb-4 border-b bg-slate-50/70">
          <DetailViewHeader
            title="ตรวจสอบรายละเอียดแผนงาน ( Trip Plan Approval )"
            subtitle="ตรวจสอบรายละเอียดความถูกต้องของแผนงานก่อนดำเนินการอนุมัติ"
            planNo={planCode}
            status={plan.status}
            showBackButton={false}
            customIcon={<ShieldCheck className="w-5 h-5 text-blue-600 stroke-[2.2]" />}
            rightExtra={
              <Link
                href={`/activity-plans/${plan.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                title="เปิดหน้ารายละเอียดเต็มในแท็บใหม่"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>เปิดหน้ารายละเอียดเต็ม</span>
              </Link>
            }
          />
        </div>

        {/* Body Content */}
        <ScrollArea className="flex-1 p-4 sm:p-6 space-y-6">
          <div className="space-y-6">
            {/* 1. APPROVAL CONTEXT BANNER */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 border border-blue-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </div>
                <h3 className="font-bold text-sm sm:text-base text-blue-950">
                  กำลังตรวจสอบแผนงานนี้เพื่อดำเนินการอนุมัติ
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-blue-200/60">
                <div>
                  <span className="text-slate-500 block text-[11px]">เลขที่แผนงาน</span>
                  <span className="font-mono font-bold text-blue-700">{planCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">ผู้จัดทำ</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {plan.employee.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">วันที่จัดงาน</span>
                  <span className="font-medium text-slate-800 block">
                    {format(start, "dd MMM yy", { locale: th })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">สถานะปัจจุบัน</span>
                  <div className="mt-0.5">
                    <ActivityStatusBadge status={plan.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. GENERAL PLAN INFORMATION (READ-ONLY) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    ข้อมูลแผนงาน (Activity Plan Overview)
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    รายละเอียดทั่วไปและเป้าหมายของแผนงาน
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ชื่อกิจกรรม */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1 md:col-span-2">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    ชื่อแผนงาน / กิจกรรม
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 block leading-snug">
                    {plan.title}
                  </span>
                </div>

                {/* ผู้จัดทำแผน */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    ผู้จัดทำแผน
                  </span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {plan.employee.name}
                  </span>
                  <span className="text-xs text-slate-500 block truncate">
                    {plan.employee.positionTitle || plan.employee.position?.name || "-"} •{" "}
                    {plan.employee.departmentName || plan.employee.department?.name || "-"}
                  </span>
                </div>

                {/* ประเภทงาน (Normalized Relation) */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    ประเภทงานที่ระบุ
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {resolvedWorkTypes.length > 0 ? (
                      resolvedWorkTypes.map((wt, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={cn(
                            "text-xs px-2.5 py-1 font-semibold rounded-lg border shadow-2xs",
                            wt.code === "TYPE_12"
                              ? "bg-sky-50 text-sky-800 border-sky-200"
                              : "bg-indigo-50 text-indigo-800 border-indigo-200",
                          )}
                        >
                          {wt.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </div>
                </div>

                {/* วันที่และเวลาจัดงาน */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    ช่วงวันเวลาจัดงาน ({plan.durationDays} วัน)
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                    {format(start, "dd MMM yyyy", { locale: th })} {format(start, "HH:mm")} น.
                    {" — "}
                    {format(end, "dd MMM yyyy", { locale: th })} {format(end, "HH:mm")} น.
                  </span>
                </div>

                {/* สถานที่ */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    สถานที่จัดงาน
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate" title={plan.location}>
                    {plan.location}
                  </span>
                  <span className="text-xs text-slate-500 block truncate">
                    {[plan.district ? `อ.${plan.district}` : "", plan.province ? `จ.${plan.province}` : ""].filter(Boolean).join(" ") || "-"}
                  </span>
                </div>
              </div>

              {/* หมายเหตุเพิ่มเติม */}
              {plan.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-600" />
                    หมายเหตุเพิ่มเติม
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                    {plan.notes}
                  </p>
                </div>
              )}
            </div>

            {/* 3. TYPE_12: TOUR SECTION (IF APPLICABLE) */}
            {isTourPlan && (
              <div className="space-y-2">
                <DetailType12Tour
                  isVisible={true}
                  tourType={tourType}
                  tourSize={tourSize}
                  country={tourCountry}
                  storeName={tourStoreName}
                  destination={tourDestination}
                />
              </div>
            )}

            {/* 4. RELATED STORES SECTION (NORMALIZED) */}
            {combinedStores.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <StoreIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        ร้านค้า / ลูกค้าที่เกี่ยวข้อง ({combinedStores.length} รายการ)
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        รายชื่อร้านค้าหรือลูกค้าเป้าหมายสำหรับแผนงานนี้
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-amber-50 text-amber-800 border-amber-200">
                    {combinedStores.length} ร้านค้า
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {combinedStores.map((st, idx) => (
                    <div
                      key={st.id || idx}
                      className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between gap-2 hover:border-amber-200 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{st.name}</span>
                          </span>
                          {st.code && (
                            <span className="font-mono text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded shrink-0">
                              {st.code}
                            </span>
                          )}
                        </div>
                        {st.location && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{st.location}</span>
                          </div>
                        )}
                        {st.remarks && (
                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 mt-1 italic">
                            &quot;{st.remarks}&quot;
                          </div>
                        )}
                      </div>
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">ประเภท:</span>
                        <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                          {st.workTypeName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. RELATED PRODUCTS SECTION (NORMALIZED) */}
            {combinedProducts.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        สินค้า / รายการเป้าหมาย ({combinedProducts.length} รายการ)
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        รายการสินค้าที่วางแผนเสนอขาย แนะนำ หรือตรวจสต็อก
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-teal-50 text-teal-800 border-teal-200">
                    {combinedProducts.length} สินค้า
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                      <tr>
                        <th className="p-3">สินค้า</th>
                        <th className="p-3">ร้านค้าเป้าหมาย</th>
                        <th className="p-3 text-center">ประเภทงาน</th>
                        <th className="p-3 text-right">จำนวนเป้าหมาย</th>
                        <th className="p-3 text-right">ราคาต่อหน่วย</th>
                        <th className="p-3 text-right">ยอดเงินเป้าหมาย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {combinedProducts.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-teal-500 shrink-0" />
                              <span>{p.name}</span>
                            </div>
                            {p.code && (
                              <span className="font-mono text-[10px] text-slate-400 block pl-4.5">
                                {p.code}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">
                            {p.storeName || "-"}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                              {p.workTypeName}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-medium text-slate-800">
                            {p.targetQuantity != null ? p.targetQuantity.toLocaleString() : "-"}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {p.unitPrice != null ? `${p.unitPrice.toLocaleString()} ฿` : "-"}
                          </td>
                          <td className="p-3 text-right font-bold text-teal-700">
                            {p.targetAmount != null ? `${p.targetAmount.toLocaleString()} ฿` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. HELPERS SECTION (NORMALIZED) */}
            {plan.helpers && plan.helpers.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        พนักงานช่วยงาน ({plan.helpers.length} คน)
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        รายชื่อเพื่อนร่วมงานที่ขอตัวไปช่วยปฏิบัติงาน
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-purple-50 text-purple-800 border-purple-200">
                    {plan.helpers.length} คน
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plan.helpers.map((h, idx) => (
                    <div
                      key={h.id || idx}
                      className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {idx + 1}. {h.employee?.name || "พนักงาน"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {h.employee?.positionTitle || h.employee?.position?.name || "-"} •{" "}
                          {h.departmentName || h.employee?.departmentName || h.employee?.department?.name || "ไม่ระบุแผนก"}
                        </div>
                        {h.rejectionReason && (
                          <div className="text-[10px] text-red-600 mt-1 italic">
                            เหตุผลปฏิเสธ: {h.rejectionReason}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 shrink-0 rounded-full",
                          h.status === "APPROVED" && "border-emerald-200 text-emerald-700 bg-emerald-50",
                          h.status === "REJECTED" && "border-red-200 text-red-700 bg-red-50",
                          h.status === "PENDING" && "border-amber-200 text-amber-700 bg-amber-50",
                        )}
                      >
                        {h.status === "APPROVED" ? "อนุมัติแล้ว" : h.status === "REJECTED" ? "ปฏิเสธ" : "รออนุมัติ"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. BUDGET BREAKDOWN */}
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-2xl border border-blue-100 p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-blue-950">
                      งบประมาณที่ขออนุมัติ
                    </h4>
                    <p className="text-xs text-blue-800 font-medium">
                      การจัดสรรงบส่งเสริมการขายและการตลาด
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">ยอดขอใช้รวม</span>
                  <span className="text-base sm:text-lg font-black text-blue-700">
                    {budgetTotal.toLocaleString()} ฿
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 flex justify-between items-center shadow-2xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-700 block">งบส่งเสริมการขาย (Sales Promotion)</span>
                    <span className="text-[11px] text-slate-400">สำหรับจัดโปรโมชั่นและส่วนลด</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">
                    {salesPromo > 0 ? `${salesPromo.toLocaleString()} ฿` : "-"}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-blue-100 flex justify-between items-center shadow-2xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-700 block">งบการตลาด (Marketing Expense)</span>
                    <span className="text-[11px] text-slate-400">สำหรับสื่อ ป้าย และกิจกรรม</span>
                  </div>
                  <span className="text-sm font-bold text-purple-700">
                    {marketing > 0 ? `${marketing.toLocaleString()} ฿` : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* 8. AUDIT / APPROVAL LOGS */}
            {plan.approvalLogs && plan.approvalLogs.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <History className="h-4 w-4 text-slate-500" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ประวัติการดำเนินการ (Approval Audit Logs)
                  </h4>
                </div>

                <div className="space-y-2">
                  {plan.approvalLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {log.user?.name || "ผู้ใช้งาน"}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {log.action}
                          </Badge>
                        </div>
                        {log.comment && (
                          <div className="text-slate-600 text-xs italic bg-white p-1.5 rounded border border-slate-100 mt-1">
                            &quot;{log.comment}&quot;
                          </div>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: th })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 9. APPROVAL ACTION AREA (BOTTOM FOOTER) */}
        <div className="p-4 sm:p-5 border-t bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs font-semibold text-slate-700"
          >
            ปิดหน้าต่าง
          </Button>

          {isPending && canApproveThisPlan && onTriggerAction && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-500 font-medium hidden md:inline mr-2">
                ตรวจสอบข้อมูลเรียบร้อยแล้ว:
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5 font-semibold"
                onClick={() => {
                  onOpenChange(false);
                  onTriggerAction(plan, "REJECT");
                }}
              >
                <XCircle className="h-4 w-4" />
                ไม่อนุมัติ / ปฏิเสธ
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 flex items-center gap-1.5 font-semibold"
                onClick={() => {
                  onOpenChange(false);
                  onTriggerAction(plan, "REQUEST_CORRECTION");
                }}
              >
                <RotateCcw className="h-4 w-4" />
                ส่งกลับแก้ไข
              </Button>

              <Button
                type="button"
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-bold shadow-sm px-4"
                onClick={() => {
                  onOpenChange(false);
                  onTriggerAction(plan, "APPROVE");
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                อนุมัติแผนงาน
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
