"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Sprout,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Plant, PlantFormData } from "@/types/product";

export default function PlantsPage() {
  const {
    hasPermission,
    allowed,
    isLoading: permLoading,
  } = usePermission("menu.products");
  const canView = !permLoading && allowed;
  const canCreate = hasPermission("product.create");
  const canUpdate = hasPermission("product.edit");
  const canDelete = hasPermission("product.delete");

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Plant | null>(null);
  const [deleteItem, setDeleteItem] = useState<Plant | null>(null);
  const [formData, setFormData] = useState<PlantFormData>({
    code: "",
    name: "",
    abbreviation: "",
    group: "",
    recommendedMedicines: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/products/plants?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPlants(data.plants || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    if (canView) fetchPlants();
  }, [canView, fetchPlants]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      code: "",
      name: "",
      abbreviation: "",
      group: "",
      recommendedMedicines: "",
      description: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Plant) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      abbreviation: item.abbreviation || "",
      group: item.group || "",
      recommendedMedicines: item.recommendedMedicines || "",
      description: item.description || "",
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (item: Plant) => {
    setDeleteItem(item);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error("กรุณากรอกรหัสและชื่อพืช");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingItem
        ? `/api/products/plants/${editingItem.id}`
        : "/api/products/plants";
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
      fetchPlants();
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
      const res = await fetch(`/api/products/plants/${deleteItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("ลบสำเร็จ");
      setIsDeleteOpen(false);
      setDeleteItem(null);
      fetchPlants();
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
      <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-sm !py-0 !gap-0">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 !px-6 !py-4 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sprout className="w-8 h-8" />
              <CardTitle className="text-2xl font-bold">ข้อมูลพืช</CardTitle>
            </div>
            {canCreate && (
              <Button
                onClick={handleOpenCreate}
                className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-md border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มพืช
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
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
                className="pl-10 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">รหัส</TableHead>
                  <TableHead className="font-semibold">ชื่อพืช</TableHead>
                  <TableHead className="font-semibold">ตัวย่อ</TableHead>
                  <TableHead className="font-semibold">กลุ่มพืช</TableHead>
                  <TableHead className="font-semibold">ตัวยาที่แนะนำ</TableHead>
                  <TableHead className="font-semibold text-right w-32">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        กำลังโหลด...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : plants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  plants.map((plant) => (
                    <TableRow key={plant.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {plant.code}
                      </TableCell>
                      <TableCell>{plant.name}</TableCell>
                      <TableCell>{plant.abbreviation || "-"}</TableCell>
                      <TableCell>{plant.group || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {plant.recommendedMedicines || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(plant)}
                              className="hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(plant)}
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

          {/* Pagination Section */}
          {total > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
              <div className="text-sm text-slate-500">
                แสดง {((page - 1) * perPage) + 1} ถึง {Math.min(page * perPage, total)} จาก {total} รายการ
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
                  <span className="text-sm text-slate-400">จาก {totalPages || 1}</span>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingItem ? "แก้ไขข้อมูลพืช" : "เพิ่มพืชใหม่"}
            </DialogTitle>
            <DialogDescription>
              กรอกข้อมูลพืชให้ครบถ้วนเพื่อบันทึกข้อมูลเข้าสู่ระบบ
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold">
                  รหัสพืช *
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="เช่น P001"
                  className="focus-visible:ring-emerald-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  ชื่อพืช *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="เช่น ทุเรียน"
                  className="focus-visible:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="abbreviation" className="text-sm font-semibold">
                  ตัวย่อพืช
                </Label>
                <Input
                  id="abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      abbreviation: e.target.value,
                    }))
                  }
                  placeholder="เช่น DUR"
                  className="focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group" className="text-sm font-semibold">
                  กลุ่มพืช
                </Label>
                <Input
                  id="group"
                  value={formData.group}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, group: e.target.value }))
                  }
                  placeholder="เช่น ไม้ผล"
                  className="focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="recommendedMedicines"
                className="text-sm font-semibold"
              >
                ใช้กับตัวยาที่แนะนำ
              </Label>
              <Input
                id="recommendedMedicines"
                value={formData.recommendedMedicines}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    recommendedMedicines: e.target.value,
                  }))
                }
                placeholder="รายการตัวยาที่แนะนำ"
                className="focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                คำอธิบายพืช
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="รายละเอียดเพิ่มเติมของพืช"
                className="min-h-[100px] focus-visible:ring-emerald-500"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="hover:bg-slate-50"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md border-0"
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
            <DialogTitle className="text-xl">ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบข้อมูลพืช <strong>{deleteItem?.name}</strong>{" "}
              ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 shadow-md"
            >
              {submitting ? "กำลังลบ..." : "ลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}