"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Settings } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          กลับไปหน้ารายการสินค้า
        </Link>

        <div className="flex gap-2">
          {canManage && (
            <Button
              asChild
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <Link href={`/products/${productId}/manage`}>
                <Settings className="h-4 w-4 mr-2" />
                จัดการสินค้า
              </Link>
            </Button>
          )}
          {canUpdate && (
            <Button
              asChild
              variant="outline"
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Link href={`/products/${productId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                แก้ไข
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบ
            </Button>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center">
          <div
            className="bg-black/50 absolute inset-0"
            onClick={() => setDeleteDialogOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold">ยืนยันการลบ</h3>
            <p className="mt-2 text-sm text-slate-600">
              คุณต้องการลบสินค้า <strong>{product.name}</strong> ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="mt-4 flex justify-end gap-2">
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
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500">รหัสสินค้า: {product.productCode}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Images */}
          {product.images && product.images.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                รูปภาพสินค้า
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {product.images.map((image) => (
                  <div
                    key={image.id}
                    className="aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={image.url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem label="ชื่อสินค้า" value={product.name} />
            <DetailItem label="ชื่อสามัญ" value={product.commonName} />
            <DetailItem label="รหัสสินค้า" value={product.productCode} />
            <DetailItem label="หน่วยนับ" value={product.unit} />
            <DetailItem label="กลุ่มสินค้า" value={product.productGroup} />
            <DetailItem label="แบรนด์สินค้า" value={product.brand} />
            <DetailItem label="ขนาดบรรจุ" value={product.packageSize} />
            <DetailItem
              label="ขนาดบรรจุต่อลัง"
              value={product.packageSizePerBox}
            />
            <DetailItem
              label="สถานะสินค้า"
              value={
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    product.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {product.status === "ACTIVE" ? "ใช้งาน" : "ไม่ใช้งาน"}
                </span>
              }
            />
            <DetailItem
              label="ใช้กับพืช"
              value={
                product.usedForPlants.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.usedForPlants.map((plant, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
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

          {/* Sales Point */}
          {product.salesPoint && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                จุดขายสินค้า
              </h3>
              <p className="text-gray-900 whitespace-pre-wrap">
                {product.salesPoint}
              </p>
            </div>
          )}

          {/* Properties */}
          {product.properties && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                คุณสมบัติ
              </h3>
              <p className="text-gray-900 whitespace-pre-wrap">
                {product.properties}
              </p>
            </div>
          )}

          {/* Pricing Info (if available) */}
          {(product.price || product.promotionBudget) && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ข้อมูลราคา
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.price && (
                  <DetailItem
                    label="ราคาสินค้า"
                    value={`${Number(product.price).toLocaleString()} บาท`}
                  />
                )}
                {product.promotionBudget && (
                  <DetailItem
                    label="งบส่งเสริมการขาย"
                    value={`${Number(product.promotionBudget).toLocaleString()} บาท`}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || "-"}</dd>
    </div>
  );
}
