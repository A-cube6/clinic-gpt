"use client";

import { useEffect, useMemo, useState } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CardShell({
  title,
  subtitle,
  cta,
  onClick,
}: {
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-slate-200 bg-white/80 p-6 text-left shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
      <div className="mt-5 inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition group-hover:bg-slate-800">
        {cta}
      </div>
    </button>
  );
}

export type ColumnSpec<T> = {
  key: keyof T;
  label: string;
  type: "text" | "number" | "boolean" | "datetime" | "select";
  options?: string[];
  required?: boolean;
  readOnly?: boolean;
};

export type EntitySpec<T extends Record<string, any>> = {
  title: string;
  description?: string;
  table: string;
  primaryKey: keyof T;
  columns: Array<ColumnSpec<T>>;
  defaultRow: () => Partial<T>;
  exportFileName: string;
};

function toCsv<T extends Record<string, any>>(rows: T[], cols: Array<ColumnSpec<T>>) {
  const header = cols.map((c) => String(c.label));
  const lines = rows.map((r) =>
    cols
      .map((c) => {
        const v = r[String(c.key)] as any;
        const cell = v === null || v === undefined ? "" : String(v);
        // escape quotes
        return `"${cell.replaceAll('"', '""')}"`;
      })
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printTableHtml(title: string, html: string) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title>
    <meta charset="utf-8" />
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; padding:20px;}
      h1{font-size:18px;margin:0 0 12px;}
      table{border-collapse:collapse;width:100%;}
      th,td{border:1px solid #e2e8f0;padding:8px;font-size:12px;text-align:left;}
      th{background:#f8fafc;}
    </style>
  </head><body><h1>${title}</h1>${html}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export function ManageModal<T extends Record<string, any>>({
  supabase,
  spec,
  onClose,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  spec: EntitySpec<T>;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Partial<T> | null>(null);

  const pk = String(spec.primaryKey);

  const load = async () => {
    setLoading(true);
    setError(null);

    // Choose a default ordering if created_at exists
    const hasCreatedAt = spec.columns.some((c) => String(c.key) === "created_at");
    const q = supabase.from(spec.table).select("*");
    const res = hasCreatedAt ? await q.order("created_at", { ascending: false }) : await q;

    if (res.error) {
      setError(res.error.message);
      setRows([]);
      setLoading(false);
      return;
    }
    setRows((res.data as T[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.table]);

  const tableHtml = useMemo(() => {
    const cols = spec.columns;
    const header = `<tr>${cols.map((c) => `<th>${c.label}</th>`).join("")}</tr>`;
    const body = rows
      .map((r) => `<tr>${cols.map((c) => `<td>${String((r as any)[String(c.key)] ?? "")}</td>`).join("")}</tr>`)
      .join("");
    return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`;
  }, [rows, spec.columns]);

  const openEdit = (row?: T) => {
    setEditRow(row ? { ...row } : spec.defaultRow());
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditRow(null);
  };

  const saveEdit = async () => {
    if (!editRow) return;

    // Validate required fields
    for (const c of spec.columns) {
      if (!c.required) continue;
      const v = (editRow as any)[String(c.key)];
      if (c.type === "number") {
        if (v === null || v === undefined || Number.isNaN(Number(v))) {
          alert(`Please enter ${c.label}.`);
          return;
        }
      } else if (c.type === "boolean") {
        // ok
      } else {
        if (!String(v ?? "").trim()) {
          alert(`Please enter ${c.label}.`);
          return;
        }
      }
    }

    const isUpdate = Boolean((editRow as any)[pk]);
    const confirmMsg = isUpdate ? `Save changes to this ${spec.title} record?` : `Create new ${spec.title} record?`;
    if (!confirm(confirmMsg)) return;

    // Remove read-only columns and empty string id on insert
    const payload: Record<string, any> = { ...editRow };
    spec.columns.forEach((c) => {
      if (c.readOnly) delete payload[String(c.key)];
    });
    if (!isUpdate) {
      if (payload[pk] === "") delete payload[pk];
    }

    const res = isUpdate
      ? await supabase.from(spec.table).update(payload).eq(pk, (editRow as any)[pk])
      : await supabase.from(spec.table).insert(payload);

    if (res.error) {
      alert(`Save failed: ${res.error.message}`);
      return;
    }

    closeEdit();
    await load();
  };

  const deleteRow = async (row: T) => {
    const id = (row as any)[pk];
    if (!id) return;
    if (!confirm(`Delete this record? This cannot be undone.`)) return;

    const res = await supabase.from(spec.table).delete().eq(pk, id);
    if (res.error) {
      alert(`Delete failed: ${res.error.message}`);
      return;
    }
    await load();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />

      <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-bold text-slate-900">{spec.title}</div>
            {spec.description ? <div className="mt-1 text-sm text-slate-600">{spec.description}</div> : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadTextFile(spec.exportFileName, toCsv(rows, spec.columns))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => printTableHtml(spec.title, tableHtml)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => openEdit()}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Add
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-auto p-5">
          {loading ? <div className="text-sm text-slate-600">Loading…</div> : null}
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          {!loading && !error ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    {spec.columns.map((c) => (
                      <th key={String(c.key)} className="px-4 py-3">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.map((r) => (
                    <tr key={String((r as any)[pk] ?? Math.random())} className="hover:bg-slate-50">
                      {spec.columns.map((c) => (
                        <td key={String(c.key)} className="px-4 py-3 align-top">
                          {String((r as any)[String(c.key)] ?? "")}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => openEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                            onClick={() => deleteRow(r)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? <div className="p-6 text-sm text-slate-600">No rows yet.</div> : null}
            </div>
          ) : null}
        </div>

        {editOpen && editRow ? (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <button type="button" className="absolute inset-0" aria-label="Close edit" onClick={closeEdit} />
            <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="text-sm font-bold text-slate-900">{(editRow as any)[pk] ? "Edit" : "Add"} {spec.title}</div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
              <div className="p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {spec.columns.map((c) => {
                    const k = String(c.key);
                    const v = (editRow as any)[k];
                    const disabled = Boolean(c.readOnly);

                    if (c.type === "boolean") {
                      return (
                        <label key={k} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                          <input
                            type="checkbox"
                            checked={Boolean(v)}
                            disabled={disabled}
                            onChange={(e) => setEditRow((prev) => ({ ...(prev as any), [k]: e.target.checked }))}
                          />
                          <span className="text-sm font-semibold text-slate-700">{c.label}</span>
                        </label>
                      );
                    }

                    if (c.type === "select") {
                      return (
                        <label key={k} className="block">
                          <div className="mb-1 text-xs font-semibold text-slate-700">{c.label}{c.required ? " *" : ""}</div>
                          <select
                            className={cn(
                              "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200",
                              disabled && "opacity-60"
                            )}
                            value={String(v ?? "")}
                            disabled={disabled}
                            onChange={(e) => setEditRow((prev) => ({ ...(prev as any), [k]: e.target.value }))}
                          >
                            <option value="">Select…</option>
                            {(c.options ?? []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                    }

                    const inputType = c.type === "number" ? "number" : "text";
                    return (
                      <label key={k} className="block">
                        <div className="mb-1 text-xs font-semibold text-slate-700">{c.label}{c.required ? " *" : ""}</div>
                        <input
                          className={cn(
                            "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200",
                            disabled && "opacity-60"
                          )}
                          type={inputType}
                          value={v === null || v === undefined ? "" : String(v)}
                          disabled={disabled}
                          onChange={(e) =>
                            setEditRow((prev) => ({
                              ...(prev as any),
                              [k]: c.type === "number" ? Number(e.target.value) : e.target.value,
                            }))
                          }
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="w-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="w-1/2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
