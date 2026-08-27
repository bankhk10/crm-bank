"use client";

import React from "react";
import { Plane, Building2, Globe2 } from "lucide-react";
import { FormCombobox } from "@/components/custom/form-components";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { STORES_LIST } from "../../../../constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

interface Props {
  readonly?: boolean;
  type12TourType: string;
  setType12TourType: (val: string) => void;
  type12TourSize: string;
  setType12TourSize: (val: string) => void;
  type12Country: string;
  setType12Country: (val: string) => void;
  type12Store: string;
  setType12Store: (val: string) => void;
  type12Destination: string;
  setType12Destination: (val: string) => void;
  customers?: CustomerOption[];
}

export function Type12Tour({
  readonly = false,
  type12TourType,
  setType12TourType,
  type12TourSize,
  setType12TourSize,
  type12Country,
  setType12Country,
  type12Store,
  setType12Store,
  type12Destination,
  setType12Destination,
  customers = [],
}: Props) {
  const customerOptions = (
    customers && customers.length > 0
      ? customers
      : STORES_LIST.map((store) => ({
          id: store,
          name: store,
          customerCode: null,
        }))
  ).map((c) => ({
    value: c.name,
    label: `${c.customerCode ? `${c.customerCode} - ` : ""}${c.name}`,
  }));

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Plane className="h-4 w-4 text-sky-600" />
          <span>ทัวร์</span>
        </div>
      </div>

      {/* 1. ประเภททัวร์ (Tour Type) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          ประเภททัวร์ <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {(["ทัวร์กลาง", "ทัวร์ร้านค้า"] as const).map((tType) => (
            <button
              key={tType}
              type="button"
              disabled={readonly}
              onClick={() => setType12TourType(tType)}
              className={cn(
                "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                type12TourType === tType
                  ? "bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-500/20 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                readonly && "opacity-75 cursor-not-allowed",
              )}
            >
              {tType === "ทัวร์กลาง" ? (
                <Globe2 className="h-3.5 w-3.5" />
              ) : (
                <Building2 className="h-3.5 w-3.5" />
              )}
              <span>{tType}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Fields: ทัวร์กลาง */}
      {type12TourType === "ทัวร์กลาง" && (
        <div className="space-y-4 pt-2 border-t border-slate-200/60 animate-in fade-in-50 duration-200">
          {/* ขนาดทัวร์ */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              ขนาดทัวร์ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {(["ทัวร์เล็ก", "ทัวร์ใหญ่"] as const).map((tSize) => (
                <button
                  key={tSize}
                  type="button"
                  disabled={readonly}
                  onClick={() => setType12TourSize(tSize)}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    type12TourSize === tSize
                      ? "bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-500/20 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    readonly && "opacity-75 cursor-not-allowed",
                  )}
                >
                  <span>{tSize}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ประเทศ */}
          <div className="space-y-1.5 max-w-md">
            <label className="block text-xs font-semibold text-slate-700">
              ประเทศ <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              disabled={readonly}
              value={type12Country}
              onChange={(e) => setType12Country(e.target.value)}
              placeholder="ระบุชื่อประเทศ เช่น ญี่ปุ่น, เกาหลีใต้"
              className="bg-white border-slate-200 text-xs h-10 rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Conditional Fields: ทัวร์ร้านค้า */}
      {type12TourType === "ทัวร์ร้านค้า" && (
        <div className="space-y-4 pt-2 border-t border-slate-200/60 animate-in fade-in-50 duration-200">
          {/* ร้านค้า */}
          <div className="space-y-1.5">
            <FormCombobox
              id="type12-store-combobox"
              label="ร้านค้า"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              triggerClassName="h-10 min-h-[40px] py-1 text-xs bg-white border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-slate-500 shadow-2xs"
              value={type12Store}
              onChange={(val) => setType12Store(val)}
              options={customerOptions}
              placeholder="เลือกร้านค้า..."
              searchPlaceholder="ค้นหาร้านค้า / ลูกค้า..."
              emptyText="ไม่พบร้านค้า"
              disabled={readonly}
              required
            />
          </div>

          {/* สถานที่จะไป */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              สถานที่จะไป <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              disabled={readonly}
              value={type12Destination}
              onChange={(e) => setType12Destination(e.target.value)}
              placeholder="ระบุสถานที่ เช่น โรงงาน ABC จังหวัดชลบุรี"
              className="bg-white border-slate-200 text-xs h-10 rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
