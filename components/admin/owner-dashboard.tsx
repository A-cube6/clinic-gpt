"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  Download,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Users,
  Package,
  UserRound,
  Stethoscope,
  X,
  RefreshCw,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type StaffRow = { id: string; role: string; full_name?: string | null };
type CustomerRow = { id: string; email: string; full_name?: string | null; phone?: string | null; created_at?: string | null };
type CatalogRow = { id: string; title: string; note?: string | null; price_inr: number; active: boolean; created_at?: string | null };
type OrderRow = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  subtotal_inr?: number | null;
  shipping_inr?: number | null;
  total_inr?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  title: string;
  qty: number;
  price_inr: number;
};
type DoctorRow = {
  id: string;
  name: string;
  phone?: string | null;
  qualifications?: string | null;
  speciality?: string | null;
  experience?: string | null;
  timings ?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  active: boolean;
  created_at?: string | null;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function shortId(id: string) {
  if (!id) return "";
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function toCsv(rows: any[], headers: string[]) {
  const esc = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function CardShell({
  icon,
  title,
  desc,
  cta,
  onOpen,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-2xl border border-slate-200 bg-white/80 p-6 text-left shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 transition-colors group-hover:bg-teal-600 group-hover:text-white">
            {icon}
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-600">{desc}</div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 group-hover:border-teal-200 group-hover:text-teal-700">
          {cta}
        </div>
      </div>
    </button>
  );
}

function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Toolbar({
  onRefresh,
  onAdd,
  onExport,
  onPrint,
  addLabel,
}: {
  onRefresh: () => void;
  onAdd: () => void;
  onExport: () => void;
  onPrint: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={onAdd}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onExport}
          type="button"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onPrint}
          type="button"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>
    </div>
  );
}

function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold text-slate-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export default function OwnerDashboard() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [openStaff, setOpenStaff] = useState(false);
  const [openCustomers, setOpenCustomers] = useState(false);
  const [openCatalog, setOpenCatalog] = useState(false);
  const [openDoctors, setOpenDoctors] = useState(false);
  const [openOrders, setOpenOrders] = useState(false);

  // --- STAFF ---
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffEdit, setStaffEdit] = useState<Partial<StaffRow> | null>(null);

  const loadStaff = async () => {
    setStaffLoading(true);
    setStaffError(null);
    const { data, error } = await supabase
      .from("staff_profiles")
      .select("id, role, full_name")
      .order("role", { ascending: true });
    if (error) setStaffError(error.message);
    setStaff((data ?? []) as StaffRow[]);
    setStaffLoading(false);
  };

  const upsertStaff = async () => {
    if (!staffEdit?.id) return;
    if (!confirm("Update this staff member?")) return;
    const payload = {
      id: staffEdit.id,
      role: staffEdit.role ?? "reception",
      full_name: staffEdit.full_name ?? null,
    };
    const { error } = await supabase.from("staff_profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      alert(error.message);
      return;
    }
    setStaffEdit(null);
    await loadStaff();
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Delete this staff member? This cannot be undone.")) return;
    const { error } = await supabase.from("staff_profiles").delete().eq("id", id);
    if (error) alert(error.message);
    await loadStaff();
  };

  // --- CUSTOMERS ---
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [custLoading, setCustLoading] = useState(false);
  const [custError, setCustError] = useState<string | null>(null);
  const [custEdit, setCustEdit] = useState<Partial<CustomerRow> | null>(null);

  const loadCustomers = async () => {
    setCustLoading(true);
    setCustError(null);
    const { data, error } = await supabase
      .from("customers")
      .select("id, email, full_name, phone, created_at")
      .order("created_at", { ascending: false });
    if (error) setCustError(error.message);
    setCustomers((data ?? []) as CustomerRow[]);
    setCustLoading(false);
  };

  const upsertCustomer = async () => {
    if (!custEdit?.email) return;
    if (!confirm("Save this customer record?")) return;

    const payload: any = {
      email: custEdit.email.trim(),
      full_name: custEdit.full_name ?? null,
      phone: custEdit.phone ?? null,
    };
    if (custEdit.id) payload.id = custEdit.id;

    const { error } = await supabase.from("customers").upsert(payload, { onConflict: "email" });
    if (error) {
      alert(error.message);
      return;
    }
    setCustEdit(null);
    await loadCustomers();
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("Delete this customer? This cannot be undone.")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) alert(error.message);
    await loadCustomers();
  };

  // --- CATALOG ---
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catEdit, setCatEdit] = useState<Partial<CatalogRow> | null>(null);

  const loadCatalog = async () => {
    setCatLoading(true);
    setCatError(null);
    const { data, error } = await supabase
      .from("catalog_items")
      .select("id, title, note, price_inr, active, created_at")
      .order("created_at", { ascending: false });
    if (error) setCatError(error.message);
    setCatalog((data ?? []) as CatalogRow[]);
    setCatLoading(false);
  };

  const upsertCatalog = async () => {
    if (!catEdit?.title) return;
    if (!confirm("Save this catalog item?")) return;

    const payload: any = {
      title: catEdit.title.trim(),
      note: catEdit.note ?? null,
      price_inr: Number.isFinite(Number(catEdit.price_inr)) ? Number(catEdit.price_inr) : 0,
      active: !!catEdit.active,
    };
    if (catEdit.id) payload.id = catEdit.id;

    const { error } = await supabase.from("catalog_items").upsert(payload);
    if (error) {
      alert(error.message);
      return;
    }
    setCatEdit(null);
    await loadCatalog();
  };

  const deleteCatalog = async (id: string) => {
    if (!confirm("Delete this catalog item? This cannot be undone.")) return;
    const { error } = await supabase.from("catalog_items").delete().eq("id", id);
    if (error) alert(error.message);
    await loadCatalog();
  };

  // --- ORDERS (read-only for now) ---
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [orderItemsByOrder, setOrderItemsByOrder] = useState<Record<string, OrderItemRow[]>>({});
  const [orderItemsLoading, setOrderItemsLoading] = useState<Record<string, boolean>>({});
  const [orderItemsError, setOrderItemsError] = useState<Record<string, string | null>>({});

  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, status, subtotal_inr, shipping_inr, total_inr, customer_name, customer_phone")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) setOrdersError(error.message);
    setOrders((data ?? []) as OrderRow[]);
    setOrdersLoading(false);
  };

  const loadOrderItems = async (orderId: string) => {
    setOrderItemsLoading((p) => ({ ...p, [orderId]: true }));
    setOrderItemsError((p) => ({ ...p, [orderId]: null }));

    const { data, error } = await supabase
      .from("order_items")
      .select("id, order_id, title, qty, price_inr")
      .eq("order_id", orderId)
      .order("title", { ascending: true });

    if (error) {
      setOrderItemsError((p) => ({ ...p, [orderId]: error.message }));
      setOrderItemsByOrder((p) => ({ ...p, [orderId]: [] }));
    } else {
      setOrderItemsByOrder((p) => ({ ...p, [orderId]: (data ?? []) as OrderItemRow[] }));
    }
    setOrderItemsLoading((p) => ({ ...p, [orderId]: false }));
  };

  const toggleOrder = async (orderId: string) => {
    const next = !(expandedOrders[orderId] ?? false);
    setExpandedOrders((p) => ({ ...p, [orderId]: next }));
    if (next && !orderItemsByOrder[orderId] && !orderItemsLoading[orderId]) {
      await loadOrderItems(orderId);
    }
  };

  // --- DOCTORS ---
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docEdit, setDocEdit] = useState<Partial<DoctorRow> | null>(null);

  const loadDoctors = async () => {
    setDocLoading(true);
    setDocError(null);
    const { data, error } = await supabase
      .from("doctors")
      .select("id, name, phone, qualifications, start_date, end_date, active, created_at")
      .order("created_at", { ascending: false });
    if (error) setDocError(error.message);
    setDoctors((data ?? []) as DoctorRow[]);
    setDocLoading(false);
  };

  const upsertDoctor = async () => {
    if (!docEdit?.name?.trim()) return;
    if (!confirm("Save this doctor?")) return;

    const payload: any = {
      name: docEdit.name.trim(),
      phone: docEdit.phone ?? null,
      qualifications: docEdit.qualifications ?? null,
      start_date: docEdit.start_date ?? null,
      end_date: docEdit.end_date ?? null,
      active: !!docEdit.active,
    };
    if (docEdit.id) payload.id = docEdit.id;

    const { error } = await supabase.from("doctors").upsert(payload);
    if (error) {
      alert(error.message);
      return;
    }
    setDocEdit(null);
    await loadDoctors();
  };

  const deleteDoctor = async (id: string) => {
    if (!confirm("Delete this doctor? This cannot be undone.")) return;
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) alert(error.message);
    await loadDoctors();
  };

  useEffect(() => {
    if (openStaff) loadStaff();
  }, [openStaff]);
  useEffect(() => {
    if (openCustomers) loadCustomers();
  }, [openCustomers]);
  useEffect(() => {
    if (openCatalog) loadCatalog();
  }, [openCatalog]);
  useEffect(() => {
    if (openDoctors) loadDoctors();
  }, [openDoctors]);
  useEffect(() => {
    if (openOrders) loadOrders();
  }, [openOrders]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Owner dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Manage staff, customers, and catalog items.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <CardShell
          icon={<Users className="h-5 w-5" />}
          title="Staff"
          desc="Owner can edit roles & names."
          cta="Manage"
          onOpen={() => setOpenStaff(true)}
        />
        <CardShell
          icon={<Stethoscope className="h-5 w-5" />}
          title="Doctors"
          desc="Doctor panel shown on homepage."
          cta="Manage"
          onOpen={() => setOpenDoctors(true)}
        />
        <CardShell
          icon={<UserRound className="h-5 w-5" />}
          title="Customers"
          desc="Customer directory (logins later)."
          cta="Manage"
          onOpen={() => setOpenCustomers(true)}
        />
        <CardShell
          icon={<Package className="h-5 w-5" />}
          title="Item catalog"
          desc="Products for shop (DB-backed)."
          cta="Manage"
          onOpen={() => setOpenCatalog(true)}
        />
        <CardShell
          icon={<ShoppingCart className="h-5 w-5" />}
          title="Orders"
          desc="Recent shop orders (read-only)."
          cta="View"
          onOpen={() => setOpenOrders(true)}
        />
      </div>

      <Modal title="Staff" open={openStaff} onClose={() => setOpenStaff(false)}>
        <Toolbar
          onRefresh={loadStaff}
          onAdd={() => setStaffEdit({ id: "", role: "reception", full_name: "" })}
          addLabel="Add/Upsert"
          onExport={() => {
            const rows = staff.map((s) => ({
              id: s.id,
              full_name: s.full_name ?? "",
              role: s.role,
            }));
            downloadText("staff.csv", toCsv(rows, ["id", "full_name", "role"])) ;
          }}
          onPrint={() => window.print()}
        />
        {staffError ? <div className="mt-4 text-sm text-red-600">{staffError}</div> : null}
        {staffLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={["Name", "Role", "User ID", "Actions"]}>
          {staff.map((s) => (
            <tr key={s.id} className="border-t border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">
                {s.full_name?.trim() ? s.full_name : <span className="text-slate-500">{shortId(s.id)}</span>}
              </td>
              <td className="px-4 py-3 text-slate-700">{s.role}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{shortId(s.id)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setStaffEdit({ ...s })}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteStaff(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>

        {staffEdit ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">Edit staff</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">User ID (auth uid)</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={staffEdit.id ?? ""}
                  onChange={(e) => setStaffEdit((s) => ({ ...(s ?? {}), id: e.target.value }))}
                  placeholder="uuid from auth.users"
                />
              </label>
              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">Full name</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={staffEdit.full_name ?? ""}
                  onChange={(e) => setStaffEdit((s) => ({ ...(s ?? {}), full_name: e.target.value }))}
                  placeholder="e.g., Anjali Sharma"
                />
              </label>
              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">Role</div>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={staffEdit.role ?? "reception"}
                  onChange={(e) => setStaffEdit((s) => ({ ...(s ?? {}), role: e.target.value }))}
                >
                  <option value="owner">owner</option>
                  <option value="reception">reception</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={upsertStaff}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setStaffEdit(null)}
              >
                Cancel
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-600">
              Note: User ID must be the auth user UID from Supabase Authentication → Users.
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal title="Customers" open={openCustomers} onClose={() => setOpenCustomers(false)}>
        <Toolbar
          onRefresh={loadCustomers}
          onAdd={() => setCustEdit({ email: "", full_name: "", phone: "" })}
          addLabel="Add customer"
          onExport={() => {
            const rows = customers.map((c) => ({
              id: c.id,
              email: c.email,
              full_name: c.full_name ?? "",
              phone: c.phone ?? "",
              created_at: c.created_at ?? "",
            }));
            downloadText("customers.csv", toCsv(rows, ["id", "email", "full_name", "phone", "created_at"])) ;
          }}
          onPrint={() => window.print()}
        />
        {custError ? <div className="mt-4 text-sm text-red-600">{custError}</div> : null}
        {custLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={["Name", "Email", "Phone", "Created", "Actions"]}>
          {customers.map((c) => (
            <tr key={c.id} className="border-t border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">{c.full_name?.trim() ? c.full_name : "—"}</td>
              <td className="px-4 py-3 text-slate-700">{c.email}</td>
              <td className="px-4 py-3 text-slate-700">{c.phone ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{c.created_at ? new Date(c.created_at).toLocaleString() : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setCustEdit({ ...c })}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteCustomer(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>

        {custEdit ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">{custEdit.id ? "Edit customer" : "Add customer"}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">Email</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={custEdit.email ?? ""}
                  onChange={(e) => setCustEdit((s) => ({ ...(s ?? {}), email: e.target.value }))}
                  placeholder="customer@gmail.com"
                />
              </label>
              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">Full name</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={custEdit.full_name ?? ""}
                  onChange={(e) => setCustEdit((s) => ({ ...(s ?? {}), full_name: e.target.value }))}
                  placeholder="Customer name"
                />
              </label>
              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">Phone</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={custEdit.phone ?? ""}
                  onChange={(e) => setCustEdit((s) => ({ ...(s ?? {}), phone: e.target.value }))}
                  placeholder="+91..."
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={upsertCustomer}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setCustEdit(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal title="Doctors" open={openDoctors} onClose={() => setOpenDoctors(false)}>
        <Toolbar
          onRefresh={loadDoctors}
          onAdd={() =>
            setDocEdit({
              name: "",
              phone: "",
              qualifications: "",
              start_date: null,
              end_date: null,
              active: true,
            })
          }
          addLabel="Add doctor"
          onExport={() => {
            const rows = doctors.map((d) => ({
              id: d.id,
              name: d.name,
              phone: d.phone ?? "",
              qualifications: d.qualifications ?? "",
              
              start_date: d.start_date ?? "",
              end_date: d.end_date ?? "",
              active: d.active,
              created_at: d.created_at ?? "",
            }));
            downloadText(
              "doctors.csv",
              toCsv(rows, ["id", "full_name", "phone", "qualifications", "start_date", "end_date", "active", "created_at"])
            );
          }}
          onPrint={() => window.print()}
        />

        {docError ? <div className="mt-4 text-sm text-red-600">{docError}</div> : null}
        {docLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={["Name", "Phone", "Qualifications", "Start", "End", "Active", "Actions"]}>
          {doctors.map((d) => (
            <tr key={d.id} className="border-t border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">{d.name}</td>
              <td className="px-4 py-3 text-slate-700">{d.phone ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700">{d.qualifications ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700">{d.start_date ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700">{d.end_date ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700">{d.active ? "Yes" : "No"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setDocEdit({ ...d })}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteDoctor(d.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>

        {docEdit ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">Edit doctor</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-xs font-semibold text-slate-700">Name</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={docEdit.name ?? ""}
                  onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), name: e.target.value }))}
                  placeholder="Dr. Name"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-semibold text-slate-700">Phone</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={docEdit.phone ?? ""}
                  onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), phone: e.target.value }))}
                  placeholder="+91…"
                />
              </label>
              <label className="block sm:col-span-2">
                <div className="mb-1 text-xs font-semibold text-slate-700">Qualifications</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={docEdit.qualifications ?? ""}
                  onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), qualifications: e.target.value }))}
                  placeholder="BDS / MDS…"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-semibold text-slate-700">Start date</div>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={docEdit.start_date ?? ""}
                  onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), start_date: e.target.value || null }))}
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-semibold text-slate-700">End date</div>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={docEdit.end_date ?? ""}
                  onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), end_date: e.target.value || null }))}
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!docEdit.active}
                  onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), active: e.target.checked }))}
                />
                <span className="text-sm font-semibold text-slate-700">Active</span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={upsertDoctor}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setDocEdit(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal title="Item catalog" open={openCatalog} onClose={() => setOpenCatalog(false)}>
        <Toolbar
          onRefresh={loadCatalog}
          onAdd={() => setCatEdit({ title: "", note: "", price_inr: 0, active: true })}
          addLabel="Add item"
          onExport={() => {
            const rows = catalog.map((i) => ({
              id: i.id,
              title: i.title,
              note: i.note ?? "",
              price_inr: i.price_inr,
              active: i.active,
              created_at: i.created_at ?? "",
            }));
            downloadText("catalog_items.csv", toCsv(rows, ["id", "title", "note", "price_inr", "active", "created_at"])) ;
          }}
          onPrint={() => window.print()}
        />
        {catError ? <div className="mt-4 text-sm text-red-600">{catError}</div> : null}
        {catLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={["Title", "Price (INR)", "Active", "Created", "Actions"]}>
          {catalog.map((i) => (
            <tr key={i.id} className="border-t border-slate-200">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{i.title}</div>
                {i.note ? <div className="mt-1 text-xs text-slate-600">{i.note}</div> : null}
              </td>
              <td className="px-4 py-3 text-slate-700">₹{i.price_inr}</td>
              <td className="px-4 py-3">
                <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", i.active ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-700")}>
                  {i.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{i.created_at ? new Date(i.created_at).toLocaleString() : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setCatEdit({ ...i })}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteCatalog(i.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>

        {catEdit ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">{catEdit.id ? "Edit item" : "Add item"}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <label className="block sm:col-span-2">
                <div className="mb-1 text-xs font-semibold text-slate-700">Title</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={catEdit.title ?? ""}
                  onChange={(e) => setCatEdit((s) => ({ ...(s ?? {}), title: e.target.value }))}
                  placeholder="Soft-bristle toothbrush"
                />
              </label>
              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">Price (INR)</div>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={String(catEdit.price_inr ?? 0)}
                  onChange={(e) => setCatEdit((s) => ({ ...(s ?? {}), price_inr: Number(e.target.value) }))}
                />
              </label>
              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">Active</div>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={catEdit.active ? "true" : "false"}
                  onChange={(e) => setCatEdit((s) => ({ ...(s ?? {}), active: e.target.value === "true" }))}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>
              <label className="block sm:col-span-4">
                <div className="mb-1 text-xs font-semibold text-slate-700">Note</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={catEdit.note ?? ""}
                  onChange={(e) => setCatEdit((s) => ({ ...(s ?? {}), note: e.target.value }))}
                  placeholder="Short description"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={upsertCatalog}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setCatEdit(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal title="Orders" open={openOrders} onClose={() => setOpenOrders(false)}>
        <Toolbar
          onRefresh={loadOrders}
          onAdd={() => alert("Orders are read-only for now. Next step: status updates via payment gateway.")}
          addLabel="—"
          onExport={() => {
            const rows = orders.map((o) => ({
              id: o.id,
              created_at: o.created_at ?? "",
              status: o.status ?? "",
              total_inr: o.total_inr ?? 0,
              customer_name: o.customer_name ?? "",
              customer_phone: o.customer_phone ?? "",
            }));
            downloadText("orders.csv", toCsv(rows, ["id", "created_at", "status", "total_inr", "customer_name", "customer_phone"])) ;
          }}
          onPrint={() => window.print()}
        />

        {ordersError ? <div className="mt-4 text-sm text-red-600">{ordersError}</div> : null}
        {ordersLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={["", "Created", "Customer", "Status", "Total", "Order ID"]}>
          {orders.map((o) => {
            const isOpen = expandedOrders[o.id] ?? false;
            const items = orderItemsByOrder[o.id] ?? null;
            const isLoading = orderItemsLoading[o.id] ?? false;
            const err = orderItemsError[o.id] ?? null;

            return (
              <Fragment key={o.id}>
                <tr className="border-t border-slate-200">
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      onClick={() => toggleOrder(o.id)}
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{o.customer_name ?? "—"}</div>
                    <div className="text-xs text-slate-600">{o.customer_phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{o.status ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">₹{o.total_inr ?? 0}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{shortId(o.id)}</td>
                </tr>

                {isOpen ? (
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm font-bold text-slate-900">Order items</div>
                          <div className="text-xs text-slate-600">
                            Subtotal: <span className="font-semibold text-slate-900">₹{o.subtotal_inr ?? 0}</span>
                            <span className="mx-2 text-slate-300">|</span>
                            Shipping: <span className="font-semibold text-slate-900">₹{o.shipping_inr ?? 0}</span>
                            <span className="mx-2 text-slate-300">|</span>
                            Total: <span className="font-semibold text-slate-900">₹{o.total_inr ?? 0}</span>
                          </div>
                        </div>

                        {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}
                        {isLoading ? <div className="mt-3 text-sm text-slate-600">Loading items…</div> : null}

                        {!isLoading && !err ? (
                          items && items.length > 0 ? (
                            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                              <table className="w-full border-collapse text-left text-sm">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Item</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Qty</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Price</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Line total</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white">
                                  {items.map((it) => (
                                    <tr key={it.id} className="border-t border-slate-200">
                                      <td className="px-4 py-3 font-semibold text-slate-900">{it.title}</td>
                                      <td className="px-4 py-3 text-slate-700">{it.qty}</td>
                                      <td className="px-4 py-3 text-slate-700">₹{it.price_inr}</td>
                                      <td className="px-4 py-3 font-semibold text-slate-900">₹{it.price_inr * it.qty}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                              No order items found.
                            </div>
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </Table>

        {orders.length === 0 && !ordersLoading ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No orders yet. Create one from the website Shop → Checkout.
          </div>
        ) : null}
      </Modal>
    </main>
  );
}
