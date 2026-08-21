"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PromotionalMaterialItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  unit?: string | null;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
  updatedAt?: string | Date;
  createdAt?: string | Date;
}

interface Props {
  items: PromotionalMaterialItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  searchQuery: string;
  selectedCategory: string;
  selectedStatus: string;
  categories: string[];
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: string) => void;
  onStatusChange: (status: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (item: PromotionalMaterialItem) => void;
  onDelete: (item: PromotionalMaterialItem) => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Premium_item: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  PP_Board: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  Banner: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  Leaflet: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  อุปกรณ์จัดงาน: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
};

export function PromotionalMaterialsTable({
  items,
  total,
  page,
  perPage,
  totalPages,
  searchQuery,
  selectedCategory,
  selectedStatus,
  categories,
  loading,
  canEdit,
  canDelete,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onPageChange,
  onEdit,
  onDelete,
}: Props) {
  const formatDate = (val?: string | Date) => {
    if (!val) return "-";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters & Search Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-6 md:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาตามชื่อสินค้า, รหัส SKU, หมวดหมู่..."
              className="pl-9 h-9 text-xs bg-slate-50/70 border-slate-200 focus:bg-white text-slate-800"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3 md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50/70 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">📂 ทุกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3 md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50/70 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">🔘 ทุกสถานะ</option>
              <option value="ACTIVE">🟢 ใช้งาน (ACTIVE)</option>
              <option value="INACTIVE">🔴 ปิดใช้งาน (INACTIVE)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/90 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 py-3 px-3 text-center text-xs font-bold text-slate-600">
                  #
                </TableHead>
                <TableHead className="w-28 py-3 px-3 text-xs font-bold text-slate-600">
                  รหัส SKU
                </TableHead>
                <TableHead className="min-w-[130px] py-3 px-3 text-xs font-bold text-slate-600">
                  หมวดหมู่
                </TableHead>
                <TableHead className="min-w-[240px] py-3 px-3 text-xs font-bold text-slate-600">
                  ชื่อรายการสื่อส่งเสริมการขาย
                </TableHead>
                <TableHead className="w-20 py-3 px-3 text-center text-xs font-bold text-slate-600">
                  หน่วย
                </TableHead>
                <TableHead className="w-28 py-3 px-3 text-right text-xs font-bold text-slate-600">
                  ราคา (บาท)
                </TableHead>
                <TableHead className="w-24 py-3 px-3 text-center text-xs font-bold text-slate-600">
                  สถานะ
                </TableHead>
                <TableHead className="w-28 py-3 px-3 text-center text-xs font-bold text-slate-600 hidden md:table-cell">
                  วันที่แก้ไข
                </TableHead>
                {(canEdit || canDelete) && (
                  <TableHead className="w-24 py-3 px-3 text-center text-xs font-bold text-slate-600">
                    จัดการ
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-12 text-center text-xs text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังโหลดข้อมูลสื่อส่งเสริมการขาย...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-12 text-center text-xs text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                      <span className="font-medium text-slate-500">
                        ไม่พบข้อมูลสื่อส่งเสริมการขายตามเงื่อนไขที่ระบุ
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => {
                  const itemIndex = (page - 1) * perPage + index + 1;
                  const catStyle =
                    CATEGORY_STYLES[item.category] || {
                      bg: "bg-slate-100",
                      text: "text-slate-700",
                      border: "border-slate-200",
                    };

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group text-xs"
                    >
                      <TableCell className="py-2.5 px-3 text-center font-medium text-slate-400">
                        {itemIndex}
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="py-2.5 px-3 font-mono font-semibold text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200/70 text-[11px]">
                          {item.sku}
                        </span>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                            catStyle.bg,
                            catStyle.text,
                            catStyle.border,
                          )}
                        >
                          {item.category}
                        </span>
                      </TableCell>

                      {/* Name & Description */}
                      <TableCell className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 leading-snug">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </TableCell>

                      {/* Unit */}
                      <TableCell className="py-2.5 px-3 text-center text-slate-600 font-medium whitespace-nowrap">
                        {item.unit || "ชิ้น"}
                      </TableCell>

                      {/* Price */}
                      <TableCell className="py-2.5 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                        ฿ {(item.price ?? 0).toLocaleString()}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            ปิดใช้งาน
                          </span>
                        )}
                      </TableCell>

                      {/* Updated At */}
                      <TableCell className="py-2.5 px-3 text-center text-[11px] text-slate-400 hidden md:table-cell whitespace-nowrap">
                        {formatDate(item.updatedAt || item.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      {(canEdit || canDelete) && (
                        <TableCell className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {canEdit && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                title="แก้ไขข้อมูล"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {canDelete && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(item)}
                                title="ลบรายการ"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 sm:px-4 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-500 font-medium">
            แสดง{" "}
            <span className="font-bold text-slate-700">
              {total > 0 ? (page - 1) * perPage + 1 : 0}
            </span>{" "}
            ถึง{" "}
            <span className="font-bold text-slate-700">
              {Math.min(page * perPage, total)}
            </span>{" "}
            จากทั้งหมด{" "}
            <span className="font-bold text-slate-900">
              {total.toLocaleString()}
            </span>{" "}
            รายการ
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="h-8 px-2.5 text-xs bg-white border-slate-200"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              ก่อนหน้า
            </Button>

            <span className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
              หน้า {page} / {Math.max(1, totalPages)}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="h-8 px-2.5 text-xs bg-white border-slate-200"
            >
              ถัดไป
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
