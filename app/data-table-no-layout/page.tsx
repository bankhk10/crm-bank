import DemoDataTable from "@/components/features/data-table-demo/demo-data-table";

export default function DataTableNoLayoutPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Data Table (ไม่มี Layout ครอบหน้า)</h1>
          <p className="text-sm text-muted-foreground">
            หน้าตัวอย่างนี้ไม่ใช้ DashboardShell เพื่อดูการแสดงผลของตารางแบบเต็มหน้าจอและการเลื่อนแนวนอน
            เมื่อคอลัมน์ล้นจอ
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <DemoDataTable />
        </div>
      </div>
    </div>
  );
}
