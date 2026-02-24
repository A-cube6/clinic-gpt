"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CardShell, ManageModal, type EntitySpec } from "@/components/admin/owner-dashboard";

type StaffRow = { full_name: string | null; id: string; role: string | null; created_at?: string | null };
type CustomerRow = { id: string; email: string | null; full_name: string | null; phone: string | null; created_at?: string | null };
type CatalogRow = { id: string; sku: string; name: string; price_inr: number; active: boolean; created_at?: string | null };

export default function OwnerDashboardClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<null | "staff" | "customers" | "catalog">(null);

  // quick counts
  const [staffCount, setStaffCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [catalogCount, setCatalogCount] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/admin/login?next=/admin/owner");
        return;
      }

      // Owner-only gate (expects staff_profiles with role)
      const { data: staff, error } = await supabase
        .from("staff_profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (error) {
        // If RLS blocks, show a helpful message instead of blank
        console.error("Role lookup failed", error);
        setRole(null);
        setReady(true);
        return;
      }

      const r = staff?.role ?? null;
      setRole(r);
      setReady(true);

      if (r !== "owner") {
        // reception should land on /staff
        router.push(r === "reception" ? "/staff" : "/admin");
        return;
      }

      // preload counts (best-effort)
      const [s, c, p] = await Promise.all([
        supabase.from("staff_profiles").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("catalog_items").select("id", { count: "exact", head: true }),
      ]);
      if (s.count != null) setStaffCount(s.count);
      if (c.count != null) setCustomerCount(c.count);
      if (p.count != null) setCatalogCount(p.count);
    })();
  }, [router, supabase]);

  const staffSpec: EntitySpec<StaffRow> = {
    title: "Staff",
    table: "staff_profiles",
    primaryKey: "id",
    description: "Owner & reception users. Edit roles carefully.",
    columns: [
      { key: "full_name", label: "Name", type: "text", readOnly: true },      
      { key: "role", label: "Role", type: "select", options: ["owner", "reception"], required: true },
      { key: "created_at", label: "Created", type: "datetime", readOnly: true },
      { key: "id", label: "User ID", type: "text", readOnly: true },
    ],
    defaultRow: () => ({ id: "", role: "reception" }),
    exportFileName: "staff.csv",
  };

  const customersSpec: EntitySpec<CustomerRow> = {
    title: "Customers",
    table: "customers",
    primaryKey: "id",
    description: "Customer directory. (Login UI will be added later.)",
    columns: [
      { key: "id", label: "User ID", type: "text", readOnly: true },
      { key: "email", label: "Email", type: "text", required: true },
      { key: "full_name", label: "Full name", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "created_at", label: "Created", type: "datetime", readOnly: true },
    ],
    defaultRow: () => ({ id: "", email: "", full_name: "", phone: "" }),
    exportFileName: "customers.csv",
  };

  const catalogSpec: EntitySpec<CatalogRow> = {
    title: "Item catalog",
    table: "catalog_items",
    primaryKey: "id",
    description: "Products used by the Shop section. Keep SKUs unique.",
    columns: [
      { key: "id", label: "ID", type: "text", readOnly: true },
      { key: "sku", label: "SKU", type: "text", required: true },
      { key: "name", label: "Name", type: "text", required: true },
      { key: "price_inr", label: "Price (INR)", type: "number", required: true },
      { key: "active", label: "Active", type: "boolean", required: true },
      { key: "created_at", label: "Created", type: "datetime", readOnly: true },
    ],
    defaultRow: () => ({ id: "", sku: "", name: "", price_inr: 0, active: true }),
    exportFileName: "catalog_items.csv",
  };

  if (!ready) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-sm text-slate-600">Loading owner dashboard…</div>
      </main>
    );
  }

  if (role !== "owner") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-semibold text-slate-900">Access restricted</div>
          <div className="mt-2 text-sm text-slate-600">This page is for the clinic owner only.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Owner Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Manage staff, customers, and product catalog. Export to CSV/print supported.</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/admin/login");
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Logout
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <CardShell
          title="Staff"
          subtitle={`${staffCount} users`}
          cta="Manage"
          onClick={() => setActiveModal("staff")}
        />
        <CardShell
          title="Customers"
          subtitle={`${customerCount} customers`}
          cta="Manage"
          onClick={() => setActiveModal("customers")}
        />
        <CardShell
          title="Item catalog"
          subtitle={`${catalogCount} items`}
          cta="Manage"
          onClick={() => setActiveModal("catalog")}
        />
      </div>

      {activeModal === "staff" ? (
        <ManageModal supabase={supabase} spec={staffSpec} onClose={() => setActiveModal(null)} />
      ) : null}
      {activeModal === "customers" ? (
        <ManageModal supabase={supabase} spec={customersSpec} onClose={() => setActiveModal(null)} />
      ) : null}
      {activeModal === "catalog" ? (
        <ManageModal supabase={supabase} spec={catalogSpec} onClose={() => setActiveModal(null)} />
      ) : null}

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">Next steps (after you approve this UI)</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Bookings calendar + leads table</li>
          <li>Billing dashboard (daily/weekly) + expenses</li>
          <li>Order management: payments + fulfillment</li>
        </ul>
      </div>
    </main>
  );
}
