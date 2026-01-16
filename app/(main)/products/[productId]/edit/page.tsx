"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductForm } from "@/components/features/products";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types/product";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.productId as string;
  const { hasPermission, isLoading: permissionLoading } =
    usePermission("product.update");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <AlertDescription>คุณไม่มีสิทธิ์ในการแก้ไขสินค้า</AlertDescription>
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
    <section className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl border-b pb-6">
              แก้ไขสินค้า
            </h5>
          </div>

          <ProductForm
            initialData={{
              productCode: product.productCode,
              name: product.name,
              commonName: product.commonName || "",
              unit: product.unit || "",
              productGroup: product.productGroup || "",
              brand: product.brand || "",
              packageSize: product.packageSize || "",
              packageSizePerBox: product.packageSizePerBox || "",
              status: product.status,
              usedForPlants: product.usedForPlants,
              salesPoint: product.salesPoint || "",
              properties: product.properties || "",
              images:
                product.images?.map((img: any) => ({
                  id: img.id,
                  url: img.url,
                  name: img.filename,
                  size: 0,
                })) || [],
              coverIndex:
                product.images && product.images.length > 0 ? 0 : null,
            }}
            productId={productId}
            isEdit
          />
        </div>
      </Card>
    </section>
  );
}
