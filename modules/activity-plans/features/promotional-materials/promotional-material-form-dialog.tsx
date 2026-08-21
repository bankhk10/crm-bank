"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createPromotionalMaterialAction, updatePromotionalMaterialAction } from "../../server/actions";
import { MARKETING_UNITS } from "../form/constants";
import { Loader2, PackagePlus, Pencil } from "lucide-react";

interface PromotionalMaterialItem {
  id?: string;
  sku?: string;
  name: string;
  category: string;
  price: number;
  unit?: string | null;
  description?: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: PromotionalMaterialItem | null;
  categories: string[];
  onSuccess: () => void;
}

export function PromotionalMaterialFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  categories,
  onSuccess,
}: Props) {
  const isEditing = Boolean(itemToEdit?.id);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Premium_item");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [unit, setUnit] = useState("ชิ้น");
  const [customUnit, setCustomUnit] = useState("");
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        setName(itemToEdit.name || "");
        setSku(itemToEdit.sku || "");
        const cat = itemToEdit.category || "Premium_item";
        if (categories.includes(cat)) {
          setCategory(cat);
          setIsCustomCategory(false);
          setCustomCategory("");
        } else {
          setCategory("CUSTOM");
          setIsCustomCategory(true);
          setCustomCategory(cat);
        }

        const u = itemToEdit.unit || "ชิ้น";
        if (MARKETING_UNITS.includes(u)) {
          setUnit(u);
          setIsCustomUnit(false);
          setCustomUnit("");
        } else {
          setUnit("CUSTOM");
          setIsCustomUnit(true);
          setCustomUnit(u);
        }

        setPrice(itemToEdit.price ?? 0);
        setStatus(itemToEdit.status || "ACTIVE");
        setDescription(itemToEdit.description || "");
      } else {
        setName("");
        setSku("");
        setCategory(categories[0] || "Premium_item");
        setIsCustomCategory(false);
        setCustomCategory("");
        setUnit("ชิ้น");
        setIsCustomUnit(false);
        setCustomUnit("");
        setPrice(0);
        setStatus("ACTIVE");
        setDescription("");
      }
    }
  }, [open, itemToEdit, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("กรุณาระบุชื่อรายการ");
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      toast.error("กรุณาระบุหมวดหมู่");
      return;
    }

    const finalUnit = isCustomUnit ? customUnit.trim() : unit;
    if (!finalUnit) {
      toast.error("กรุณาระบุหน่วยนับ");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        sku: sku.trim() || undefined,
        category: finalCategory,
        price: Number(price) || 0,
        unit: finalUnit,
        status,
        description: description.trim() || undefined,
      };

      if (isEditing && itemToEdit?.id) {
        const res = await updatePromotionalMaterialAction(itemToEdit.id, payload);
        if (!res.success) {
          throw new Error((res as any).error || "ไม่สามารถแก้ไขข้อมูลได้");
        }
        toast.success("แก้ไขข้อมูลสื่อส่งเสริมการขายเรียบร้อยแล้ว");
      } else {
        const res = await createPromotionalMaterialAction(payload);
        if (!res.success) {
          throw new Error((res as any).error || "ไม่สามารถสร้างข้อมูลได้");
        }
        toast.success("เพิ่มข้อมูลสื่อส่งเสริมการขายเรียบร้อยแล้ว");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
            {isEditing ? (
              <>
                <Pencil className="h-5 w-5 text-amber-600" />
                แก้ไขสื่อส่งเสริมการขาย
              </>
            ) : (
              <>
                <PackagePlus className="h-5 w-5 text-emerald-600" />
                เพิ่มสื่อส่งเสริมการขาย
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isEditing
              ? "แก้ไขรายละเอียดสื่อส่งเสริมการขาย ข้อมูลจะถูกอัปเดตในระบบและ Activity Plan ทันที"
              : "เพิ่มรายการสื่อส่งเสริมการขายใหม่สำหรับนำไปใช้ในกิจกรรมและการคำนวณงบประมาณ"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              หมวดหมู่ <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-2">
              <select
                value={isCustomCategory ? "CUSTOM" : category}
                onChange={(e) => {
                  if (e.target.value === "CUSTOM") {
                    setIsCustomCategory(true);
                  } else {
                    setIsCustomCategory(false);
                    setCategory(e.target.value);
                  }
                }}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="CUSTOM">+ ระบุหมวดหมู่อื่นๆ...</option>
              </select>

              {isCustomCategory && (
                <Input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..."
                  className="h-8 text-xs bg-white border-slate-200"
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              ชื่อรายการ <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เสื้อแขนยาว ปืนใหญ่ สีแดง, สติมเพล็กซ์ ขนาด 60x80 ซม."
              className="h-9 text-xs bg-white border-slate-200 text-slate-800 font-medium"
              required
            />
          </div>

          {/* SKU & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* SKU */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>รหัส SKU</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (ว่างไว้เพื่อสร้างอัตโนมัติ)
                </span>
              </Label>
              <Input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="เช่น PREM-022, PPB-086"
                className="h-9 text-xs bg-white border-slate-200 font-mono text-slate-700"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                สถานะการใช้งาน
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="ACTIVE">🟢 ใช้งาน (ACTIVE)</option>
                <option value="INACTIVE">🔴 ปิดใช้งาน (INACTIVE)</option>
              </select>
            </div>
          </div>

          {/* Unit & Price Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Unit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                หน่วยนับ <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-1.5">
                <select
                  value={isCustomUnit ? "CUSTOM" : unit}
                  onChange={(e) => {
                    if (e.target.value === "CUSTOM") {
                      setIsCustomUnit(true);
                    } else {
                      setIsCustomUnit(false);
                      setUnit(e.target.value);
                    }
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {MARKETING_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="CUSTOM">+ ระบุหน่วยอื่น...</option>
                </select>

                {isCustomUnit && (
                  <Input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="พิมพ์หน่วยนับใหม่..."
                    className="h-8 text-xs bg-white border-slate-200"
                  />
                )}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                ราคาต่อหน่วย (บาท) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                  ฿
                </span>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-9 pl-7 text-xs bg-white border-slate-200 text-slate-800 font-bold text-right"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              รายละเอียดเพิ่มเติม
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="หมายเหตุ หรือ สเปก ขนาด รูปแบบ..."
              rows={2}
              className="text-xs bg-white border-slate-200 resize-none"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs h-9 px-4"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-5 font-semibold shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : isEditing ? (
                "บันทึกการแก้ไข"
              ) : (
                "เพิ่มข้อมูล"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
