import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminHome() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  // Lightweight counts for MVP dashboard (tables added in the SQL snippet)
  const [{ count: leadsCount }, { count: bookingsCount }, { count: ordersCount }] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Owner + Reception view (MVP).</p>
        <p className="mt-2 text-xs text-slate-500">Signed in as: {auth.user?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Leads</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{leadsCount ?? 0}</div>
          <div className="mt-1 text-xs text-slate-500">Booking requests + messages</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Bookings</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{bookingsCount ?? 0}</div>
          <div className="mt-1 text-xs text-slate-500">Appointments</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Orders</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{ordersCount ?? 0}</div>
          <div className="mt-1 text-xs text-slate-500">Merch purchases</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-900">Next screens we’ll add</div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Leads table + status (new, contacted, booked, closed)</li>
          <li>Calendar view for bookings</li>
          <li>Billing: daily / weekly totals</li>
          <li>Expenses: materials, doctor payout, staff salary</li>
        </ul>
      </div>
    </div>
  );
}
