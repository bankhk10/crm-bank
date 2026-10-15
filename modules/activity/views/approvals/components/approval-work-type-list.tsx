"use client";

import React from "react";
import { Target } from "lucide-react";
import {
  Type1ApprovalCard,
  type Type1TargetItem,
} from "@/modules/activity/features/type-1";

interface ApprovalWorkTypeListProps {
  plan?: any;
  targets?: any;
  type1Targets: {
    primary: Type1TargetItem;
    list: Type1TargetItem[];
  };
  parsedResults?: any;
  isTypeActive: (code: string, label: string) => boolean;
}

/**
 * Component กลางสำหรับแสดงรายละเอียดของประเภทงานในหน้าพิจารณาอนุมัติ (Approvals)
 * สอดคล้องกับ ActualWorkTypeList โดยยึด Type 1 เป็น Gold Standard
 */
export function ApprovalWorkTypeList({
  type1Targets,
  isTypeActive,
}: ApprovalWorkTypeListProps) {
  const isType1 =
    isTypeActive("TYPE_1", "เข้าพบเกษตรกร") ||
    isTypeActive("TYPE_1", "เข้าพบร้านค้า / Key Farmer");

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            รายละเอียดตามประเภทงาน (Work Type Details)
          </h3>
        </div>
      </div>

      {/* 🟢 TYPE 1: เข้าพบเกษตรกร / ร้านค้า (Gold Standard Vertical Slice) */}
      <Type1ApprovalCard
        isVisible={isType1}
        target={type1Targets.primary}
        targets={type1Targets.list}
      />

      {/* 🔵 ประเภทงานอื่นๆ (Type 2 - 14) จะเพิ่มเข้ามาเมื่อเริ่มพัฒนา Feature แต่ละประเภทงาน */}
    </div>
  );
}
