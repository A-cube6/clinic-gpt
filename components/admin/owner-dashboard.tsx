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
  ClipboardList,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  MessageCircle,
  Wallet,
  CalendarDays,
} from "lucide-react";

type StaffRow = { id: string; role: string; full_name?: string | null; phone?: string | null };
type CustomerRow = { id: string; email: string; full_name?: string | null; phone?: string | null; created_at?: string | null };
type CatalogRow = { id: string; title: string; note?: string | null; mrp_inr: number; discount_inr: number; discount_pct: number; purchase_price_inr: number; stock: number; photo_url?: string | null; sell_price_inr?: number | null; active: boolean; created_at?: string | null };
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

type DoctorJoin = { name: string } | { name: string }[] | null;
type BookingRequestRow = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  full_name: string;
  phone: string;
  service?: string | null;
  preferred_date?: string | null;
  doctor_id?: string | null;
  doctor?: DoctorJoin;
  note?: string | null;
};
type DoctorRow = {
  id: string;
  name: string;
  phone?: string | null;
  qualifications?: string | null;
  speciality?: string | null;
  experience?: string | null;
  // Old free-text timings (kept for backward compatibility)
  timings?: string | null;
  // Weekly schedule map: { sun, mon, tue, wed, thu, fri, sat } -> "10:00-13:00, 16:00-19:00"
  weekly_schedule?: Record<string, string> | null;
  start_date?: string | null;
  end_date?: string | null;
  active: boolean;
  created_at?: string | null;
};

type ProcedureRow = {
  id: string;
  name: string;
  price_inr: number;
  active: boolean;
  created_at?: string | null;
};

type ProcedureDoctorJoinRow = {
  procedure_id: string;
  doctor_id: string;
  doctors?: { name: string } | null;
};

type FinanceRow = {
  id: string;
  kind: "asset" | "liability";
  title: string;
  amount_inr: number;
  note?: string | null;
  created_at?: string | null;
};

const WEEK_DAYS: Array<{ key: string; label: string }> = [
  { key: "sun", label: "Sunday" },
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
];

