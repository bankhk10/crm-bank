"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SettingItem {
  id: string;
  code: string;
  description: string;
  name?: string; // Some might have name instead of description? Let's check.
  createdAt: string;
  updatedAt: string;
}

interface ProductManagementSettingsViewProps {
  title: string;
  icon: LucideIcon;
  apiPath: string;
  entityKey: string; // The key in JSON response, e.g. "brands"
  entityLabel: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  idLabel?: string;
  nameLabel?: string;
}

export default function ProductManagementSettingsView({
  title,
  icon: Icon,
  apiPath,
  entityKey,
  entityLabel,
  gradientFrom,
  gradientTo,
  accentColor,
  idLabel = "รหัส",
  nameLabel = "ชื่อ",
}: ProductManagementSettingsViewProps) {
  const {
    hasPermission,
    allowed,
    isLoading: permLoading,
  } = usePermission("menu.products");
  const canView = !permLoading && allowed;
  const canCreate = hasPermission("product.create");
  const canUpdate = hasPermission("product.edit");
  const canDelete = hasPermission("product.delete");

  const [items, setItems] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<SettingItem | null>(null);
  const [formData, setFormData] = useState({ code: "", description: "", name: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`${apiPath}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data[entityKey] || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, apiPath, entityKey]);

  useEffect(() => {
    if (canView) fetchItems();
  }, [canView, fetchItems]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ code: "", description: "", name: "" });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: SettingItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      description: item.description || "",
      name: item.name || ""
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (item: SettingItem) => {
    setDeleteItem(item);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("กรุณากรอกรหัส");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingItem
        ? `${apiPath}/${editingItem.id}`
        : apiPath;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      toast.success(editingItem ? "แก้ไขสำเร็จ" : "สร้างสำเร็จ");
      setIsFormOpen(false);
      fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiPath}/${deleteItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("ลบสำเร็จ");
      setIsDeleteOpen(false);
      setDeleteItem(null);
      fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  if (permLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลนี้</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-sm !py-0 !gap-0">
        <CardHeader className={cn("bg-gradient-to-r !px-6 !py-4 text-white shadow-lg", gradientFrom, gradientTo)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Icon className="w-8 h-8" />
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            </div>
            {canCreate && (
              <Button
                onClick={handleOpenCreate}
                className="bg-white hover:bg-slate-50 shadow-md border-0"
                style={{ color: accentColor }}
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม{entityLabel}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="ค้นหา..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">{idLabel}</TableHead>
                  <TableHead className="font-semibold">{nameLabel}{entityLabel}</TableHead>
                  <TableHead className="font-semibold text-right w-32">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn("w-5 h-5 border-2 border-t-transparent rounded-full animate-spin")} style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
                        กำลังโหลด...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-slate-500"
                    >
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {item.code}
                      </TableCell>
                      <TableCell>{item.description || (item as any).name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(item)}
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(item)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination info & controls */}
          {total > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500 order-2 sm:order-1">
                แสดง {items.length} จาก {total} รายการ
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  ย้อนกลับ
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  <span className="text-sm font-medium">หน้า {page}</span>
                  <span className="text-sm text-slate-400">จาก {Math.ceil(total / perPage)}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={page >= Math.ceil(total / perPage) || loading}
                >
                  ถัดไป
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `แก้ไข${entityLabel}` : `เพิ่ม${entityLabel}ใหม่`}
            </DialogTitle>
            <DialogDescription>กรอกข้อมูล{entityLabel}ด้านล่าง</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{idLabel}{entityLabel} *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder={`รหัส${entityLabel}`}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{nameLabel}{entityLabel} *</Label>
              <Input
                id="name"
                value={nameLabel === "ชื่อ" ? formData.name || formData.description : formData.description}
                onChange={(e) => {
                  const val = e.target.value;
                  if (nameLabel === "ชื่อ") {
                    setFormData(prev => ({ ...prev, name: val, description: prev.description || "" }));
                  } else {
                    setFormData(prev => ({ ...prev, description: val }));
                  }
                }}
                placeholder={`${nameLabel}${entityLabel}`}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className={cn(gradientFrom, gradientTo, "text-white")}
              >
                {submitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบ{entityLabel} <strong>{deleteItem?.description || (deleteItem as any)?.name}</strong>{" "}
              ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "กำลังลบ..." : "ลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
