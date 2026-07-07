"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
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

interface LoginAnnouncementFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: LoginAnnouncementItem | null;
  availableRoles: { slug: string; name: string }[];
}

export default function LoginAnnouncementForm({
  open,
  onClose,
  onSuccess,
  item,
  availableRoles,
}: LoginAnnouncementFormProps) {
  const isEdit = Boolean(item);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setImageUrl(item?.imageUrl ?? "");
      setTitle(item?.title ?? "");
      setSelectedRoles(item?.roles ?? []);
      setPreviewUrl(item?.imageUrl ?? "");
      setSelectedFile(null);
      setError(null);
    } else {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const toggleRole = (slug: string) => {
    setSelectedRoles((prev) =>
      prev.includes(slug) ? prev.filter((r) => r !== slug) : [...prev, slug]
    );
  };

  const isAllRolesSelected =
    availableRoles.length > 0 && selectedRoles.length === availableRoles.length;

  const toggleAllRoles = () => {
    if (isAllRolesSelected) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(availableRoles.map((r) => r.slug));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear old blob url if exists
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageUrl(""); // Clear old url to ensure we upload the new one
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!imageUrl && !selectedFile) {
      setError("กรุณาอัปโหลดรูปภาพ");
      return;
    }
    if (selectedRoles.length === 0) {
      setError("กรุณาเลือก Role อย่างน้อย 1 รายการ");
      return;
    }

    setUploading(true);
    let finalImageUrl = imageUrl;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          finalImageUrl = data.url;
        } else {
          setError("อัปโหลดรูปภาพไม่สำเร็จ");
          setUploading(false);
          return;
        }
      } catch {
        setError("เกิดข้อผิดพลาดในการอัปโหลด");
        setUploading(false);
        return;
      }
    }

    startTransition(async () => {
      const input = {
        imageUrl: finalImageUrl,
        title: title || undefined,
        roles: selectedRoles,
        isActive: true,
      };
      const result = isEdit
        ? await updateAnnouncementAction(item!.id, input)
        : await createAnnouncementAction(input);
        
      setUploading(false);
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
            <Label>รูปภาพ *</Label>
            <label
              htmlFor="announcement-image-upload"
              className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50/50 hover:bg-gray-50 hover:border-blue-400 transition-all duration-200"
            >
              {previewUrl ? (
                <>
                  <div className="relative w-full h-48 mb-4">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain rounded-md shadow-sm"
                    />
                  </div>
                  {!uploading && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-full">
                      <Upload className="w-4 h-4" />
                      เปลี่ยนรูปภาพ
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-4">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-gray-700 font-medium mb-1">คลิกเพื่ออัปโหลดรูปภาพ</p>
                  <p className="text-gray-400 text-sm">รองรับไฟล์ JPG, PNG, GIF</p>
                </div>
              )}
              
              <Input
                id="announcement-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              
              {uploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-blue-700 font-semibold animate-pulse">กำลังอัปโหลด...</p>
                </div>
              )}
            </label>
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
          <div className="space-y-3">
            <Label>แสดงให้ Role * (เลือกอย่างน้อย 1)</Label>
            <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer pb-3 border-b border-gray-200 mb-3">
                <Checkbox
                  checked={isAllRolesSelected}
                  onCheckedChange={toggleAllRoles}
                />
                <span className="text-sm font-semibold text-blue-700">เลือกทั้งหมด</span>
              </label>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {availableRoles.map((role) => (
                  <label
                    key={role.slug}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1.5 -ml-1.5 rounded-md transition-colors"
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role.slug)}
                      onCheckedChange={() => toggleRole(role.slug)}
                    />
                    <span className="text-sm text-gray-700">{role.name}</span>
                  </label>
                ))}
              </div>
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
