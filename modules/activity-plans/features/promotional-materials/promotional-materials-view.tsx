"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Package,
  Plus,
  Layers,
  CheckCircle2,
  Tags,
  Coins,
} from "lucide-react";
import { PromotionalMaterialsTable, type PromotionalMaterialItem } from "./promotional-materials-table";
import { PromotionalMaterialFormDialog } from "./promotional-material-form-dialog";
import { DeleteMaterialDialog } from "./delete-material-dialog";
import {
  getPromotionalMaterialsAction,
  getDistinctPromotionalCategoriesAction,
} from "../../server/actions";

export default function PromotionalMaterialsView() {
  const {
    hasPermission,
    allowed,
    isLoading: permLoading,
  } = usePermission("menu.promotional_materials");

  const canView =
    !permLoading &&
    (allowed ||
      hasPermission("promotional_material.view") ||
      hasPermission("activity.manage") ||
      hasPermission("system.settings"));

  const canCreate =
    hasPermission("promotional_material.create") ||
    hasPermission("menu.promotional_materials") ||
    hasPermission("activity.manage") ||
    hasPermission("system.settings");

  const canEdit =
    hasPermission("promotional_material.edit") ||
    hasPermission("menu.promotional_materials") ||
    hasPermission("activity.manage") ||
    hasPermission("system.settings");

  const canDelete =
    hasPermission("promotional_material.delete") ||
    hasPermission("menu.promotional_materials") ||
    hasPermission("activity.manage") ||
    hasPermission("system.settings");

  // State
  const [items, setItems] = useState<PromotionalMaterialItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [categories, setCategories] = useState<string[]>([
    "Premium_item",
    "PP_Board",
    "Banner",
    "Leaflet",
    "อุปกรณ์จัดงาน",
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PromotionalMaterialItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PromotionalMaterialItem | null>(null);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await getDistinctPromotionalCategoriesAction();
      if (res.success && res.categories?.length > 0) {
        setCategories((prev) => {
          const merged = Array.from(new Set([...prev, ...res.categories]));
          return merged;
        });
      }
    } catch {
      // Keep defaults
    }
  }, []);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPromotionalMaterialsAction({
        page,
        perPage,
        q: searchQuery,
        category: selectedCategory,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        sortBy: "category",
        sortOrder: "asc",
      });

      if (res.success) {
        setItems(res.promotionalMaterials || []);
        setTotal(res.total || 0);
        setTotalPages((res as any).totalPages || 1);
      } else {
        setError((res as any).error || "ไม่สามารถโหลดข้อมูลสื่อส่งเสริมการขายได้");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    if (canView) {
      fetchCategories();
      fetchItems();
    }
  }, [canView, fetchCategories, fetchItems]);

  const handleCreateNew = () => {
    setItemToEdit(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (item: PromotionalMaterialItem) => {
    setItemToEdit(item);
    setFormDialogOpen(true);
  };

  const handleDelete = (item: PromotionalMaterialItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  if (permLoading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertDescription>
            คุณไม่มีสิทธิ์เข้าถึงเมนูจัดการสื่อส่งเสริมการขาย
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-12 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                จัดการสื่อส่งเสริมการขาย
              </h1>
              <p className="text-xs text-slate-500">
                จัดการข้อมูล Master Data สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถม) สำหรับใช้ใน Activity Plan
              </p>
            </div>
          </div>
        </div>

        {canCreate && (
          <Button
            type="button"
            onClick={handleCreateNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            เพิ่มสื่อส่งเสริมการขาย
          </Button>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Total Items */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              รายการทั้งหมด
            </span>
            <Layers className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800">
            {total.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Categories */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              หมวดหมู่
            </span>
            <Tags className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700">
            {categories.length}
          </div>
        </div>

        {/* Card 3: Active Items */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              สถานะพร้อมใช้
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {items.filter((i) => i.status === "ACTIVE").length > 0
              ? `${items.filter((i) => i.status === "ACTIVE").length} ในหน้านี้`
              : "พร้อมใช้"}
          </div>
        </div>

        {/* Card 4: Database Source Notice */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              แหล่งข้อมูล
            </span>
            <Coins className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-amber-700">
            Database Live Sync
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Table */}
      <PromotionalMaterialsTable
        items={items}
        total={total}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        categories={categories}
        loading={loading}
        canEdit={canEdit}
        canDelete={canDelete}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Dialog (Create / Edit) */}
      <PromotionalMaterialFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        itemToEdit={itemToEdit}
        categories={categories}
        onSuccess={() => {
          fetchCategories();
          fetchItems();
        }}
      />

      {/* Delete Dialog */}
      <DeleteMaterialDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        item={itemToDelete}
        onSuccess={() => {
          fetchItems();
        }}
      />
    </div>
  );
}
