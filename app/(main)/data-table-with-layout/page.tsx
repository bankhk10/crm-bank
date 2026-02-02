import DemoDataTable from "@/components/features/data-table-demo/demo-data-table";

export default function DataTableWithLayoutPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Table (มี Layout ครอบหน้า)</h1>
        <p className="text-sm text-muted-foreground">
          ตารางตัวอย่างที่อยู่ภายใน DashboardShell เพื่อให้เปรียบเทียบกับหน้าที่ไม่มี layout
          และสามารถเลื่อนแนวนอนได้เมื่อคอลัมน์ล้นจอ
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <DemoDataTable />
      </div>
    </section>
  );
}
