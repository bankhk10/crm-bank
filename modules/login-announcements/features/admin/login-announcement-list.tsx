"use client";

import { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteAnnouncementAction,
  toggleAnnouncementActiveAction,
  reorderAnnouncementAction,
  listAnnouncementsAction,
} from "../../server/actions";
import LoginAnnouncementForm from "./login-announcement-form";
import type { LoginAnnouncementItem } from "../../infrastructure/login-announcement.repository";

interface LoginAnnouncementListProps {
  initialItems: LoginAnnouncementItem[];
}

export default function LoginAnnouncementList({
  initialItems,
}: LoginAnnouncementListProps) {
  const [items, setItems] = useState<LoginAnnouncementItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<LoginAnnouncementItem | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    startTransition(async () => {
      const updated = await listAnnouncementsAction();
      setItems(updated);
    });
  }, []);

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteAnnouncementAction(deleteId);
      setDeleteId(null);
      refresh();
    });
  };

  const openAdd = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: LoginAnnouncementItem) => {
    setEditItem(item);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">จัดการ Popup หลัง Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            รูปภาพจะแสดงเป็น Slideshow หลัง login สำเร็จ ตามลำดับด้านล่าง
          </p>
        </div>
        <Button id="add-announcement-btn" onClick={openAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          เพิ่ม Popup
        </Button>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border rounded-lg bg-white">
          <p>ยังไม่มี Popup – กดปุ่ม &quot;เพิ่ม Popup&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ลำดับ</TableHead>
                <TableHead className="w-24">รูปภาพ</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>แสดงให้ Role</TableHead>
                <TableHead className="w-24">สถานะ</TableHead>
                <TableHead className="w-32 text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  {/* Sort controls */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() =>
                          startTransition(async () => {
                            await reorderAnnouncementAction(item.id, "up");
                            refresh();
                          })
                        }
                        disabled={isPending || index === 0}
                        className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"
                        aria-label="เลื่อนขึ้น"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          startTransition(async () => {
                            await reorderAnnouncementAction(item.id, "down");
                            refresh();
                          })
                        }
                        disabled={isPending || index === items.length - 1}
                        className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"
                        aria-label="เลื่อนลง"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>

                  {/* Thumbnail */}
                  <TableCell>
                    <div className="relative w-16 h-10 rounded overflow-hidden bg-gray-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.title ?? "popup"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>

                  {/* Title */}
                  <TableCell className="font-medium">
                    {item.title || (
                      <span className="text-gray-400 italic">ไม่มีชื่อ</span>
                    )}
                  </TableCell>

                  {/* Roles */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.roles.map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  {/* Active toggle */}
                  <TableCell>
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          await toggleAnnouncementActiveAction(item.id);
                          refresh();
                        })
                      }
                      disabled={isPending}
                      aria-label={item.isActive ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                      className="flex items-center gap-1 text-sm"
                    >
                      {item.isActive ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-green-600" />
                          <span className="text-green-700">เปิด</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-400">ปิด</span>
                        </>
                      )}
                    </button>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(item)}
                        aria-label="แก้ไข"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteId(item.id)}
                        aria-label="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Dialog */}
      <LoginAnnouncementForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={refresh}
        item={editItem}
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ Popup นี้ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
