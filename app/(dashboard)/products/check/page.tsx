import { Metadata } from "next";
import { CheckProductView } from "@/modules/products";

export const metadata: Metadata = {
  title: "ตรวจสอบข้อมูลสินค้า",
  description: "อัปโหลดและตรวจสอบข้อมูลสินค้าจากไฟล์ Excel",
};

export default function CheckProductPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <CheckProductView />
    </div>
  );
}
