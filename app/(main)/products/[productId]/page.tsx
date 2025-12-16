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
  ArrowLeft,
  Edit,
  Trash2,
  Settings,
  Package,
  Tag,
  Layers,
  Box,
  Ruler,
  CheckCircle2,
  XCircle,
  Leaf,
  Target,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types/product";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const { hasPermission, isLoading: permissionLoading } = usePermission("product.view");
  const canUpdate = hasPermission("product.update");
  const canDelete = hasPermission("product.delete");
  const canManage = hasPermission("product.manage");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลสินค้าได้");
        const data = await res.json();
        setProduct(data.product);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
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
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("ไม่สามารถลบสินค้าได้");

      router.push("/products");
      router.refresh();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex === null || !product?.images) return;
    setSelectedImageIndex((prev) =>
      prev === null ? null : (prev + 1) % product.images!.length
    );
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePrevImage = () => {
    if (selectedImageIndex === null || !product?.images) return;
    setSelectedImageIndex((prev) =>
      prev === null
        ? null
        : (prev - 1 + product.images!.length) % product.images!.length
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
  }, [selectedImageIndex]);

  // Reset zoom and pan when dialog closes
  useEffect(() => {
    if (selectedImageIndex === null) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [selectedImageIndex]);

  // Zoom and Pan Handlers
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
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

  return (
    <div className="min-h-screen from-slate-50 to-blue-50">
      {/* Hero Header Section */}
      {/* <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white"> */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Header */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <Link
            href="/products"
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับไปหน้ารายการสินค้า
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Package className="h-8 w-8" />
                <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>รหัสสินค้า: {product.productCode}</span>
                </div>
                {product.status === "ACTIVE" ? (
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-green-300" />
                    <span className="text-green-100">ใช้งาน</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-500/20 px-3 py-1 rounded-full">
                    <XCircle className="h-4 w-4 text-gray-300" />
                    <span className="text-gray-100">ไม่ใช้งาน</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Product Images Gallery */}
          {product.images && product.images.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-600" />
                  รูปภาพสินค้า
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {product.images.map((image, index) => (
                    <div
                      key={image.id}
                      className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl cursor-pointer"
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                      }}
                    >
                      <img
                        src={image.url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          คลิกเพื่อดูขนาดเต็ม
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Product Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-blue-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  ข้อมูลพื้นฐาน
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <DetailItem icon={<Package className="h-5 w-5" />} label="ชื่อสินค้า" value={product.name} />
                <DetailItem icon={<Tag className="h-5 w-5" />} label="ชื่อสามัญ" value={product.commonName} />
                <DetailItem icon={<Tag className="h-5 w-5" />} label="รหัสสินค้า" value={product.productCode} />
                <DetailItem icon={<Ruler className="h-5 w-5" />} label="หน่วยนับ" value={product.unit} />
                <DetailItem icon={<Layers className="h-5 w-5" />} label="กลุ่มสินค้า" value={product.productGroup} />
                <DetailItem icon={<Tag className="h-5 w-5" />} label="แบรนด์สินค้า" value={product.brand} />
              </div>
            </div>

            {/* Package Information Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-purple-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Box className="h-6 w-6 text-purple-600" />
                  ข้อมูลบรรจุภัณฑ์
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <DetailItem icon={<Box className="h-5 w-5" />} label="ขนาดบรรจุ" value={product.packageSize} />
                <DetailItem icon={<Layers className="h-5 w-5" />} label="ขนาดบรรจุต่อลัง" value={product.packageSizePerBox} />
                <DetailItem
                  icon={<Leaf className="h-5 w-5" />}
                  label="ใช้กับพืช"
                  value={
                    product.usedForPlants.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.usedForPlants.map((plant, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 border border-green-200"
                          >
                            <Leaf className="h-3.5 w-3.5" />
                            {plant}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Sales Point & Properties */}
          {(product.salesPoint || product.properties) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {product.salesPoint && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="p-6 border-b border-gray-100 bg-amber-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Target className="h-6 w-6 text-amber-600" />
                      จุดขายสินค้า
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {product.salesPoint}
                    </p>
                  </div>
                </div>
              )}

              {product.properties && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="p-6 border-b border-gray-100 bg-teal-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="h-6 w-6 text-teal-600" />
                      คุณสมบัติ
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {product.properties}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pricing Information */}
          {(product.price || product.promotionBudget) && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-emerald-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                  ข้อมูลราคา
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.price && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-blue-900">ราคาสินค้า</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">
                        {Number(product.price).toLocaleString()}
                        <span className="text-lg ml-2">บาท</span>
                      </p>
                    </div>
                  )}
                  {product.promotionBudget && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-600 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-purple-900">งบส่งเสริมการขาย</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {Number(product.promotionBudget).toLocaleString()}
                        <span className="text-lg ml-2">บาท</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
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

      {/* Image Viewer Dialog */}
      {selectedImageIndex !== null && product?.images && (
        <Dialog
          open={selectedImageIndex !== null}
          onOpenChange={(open) => !open && setSelectedImageIndex(null)}
        >
          <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-black/20 backdrop-blur-md border-none shadow-none flex items-center justify-center outline-none [&>button]:hidden">
            <DialogTitle className="sr-only">Image Preview</DialogTitle>

            {selectedImageIndex !== null && product.images && (
              <div className="relative w-full h-full flex items-center justify-center px-full">
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
                  style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                >
                  <img
                    src={product.images[selectedImageIndex].url}
                    alt={product.name}
                    className="max-w-full max-h-[85vh] object-contain select-none transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      transformOrigin: 'center center',
                    }}
                    draggable={false}
                  />

                  {/* Zoom Level Indicator */}
                  {zoom > 1 && (
                    <div className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-sm font-bold border border-white/20 shadow-2xl">
                      🔍 {Math.round(zoom * 100)}%
                    </div>
                  )}

                  {/* Instructions Overlay */}
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10 shadow-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    🖱️ ล้อเมาส์เพื่อซูม • ลากเพื่อเลื่อน • ดับเบิลคลิกเพื่อรีเซ็ต
                  </div>

                  {/* Image Counter Badge */}
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

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      {icon && <div className="text-gray-400 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
        <dd className="text-base text-gray-900 font-medium break-words">{value || "-"}</dd>
      </div>
    </div>
  );
}
