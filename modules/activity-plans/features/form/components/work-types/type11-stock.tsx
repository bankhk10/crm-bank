import React from "react";
import { ClipboardList } from "lucide-react";

interface Props {
  readonly?: boolean;
  type11Stores: string;
  setType11Stores: (val: string) => void;
}

export function Type11Stock({
  readonly = false,
  type11Stores,
  setType11Stores,
}: Props) {
  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <ClipboardList className="h-4 w-4 text-slate-600" />
          <span>ตรวจเช็กสต็อกหน้าร้าน</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          รายชื่อร้านค้า <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={type11Stores}
          onChange={(e) => setType11Stores(e.target.value)}
          disabled={readonly}
          placeholder="เช่น ร้านทดสอบ สาขา 1, ร้านสหายพานิช"
          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>
    </div>
  );
}
