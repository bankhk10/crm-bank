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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ChemicalGroup {
  id: string;
  code: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ChemicalGroupsPage() {
  const {
    hasPermission,
    allowed,
    isLoading: permLoading,
  } = usePermission("menu.products");
  const canView = !permLoading && allowed;
  const canCreate = hasPermission("product.create");
  const canUpdate = hasPermission("product.update");
  const canDelete = hasPermission("product.delete");

  const [groups, setGroups] = useState<ChemicalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChemicalGroup | null>(null);
  const [deleteItem, setDeleteItem] = useState<ChemicalGroup | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    abbreviation: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/products/chemical-groups?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setGroups(data.groups || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    if (canView) {
      fetchGroups();
    }
  }, [canView, fetchGroups]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ code: "", name: "", abbreviation: "", description: "" });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: ChemicalGroup) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      abbreviation: item.abbreviation || "",
      description: item.description || "",
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (item: ChemicalGroup) => {
    setDeleteItem(item);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error("กรุณากรอกข้อมูลรหัสและชื่อกลุ่มสารให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingItem
        ? `/api/products/chemical-groups/${editingItem.id}`
        : "/api/products/chemical-groups";
      const method = editingItem ? "PUT" : "POST";

      const payload = {
        code: formData.code,
        name: formData.name,
        abbreviation: formData.abbreviation || null,
        description: formData.description || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      toast.success(editingItem ? "แก้ไขสำเร็จ" : "สร้างสำเร็จ");
      setIsFormOpen(false);
      fetchGroups();
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
      const res = await fetch(
        `/api/products/chemical-groups/${deleteItem.id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("ลบสำเร็จ");
      setIsDeleteOpen(false);
      setDeleteItem(null);
      fetchGroups();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลนี้</AlertDescription>
      </Alert>
    );
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <section className="space-y-6 p-6">
      <Card className="shadow-lg border-0 overflow-hidden !py-0 !gap-0">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white !px-6 !py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FlaskConical className="w-8 h-8" />
              <CardTitle className="text-2xl font-bold">กลุ่มสาร</CardTitle>
            </div>
            {canCreate && (
              <Button
                onClick={handleOpenCreate}
                className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มกลุ่มสาร
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
                  <TableHead className="font-semibold">รหัส</TableHead>
                  <TableHead className="font-semibold">ชื่อกลุ่มสาร</TableHead>
                  <TableHead className="font-semibold">ตัวย่อ</TableHead>
                  <TableHead className="font-semibold">คำอธิบาย</TableHead>
                  <TableHead className="font-semibold text-right w-32">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        กำลังโหลด...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-slate-500"
                    >
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((grp) => (
                    <TableRow key={grp.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{grp.code}</TableCell>
                      <TableCell>{grp.name}</TableCell>
                      <TableCell>{grp.abbreviation || "-"}</TableCell>
                      <TableCell>{grp.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(grp)}
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(grp)}
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

          {/* Pagination */}
          {total > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
              <div className="text-sm text-slate-500">
                แสดง {(page - 1) * perPage + 1} ถึง{" "}
                {Math.min(page * perPage, total)} จาก {total} รายการ
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 mx-2">
                  <span className="text-sm font-medium">หน้า {page}</span>
                  <span className="text-sm text-slate-400">
                    จาก {totalPages || 1}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0 || loading}
                  className="h-9 w-9"
                >
                  <ChevronRight className="h-4 w-4" />
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
              {editingItem ? "แก้ไขกลุ่มสาร" : "เพิ่มกลุ่มสารใหม่"}
            </DialogTitle>
            <DialogDescription>กรอกข้อมูลกลุ่มสารด้านล่าง</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">รหัสกลุ่มสาร *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="เช่น CHEM001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อกลุ่มสาร *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="ชื่อกลุ่มสาร"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abbreviation">ตัวย่อ</Label>
              <Input
                id="abbreviation"
                value={formData.abbreviation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    abbreviation: e.target.value,
                  }))
                }
                placeholder="ตัวย่อ (ถ้ามี)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="คำอธิบายเพิ่มเติม"
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
                className="bg-gradient-to-r from-emerald-600 to-teal-600"
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
              คุณต้องการลบกลุ่มสาร <strong>{deleteItem?.name}</strong>{" "}
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
