"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DetailItem } from "@/components/custom/detail-item";
import { ActivityStatusBadge } from "../../../ui/activity-status-badge";
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
  Clock,
  ShieldCheck,
  User,
  Layers,
  Package,
} from "lucide-react";

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

  const planCode = plan.code || plan.id;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {planCode}
                </span>
                <ActivityStatusBadge status={plan.status} />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 mt-1">
                {plan.title}
              </DialogTitle>
            </div>

            <Link
              href={`/activity-plans/${plan.id}`}
              className="self-start sm:self-auto text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              เปิดหน้ารายละเอียดเต็ม
            </Link>
          </div>
        </DialogHeader>

        {/* Body Content */}
        <ScrollArea className="flex-1 p-6 space-y-6">
          <div className="space-y-6">
            {/* General Info Grid */}
            <div className="grid gap-3 sm:grid-cols-2 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
              <DetailItem
                label="ผู้จัดทำแผน"
                value={`${plan.employee.name} (${plan.employee.positionTitle || "ไม่ระบุตำแหน่ง"})`}
                icon={<User className="h-4 w-4 text-blue-500" />}
              />
              <DetailItem
                label="ประเภทกิจกรรม"
                value={
                  typeof plan.activityType === "object"
                    ? plan.activityType?.name || plan.activityType?.code
                    : plan.activityType || "ไม่ระบุ"
                }
                icon={<Layers className="h-4 w-4 text-indigo-500" />}
              />
              <DetailItem
                label="ช่วงวันเวลาจัดงาน"
                value={`${format(start, "dd MMM yy HH:mm", { locale: th })} - ${format(end, "dd MMM yy HH:mm", { locale: th })}`}
                icon={<Calendar className="h-4 w-4 text-emerald-500" />}
              />
              <DetailItem
                label="สถานที่จัดกิจกรรม"
                value={`${plan.location} ${plan.district ? `อ.${plan.district}` : ""} ${plan.province ? `จ.${plan.province}` : ""}`}
                icon={<MapPin className="h-4 w-4 text-red-500" />}
              />
            </div>

            {/* Objective & Description */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-blue-600" />
                  วัตถุประสงค์ / เป้าหมายกิจกรรม
                </h4>
                <p className="mt-1 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-line">
                  {plan.objective || "ไม่ได้ระบุวัตถุประสงค์"}
                </p>
              </div>

              {plan.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-600" />
                    รายละเอียดงานเพิ่มเติม
                  </h4>
                  <p className="mt-1 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-line">
                    {plan.description}
                  </p>
                </div>
              )}
            </div>

            {/* Budget Breakdown */}
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-4 rounded-xl border border-blue-100/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  งบประมาณที่ขออนุมัติ
                </h4>
                <span className="text-sm font-extrabold text-blue-700">
                  รวม {budgetTotal.toLocaleString()} บาท
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                  <span className="text-slate-600">งบส่งเสริมการขาย (Sales Promo):</span>
                  <span className="font-bold text-blue-700">
                    {salesPromo > 0 ? `${salesPromo.toLocaleString()} บาท` : "-"}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                  <span className="text-slate-600">งบการตลาด (Marketing):</span>
                  <span className="font-bold text-purple-700">
                    {marketing > 0 ? `${marketing.toLocaleString()} บาท` : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Helpers List */}
            {plan.helpers && plan.helpers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-purple-600" />
                  พนักงานช่วยงานที่ขอตัว ({plan.helpers.length} คน)
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {plan.helpers.map((h) => (
                    <div
                      key={h.id}
                      className="bg-white p-3 rounded-lg border border-slate-100 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          {h.employee.name}
                        </div>
                        <div className="text-slate-500">
                          {h.employee.departmentName || h.departmentName || "ไม่ระบุแผนก"}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          h.status === "APPROVED"
                            ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                            : h.status === "REJECTED"
                            ? "border-red-200 text-red-700 bg-red-50"
                            : "border-amber-200 text-amber-700 bg-amber-50"
                        }
                      >
                        {h.status === "APPROVED"
                          ? "อนุมัติแล้ว"
                          : h.status === "REJECTED"
                          ? "ปฏิเสธ"
                          : "รออนุมัติ"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-items / Products (if available) */}
            {plan.items && plan.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-teal-600" />
                  รายละเอียดรายการ / แปลง / ร้านค้า ({plan.items.length} รายการ)
                </h4>
                <div className="space-y-2">
                  {plan.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="bg-white p-3 rounded-lg border border-slate-100 text-xs flex flex-col sm:flex-row justify-between gap-2"
                    >
                      <div className="font-medium text-slate-800">
                        {it.customerName ||
                          it.plotOwnerName ||
                          it.plotCropName ||
                          it.surveyStoreName ||
                          `รายการที่ ${idx + 1}`}
                      </div>
                      <div className="text-slate-500 text-right">
                        {it.plotProductName ||
                          it.saleProductName ||
                          it.followupProductName ||
                          it.visitTopic ||
                          it.detail ||
                          "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approval History Logs */}
            {plan.approvalLogs && plan.approvalLogs.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-4 w-4 text-slate-600" />
                  ประวัติการดำเนินการ (Audit Logs)
                </h4>
                <div className="space-y-2">
                  {plan.approvalLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">
                          {log.user?.name || "ผู้ใช้งาน"}
                        </span>
                        <span className="text-slate-500"> ({log.action})</span>
                        {log.comment && (
                          <div className="text-slate-600 text-xs mt-0.5 italic">
                            &quot;{log.comment}&quot;
                          </div>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] whitespace-nowrap">
                        {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: th })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-slate-50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs"
          >
            ปิด
          </Button>

          {isPending && canApproveThisPlan && onTriggerAction && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                onClick={() => {
                  onOpenChange(false);
                  onTriggerAction(plan, "REJECT");
                }}
              >
                <XCircle className="h-3.5 w-3.5" />
                ปฏิเสธ
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50 flex items-center gap-1"
                onClick={() => {
                  onOpenChange(false);
                  onTriggerAction(plan, "REQUEST_CORRECTION");
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                ส่งกลับแก้ไข
              </Button>

              <Button
                type="button"
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                onClick={() => {
                  onOpenChange(false);
                  onTriggerAction(plan, "APPROVE");
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                อนุมัติแผนงาน
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
