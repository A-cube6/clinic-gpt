"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type BookingCalendarDoctor = {
  id: string;
  name: string;
  weekly_schedule: Record<string, string> | null;
  start_date: string | null;
  end_date: string | null;
};

type Props = {
  doctor: BookingCalendarDoctor | null;
  selectedDate: string;
  onSelectDate: (dateISO: string) => void;
};

type BookingCalendarRow = {
  booking_date: string;
  booking_count: number;
};

const WEEK_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateFromISO(dateISO: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function weekKeyFromISODate(dateISO: string): (typeof WEEK_KEYS)[number] {
  return WEEK_KEYS[dateFromISO(dateISO).getDay()];
}

function isDoctorAvailableOn(doctor: BookingCalendarDoctor, dateISO: string): boolean {
  const key = weekKeyFromISODate(dateISO);
  const raw = (doctor.weekly_schedule as Record<string, string> | null)?.[key];
  const timing = typeof raw === "string" ? raw.trim() : "";
  if (!timing) return false;
  if (doctor.start_date && dateISO < doctor.start_date) return false;
  if (doctor.end_date && dateISO > doctor.end_date) return false;
  return true;
}

function timingForDay(doctor: BookingCalendarDoctor, dateISO: string): string {
  const key = weekKeyFromISODate(dateISO);
  const raw = (doctor.weekly_schedule as Record<string, string> | null)?.[key];
  return typeof raw === "string" ? raw.trim() : "";
}

function monthGrid(month: Date): Date[] {
  const start = startOfMonth(month);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const next = new Date(gridStart);
    next.setDate(gridStart.getDate() + i);
    return next;
  });
}