function normalizeWeeklySchedule(d?: Partial<DoctorRow> | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const day of WEEK_DAYS) out[day.key] = "";

  if (!d) return out;

  const ws = (d as any).weekly_schedule;
  if (ws && typeof ws === "object") {
    for (const day of WEEK_DAYS) {
      const v = (ws as any)[day.key];
      if (typeof v === "string") out[day.key] = v;
    }
    return out;
  }

  // Fallback: if old 'timings' is JSON, try to parse it.
  if (typeof (d as any).timings === "string") {
    const t = ((d as any).timings as string).trim();
    if (t.startsWith("{") && t.endsWith("}")) {
      try {
        const parsed = JSON.parse(t);
        if (parsed && typeof parsed === "object") {
          for (const day of WEEK_DAYS) {
            const v = (parsed as any)[day.key];
            if (typeof v === "string") out[day.key] = v;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return out;
}




function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function shortId(id: string) {
  if (!id) return "";
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function toWhatsAppUrl(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
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
      className="group w-full rounded-2xl border border-slate-200 bg-white/80 p-4 sm:p-6 text-left shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 transition-colors group-hover:bg-teal-600 group-hover:text-white">
            {icon}
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-600">{desc}</div>
          </div>
        </div>
        <div className="self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 group-hover:border-teal-200 group-hover:text-teal-700 sm:self-auto">
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
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
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
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
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
    <div className="mt-4 overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200 touch-pan-x">
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
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
  const [openProcedures, setOpenProcedures] = useState(false);
  const [openOrders, setOpenOrders] = useState(false);
  const [openFinance, setOpenFinance] = useState(false);
  const [openBookings, setOpenBookings] = useState(false);

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
      .select("id, role, full_name, phone")
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
      phone: staffEdit.phone ?? null,
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

  const [catSaving, setCatSaving] = useState(false);
  const [catSaveError, setCatSaveError] = useState<string | null>(null);

  const loadCatalog = async () => {
    setCatLoading(true);
    setCatError(null);
    const { data, error } = await supabase
      .from("catalog_items")
      .select("id, title, note, mrp_inr, discount_inr, discount_pct, purchase_price_inr, stock, photo_url, sell_price_inr, active, created_at")
      .order("created_at", { ascending: false });
    if (error) setCatError(error.message);
    setCatalog((data ?? []) as CatalogRow[]);
    setCatLoading(false);
  };

    const upsertCatalog = async () => {
    const title = String(catEdit?.title ?? "").trim();
    if (!title) {
      setCatSaveError("Title is required.");
      return;
    }

    setCatSaving(true);
    setCatSaveError(null);

    const payload: any = {
      title,
      note: catEdit?.note ?? null,
      mrp_inr: Number.isFinite(Number(catEdit?.mrp_inr)) ? Number(catEdit?.mrp_inr) : 0,
      discount_inr: Number.isFinite(Number(catEdit?.discount_inr)) ? Number(catEdit?.discount_inr) : 0,
      discount_pct: Number.isFinite(Number(catEdit?.discount_pct)) ? Number(catEdit?.discount_pct) : 0,
      purchase_price_inr: Number.isFinite(Number(catEdit?.purchase_price_inr)) ? Number(catEdit?.purchase_price_inr) : 0,
      stock: Number.isFinite(Number(catEdit?.stock)) ? Number(catEdit?.stock) : 0,
      photo_url: catEdit?.photo_url ? String(catEdit.photo_url).trim() : null,
      active: !!catEdit?.active,
    };

    try {
      let error: any = null;

      if (catEdit?.id) {
        const res = await supabase.from("catalog_items").update(payload).eq("id", catEdit.id);
        error = res.error;
      } else {
        const res = await supabase.from("catalog_items").insert(payload);
        error = res.error;
      }

      if (error) {
        setCatSaveError(error.message ?? "Failed to save catalog item.");
        return;
      }

      setCatEdit(null); // close edit panel
      await loadCatalog();
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCatalog = async (id: string) => {
    if (!confirm("Delete this catalog item? This cannot be undone.")) return;
    const { error } = await supabase.from("catalog_items").delete().eq("id", id);
    if (error) alert(error.message);
    await loadCatalog();
  };

  
  // --- PROCEDURES ---
  const [procedures, setProcedures] = useState<ProcedureRow[]>([]);
  const [procLoading, setProcLoading] = useState(false);
  const [procError, setProcError] = useState<string | null>(null);
  const [procEdit, setProcEdit] = useState<(Partial<ProcedureRow> & { doctor_ids?: string[] }) | null>(null);

  const [procDoctorIds, setProcDoctorIds] = useState<Record<string, string[]>>({});
  const [procDoctorNames, setProcDoctorNames] = useState<Record<string, string[]>>({});

  const loadProcedures = async () => {
    setProcLoading(true);
    setProcError(null);

    const { data, error } = await supabase
      .from("procedures")
      .select("id, name, price_inr, active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setProcError(error.message);
      setProcedures([]);
      setProcDoctorIds({});
      setProcDoctorNames({});
      setProcLoading(false);
      return;
    }

    const procs = (data ?? []) as ProcedureRow[];
    setProcedures(procs);

    const ids = procs.map((p) => p.id);
    if (ids.length === 0) {
      setProcDoctorIds({});
      setProcDoctorNames({});
      setProcLoading(false);
      return;
    }

    const { data: joins, error: jerr } = await supabase
      .from("procedure_doctors")
      .select("procedure_id, doctor_id, doctors(name)")
      .in("procedure_id", ids);

    if (jerr) {
      setProcError(jerr.message);
      setProcDoctorIds({});
      setProcDoctorNames({});
      setProcLoading(false);
      return;
    }

    const idMap: Record<string, string[]> = {};
    const nameMap: Record<string, string[]> = {};
    ((joins ?? []) as any[]).forEach((r) => {
      const pid = r.procedure_id as string;
      const did = r.doctor_id as string;
      if (!idMap[pid]) idMap[pid] = [];
      if (!idMap[pid].includes(did)) idMap[pid].push(did);

      const nm = r.doctors?.name as string | undefined;
      if (nm) {
        if (!nameMap[pid]) nameMap[pid] = [];
        if (!nameMap[pid].includes(nm)) nameMap[pid].push(nm);
      }
    });

    setProcDoctorIds(idMap);
    setProcDoctorNames(nameMap);
    setProcLoading(false);
  };

  const toggleProcDoctor = (doctorId: string) => {
    setProcEdit((s) => {
      const prev = s ?? {};
      const set = new Set(prev.doctor_ids ?? []);
      if (set.has(doctorId)) set.delete(doctorId);
      else set.add(doctorId);
      return { ...prev, doctor_ids: Array.from(set) };
    });
  };

  const upsertProcedure = async () => {
    if (!procEdit?.name?.trim()) return;
    if (!confirm("Save this procedure?")) return;

    const payload: any = {
      name: procEdit.name.trim(),
      price_inr: Number.isFinite(Number(procEdit.price_inr)) ? Number(procEdit.price_inr) : 0,
      active: !!procEdit.active,
    };

    let procId = procEdit.id;

    if (procId) {
      const { error } = await supabase.from("procedures").update(payload).eq("id", procId);
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase.from("procedures").insert(payload).select("id").maybeSingle();
      if (error) {
        alert(error.message);
        return;
      }
      procId = data?.id as string | undefined;
      if (!procId) {
        alert("Failed to create procedure (no id returned).");
        return;
      }
    }

    const doctorIds = Array.from(new Set((procEdit.doctor_ids ?? []).filter(Boolean)));

    // Replace mapping
    const { error: delErr } = await supabase.from("procedure_doctors").delete().eq("procedure_id", procId);
    if (delErr) {
      alert(delErr.message);
      return;
    }

    if (doctorIds.length > 0) {
      const rows = doctorIds.map((did) => ({ procedure_id: procId, doctor_id: did }));
      const { error: insErr } = await supabase.from("procedure_doctors").insert(rows);
      if (insErr) {
        alert(insErr.message);
        return;
      }
    }

    setProcEdit(null);
    await loadProcedures();
  };

  const deleteProcedure = async (id: string) => {
    if (!confirm("Delete this procedure? This cannot be undone.")) return;
    const { error } = await supabase.from("procedures").delete().eq("id", id);
    if (error) alert(error.message);
    await loadProcedures();
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
  // --- BOOKING REQUESTS ---
  const [bookingReqs, setBookingReqs] = useState<BookingRequestRow[]>([]);
  const [bookingReqsLoading, setBookingReqsLoading] = useState(false);
  const [bookingReqsError, setBookingReqsError] = useState<string | null>(null);
  const [bookingReqsUpdating, setBookingReqsUpdating] = useState<Record<string, boolean>>({});

  const loadBookingReqs = async () => {
    setBookingReqsLoading(true);
    setBookingReqsError(null);

    const { data, error } = await supabase
      .from("booking_requests")
      .select("id, created_at, status, full_name, phone, service, preferred_date, doctor_id, note, doctor:doctors(name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setBookingReqsError(error.message);
      setBookingReqs([]);
      setBookingReqsLoading(false);
      return;
    }

    // Supabase embedded join can come back as an array in some cases; normalize to a single object.
    const rows = (data ?? []).map((r: any) => ({
      ...r,
      doctor: Array.isArray(r.doctor) ? (r.doctor[0] ?? null) : (r.doctor ?? null),
    })) as BookingRequestRow[];

    setBookingReqs(rows);
    setBookingReqsLoading(false);
  };
function doctorNameFromJoin(d: DoctorJoin | undefined): string {
  if (!d) return "";
  return Array.isArray(d) ? (d[0]?.name ?? "") : (d.name ?? "");
}


  const updateBookingStatus = async (id: string, status: string) => {
    setBookingReqsUpdating((p) => ({ ...p, [id]: true }));
    const { error } = await supabase.from("booking_requests").update({ status }).eq("id", id);
    if (error) alert(error.message);
    setBookingReqsUpdating((p) => ({ ...p, [id]: false }));
    setBookingReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const deleteBookingReq = async (id: string) => {
    if (!confirm("Delete this booking request? This cannot be undone.")) return;
    const { error } = await supabase.from("booking_requests").delete().eq("id", id);
    if (error) alert(error.message);
    await loadBookingReqs();
  };


  // --- ASSETS & LIABILITIES ---
  const [finance, setFinance] = useState<FinanceRow[]>([]);
  const [finLoading, setFinLoading] = useState(false);
  const [finError, setFinError] = useState<string | null>(null);
  const [finEdit, setFinEdit] = useState<Partial<FinanceRow> | null>(null);

  const loadFinance = async () => {
    setFinLoading(true);
    setFinError(null);
    const { data, error } = await supabase
      .from("clinic_finance_items")
      .select("id, kind, title, amount_inr, note, created_at")
      .order("created_at", { ascending: false });
    if (error) setFinError(error.message);
    setFinance((data ?? []) as FinanceRow[]);
    setFinLoading(false);
  };

  const saveFinance = async () => {
    if (!finEdit?.title?.trim()) return;
    const payload = {
      kind: (finEdit.kind as any) ?? "liability",
      title: finEdit.title.trim(),
      amount_inr: Number(finEdit.amount_inr ?? 0),
      note: finEdit.note ?? null,
    };

    // update vs insert
    if (finEdit.id) {
      const { error } = await supabase.from("clinic_finance_items").update(payload).eq("id", finEdit.id);
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("clinic_finance_items").insert(payload);
      if (error) {
        alert(error.message);
        return;
      }
    }

    setFinEdit(null);
    await loadFinance();
  };

  const deleteFinance = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("clinic_finance_items").delete().eq("id", id);
    if (error) alert(error.message);
    await loadFinance();
  };



  // --- DOCTORS ---
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docEdit, setDocEdit] = useState<Partial<DoctorRow> | null>(null);

  const [expandedDoctors, setExpandedDoctors] = useState<Record<string, boolean>>({});
  const [docLayoutOpen, setDocLayoutOpen] = useState(false);
  const [docColumns, setDocColumns] = useState({
    speciality: false,
    experience: false,
    start_date: false,
    end_date: false,
    created_at: false,
  });

  const doctorHeaders = useMemo(() => {
    const h: string[] = ["", "Name", "Phone", "Qualifications"];
    if (docColumns.speciality) h.push("Speciality");
    if (docColumns.experience) h.push("Experience");
    if (docColumns.start_date) h.push("Start");
    if (docColumns.end_date) h.push("End");
    if (docColumns.created_at) h.push("Created");
    h.push("Active", "Actions");
    return h;
  }, [docColumns]);

  const toggleDoctor = (doctorId: string) => {
    setExpandedDoctors((p) => ({ ...p, [doctorId]: !(p[doctorId] ?? false) }));
  };

  const loadDoctors = async () => {
    setDocLoading(true);
    setDocError(null);
    const { data, error } = await supabase
      .from("doctors")
      .select("id, name, phone, qualifications, speciality, experience, weekly_schedule, timings, start_date, end_date, active, created_at")
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
      speciality: docEdit.speciality ?? null,
      experience: docEdit.experience ?? null,
      weekly_schedule: normalizeWeeklySchedule(docEdit),
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
    if (openProcedures) {
      loadProcedures();
      if (doctors.length === 0) loadDoctors();
    }
  }, [openProcedures]);
  useEffect(() => {
    if (openOrders) loadOrders();
  }, [openOrders]);
  useEffect(() => {
    if (openBookings) loadBookingReqs();
  }, [openBookings]);
  useEffect(() => {
    if (openFinance) loadFinance();
  }, [openFinance]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Owner dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Manage staff, customers, and catalog items.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
          icon={<ClipboardList className="h-5 w-5" />}
          title="Procedures"
          desc="Price list + allowed doctors."
          cta="Manage"
          onOpen={() => setOpenProcedures(true)}
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
        <CardShell
          icon={<CalendarDays className="h-5 w-5" />}
          title="Booking requests"
          desc="Appointment requests from website."
          cta="View"
          onOpen={() => setOpenBookings(true)}
        />
        <CardShell
          icon={<Wallet className="h-5 w-5" />}
          title="Assets & liabilities"
          desc="Track clinic assets and liabilities."
          cta="Manage"
          onOpen={() => setOpenFinance(true)}
        />

      </div>

      <Modal title="Staff" open={openStaff} onClose={() => setOpenStaff(false)}>
        <Toolbar
          onRefresh={loadStaff}
          onAdd={() => setStaffEdit({ id: "", role: "reception", full_name: "", phone: "" })}
          addLabel="Add/Upsert"
          onExport={() => {
            const rows = staff.map((s) => ({
              id: s.id,
              full_name: s.full_name ?? "",
              phone: s.phone ?? "",
              role: s.role,
            }));
            downloadText("staff.csv", toCsv(rows, ["id", "full_name", "phone", "role"])) ;
          }}
          onPrint={() => window.print()}
        />
        {staffError ? <div className="mt-4 text-sm text-red-600">{staffError}</div> : null}
        {staffLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={["Name", "Phone", "Role", "User ID", "Actions"]}>
          {staff.map((s) => (
            <tr key={s.id} className="border-t border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-900">
                {s.full_name?.trim() ? s.full_name : <span className="text-slate-500">{shortId(s.id)}</span>}
              </td>
              <td className="px-4 py-3 text-slate-700">{s.phone?.trim() ? s.phone : "—"}</td>
              <td className="px-4 py-3 text-slate-700">{s.role}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{shortId(s.id)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {toWhatsAppUrl(s.phone) ? (
                    <a
                      href={toWhatsAppUrl(s.phone) as string}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  ) : null}
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
                <div className="mb-1 text-xs font-semibold text-slate-700">Phone</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={staffEdit.phone ?? ""}
                  onChange={(e) => setStaffEdit((s) => ({ ...(s ?? {}), phone: e.target.value }))}
                  placeholder="+91…"
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
            {catSaveError ? <div className="mt-3 text-sm text-red-600">{catSaveError}</div> : null}
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
              speciality: "",
              experience: "",
              weekly_schedule: normalizeWeeklySchedule(null),
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
              speciality: d.speciality ?? "",
              experience: d.experience ?? "",
              weekly_schedule: JSON.stringify(normalizeWeeklySchedule(d)),
              start_date: d.start_date ?? "",
              end_date: d.end_date ?? "",
              active: d.active,
              created_at: d.created_at ?? "",
            }));
            downloadText(
              "doctors.csv",
              toCsv(rows, [
                "id",
                "name",
                "phone",
                "qualifications",
                "speciality",
                "experience",
                "weekly_schedule",
                "start_date",
                "end_date",
                "active",
                "created_at",
              ])
            );
          }}
          onPrint={() => window.print()}
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
              docLayoutOpen
                ? "border-teal-200 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
            onClick={() => setDocLayoutOpen((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Layout
          </button>
          <div className="text-xs text-slate-500">Tip: Expand a doctor to see weekly sittings.</div>
        </div>

        {docLayoutOpen ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-700">Show columns</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {[
                { key: "speciality", label: "Speciality" },
                { key: "experience", label: "Experience" },
                { key: "start_date", label: "Start date" },
                { key: "end_date", label: "End date" },
                { key: "created_at", label: "Created at" },
              ].map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={(docColumns as any)[c.key]}
                    onChange={(e) =>
                      setDocColumns((p) => ({
                        ...(p as any),
                        [c.key]: e.target.checked,
                      }))
                    }
                  />
                  <span className="font-semibold">{c.label}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {docError ? <div className="mt-4 text-sm text-red-600">{docError}</div> : null}
        {docLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={doctorHeaders}>
          {doctors.map((d) => {
            const isOpen = expandedDoctors[d.id] ?? false;
            const ws = normalizeWeeklySchedule(d);

            return (
              <Fragment key={d.id}>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleDoctor(d.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 text-slate-700">{d.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{d.qualifications ?? "—"}</td>

                  {docColumns.speciality ? <td className="px-4 py-3 text-slate-700">{d.speciality ?? "—"}</td> : null}
                  {docColumns.experience ? <td className="px-4 py-3 text-slate-700">{d.experience ?? "—"}</td> : null}
                  {docColumns.start_date ? <td className="px-4 py-3 text-slate-700">{d.start_date ?? "—"}</td> : null}
                  {docColumns.end_date ? <td className="px-4 py-3 text-slate-700">{d.end_date ?? "—"}</td> : null}
                  {docColumns.created_at ? <td className="px-4 py-3 text-slate-700">{d.created_at ?? "—"}</td> : null}

                  <td className="px-4 py-3 text-slate-700">{d.active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {toWhatsAppUrl(d.phone) ? (
                        <a
                          href={toWhatsAppUrl(d.phone) as string}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => setDocEdit({ ...d, weekly_schedule: ws })}
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

                {isOpen ? (
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={doctorHeaders.length} className="px-4 py-4">
                      <div className="text-xs font-semibold text-slate-700">Weekly sitting days & timings</div>
                      <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-[860px] w-full border-collapse text-left text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              {WEEK_DAYS.map((day) => (
                                <th key={day.key} className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-700">
                                  {day.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {WEEK_DAYS.map((day) => (
                                <td key={day.key} className="border-t border-slate-200 px-3 py-2 text-slate-700">
                                  {ws[day.key]?.trim() ? ws[day.key] : "—"}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Example: <span className="font-semibold">10:00-13:00, 16:00-19:00</span> (leave blank if not sitting).
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </Table>

        {docEdit ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">{docEdit.id ? "Edit doctor" : "Add doctor"}</div>

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

              {docColumns.speciality ? (
                <label className="block">
                  <div className="mb-1 text-xs font-semibold text-slate-700">Speciality</div>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                    value={docEdit.speciality ?? ""}
                    onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), speciality: e.target.value }))}
                    placeholder="e.g. Orthodontics"
                  />
                </label>
              ) : null}

              {docColumns.experience ? (
                <label className="block">
                  <div className="mb-1 text-xs font-semibold text-slate-700">Experience</div>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                    value={docEdit.experience ?? ""}
                    onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), experience: e.target.value }))}
                    placeholder="e.g. 10 years"
                  />
                </label>
              ) : null}

              {docColumns.start_date ? (
                <label className="block">
                  <div className="mb-1 text-xs font-semibold text-slate-700">Start date</div>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                    value={docEdit.start_date ?? ""}
                    onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), start_date: e.target.value || null }))}
                  />
                </label>
              ) : null}

              {docColumns.end_date ? (
                <label className="block">
                  <div className="mb-1 text-xs font-semibold text-slate-700">End date</div>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                    value={docEdit.end_date ?? ""}
                    onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), end_date: e.target.value || null }))}
                  />
                </label>
              ) : null}

              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={!!docEdit.active}
                  onChange={(e) => setDocEdit((s) => ({ ...(s ?? {}), active: e.target.checked }))}
                />
                <span className="text-sm font-semibold text-slate-700">Active</span>
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-bold text-slate-900">Weekly timings</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {WEEK_DAYS.map((day) => {
                  const ws = normalizeWeeklySchedule(docEdit);
                  return (
                    <label key={day.key} className="block">
                      <div className="mb-1 text-xs font-semibold text-slate-700">{day.label}</div>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                        value={ws[day.key] ?? ""}
                        onChange={(e) =>
                          setDocEdit((s) => ({
                            ...(s ?? {}),
                            weekly_schedule: {
                              ...normalizeWeeklySchedule(s ?? null),
                              [day.key]: e.target.value,
                            },
                          }))
                        }
                        placeholder="10:00-13:00, 16:00-19:00"
                      />
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Leave blank for days the doctor does not sit. This is what shows in the twisty view.
              </div>
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


      <Modal title="Item catalog" open={openCatalog} onClose={() => {
        setOpenCatalog(false);
        setCatEdit(null);
        setCatSaveError(null);
        setCatSaving(false);
      }}>
        <Toolbar
          onRefresh={loadCatalog}
          onAdd={() => {
            setCatSaveError(null);
            setCatEdit({ title: "", note: "", mrp_inr: 0, discount_inr: 0, discount_pct: 0, purchase_price_inr: 0, stock: 0, photo_url: "", active: true });
          }}
          addLabel="Add item"
          onExport={() => {
            const rows = catalog.map((i) => ({
  id: i.id,
  title: i.title,
  note: i.note ?? "",
  mrp_inr: i.mrp_inr ?? 0,
  discount_inr: i.discount_inr ?? 0,
  discount_pct: (i.discount_pct ?? (i.mrp_inr ? Math.round(((i.discount_inr ?? 0) / i.mrp_inr) * 10000) / 100 : 0)),
  sell_price_inr: (i.sell_price_inr ?? Math.max((i.mrp_inr ?? 0) - (i.discount_inr ?? 0), 0)),
  purchase_price_inr: i.purchase_price_inr ?? 0,
  stock: i.stock ?? 0,
  photo_url: i.photo_url ?? "",
  active: i.active,
  created_at: i.created_at ?? "",
}));
downloadText(
  "catalog_items.csv",
  toCsv(rows, [
    "id",
    "title",
    "note",
    "mrp_inr",
    "discount_inr",
    "discount_pct",
    "sell_price_inr",
    "purchase_price_inr",
    "stock",
    "photo_url",
    "active",
    "created_at",
  ])
);
          }}
          onPrint={() => window.print()}
        />
        {catError ? <div className="mt-4 text-sm text-red-600">{catError}</div> : null}
        {catLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={["Photo", "Title", "MRP", "Discount (₹)", "Discount (%)", "Sell", "Purchase", "Stock", "Active", "Created", "Actions"]}>
          {catalog.map((i) => (
            <tr key={i.id} className="border-t border-slate-200">
              <td className="px-4 py-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {i.photo_url ? (
                    <img src={i.photo_url} alt={i.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-400">No photo</div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{i.title}</div>
                {i.note ? <div className="mt-1 text-xs text-slate-600">{i.note}</div> : null}
              </td>
              <td className="px-4 py-3 text-slate-700">₹{i.mrp_inr}</td>
              <td className="px-4 py-3 text-slate-700">₹{i.discount_inr}</td>
              <td className="px-4 py-3 text-slate-700">{i.discount_pct ?? (i.mrp_inr ? Math.round(((i.discount_inr ?? 0) / i.mrp_inr) * 10000) / 100 : 0)}%</td>
              <td className="px-4 py-3 text-slate-900 font-semibold">₹{(i.sell_price_inr ?? Math.max((i.mrp_inr ?? 0) - (i.discount_inr ?? 0), 0))}</td>
              <td className="px-4 py-3 text-slate-700">₹{i.purchase_price_inr}</td>
              <td className="px-4 py-3 text-slate-700">{i.stock}</td>
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
  <div className="mb-1 text-xs font-semibold text-slate-700">MRP (INR)</div>
  <input
    type="number"
    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
    value={String(catEdit.mrp_inr ?? 0)}
    onChange={(e) => {
    const mrp = Number(e.target.value);
    setCatEdit((s) => {
      const prev = s ?? {};
      const discInr = Number.isFinite(Number((prev as any).discount_inr)) ? Number((prev as any).discount_inr) : 0;
      const discPct = Number.isFinite(Number((prev as any).discount_pct)) ? Number((prev as any).discount_pct) : 0;
      let nextDiscInr = discInr;
      let nextDiscPct = discPct;
      if (discInr > 0) {
        nextDiscPct = mrp > 0 ? Math.round(((discInr / mrp) * 100) * 100) / 100 : 0;
      } else if (discPct > 0) {
        nextDiscInr = mrp > 0 ? Math.round((mrp * discPct) / 100) : 0;
      }
      return { ...(prev as any), mrp_inr: mrp, discount_inr: nextDiscInr, discount_pct: nextDiscPct };
    });
  }}
  />
</label>

<label className="block sm:col-span-1">
  <div className="mb-1 text-xs font-semibold text-slate-700">Discount (INR)</div>
  <input
    type="number"
    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
    value={String(catEdit.discount_inr ?? 0)}
    onChange={(e) => {
    const discInr = Number(e.target.value);
    setCatEdit((s) => {
      const prev = s ?? {};
      const mrp = Number.isFinite(Number((prev as any).mrp_inr)) ? Number((prev as any).mrp_inr) : 0;
      const pct = mrp > 0 ? Math.round(((discInr / mrp) * 100) * 100) / 100 : 0;
      return { ...(prev as any), discount_inr: discInr, discount_pct: pct };
    });
  }}
  />
</label>

<label className="block sm:col-span-1">
  <div className="mb-1 text-xs font-semibold text-slate-700">Discount (%)</div>
  <input
    type="number"
    step="0.01"
    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
    value={String(catEdit.discount_pct ?? 0)}
    onChange={(e) => {
      const pct = Number(e.target.value);
      setCatEdit((s) => {
        const prev = s ?? {};
        const mrp = Number.isFinite(Number((prev as any).mrp_inr)) ? Number((prev as any).mrp_inr) : 0;
        const discInr = mrp > 0 ? Math.round((mrp * pct) / 100) : 0;
        return { ...(prev as any), discount_pct: pct, discount_inr: discInr };
      });
    }}
  />
</label>

<label className="block sm:col-span-1">
  <div className="mb-1 text-xs font-semibold text-slate-700">Sell price (auto)</div>
  <input
    type="text"
    readOnly
    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 outline-none"
    value={
      "₹" +
      String(Math.max(Number(catEdit.mrp_inr ?? 0) - Number(catEdit.discount_inr ?? 0), 0))
    }
  />
</label>

<label className="block sm:col-span-1">
  <div className="mb-1 text-xs font-semibold text-slate-700">Purchase price (INR)</div>
  <input
    type="number"
    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
    value={String(catEdit.purchase_price_inr ?? 0)}
    onChange={(e) => setCatEdit((s) => ({ ...(s ?? {}), purchase_price_inr: Number(e.target.value) }))}
  />
</label>

<label className="block sm:col-span-1">
  <div className="mb-1 text-xs font-semibold text-slate-700">Stock</div>
  <input
    type="number"
    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
    value={String(catEdit.stock ?? 0)}
    onChange={(e) => setCatEdit((s) => ({ ...(s ?? {}), stock: Number(e.target.value) }))}
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

<label className="block sm:col-span-3">
  <div className="mb-1 text-xs font-semibold text-slate-700">Photo URL</div>
  <input
    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
    value={catEdit.photo_url ?? ""}
    onChange={(e) => setCatEdit((s) => ({ ...(s ?? {}), photo_url: e.target.value }))}
    placeholder="https://…"
  />
</label>

<label className="block sm:col-span-1">
  <div className="mb-1 text-xs font-semibold text-slate-700">Preview</div>
  <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
    {catEdit.photo_url ? (
      <img src={catEdit.photo_url} alt={String(catEdit.title ?? "Item")} className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-400">—</div>
    )}
  </div>
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
                disabled={catSaving}
                className={cn(
                  "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800",
                  catSaving && "opacity-60 cursor-not-allowed"
                )}
                onClick={upsertCatalog}
              >
                {catSaving ? "Saving…" : "Save"}
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

      
      <Modal title="Procedures" open={openProcedures} onClose={() => setOpenProcedures(false)}>
        <Toolbar
          onRefresh={loadProcedures}
          onAdd={() => setProcEdit({ name: "", price_inr: 0, active: true, doctor_ids: [] })}
          addLabel="Add procedure"
          onExport={() => {
            const rows = procedures.map((p) => ({
              id: p.id,
              name: p.name,
              price_inr: p.price_inr ?? 0,
              doctors: (procDoctorNames[p.id] ?? []).join("; "),
              active: p.active,
              created_at: p.created_at ?? "",
            }));
            downloadText("procedures.csv", toCsv(rows, ["id", "name", "price_inr", "doctors", "active", "created_at"]));
          }}
          onPrint={() => window.print()}
        />

        {procError ? <div className="mt-4 text-sm text-red-600">{procError}</div> : null}
        {procLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={["Procedure", "Price", "Doctors", "Active", "Created", "Actions"]}>
          {procedures.map((p) => (
            <tr key={p.id} className="border-t border-slate-200">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{p.name}</div>
              </td>
              <td className="px-4 py-3 text-slate-700">₹{p.price_inr}</td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {(procDoctorNames[p.id] ?? []).length > 0 ? (procDoctorNames[p.id] ?? []).join(", ") : "—"}
              </td>
              <td className="px-4 py-3">
                <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", p.active ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-700")}>
                  {p.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setProcEdit({ ...p, doctor_ids: procDoctorIds[p.id] ?? [] })}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteProcedure(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>

        {procedures.length === 0 && !procLoading ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No procedures yet. Click <b>Add procedure</b> to create your price list.
          </div>
        ) : null}

        {procEdit ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">{procEdit.id ? "Edit procedure" : "Add procedure"}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <label className="block sm:col-span-2">
                <div className="mb-1 text-xs font-semibold text-slate-700">Procedure</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={procEdit.name ?? ""}
                  onChange={(e) => setProcEdit((s) => ({ ...(s ?? {}), name: e.target.value }))}
                  placeholder="Root canal treatment"
                />
              </label>

              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">Price (INR)</div>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={String(procEdit.price_inr ?? 0)}
                  onChange={(e) => setProcEdit((s) => ({ ...(s ?? {}), price_inr: Number(e.target.value) }))}
                />
              </label>

              <label className="block sm:col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-700">Active</div>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={procEdit.active ? "true" : "false"}
                  onChange={(e) => setProcEdit((s) => ({ ...(s ?? {}), active: e.target.value === "true" }))}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>

              <label className="block sm:col-span-4">
                <div className="mb-1 text-xs font-semibold text-slate-700">Doctors</div>
                <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                  {doctors.length === 0 ? (
                    <div className="p-2 text-sm text-slate-600">No doctors found. Add doctors first.</div>
                  ) : (
                    doctors.map((d) => {
                      const checked = (procEdit.doctor_ids ?? []).includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-800 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={() => toggleProcDoctor(d.id)}
                          />
                          <span className="font-semibold">{d.name}</span>
                          {d.speciality ? <span className="text-xs text-slate-500">({d.speciality})</span> : null}
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-600">Select one or more doctors for this procedure.</div>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={upsertProcedure}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setProcEdit(null)}
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


      <Modal title="Booking requests" open={openBookings} onClose={() => setOpenBookings(false)}>
        <Toolbar
          onRefresh={loadBookingReqs}
          onAdd={() => alert("Booking requests are created from the website booking form.")}
          addLabel="—"
          onExport={() => {
            const rows = bookingReqs.map((b) => ({
              id: b.id,
              created_at: b.created_at ?? "",
              status: b.status ?? "",
              full_name: b.full_name ?? "",
              phone: b.phone ?? "",
              preferred_date: b.preferred_date ?? "",
              doctor: doctorNameFromJoin(b.doctor),
              service: b.service ?? "",
              note: b.note ?? "",
            }));
            downloadText(
              "booking_requests.csv",
              toCsv(rows, ["id", "created_at", "status", "full_name", "phone", "preferred_date", "doctor", "service", "note"])
            );
          }}
          onPrint={() => window.print()}
        />

        {bookingReqsError ? <div className="mt-4 text-sm text-red-600">{bookingReqsError}</div> : null}
        {bookingReqsLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <Table headers={["Created", "Patient", "Preferred date", "Doctor", "Service", "Status", "Actions"]}>
          {bookingReqs.map((b) => (
            <tr key={b.id} className="border-t border-slate-200">
              <td className="px-4 py-3 text-slate-700">
                {b.created_at ? new Date(b.created_at).toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{b.full_name}</div>
                <div className="text-xs text-slate-600">{b.phone}</div>
              </td>
              <td className="px-4 py-3 text-slate-700">{b.preferred_date ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700">{doctorNameFromJoin(b.doctor) || "Any"}</td>
              <td className="px-4 py-3 text-slate-700">{b.service ?? "—"}</td>
              <td className="px-4 py-3">
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  value={b.status ?? "new"}
                  disabled={bookingReqsUpdating[b.id] ?? false}
                  onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                >
                  <option value="new">new</option>
                  <option value="called">called</option>
                  <option value="confirmed">confirmed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {toWhatsAppUrl(b.phone) ? (
                    <a
                      href={toWhatsAppUrl(b.phone) as string}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WA
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => deleteBookingReq(b.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>

        {bookingReqs.length === 0 && !bookingReqsLoading ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No booking requests yet. Patients create these via the website booking form.
          </div>
        ) : null}
      </Modal>

      <Modal title="Assets & liabilities" open={openFinance} onClose={() => setOpenFinance(false)}>
        <Toolbar
          onRefresh={loadFinance}
          onAdd={() => setFinEdit({ kind: "liability", title: "", amount_inr: 0, note: "" })}
          addLabel="Add entry"
          onExport={() => {
            const rows = finance.map((f) => ({
              id: f.id,
              kind: f.kind,
              title: f.title,
              amount_inr: f.amount_inr ?? 0,
              note: f.note ?? "",
              created_at: f.created_at ?? "",
            }));
            downloadText(
              "assets-liabilities.csv",
              toCsv(rows, ["id", "kind", "title", "amount_inr", "note", "created_at"])
            );
          }}
          onPrint={() => window.print()}
        />

        {finError ? <div className="mt-4 text-sm text-red-600">{finError}</div> : null}
        {finLoading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Total assets</div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              ₹{finance.filter((x) => x.kind === "asset").reduce((s, x) => s + Number(x.amount_inr ?? 0), 0)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Total liabilities</div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              ₹{finance.filter((x) => x.kind === "liability").reduce((s, x) => s + Number(x.amount_inr ?? 0), 0)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Net</div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              ₹{finance.reduce((s, x) => s + (x.kind === "asset" ? 1 : -1) * Number(x.amount_inr ?? 0), 0)}
            </div>
          </div>
        </div>

        <Table headers={["Type", "Title", "Amount", "Note", "Created", "Actions"]}>
          {finance.map((f) => (
            <tr key={f.id} className="border-t border-slate-200">
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                    f.kind === "asset" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  )}
                >
                  {f.kind}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900">{f.title}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">₹{Number(f.amount_inr ?? 0)}</td>
              <td className="px-4 py-3 text-slate-700">{f.note ?? ""}</td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {f.created_at ? new Date(f.created_at).toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setFinEdit({ ...f })}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteFinance(f.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>

        {finEdit ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">{finEdit.id ? "Edit entry" : "Add entry"}</div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <div className="mb-1 text-xs font-semibold text-slate-700">Type</div>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={(finEdit.kind as any) ?? "liability"}
                  onChange={(e) => setFinEdit((s) => ({ ...(s ?? {}), kind: e.target.value as any }))}
                >
                  <option value="asset">asset</option>
                  <option value="liability">liability</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <div className="mb-1 text-xs font-semibold text-slate-700">Title</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={finEdit.title ?? ""}
                  onChange={(e) => setFinEdit((s) => ({ ...(s ?? {}), title: e.target.value }))}
                  placeholder="e.g., Dental chair EMI / X-ray machine"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-semibold text-slate-700">Amount (₹)</div>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={Number(finEdit.amount_inr ?? 0)}
                  onChange={(e) => setFinEdit((s) => ({ ...(s ?? {}), amount_inr: Number(e.target.value) }))}
                />
              </label>
              <label className="block sm:col-span-2">
                <div className="mb-1 text-xs font-semibold text-slate-700">Note</div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  value={finEdit.note ?? ""}
                  onChange={(e) => setFinEdit((s) => ({ ...(s ?? {}), note: e.target.value }))}
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={saveFinance}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setFinEdit(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

    </main>
  );
}
