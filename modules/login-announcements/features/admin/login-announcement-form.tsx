"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
} from "../../server/actions";
import type { LoginAnnouncementItem } from "../../infrastructure/login-announcement.repository";

// ─── Available Roles ──────────────────────────────────────────────────────────
const AVAILABLE_ROLES = [
  { slug: "admin", label: "Admin" },
  { slug: "manager", label: "Manager" },
  { slug: "employee", label: "Employee" },
  { slug: "sales", label: "Sales" },
];

interface LoginAnnouncementFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: LoginAnnouncementItem | null;
}

export default function LoginAnnouncementForm({
  open,
  onClose,
  onSuccess,
  item,
}: LoginAnnouncementFormProps) {
  const isEdit = Boolean(item);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    item?.roles ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(item?.imageUrl ?? "");

  const toggleRole = (slug: string) => {
    setSelectedRoles((prev) =>
      prev.includes(slug) ? prev.filter((r) => r !== slug) : [...prev, slug]
    );
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
        setPreviewUrl(data.url);
      } else {
        setError("อัปโหลดรูปภาพไม่สำเร็จ");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!imageUrl) {
      setError("กรุณาอัปโหลดรูปภาพ");
      return;
    }
    if (selectedRoles.length === 0) {
      setError("กรุณาเลือก Role อย่างน้อย 1 รายการ");
      return;
    }

    startTransition(async () => {
      const input = {
        imageUrl,
        title: title || undefined,
        roles: selectedRoles,
        isActive: true,
      };
      const result = isEdit
        ? await updateAnnouncementAction(item!.id, input)
        : await createAnnouncementAction(input);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  // Reset form state when dialog opens with new item
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไข Popup" : "เพิ่ม Popup ใหม่"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="announcement-image-upload">รูปภาพ *</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              {previewUrl ? (
                <div className="relative w-full h-48">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain rounded"
                  />
                </div>
              ) : (
                <p className="text-gray-400 text-sm py-8">
                  ยังไม่มีรูปภาพ – กดเลือกไฟล์ด้านล่าง
                </p>
              )}
              <Input
                id="announcement-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="mt-2"
              />
              {uploading && (
                <p className="text-sm text-gray-500 mt-1">กำลังอัปโหลด...</p>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="announcement-title">
              ชื่อ (สำหรับ Admin เท่านั้น)
            </Label>
            <Input
              id="announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น โปรโมชั่นเดือนกรกฎาคม"
            />
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <Label>แสดงให้ Role * (เลือกอย่างน้อย 1)</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ROLES.map((role) => (
                <label
                  key={role.slug}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedRoles.includes(role.slug)}
                    onCheckedChange={() => toggleRole(role.slug)}
                  />
                  <span className="text-sm">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending || uploading}>
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
