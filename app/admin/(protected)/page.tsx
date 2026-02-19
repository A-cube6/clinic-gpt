import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getStats() {
  const supabase = await createSupabaseServerClient();

  const [{ count: leads }, { count: bookings }, { count: orders }] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  return {
    leads: leads ?? 0,
    bookings: bookings ?? 0,
    orders: orders ?? 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Owner / Reception access.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Leads</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.leads}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bookings</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.bookings}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Orders</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.orders}</div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
        Next steps: add sidebar navigation + calendar view for bookings + daily/weekly billing dashboards.
      </div>
    </main>
  );
}
