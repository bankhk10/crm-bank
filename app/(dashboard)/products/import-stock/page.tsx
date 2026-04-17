import { Metadata } from "next";
import { Suspense } from "react";
import ProductStockImportView from "@/modules/products/features/import-stock/product-stock-import-view";

export const metadata: Metadata = {
  title: "นำเข้าสต็อกสินค้า | CRM Bank",
  description: "อัปโหลดไฟล์ Excel เพื่ออัพเดทสต็อกสินค้าหลายรายการพร้อมกัน",
};

export default function ProductStockImportPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Suspense fallback={<div>Loading...</div>}>
        <ProductStockImportView />
      </Suspense>
    </div>
  );
}
