"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  CheckCircle2,
  Eye,
  Search,
  Package,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  listProductsAction,
  approveProductAction,
  type ProductRecord,
} from "@/modules/products";
import { ProductStatusBadge } from "../../ui/product-status-badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ProductApprovalListView() {
  const router = useRouter();
  const { hasPermission, isLoading: checkingPermission } =
    usePermission("menu.products");
  const canApprove = hasPermission("product.approve");
  const canView = hasPermission("product.view");

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [approveCandidate, setApproveCandidate] =
    useState<ProductRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listProductsAction({
        page: 1,
        perPage: 100,
        status: "PENDING_APPROVAL",
        q: search.trim() || undefined,
      });
      setProducts((result.products ?? []) as ProductRecord[]);
      setTotal(typeof result.total === "number" ? result.total : 0);
    } catch (err: any) {
      toast.error(err.message || "โหลดข้อมูลรายการรออนุมัติไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPendingProducts();
  }, [fetchPendingProducts]);

  const handleApprove = async () => {
    if (!approveCandidate) return;
    setActionLoading(true);
    try {
      const result = await approveProductAction(approveCandidate.id);
      if (!result.success) throw new Error(result.error || "Approve failed");
      toast.success(
        `อนุมัติสินค้า "${approveCandidate.name}" สำเร็จ (สถานะ: ใช้งาน)`,
      );
      setApproveCandidate(null);
      await fetchPendingProducts();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถอนุมัติสินค้าได้");
    } finally {
      setActionLoading(false);
    }
  };

  if (checkingPermission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!canView && !canApprove) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Banner / Header */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-6 sm:p-8 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-lg shadow-amber-500/20">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  กลับหน้ารายการสินค้า
                </Link>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                ตรวจสอบและอนุมัติสินค้า
                {total > 0 && (
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                    {total}
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                รายการสินค้าที่สร้างใหม่และรอการตรวจสอบความถูกต้องก่อนเปิดใช้งานในระบบ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 hover:bg-white text-slate-700 font-medium"
              onClick={() => fetchPendingProducts()}
            >
              รีเฟรชข้อมูล
            </Button>
          </div>
        </div>
      </div>

      {/* Approve Confirm Dialog */}
      {approveCandidate && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="bg-black/40 backdrop-blur-sm absolute inset-0 transition-opacity"
            onClick={() => setApproveCandidate(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl ring-1 ring-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                ยืนยันการอนุมัติสินค้า
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              คุณต้องการอนุมัติสินค้า{" "}
              <span className="font-semibold text-slate-900">
                {approveCandidate.name} ({approveCandidate.productCode})
              </span>{" "}
              ใช่หรือไม่?
              <br />
              <span className="text-xs text-slate-500 mt-1 block">
                เมื่ออนุมัติแล้ว สถานะจะเปลี่ยนเป็น &quot;ใช้งาน&quot;
                และสามารถนำไปสร้างรายการขายได้ทันที
              </span>
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setApproveCandidate(null)}
              >
                ยกเลิก
              </Button>
              <Button
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm shadow-emerald-700/20"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? "กำลังอนุมัติ..." : "อนุมัติสินค้า"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารหัสสินค้า, ชื่อสินค้า..."
              className="pl-9 text-sm rounded-xl border-slate-200 focus-visible:ring-amber-500"
            />
          </div>
          <div className="text-xs font-medium text-slate-500 self-end sm:self-auto">
            แสดง {products.length} รายการที่รอการอนุมัติ
          </div>
        </div>

        {/* Products List / Table */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-3 text-sm text-slate-500">กำลังโหลดข้อมูลสินค้า...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 mb-4 shadow-sm">
              <Sparkles className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              ไม่มีสินค้าที่รอการอนุมัติ
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              สินค้าทั้งหมดในระบบได้รับการอนุมัติเรียบร้อยแล้ว
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 rounded-xl border-slate-200"
              asChild
            >
              <Link href="/products">กลับไปยังรายการสินค้า</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[13px] font-semibold text-slate-600">
                  <th className="py-3.5 px-4 sm:px-6">สินค้า</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">หมวดหมู่ / แบรนด์</th>
                  <th className="py-3.5 px-4">หน่วย / ขนาด</th>
                  <th className="py-3.5 px-4 text-right hidden sm:table-cell">ราคา (ลัง/ชิ้น)</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">วันที่สร้าง</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-amber-50/30 transition-colors group"
                  >
                    {/* Product Name & Code */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 ring-1 ring-slate-200/70 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                          <Package className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.id}`}
                            className="font-medium text-slate-900 hover:text-amber-700 transition-colors block truncate max-w-xs sm:max-w-sm"
                          >
                            {item.name}
                          </Link>
                          <span className="text-xs font-mono text-slate-500">
                            {item.productCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Brand */}
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-slate-700">
                          {item.brand || "-"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.tradeNameGroup?.code || item.category?.description || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Unit & Package */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-slate-800">
                          {item.unit || "-"}
                        </span>
                        {item.packageSize && (
                          <span className="text-xs text-slate-500">
                            {item.packageSize} {item.packageSizeUnit || ""}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 text-right hidden sm:table-cell">
                      {item.cartonPrice ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-bold text-emerald-700 tabular-nums">
                            ฿{Number(item.cartonPrice).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-[11px] text-slate-500">ต่อลัง</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {item.createdAt
                          ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")
                          : "-"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <ProductStatusBadge status={item.status} className="text-xs" />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          asChild
                        >
                          <Link href={`/products/${item.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            ดูข้อมูล
                          </Link>
                        </Button>

                        {canApprove && (
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shadow-emerald-700/20"
                            onClick={() => setApproveCandidate(item)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            อนุมัติ
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
