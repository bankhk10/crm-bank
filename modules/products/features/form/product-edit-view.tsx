"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductForm, getProductAction, updateProductAction, type Product } from "@/modules/products";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProductEditView() {
  const { productId } = useParams() as { productId: string };
  const router = useRouter();
  const { hasPermission: checkPerm, isLoading: permissionLoading } = usePermission();
  const hasPermission = checkPerm("product.edit") || checkPerm("product.manage");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const result = await getProductAction(productId);
        if (!result.success) throw new Error(result.error || "ไม่สามารถโหลดข้อมูลสินค้าได้");
        setProduct((result as any).product);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
              chemicalGroup: product.chemicalGroup || "",
              packageSize: product.packageSize || "",
              packageSizeUnit: product.packageSizeUnit || "",
              packageSizePerBox: product.packageSizePerBox || "",
              status: product.status,
              usedForPlants: product.usedForPlants,
              salesPoint: product.salesPoint || "",
              properties: product.properties || "",
              categoryId: product.categoryId || undefined,
              productABCTypeId: product.productABCTypeId || undefined,
              parentId: product.parentId || undefined,
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
            onSubmit={async (payload) => {
              const result = await updateProductAction(productId, payload);
              return {
                success: result.success,
                error: result.error,
                data: result.success ? { product: (result as any).product } : undefined,
              };
            }}
            onCancel={() => router.push(`/products`)}
          />
        </div>
      </Card>
    </section>
  );
}