function weekRange(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export default function BookingDoctorCalendar({ doctor, selectedDate, onSelectDate }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [visibleDate, setVisibleDate] = useState<Date>(() => (selectedDate ? dateFromISO(selectedDate) : new Date()));
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctor) return;

    const visibleMonth = startOfMonth(visibleDate);
    const rangeStart = startOfMonth(addMonths(visibleMonth, -1));
    const rangeEnd = endOfMonth(addMonths(visibleMonth, 2));

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc("get_public_doctor_booking_calendar", {
        p_doctor_id: doctor.id,
        p_from: isoDate(rangeStart),
        p_to: isoDate(rangeEnd),
      });

      if (cancelled) return;

      if (error) {
        setBookingsByDate({});
        setError(error.message);
        setLoading(false);
        return;
      }

      const next: Record<string, number> = {};
      ((data ?? []) as BookingCalendarRow[]).forEach((row) => {
        if (!row.booking_date) return;
        next[row.booking_date] = Number(row.booking_count ?? 0);
      });

      setBookingsByDate(next);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [doctor, supabase, visibleDate]);

  const visibleMonth = useMemo(() => startOfMonth(visibleDate), [visibleDate]);
  const days = useMemo(() => monthGrid(visibleMonth), [visibleMonth]);
  const weekDays = useMemo(() => weekRange(visibleDate), [visibleDate]);
  const monthLabel = visibleMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const weekLabel = useMemo(() => {
    const first = weekDays[0];
    const last = weekDays[6];
    const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
    if (sameMonth) {
      return `${first.toLocaleDateString("en-IN", { month: "short" })} ${first.getDate()}-${last.getDate()}`;
    }
    return `${first.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${last.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    })}`;
  }, [weekDays]);

  if (!doctor) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
        <div className="text-sm font-semibold text-slate-900">Doctor calendar</div>
        <p className="mt-2 text-sm text-slate-600">Select a doctor to view their current weekly availability and confirmed booking days.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Doctor calendar</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{doctor.name}</div>
          <p className="mt-1 text-sm text-slate-600">Booked days come from confirmed rows in `booking_requests`. Time slots are still confirmed by reception.</p>
        </div>
        {loading ? <Loader2 className="mt-1 h-4 w-4 animate-spin text-slate-400" /> : null}
      </div>

      <div className="mt-5 flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setVisibleDate((prev) => addDays(prev, -7))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-900">{weekLabel}</div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">{monthLabel}</div>
        </div>
        <button
          type="button"
          onClick={() => setVisibleDate((prev) => addDays(prev, 7))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 md:hidden">
        {weekDays.map((day) => {
          const dateISO = isoDate(day);
          const isSelected = selectedDate === dateISO;
          const available = isDoctorAvailableOn(doctor, dateISO);
          const bookedCount = bookingsByDate[dateISO] ?? 0;

          const palette = bookedCount > 0
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : available
              ? "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100"
              : "border-slate-200 bg-slate-100 text-slate-500";

          return (
            <button
              key={dateISO}
              type="button"
              onClick={() => {
                if (!available) return;
                onSelectDate(dateISO);
              }}
              disabled={!available}
              title={available ? timingForDay(doctor, dateISO) : "Doctor not available"}
              className={[
                "min-h-[92px] rounded-2xl border px-1 py-2 text-center transition",
                palette,
                isSelected ? "ring-2 ring-teal-500 ring-offset-2" : "",
                !available ? "cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide">{WEEK_LABELS[day.getDay()]}</div>
              <div className="mt-1 text-lg font-bold">{day.getDate()}</div>
              <div className="mt-3 flex justify-center">
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full",
                    bookedCount > 0 ? "bg-amber-500" : available ? "bg-teal-500" : "bg-slate-400",
                  ].join(" ")}
                />
              </div>
              <div className="mt-2 text-[10px] font-medium">
                {bookedCount > 0 ? `${bookedCount} booked` : available ? "Open" : "Off"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 hidden items-center justify-between md:flex">
        <button
          type="button"
          onClick={() => setVisibleDate((prev) => addMonths(prev, -1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-semibold text-slate-900">{monthLabel}</div>
        <button
          type="button"
          onClick={() => setVisibleDate((prev) => addMonths(prev, 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 hidden grid-cols-7 gap-2 md:grid">
        {WEEK_LABELS.map((label) => (
          <div key={label} className="px-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
        ))}

        {days.map((day) => {
          const dateISO = isoDate(day);
          const inMonth = day.getMonth() === visibleMonth.getMonth();
          const isSelected = selectedDate === dateISO;
          const available = isDoctorAvailableOn(doctor, dateISO);
          const bookedCount = bookingsByDate[dateISO] ?? 0;
          const timing = available ? timingForDay(doctor, dateISO) : "";

          const palette = !inMonth
            ? "border-slate-100 bg-slate-50 text-slate-300"
            : bookedCount > 0
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : available
                ? "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100"
                : "border-slate-200 bg-slate-100 text-slate-500";

          return (
            <button
              key={dateISO}
              type="button"
              onClick={() => {
                if (!inMonth || !available) return;
                onSelectDate(dateISO);
              }}
              disabled={!inMonth || !available}
              title={
                bookedCount > 0
                  ? `${bookedCount} confirmed booking${bookedCount > 1 ? "s" : ""}${timing ? ` • ${timing}` : ""}`
                  : timing || "Doctor not available"
              }
              className={[
                "min-h-[74px] rounded-2xl border p-2 text-left transition",
                palette,
                isSelected ? "ring-2 ring-teal-500 ring-offset-2" : "",
                !inMonth || !available ? "cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">{day.getDate()}</span>
                {bookedCount > 0 ? (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    {bookedCount} booked
                  </span>
                ) : available && inMonth ? (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                    Open
                  </span>
                ) : null}
              </div>
              <div className="mt-3 line-clamp-2 text-[11px] leading-4">
                {inMonth ? (available ? timing : "Not available") : ""}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-teal-200" />
          Available
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-200" />
          Confirmed booking exists
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-300" />
          Doctor not available
        </div>
      </div>

      {selectedDate ? (
        <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Selected date: <span className="font-semibold">{selectedDate}</span>
          {isDoctorAvailableOn(doctor, selectedDate) ? ` • ${timingForDay(doctor, selectedDate)}` : ""}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Could not load confirmed booking days: {error}
        </div>
      ) : null}
    </div>
  );
}
