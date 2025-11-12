export default function NewCompanyPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">New company</h1>
        <p className="text-sm text-muted-foreground">Add a new client organization to your CRM.</p>
      </header>
      <form className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Company name</span>
          <input className="rounded border px-3 py-2" placeholder="Acme Inc." />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Industry</span>
          <input className="rounded border px-3 py-2" placeholder="Financial services" />
        </label>
        <label className="md:col-span-2 grid gap-2 text-sm">
          <span className="font-medium">Description</span>
          <textarea className="min-h-[120px] rounded border px-3 py-2" placeholder="Notes, ideal customer profile, etc." />
        </label>
        <div className="md:col-span-2 flex justify-end gap-3">
          <button className="rounded border px-3 py-2 text-sm" type="button">
            Cancel
          </button>
          <button className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700" type="submit">
            Save company
          </button>
        </div>
      </form>
    </section>
  );
}
