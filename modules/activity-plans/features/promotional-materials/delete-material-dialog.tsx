"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deletePromotionalMaterialAction } from "../../server/actions";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

interface PromotionalMaterialItem {
  id: string;
  sku?: string;
  name: string;
  category: string;
  price?: number;
  unit?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PromotionalMaterialItem | null;
  onSuccess: () => void;
}

export function DeleteMaterialDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  if (!item) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deletePromotionalMaterialAction(item.id);
      if (!res.success) {
        throw new Error((res as any).error || "ไม่สามารถลบรายการได้");
      }

      toast.success((res as any).message || "ลบรายการเรียบร้อยแล้ว");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-lg font-bold">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            ยืนยันการลบสื่อส่งเสริมการขาย
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 pt-1">
            คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ออกจากระบบ?
          </DialogDescription>
        </DialogHeader>

        {/* Item Details Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">รหัส SKU:</span>
            <span className="font-mono font-semibold text-slate-700">
              {item.sku || "-"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">หมวดหมู่:</span>
            <span className="font-semibold text-emerald-700">
              {item.category}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">ชื่อรายการ:</span>
            <span className="font-bold text-slate-900 text-right max-w-[240px] truncate">
              {item.name}
            </span>
          </div>
          {item.price != null && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ราคาต่อหน่วย:</span>
              <span className="font-bold text-slate-800">
                ฿ {item.price.toLocaleString()} / {item.unit || "ชิ้น"}
              </span>
            </div>
          )}
        </div>

        {/* Safety Notice */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
          <strong className="font-bold block mb-0.5">ℹ️ ข้อมูลความปลอดภัย:</strong>
          ระบบจะทำการ <strong>Soft Delete</strong> โดยซ่อนรายการนี้จากเมนูเลือกสินค้าในอนาคต แต่จะไม่ลบประวัติหรือทำให้ข้อมูลใน Activity Plan เดิมที่เคยอ้างอิงรายการนี้เสียหาย
        </div>

        <DialogFooter className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="text-xs h-9 px-4"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-4 font-semibold shadow-sm"
          >
            {deleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                ยืนยันการลบ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
