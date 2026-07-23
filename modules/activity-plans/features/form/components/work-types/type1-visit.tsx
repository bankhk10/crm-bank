import React from "react";
import { Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_OWNERS } from "../../constants";

interface Props {
  readonly?: boolean;
  type1Customers: string;
  setType1Customers: (val: string) => void;
  type1Topics: string[];
  toggleType1Topic: (topic: string) => void;
  type1OtherTopic: string;
  setType1OtherTopic: (val: string) => void;
  type1Detail: string;
  setType1Detail: (val: string) => void;
}

export function Type1Visit({
  readonly = false,
  type1Customers,
  setType1Customers,
  type1Topics,
  toggleType1Topic,
  type1OtherTopic,
  setType1OtherTopic,
  type1Detail,
  setType1Detail,
}: Props) {
  return (
    <div className="bg-sky-50/40 border border-sky-200/80 rounded-xl p-4 md:p-5 space-y-4 relative">
      <div className="flex items-center justify-between border-b border-sky-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
          <Users className="h-4 w-4 text-sky-600" />
          <span>เข้าพบร้านค้า / เกษตรกร</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            รายชื่อลูกค้า / ร้านค้า <span className="text-red-500">*</span>
          </label>
          <select
            value={type1Customers}
            onChange={(e) => setType1Customers(e.target.value)}
            disabled={readonly}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="">-- เลือกร้านค้า / เกษตรกร --</option>
            {DEMO_OWNERS.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700">
            ประเด็นหลัก <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200">
            {[
              "แจ้งข่าวสาร",
              "อัปเดตข้อมูลลูกค้า",
              "เลี้ยงรับรอง / สังสรรค์",
              "ให้คำแนะนำการใช้สินค้า",
              "อื่นๆ",
            ].map((topic) => {
              const isChecked = type1Topics.includes(topic);
              return (
                <label
                  key={topic}
                  onClick={() => !readonly && toggleType1Topic(topic)}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      isChecked
                        ? "bg-sky-600 border-sky-600 text-white"
                        : "border-slate-300 bg-white",
                    )}
                  >
                    {isChecked && (
                      <Check className="h-3 w-3 stroke-[3]" />
                    )}
                  </div>
                  <span>{topic}</span>
                </label>
              );
            })}
          </div>
          {type1Topics.includes("อื่นๆ") && (
            <input
              type="text"
              value={type1OtherTopic}
              onChange={(e) => setType1OtherTopic(e.target.value)}
              disabled={readonly}
              placeholder="โปรดระบุประเด็นอื่นๆ..."
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          รายละเอียดเพิ่มเติม
        </label>
        <input
          type="text"
          value={type1Detail}
          onChange={(e) => setType1Detail(e.target.value)}
          disabled={readonly}
          placeholder="ระบุรายละเอียดเพิ่มเติม..."
          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
    </div>
  );
}
