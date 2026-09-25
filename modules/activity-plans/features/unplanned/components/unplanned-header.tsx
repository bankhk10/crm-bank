"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ActivityStatusBadge } from "@/modules/activity-plans/ui/activity-status-badge";
import type { ActivityStatus } from "@prisma/client";

interface UnplannedHeaderProps {
  isEditMode?: boolean;
  planNo?: string | null;
  status?: ActivityStatus | string | null;
  returnedComment?: string | null;
  reviewerName?: string | null;
  onBack?: () => void;
}

export function UnplannedHeader({
  isEditMode = false,
  planNo,
  status,
  returnedComment,
  reviewerName,
  onBack,
}: UnplannedHeaderProps) {
  const isReturned = status === "RETURNED";
  const isPendingReview = status === "PENDING_REVIEW";
  const isReviewed = status === "REVIEWED";
  const isDraft = status === "DRAFT";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          {onBack ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onBack}
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          ) : (
            <Link href="/activity-plans">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </Button>
            </Link>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {isEditMode
                  ? `กิจกรรมนอกแผนงาน ${planNo ? `#${planNo}` : ""}`
                  : "บันทึกกิจกรรมนอกแผน"}
              </h1>
              {status && <ActivityStatusBadge status={status as any} />}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isEditMode
                ? "ตรวจสอบและแก้ไขรายละเอียดกิจกรรมและผลการปฏิบัติงานจริง"
                : "บันทึกกิจกรรมและผลการปฏิบัติงานจริงทันทีโดยไม่มีการวางแผนล่วงหน้า"}
            </p>
          </div>
        </div>

        {reviewerName && (isPendingReview || isReviewed) && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <span className="text-slate-400 font-medium">ผู้ตรวจสอบ:</span>
            <span className="font-semibold text-slate-800">{reviewerName}</span>
          </div>
        )}
      </div>

      {/* RETURNED Notice */}
      {isReturned && (
        <Alert className="bg-amber-50/80 border-amber-200 text-amber-900 rounded-2xl p-4 sm:p-5">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="ml-2">
            <AlertTitle className="font-bold text-sm text-amber-950">
              กิจกรรมนี้ถูกส่งกลับเพื่อแก้ไข (Returned)
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-amber-800 mt-1 space-y-1">
              {returnedComment ? (
                <div className="bg-white/70 border border-amber-200/60 rounded-xl p-3 my-2 font-medium text-slate-800">
                  <span className="text-amber-700 font-semibold block text-xs">
                    ข้อความจากผู้ตรวจสอบ:
                  </span>
                  &ldquo;{returnedComment}&rdquo;
                </div>
              ) : (
                <p>หัวหน้างานได้ส่งกลับกิจกรรมนี้เพื่อให้แก้ไขข้อมูล</p>
              )}
              <p className="text-amber-700 text-xs">
                💡 คุณสามารถแก้ไขรายละเอียด ผลการปฏิบัติงานจริง
                หรือรูปภาพหลักฐาน แล้วกด <b>&ldquo;ส่งตรวจสอบใหม่&rdquo;</b>{" "}
                เพื่อให้หัวหน้าพิจารณาอีกครั้ง
              </p>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* PENDING_REVIEW Notice */}
      {isPendingReview && (
        <Alert className="bg-blue-50/80 border-blue-200 text-blue-900 rounded-2xl p-4 sm:p-5">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="ml-2">
            <AlertTitle className="font-bold text-sm text-blue-950">
              รอหัวหน้าตรวจสอบ (Pending Review)
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-blue-800 mt-1">
              กิจกรรมนี้ได้รับการส่งเพื่อขอการตรวจสอบแล้ว
              อยู่ระหว่างรอหัวหน้างานตรวจสอบผลการปฏิบัติงาน (โหมดดูข้อมูลเท่านั้น
              - View Only)
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* REVIEWED Notice */}
      {isReviewed && (
        <Alert className="bg-emerald-50/80 border-emerald-200 text-emerald-900 rounded-2xl p-4 sm:p-5">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="ml-2">
            <AlertTitle className="font-bold text-sm text-emerald-950">
              ตรวจสอบแล้ว (Reviewed)
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-emerald-800 mt-1">
              กิจกรรมนอกแผนงานนี้ผ่านการตรวจสอบเรียบร้อยแล้ว
              ไม่อนุญาตให้แก้ไขข้อมูลเพิ่มเติม (โหมดดูข้อมูลเท่านั้น - View Only)
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
}
