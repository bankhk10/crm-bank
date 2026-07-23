import React from "react";
import { Sprout } from "lucide-react";

interface Props {
  readonly?: boolean;
  type10DemoPlot: string;
  setType10DemoPlot: (val: string) => void;
  type10Location: string;
  setType10Location: (val: string) => void;
  type10Showcase: string;
  setType10Showcase: (val: string) => void;
  type10Attendees: number;
  setType10Attendees: (val: number) => void;
  type10BookingSales: number;
  setType10BookingSales: (val: number) => void;
}

export function Type10FieldDay({
  readonly = false,
  type10DemoPlot,
  setType10DemoPlot,
  type10Location,
  setType10Location,
  type10Showcase,
  setType10Showcase,
  type10Attendees,
  setType10Attendees,
  type10BookingSales,
  setType10BookingSales,
}: Props) {
  return (
    <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
          <Sprout className="h-4 w-4 text-amber-600" />
          <span>จัดงาน Field Day</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            ชื่อแปลงสาธิต <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={type10DemoPlot}
            onChange={(e) => setType10DemoPlot(e.target.value)}
            disabled={readonly}
            placeholder="เช่น แปลงสาธิตสวนทุเรียน..."
            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            สถานที่จัดงาน <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={type10Location}
            onChange={(e) => setType10Location(e.target.value)}
            disabled={readonly}
            placeholder="ระบุสถานที่จัดงาน..."
            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            พืชเป้าหมายและสินค้าที่โชว์ผลงาน{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={type10Showcase}
            onChange={(e) => setType10Showcase(e.target.value)}
            disabled={readonly}
            placeholder="เช่น ทุเรียน & ปุ๋ยทดสอบ"
            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            เป้าหมายจำนวนผู้เข้าร่วม (คน) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={type10Attendees}
            onChange={(e) => setType10Attendees(parseInt(e.target.value) || 0)}
            disabled={readonly}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            เป้ายอดขายจองในงาน (ถ้ามี)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
              ฿
            </span>
            <input
              type="number"
              value={type10BookingSales}
              onChange={(e) =>
                setType10BookingSales(parseFloat(e.target.value) || 0)
              }
              disabled={readonly}
              className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
