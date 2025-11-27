"use client";

import React from "react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProductForm from "@/components/features/products/product-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  const { hasPermission, isLoading } = usePermission("product.create");

  if (isLoading) {
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
          คุณไม่มีสิทธิ์ในการสร้างสินค้า
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          กลับไปหน้ารายการสินค้า
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">เพิ่มสินค้าใหม่</h1>
        <p className="mt-1 text-sm text-gray-500">
          กรอกข้อมูลสินค้าที่ต้องการเพิ่มลงในระบบ
        </p>
      </div>

      <ProductForm />
    </div>
  );
}
