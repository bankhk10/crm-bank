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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, FolderTree } from "lucide-react";
import { toast } from "sonner";

interface ProductCategory {
  id: string;
  code: string;
  description: string;
}

interface ProductGroup {
  id: string;
  code: string;
  description: string;
  categoryId: string | null;
  category: ProductCategory | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProductGroupsPage() {
  const {
    hasPermission,
    allowed,
    isLoading: permLoading,
  } = usePermission("menu.products");
  const canView = !permLoading && allowed;
  const canCreate = hasPermission("product.create");
  const canUpdate = hasPermission("product.edit");
  const canDelete = hasPermission("product.delete");

  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductGroup | null>(null);
  const [deleteItem, setDeleteItem] = useState<ProductGroup | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    categoryId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/products/groups?${params}`);
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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/products/categories?perPage=100");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      console.error("Failed to fetch categories");
    }
  }, []);

  useEffect(() => {
    if (canView) {
      fetchGroups();
      fetchCategories();
    }
  }, [canView, fetchGroups, fetchCategories]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ code: "", description: "", categoryId: "" });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: ProductGroup) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      description: item.description,
      categoryId: item.categoryId || "",
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (item: ProductGroup) => {
    setDeleteItem(item);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.description.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingItem
        ? `/api/products/groups/${editingItem.id}`
        : "/api/products/groups";
      const method = editingItem ? "PUT" : "POST";

      const payload = {
        code: formData.code,
        description: formData.description,
        categoryId: formData.categoryId || null,
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
      const res = await fetch(`/api/products/groups/${deleteItem.id}`, {
        method: "DELETE",
      });

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

  return (
    <section className="space-y-6 p-6">
      <Card className="shadow-lg border-0 overflow-hidden !py-0 !gap-0">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white !px-6 !py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FolderTree className="w-8 h-8" />
              <CardTitle className="text-2xl font-bold">กลุ่มชื่อการค้า</CardTitle>
            </div>
            {canCreate && (
              <Button
                onClick={handleOpenCreate}
                className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มกลุ่มชื่อการค้า
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
                  <TableHead className="font-semibold">ชื่อกลุ่มชื่อการค้า</TableHead>
                  <TableHead className="font-semibold text-right">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        กำลังโหลด...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-slate-500"
                    >
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((grp) => (
                    <TableRow key={grp.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{grp.code}</TableCell>
                      <TableCell>{grp.description}</TableCell>
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

          {/* Pagination info */}
          {total > 0 && (
            <div className="mt-4 text-sm text-slate-500">
              แสดง {groups.length} จาก {total} รายการ
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "แก้ไขกลุ่มชื่อการค้า" : "เพิ่มกลุ่มชื่อการค้าใหม่"}
            </DialogTitle>
            <DialogDescription>กรอกข้อมูลกลุ่มชื่อการค้าด้านล่าง</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">รหัส *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="เช่น GRP001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">ชื่อกลุ่มชื่อการค้า *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="ชื่อกลุ่มชื่อการค้า"
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
              คุณต้องการลบกลุ่มชื่อการค้า <strong>{deleteItem?.description}</strong>{" "}
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
