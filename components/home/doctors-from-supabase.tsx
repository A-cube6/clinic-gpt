"use client";

import type { ReactElement, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Calendar, ChevronRight, X } from "lucide-react";

type DoctorRow = {
  id: string;
  name: string;
  qualifications: string | null;
  speciality: string | null;
  experience: string | null;
  timings: string | null;
  weekly_schedule?: Record<string, string> | null;
};

type BtnTheme = {
  base: string;
  primary: string;
  whatsapp: string;
  small?: string;
};

type Props = {
  // Reuse homepage helpers/styles without duplicating logic
  scrollToId: (e: React.MouseEvent, id: string) => void;
  cn: (...classes: Array<string | false | null | undefined>) => string;
  BTN: BtnTheme & { small: string };
  WhatsAppLink: (props: { children: ReactNode; className?: string }) => ReactElement;
};

const WEEK_DAYS: Array<{ key: string; short: string; full: string }> = [
  { key: "sun", short: "Sun", full: "Sunday" },
  { key: "mon", short: "Mon", full: "Monday" },
  { key: "tue", short: "Tue", full: "Tuesday" },
  { key: "wed", short: "Wed", full: "Wednesday" },
  { key: "thu", short: "Thu", full: "Thursday" },
  { key: "fri", short: "Fri", full: "Friday" },
  { key: "sat", short: "Sat", full: "Saturday" },
];

function todayKey(): string {
  const idx = new Date().getDay(); // 0 Sun
  return WEEK_DAYS[idx]?.key ?? "mon";
}

function normalizeWs(ws?: Record<string, string> | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of WEEK_DAYS) out[d.key] = "";
  if (!ws) return out;
  for (const d of WEEK_DAYS) {
    const v = (ws as any)[d.key];
    if (typeof v === "string") out[d.key] = v;
  }
  return out;
}

function WeeklyScheduleSheet({
  doctorName,
  ws,
  open,
  onClose,
  cn,
}: {
  doctorName: string;
  ws: Record<string, string>;
  open: boolean;
  onClose: () => void;
  cn: Props["cn"];
}) {
  const [selected, setSelected] = useState<string>(todayKey());

  useEffect(() => {
    if (open) setSelected(todayKey());
  }, [open]);

  if (!open) return null;

  const working = WEEK_DAYS.filter((d) => (ws[d.key] ?? "").trim().length > 0);
  const selectedDay = WEEK_DAYS.find((d) => d.key === selected) ?? WEEK_DAYS[1];
  const selectedVal = (ws[selectedDay.key] ?? "").trim();

  return (
    <>
      {/* click-outside layer */}
      <button
        type="button"
        className="fixed inset-0 z-[70] bg-black/40 md:bg-transparent"
        aria-label="Close schedule"
        onClick={onClose}
      />

      {/* Mobile: bottom sheet | Desktop: popover */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[80] mx-auto w-full max-w-md rounded-t-2xl border border-slate-200 bg-white shadow-2xl",
          "md:absolute md:inset-auto md:right-0 md:top-16 md:bottom-auto md:mx-0 md:w-[360px] md:rounded-2xl md:shadow-xl"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-sm font-bold text-slate-900">Availability</div>
            <div className="text-xs text-slate-500">{doctorName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="text-xs text-slate-600">Tap a day to see timings</div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {WEEK_DAYS.map((d) => {
              const v = (ws[d.key] ?? "").trim();
              const isWorking = v.length > 0;
              const isSel = selected === d.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelected(d.key)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition",
                    isWorking
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    isSel && "ring-2 ring-teal-200 ring-offset-2"
                  )}
                >
                  {d.short}
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-700">{selectedDay.full}</div>
            <div className="mt-1 text-sm text-slate-900">{selectedVal || "Not available"}</div>
          </div>

          <div className="mt-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Working days:</span>{" "}
            {working.length ? working.map((d) => d.short).join(", ") : "—"}
          </div>
        </div>
      </div>
    </>
  );
}

function DoctorCard({
  d,
  scrollToId,
  cn,
  BTN,
  WhatsAppLink: _WhatsAppLink,
  scheduleOpen,
  onOpenSchedule,
  onCloseSchedule,
}: {
  d: DoctorRow;
  scrollToId: Props["scrollToId"];
  cn: Props["cn"];
  BTN: Props["BTN"];
  WhatsAppLink: Props["WhatsAppLink"]; // kept for compatibility
  scheduleOpen: boolean;
  onOpenSchedule: () => void;
  onCloseSchedule: () => void;
}) {
  const ws = useMemo(() => normalizeWs(d.weekly_schedule ?? null), [d.weekly_schedule]);

  return (
    // When the schedule popover is open on desktop, this card must sit above its siblings.
    // Cards have hover transforms which create stacking contexts; without raising the card's z-index,
    // the popover can be painted underneath the next card.
    <div
      className={cn(
        "relative rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        scheduleOpen ? "z-[60]" : "z-0"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-200" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{d.name}</div>
            <div className="truncate text-xs text-slate-500">{d.qualifications ?? "—"}</div>
            {d.speciality ? <div className="mt-1 text-xs text-slate-500">{d.speciality}</div> : null}
            <div className="truncate text-xs text-slate-500">{d.timings}</div>
          </div>
        </div>

      </div>

      <div className="mt-4 flex gap-2">
        <a
          href="#book"
          onClick={(e) => scrollToId(e, "book")}
          className={cn(BTN.base, BTN.primary, BTN.small, "flex-1")}
        >
          Consult
          <ChevronRight className="h-4 w-4 opacity-90" />
        </a>
        <button
          type="button"
          onClick={scheduleOpen ? onCloseSchedule : onOpenSchedule}
          className="inline-flex h-10 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label="View weekly schedule"
          title="View schedule"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      <WeeklyScheduleSheet
        doctorName={d.name}
        ws={ws}
        open={scheduleOpen}
        onClose={onCloseSchedule}
        cn={cn}
      />
    </div>
  );
}

export default function DoctorsFromSupabase({ scrollToId, cn, BTN, WhatsAppLink }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<DoctorRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openScheduleId, setOpenScheduleId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id,name,qualifications,speciality,experience,timings,weekly_schedule,active")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) {
        setError(error.message);
        setRows([]);
        return;
      }

      setRows((data ?? []) as DoctorRow[]);
    })();
  }, [supabase]);

  // Keep layout stable if loading
  if (rows === null) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
            <div className="h-14 w-2/3 rounded-xl bg-slate-200" />
            <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
            <div className="mt-6 h-9 rounded-xl bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load doctors: {error}
      </div>
    );
  }

  // If none, show nothing (or a gentle placeholder)
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        No doctors are configured yet. Owner can add doctors from the Owner Dashboard → Doctors.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {rows.map((d) => (
        <DoctorCard
          key={d.id}
          d={d}
          scrollToId={scrollToId}
          cn={cn}
          BTN={BTN}
          WhatsAppLink={WhatsAppLink}
          scheduleOpen={openScheduleId === d.id}
          onOpenSchedule={() => setOpenScheduleId(d.id)}
          onCloseSchedule={() => setOpenScheduleId(null)}
        />
      ))}
    </div>
  );
}
