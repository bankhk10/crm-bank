import { Metadata } from "next";
import { SalesImportWizard } from "@/modules/sales-import/features/sales-import-wizard";

export const metadata: Metadata = {
  title: "นำเข้าข้อมูลการขาย | CRM",
  description: "นำเข้าข้อมูลยอดขายสรุป (Legacy Sales Data) ผ่านระบบตัวกลาง",
};

export default function ImportSalesPage() {
  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">ระบบนำเข้าข้อมูลดิบ</h1>
        <p className="text-muted-foreground">
          ระบบซัพพอร์ตการนำเข้าข้อมูลยอดขายสรุป (Aggregated Monthly Data)
          เมื่อนำเข้าแล้ว ข้อมูลจะเชื่อมโยงไปที่ระบบ Report และ Dashboard โดยอัตโนมัติ
        </p>
      </div>
      <SalesImportWizard />
    </div>
  );
}
