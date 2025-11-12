export default function SalesReportPage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Sales Report</h1>
        <p className="text-sm text-muted-foreground">Monitor pipeline conversions and revenue.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium">Pipeline</h2>
          <p className="text-sm text-slate-600">Visualize deal stages here.</p>
        </div>
        <div className="rounded border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium">Revenue</h2>
          <p className="text-sm text-slate-600">Chart total monthly revenue.</p>
        </div>
      </div>
    </section>
  );
}
