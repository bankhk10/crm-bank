"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Save, GripVertical, Settings } from "lucide-react";
import { toast } from "sonner";
import { ShowProductImage } from "@prisma/client";
import {
  uploadShowProductImage,
  updateShowProductImage,
  deleteShowProductImage,
  updateShowProductImagesOrder,
} from "@/modules/products/server/show-product-actions";
import Image from "next/image";

interface EditCarouselDialogProps {
  initialImages: ShowProductImage[];
  onUpdate: () => void;
}

export function EditCarouselDialog({
  initialImages,
  onUpdate,
}: EditCarouselDialogProps) {
  const [images, setImages] = useState<ShowProductImage[]>(initialImages);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", "New Image");
    formData.append("description", "");

    try {
      const res = await uploadShowProductImage(formData);
      if (res.success && res.data) {
        setImages([...images, res.data as ShowProductImage]);
        toast.success("อัพโหลดรูปภาพสำเร็จ");
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการอัพโหลด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpdate = async (
    id: string,
    updates: { title?: string; description?: string; isActive?: boolean },
  ) => {
    const prevImages = [...images];
    setImages(
      images.map((img) => (img.id === id ? { ...img, ...updates } : img)),
    );

    const res = await updateShowProductImage(id, updates);
    if (!res.success) {
      toast.error("ไม่สามารถบันทึกข้อมูลได้");
      setImages(prevImages);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบรูปภาพนี้ใช่หรือไม่?")) return;

    const prevImages = [...images];
    setImages(images.filter((img) => img.id !== id));

    const res = await deleteShowProductImage(id);
    if (res.success) {
      toast.success("ลบรูปภาพสำเร็จ");
    } else {
      toast.error(res.message || "ลบรูปภาพไม่สำเร็จ");
      setImages(prevImages);
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[index - 1];
    newImages[index - 1] = temp;

    // update order numbers
    const updates = newImages.map((img, i) => ({ ...img, order: i }));
    setImages(updates);

    await updateShowProductImagesOrder(
      updates.map((u) => ({ id: u.id, order: u.order })),
    );
  };

  const moveDown = async (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[index + 1];
    newImages[index + 1] = temp;

    // update order numbers
    const updates = newImages.map((img, i) => ({ ...img, order: i }));
    setImages(updates);

    await updateShowProductImagesOrder(
      updates.map((u) => ({ id: u.id, order: u.order })),
    );
  };

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onUpdate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          จัดการแกลเลอรี
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จัดการรูปภาพสินค้าแนะนำ</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              รูปภาพที่อัพโหลดจะแสดงในหน้าแนะนำสินค้า คุณสามารถเรียงลำดับ
              เปิด/ปิด และตั้งชื่อได้
            </p>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  "กำลังอัพโหลด..."
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มรูปภาพ
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {images.length === 0 && (
              <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">ยังไม่มีรูปภาพ</p>
              </div>
            )}

            {images.map((image, index) => (
              <div
                key={image.id}
                className="flex gap-4 p-4 border rounded-lg bg-card items-start relative"
              >
                <div className="flex flex-col gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === images.length - 1}
                    onClick={() => moveDown(index)}
                  >
                    ↓
                  </Button>
                </div>

                <div className="relative w-48 h-32 rounded-md overflow-hidden flex-shrink-0 border">
                  <Image
                    src={image.url}
                    alt={image.filename}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-grow space-y-4">
                  <div className="grid gap-2">
                    <Label>หัวข้อ (Title)</Label>
                    <Input
                      value={image.title || ""}
                      onChange={(e) =>
                        handleUpdate(image.id, { title: e.target.value })
                      }
                      placeholder="เช่น สินค้าแนะนำ 1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>รายละเอียด (Description)</Label>
                    <Textarea
                      value={image.description || ""}
                      onChange={(e) =>
                        handleUpdate(image.id, { description: e.target.value })
                      }
                      placeholder="คำอธิบายสั้นๆ..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end h-full min-h-[128px] ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>

                  <div className="flex items-center gap-2 mt-auto">
                    <Label className="text-xs">แสดงผล</Label>
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={image.isActive}
                      onChange={(e) =>
                        handleUpdate(image.id, { isActive: e.target.checked })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
