"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ChevronRight, MessageCircle } from "lucide-react";

type DoctorRow = {
  id: string;
  name: string;
  qualifications: string | null;
  speciality: string | null;
  experience: string | null;
  timings: string | null;
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
  WhatsAppLink: (props: { children: React.ReactNode; className?: string }) => JSX.Element;
};

function DoctorCard({
  d,
  scrollToId,
  cn,
  BTN,
  WhatsAppLink,
}: {
  d: DoctorRow;
  scrollToId: Props["scrollToId"];
  cn: Props["cn"];
  BTN: Props["BTN"];
  WhatsAppLink: Props["WhatsAppLink"];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-slate-200" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{d.name}</div>
          <div className="truncate text-xs text-slate-500">{d.qualifications ?? "—"}</div>
          {d.speciality ? <div className="mt-1 text-xs text-slate-500">{d.speciality}</div> : null}
          <div className="truncate text-xs text-slate-500">{d.timings}</div>
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
        <WhatsAppLink className={cn(BTN.base, BTN.whatsapp, BTN.small, "flex-1")}>
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </WhatsAppLink>
      </div>
    </div>
  );
}

export default function DoctorsFromSupabase({ scrollToId, cn, BTN, WhatsAppLink }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<DoctorRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id,name,qualifications,speciality,experience,timings,active")
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
        <DoctorCard key={d.id} d={d} scrollToId={scrollToId} cn={cn} BTN={BTN} WhatsAppLink={WhatsAppLink} />
      ))}
    </div>
  );
}
