"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Package,
  Tag,
  Layers,
  Box,
  Ruler,
  Beaker,
  CheckCircle2,
  XCircle,
  Leaf,
  Target,
  FileText,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  FolderOpen,
  Link2,
  Hash,
  Edit,
  Trash2,
  Copy,
  Clock,
  Loader2,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  getProductAction,
  deleteProductAction,
  approveProductAction,
  type Product,
} from "@/modules/products";
import { PACKAGE_UNIT_OPTIONS } from "@/modules/products/constants";
import { DetailHero } from "@/components/custom/detail-hero";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ProductDetailView() {
  const { productId } = useParams() as { productId: string };
  const router = useRouter();
  const { hasPermission, isLoading: permissionLoading } =
    usePermission("product.view");
  const canEdit =
    hasPermission("product.edit") || hasPermission("product.manage");
  const canDelete = hasPermission("product.delete");
  const canCreate = hasPermission("product.create");
  const canApprove = hasPermission("product.approve");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(false);

  // Image gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await getProductAction(productId);
        if (!res.success || !("product" in res))
          throw new Error((res as any).error || "ไม่สามารถโหลดข้อมูลสินค้าได้");
        setProduct(res.product as Product);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleDelete = async () => {
    if (!product) return;

    setDeleting(true);
    try {
      const res = await deleteProductAction(productId);
      if (!res.success) throw new Error(res.error || "ไม่สามารถลบสินค้าได้");

      toast.success("ลบสินค้าเรียบร้อยแล้ว");
      router.push("/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "ลบสินค้าไม่สำเร็จ");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleApprove = async () => {
    if (!product) return;
    setApproving(true);
    try {
      const res = await approveProductAction(productId);
      if (!res.success)
        throw new Error(res.error || "ไม่สามารถอนุมัติสินค้าได้");
      toast.success("อนุมัติสินค้าเรียบร้อยแล้ว (สถานะ: ใช้งาน)");
      setProduct((prev) => (prev ? { ...prev, status: "ACTIVE" } : null));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการอนุมัติสินค้า");
    } finally {
      setApproving(false);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex === null || !product?.images) return;
    setSelectedImageIndex((prev) =>
      prev === null ? null : (prev + 1) % product.images!.length,
    );
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePrevImage = () => {
    if (selectedImageIndex === null || !product?.images) return;
    setSelectedImageIndex((prev) =>
      prev === null
        ? null
        : (prev - 1 + product.images!.length) % product.images!.length,
    );
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "Escape") setSelectedImageIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, product?.images]);

  useEffect(() => {
    if (selectedImageIndex === null) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [selectedImageIndex]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          คุณไม่มีสิทธิ์ในการดูรายละเอียดสินค้า
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!product) {
    return (
      <Alert variant="destructive">
        <AlertDescription>ไม่พบข้อมูลสินค้า</AlertDescription>
      </Alert>
    );
  }

  const images = product.images ?? [];
  const activeImage = images[activeImageIndex];

  return (
    <div className="min-h-screen">
      <DetailHero
        backUrl="/products"
        backLabel="หน้ารายการสินค้า"
        title={product.name}
        icon={<Package className="h-8 w-8 sm:h-10 sm:w-10 text-white" />}
        accentColor="#B91C1C"
        badges={
          <>
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-200 bg-white/5 border border-white/50 px-3 py-1 rounded-full">
              รหัสสินค้า : {product.productCode}
            </span>
            {product.status === "ACTIVE" ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/50 px-3 py-1 rounded-full uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ใช้งาน
              </span>
            ) : product.status === "PENDING_APPROVAL" ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-300 bg-amber-400/20 border border-amber-400/50 px-3 py-1 rounded-full uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5" />
                รออนุมัติ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-gray-200 bg-white/5 border border-white/50 px-3 py-1 rounded-full uppercase tracking-wider">
                <XCircle className="h-3.5 w-3.5" />
                {product.status || "ไม่ระบุ"}
              </span>
            )}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {product.status === "PENDING_APPROVAL" && canApprove && (
              <Button
                size="sm"
                className="h-10 px-4 sm:px-6 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400/40 rounded-xl shadow-lg shadow-emerald-950/20 backdrop-blur-md transition-all active:scale-[0.98]"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                )}
                อนุมัติสินค้า
              </Button>
            )}
            {canCreate && (
              <Button
                size="sm"
                className="h-10 px-4 sm:px-6 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-50 border border-amber-500/30 rounded-xl backdrop-blur-md transition-all active:scale-[0.98]"
                asChild
              >
                <Link href={`/products/new?copyFrom=${productId}`}>
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  คัดลอก
                </Link>
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                className="h-10 px-4 sm:px-6 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl backdrop-blur-md transition-all active:scale-[0.98]"
                asChild
              >
                <Link href={`/products/${productId}/edit`}>
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  แก้ไข
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                className="h-10 px-4 sm:px-6 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl backdrop-blur-md transition-all active:scale-[0.98]"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2 text-red-400" />
                ลบ
              </Button>
            )}
          </div>
        }
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Pending Approval Banner */}
        {product.status === "PENDING_APPROVAL" && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 ring-1 ring-amber-300/60 shadow-sm">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-amber-900">
                  สินค้านี้อยู่ระหว่างรอการอนุมัติ
                </h3>
                <p className="text-xs sm:text-sm text-amber-700 mt-0.5">
                  สินค้ายังไม่สามารถนำไปสร้างใบสั่งขาย (Sales Note / Order) ได้ จนกว่าจะได้รับการตรวจสอบและอนุมัติ
                </p>
              </div>
            </div>
            {canApprove && (
              <Button
                size="sm"
                className="w-full sm:w-auto font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 shadow-md shadow-emerald-700/20 transition-all shrink-0"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                อนุมัติสินค้านี้
              </Button>
            )}
          </div>
        )}

        {/* Main product layout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* ─── LEFT: Image Gallery ─── */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
              {images.length > 0 ? (
                <div className="space-y-3">
                  {/* Main large image */}
                  <div
                    className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-200 cursor-zoom-in group"
                    onClick={() => {
                      setSelectedImageIndex(activeImageIndex);
                    }}
                  >
                    <img
                      src={activeImage.url}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                    <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      คลิกเพื่อดูขนาดเต็ม
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 bg-white flex items-center justify-center p-1 ${
                            index === activeImageIndex
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square w-full rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                  <div className="text-center text-gray-400">
                    <Package className="h-16 w-16 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">ไม่มีรูปภาพ</p>
                  </div>
                </div>
              )}
            </div>

            {/* ─── RIGHT: Product Info ─── */}
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
              {product.name && (
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {product.name}
                  </h2>
                </div>
              )}

              {/* Price */}
              {(Number(product.price) > 0 ||
                Number(product.cartonPrice) > 0) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 space-y-2">
                  <p className="text-xl font-semibold text-blue-700 uppercase tracking-wide">
                    ราคาสินค้า
                  </p>
                  {Number(product.price) > 0 && (
                    <div>
                      <p className="text-sm text-blue-400">ราคาต่อชิ้น</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {Number(product.price).toLocaleString()}
                        <span className="text-sm font-normal text-blue-500 ml-1">
                          บาท
                        </span>
                      </p>
                    </div>
                  )}
                  {Number(product.cartonPrice) > 0 && (
                    <div>
                      <p className="text-sm text-blue-400">ราคาต่อลัง</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {Number(product.cartonPrice).toLocaleString()}
                        <span className="text-sm font-normal text-blue-500 ml-1">
                          บาท
                        </span>
                      </p>
                    </div>
                  )}
                  {Number(product.promotionBudget) > 0 && (
                    <p className="text-sm text-purple-600 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      งบส่งเสริม:{" "}
                      {Number(product.promotionBudget).toLocaleString()} บาท
                    </p>
                  )}
                  {Number(product.pointPerUnit) > 0 && (
                    <p className="text-sm text-amber-600 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" />
                      คะแนนต่อหน่วย: {product.pointPerUnit} คะแนน
                    </p>
                  )}
                </div>
              )}

              {/* Attributes */}
              <div className="space-y-0 divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <AttributeRow
                  icon={<Hash className="h-4 w-4" />}
                  label="รหัสสินค้า"
                  value={product.productCode}
                />
                <AttributeRow
                  icon={<Tag className="h-4 w-4" />}
                  label="ชื่อสามัญ"
                  value={product.commonName}
                />
                <AttributeRow
                  icon={<Layers className="h-4 w-4" />}
                  label="กลุ่มชื่อการค้า"
                  value={
                    product.tradeNameGroup
                      ? `${product.tradeNameGroup.code}`
                      : undefined
                  }
                />
                <AttributeRow
                  icon={<Beaker className="h-4 w-4" />}
                  label="กลุ่มสินค้า"
                  value={
                    product.productGroup
                      ? `${product.productGroup.code} - ${product.productGroup.name}`
                      : undefined
                  }
                />
                <AttributeRow
                  icon={<Tag className="h-4 w-4" />}
                  label="แบรนด์"
                  value={product.brand}
                />
                <AttributeRow
                  icon={<FolderOpen className="h-4 w-4" />}
                  label="หมวดสินค้า"
                  value={
                    product.category
                      ? `${product.category.description}`
                      : undefined
                  }
                />
                <AttributeRow
                  icon={<Layers className="h-4 w-4" />}
                  label="ประเภท (ABC Code)"
                  value={
                    product.productABCType
                      ? product.productABCType.name
                      : undefined
                  }
                />
                <AttributeRow
                  icon={<Link2 className="h-4 w-4" />}
                  label="สินค้าหลัก"
                  value={
                    product.parent
                      ? `${product.parent.productCode} - ${product.parent.name}`
                      : undefined
                  }
                />
                <AttributeRow
                  icon={<Ruler className="h-4 w-4" />}
                  label="หน่วยนับ"
                  value={
                    product.unitObj
                      ? `${product.unitObj.code} - ${product.unitObj.description}`
                      : product.unit
                  }
                />
                <AttributeRow
                  icon={<Box className="h-4 w-4" />}
                  label="ขนาดบรรจุ"
                  value={
                    product.packageSize
                      ? `${product.packageSize} ${PACKAGE_UNIT_OPTIONS.find((opt) => opt.value === product.packageSizeUnit)?.label || product.packageSizeUnit || ""}`
                      : undefined
                  }
                />
                <AttributeRow
                  icon={<Layers className="h-4 w-4" />}
                  label="จำนวนบรรจุต่อลัง"
                  value={
                    product.packageSizePerBox
                      ? `${product.packageSizePerBox} ชิ้น`
                      : undefined
                  }
                />
                <AttributeRow
                  icon={<Ruler className="h-4 w-4" />}
                  label="ขนาดบรรจุรวมต่อลัง"
                  value={
                    product.totalPackageSizePerBox
                      ? `${product.totalPackageSizePerBox} ${PACKAGE_UNIT_OPTIONS.find((opt) => opt.value === product.packageSizeUnit)?.label || product.packageSizeUnit || ""}`
                      : undefined
                  }
                />
                {product.approvedBy && (
                  <AttributeRow
                    icon={<UserCheck className="h-4 w-4" />}
                    label="ผู้อนุมัติ"
                    value={product.approvedBy.name}
                  />
                )}
                {product.approvedAt && (
                  <AttributeRow
                    icon={<Clock className="h-4 w-4" />}
                    label="วันที่อนุมัติ"
                    value={format(
                      new Date(product.approvedAt),
                      "dd/MM/yyyy HH:mm น.",
                    )}
                  />
                )}
              </div>

              {/* Used For Plants */}
              {product.usedForPlants && product.usedForPlants.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5" />
                    ใช้กับพืช
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.usedForPlants.map((plant, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 border border-green-200"
                      >
                        <Leaf className="h-3 w-3" />
                        {plant}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── BOTTOM: Sales Point & Properties ─── */}
          {(product.salesPoint || product.properties) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-gray-100 bg-slate-50/30">
              {product.salesPoint && (
                <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-amber-500" />
                    จุดขายสินค้า
                  </h2>
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                    {product.salesPoint}
                  </p>
                </div>
              )}
              {product.properties && (
                <div className="p-6">
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-teal-500" />
                    คุณสมบัติสินค้า
                  </h2>
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                    {product.properties}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogTitle>ยืนยันการลบสินค้า</DialogTitle>
          <DialogDescription>
            คุณต้องการลบสินค้า <strong>{product.name}</strong> ใช่หรือไม่?
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "กำลังลบ..." : "ลบสินค้า"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Dialog */}
      {selectedImageIndex !== null && product?.images && (
        <Dialog
          open={selectedImageIndex !== null}
          onOpenChange={(open) => !open && setSelectedImageIndex(null)}
        >
          <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-black/20 backdrop-blur-md border-none shadow-none flex items-center justify-center outline-none [&>button]:hidden">
            <DialogTitle className="sr-only">Image Preview</DialogTitle>

            {selectedImageIndex !== null && product.images && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedImageIndex(null)}
                  className="absolute top-6 right-6 z-50 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 hover:scale-110"
                >
                  <X className="h-6 w-6" />
                </button>

                {/* Navigation Buttons */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      className="absolute left-4 md:left-8 z-50 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 group hover:scale-110"
                    >
                      <ChevronLeft className="h-7 w-7 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="absolute right-4 md:right-8 z-50 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 group hover:scale-110"
                    >
                      <ChevronRight className="h-7 w-7 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </>
                )}

                {/* Main Image */}
                <div
                  className="relative max-w-full max-h-full flex flex-col items-center overflow-hidden"
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onDoubleClick={handleDoubleClick}
                  style={{
                    cursor:
                      zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                  }}
                >
                  <img
                    src={product.images[selectedImageIndex].url}
                    alt={product.name}
                    className="max-w-full max-h-[85vh] object-contain select-none transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      transformOrigin: "center center",
                    }}
                    draggable={false}
                  />

                  {zoom > 1 && (
                    <div className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-sm font-bold border border-white/20 shadow-2xl">
                      🔍 {Math.round(zoom * 100)}%
                    </div>
                  )}

                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10 shadow-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    🖱️ ล้อเมาส์เพื่อซูม • ลากเพื่อเลื่อน •
                    ดับเบิลคลิกเพื่อรีเซ็ต
                  </div>

                  <div className="mt-6 px-6 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-white text-base font-bold border border-white/20 shadow-2xl">
                    {selectedImageIndex + 1} / {product.images.length}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AttributeRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2 shrink-0 sm:w-40 mb-0.5 sm:mb-0">
          {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
          <span className="text-xs sm:text-sm text-gray-500 font-medium">
            {label}
          </span>
        </div>
        <span className="text-sm font-semibold text-gray-900 overflow-wrap-anywhere break-words min-w-0 pl-6 sm:pl-0 leading-snug">
          {value}
        </span>
      </div>
    </div>
  );
}
