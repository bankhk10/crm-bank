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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/products"
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับไปหน้ารายการสินค้า
          </Link>

          {/* Product Header */}
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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {canManage && (
                <Button
                  asChild
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Link href={`/products/${productId}/manage`}>
                    <Settings className="h-5 w-5 mr-2" />
                    จัดการสินค้า
                  </Link>
                </Button>
              )}
              {canUpdate && (
                <Button
                  asChild
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Link href={`/products/${productId}/edit`}>
                    <Edit className="h-5 w-5 mr-2" />
                    แก้ไข
                  </Link>
                </Button>
              )}
              {canDelete && (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="shadow-lg hover:shadow-xl transition-all"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  ลบ
                </Button>
              )}
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
                  {product.images.map((image) => (
                    <div
                      key={image.id}
                      className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl"
                    >
                      <img
                        src={image.url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
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
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
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
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
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
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
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
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
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
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
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
