"use client";

// Smile & Care Dental Clinic — Prototype
// Single-file React component you can paste into a Next.js App Router page.
// Path suggestion: app/page.tsx
// Styling: Tailwind CSS


import React, { useEffect } from "react";
import { Bone, Activity, SmilePlus, Baby, Sparkles, HeartPulse } from "lucide-react";

// --- Quick config (edit these) ---
const CLINIC = {
  // Paste your Lovable clinic photo URL(s) here if you want to hotlink:
  // heroImageUrl: "https://...",
  // bookingImageUrl: "https://...",
  heroImageUrl: "/images/clinic-hero.jpg",
  bookingImageUrl: "/images/clinic-booking.jpg",

  name: "Smile & Care Dental Clinic",
  city: "Kalyani, West Bengal",
  phoneDisplay: "+91 84205 99459",
  phoneTel: "+91 84205 99459",
  whatsappNumber: "+918420599459", // digits only (countrycode + number)

  addressLines: ["B-9/20 CA, Block B (B9)", "Kalyani, West Bengal 741235", "India"],
  mapQuery: "B-9/20 CA, B 9, B9, Block B, Kalyani, West Bengal 741235, India",

  hours: [
    { day: "Mon-Sat", time: "10:00 AM – 8:00 PM" },
    { day: "Sunday", time: "By appointment" },
  ],
};

const THEME = {
  // Tailwind-friendly: use these in className strings
  accent: "from-teal-500 to-sky-500",
  accentSolid: "bg-teal-600",
  accentSolidHover: "hover:bg-teal-700",
};

const SERVICES = [
  {
    title: "Dental Implants",
    desc: "Natural-looking replacement teeth with strong bite support.",
    tag: "Implants",
  },
  {
    title: "Root Canal (RCT)",
    desc: "Pain-relief focused treatment to save an infected tooth.",
    tag: "RCT",
  },
  {
    title: "Braces & Aligners",
    desc: "Options for teens & adults—clear aligners included.",
    tag: "Braces",
  },
  {
    title: "Kids Dentistry",
    desc: "Gentle checkups, fillings, and preventive care for children.",
    tag: "Kids",
  },
  {
    title: "Cleaning & Gum Care",
    desc: "Scaling, polishing, and gum health treatments.",
    tag: "Cleaning",
  },
  {
    title: "Cosmetic Dentistry",
    desc: "Whitening, veneers, and smile makeovers.",
    tag: "Cosmetic",
  },
];

const PRODUCTS = [
  {
    title: "Soft-Bristle Toothbrush",
    price: "₹149",
    note: "Gentle on gums, everyday use.",
  },
  {
    title: "Fluoride Toothpaste",
    price: "₹199",
    note: "Cavity protection for daily brushing.",
  },
  {
    title: "Dental Floss",
    price: "₹249",
    note: "For interdental cleaning.",
  },
  {
    title: "Mouthwash",
    price: "₹299",
    note: "Fresh breath and plaque control.",
  },
];

// --- Services grid (Lucide icons) ---
const services = [
  { icon: Bone, title: "Dental Implants", desc: "Permanent, natural-looking tooth replacements" },
  { icon: Activity, title: "Root Canal (RCT)", desc: "Painless treatment to save damaged teeth" },
  { icon: SmilePlus, title: "Braces & Aligners", desc: "Straight teeth with modern orthodontics" },
  { icon: Baby, title: "Kids Dentistry", desc: "Gentle, fun dental care for children" },
  { icon: HeartPulse, title: "Cleaning & Gum Care", desc: "Deep cleaning and periodontal treatment" },
  { icon: Sparkles, title: "Smile Makeovers", desc: "Cosmetic dentistry for a confident smile" },
];

const ServicesGrid = () => (
  <section id="services" className="py-16 md:py-20">
    <div className="container mx-auto max-w-6xl px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-heading font-bold text-foreground">Our Services</h2>
        <p className="text-muted-foreground mt-2">
          Comprehensive dental care for every member of your family
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="group rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
              <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FAQS = [
  {
    q: "Is RCT painful?",
    a: "Most patients feel relief after treatment. We use local anaesthesia and comfort-first steps to minimise pain.",
  },
  {
    q: "How much do implants cost?",
    a: "Implant pricing depends on the case, bone health, and the crown type. We’ll share an estimate after consultation.",
  },
  {
    q: "Do you treat kids?",
    a: "Yes—our clinic is family-friendly with gentle pediatric dentistry options.",
  },
  {
    q: "How do I book an appointment?",
    a: "Use the form on this page, WhatsApp us, or call directly. We’ll confirm the slot quickly.",
  },
  {
    q: "What if I have severe pain or swelling?",
    a: "Please call immediately. Online chat is not for emergencies.",
  },
];

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

// --- Icons (no extra dependencies) ---
type IconProps = { className?: string };

function IconArrowRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 6l6 6-6 6" />
    </svg>
  );
}

function IconPhone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.19 19a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.32 1.7.59 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.11a2 2 0 0 1 2.11-.45c.8.27 1.64.47 2.5.59A2 2 0 0 1 22 16.92z"
      />
    </svg>
  );
}

function IconWhatsApp({ className }: IconProps) {
  // Neutral chat bubble (swap to a brand icon later if you want)
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 20l1.4-4.8A8.5 8.5 0 1 1 21 11.5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 10.5c.4 2 2 3.6 4 4" />
    </svg>
  );
}

function IconCalendar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
    </svg>
  );
}

function IconChat({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
      />
    </svg>
  );
}

function IconBag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1 14H5L6 7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

const BTN = {
  base:
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.98]",
  primary: cn(
    "text-white shadow-sm hover:shadow-md hover:-translate-y-0.5",
    THEME.accentSolid,
    THEME.accentSolidHover
  ),
  // WhatsApp brand green
  whatsapp: "text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-[#25D366] hover:bg-[#1EBE57]",
  outline:
    "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5",
  small: "px-3 py-2 text-xs",
};

function WhatsAppLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const href = `https://wa.me/${CLINIC.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${CLINIC.name}, I'd like to book an appointment.`
  )}`;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

function CallLink({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <a href={`tel:${CLINIC.phoneTel}`} className={className}>
      {children}
    </a>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{eyebrow}</div>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
      {desc ? <p className="mt-3 text-sm text-slate-600 md:text-base">{desc}</p> : null}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      {children}
    </div>
  );
}

function MiniIcon({ label }: { label: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-900">{q}</span>
        <span className="text-slate-500 group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <p className="mt-3 text-sm text-slate-600">{a}</p>
    </details>
  );
}

function googleMapsEmbedSrc(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function googleMapsDirectionsHref(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// --- Main page ---
export default function Page() {
  // Smooth scrolling for in-page navigation (menu links)
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Apply smooth scrolling at the document level (works with normal #hash links too)
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = prefersReducedMotion ? "auto" : "smooth";

    // Dev checks (tiny test cases)
    if (process.env.NODE_ENV !== "production") {
      console.assert(/^\d+$/.test(CLINIC.whatsappNumber), "CLINIC.whatsappNumber should be digits only");
      console.assert(CLINIC.mapQuery.length > 0, "CLINIC.mapQuery should not be empty");
      console.assert(CLINIC.phoneTel.startsWith("+"), "CLINIC.phoneTel should start with +countrycode");
    }

    return () => {
      root.style.scrollBehavior = prev;
    };
  }, []);

  const scrollToId = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const prefersReducedMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      // Keep URL hash in sync (nice for sharing links)
      history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-2xl bg-gradient-to-br", THEME.accent)} />
            <div>
              <div className="text-sm font-semibold leading-tight">{CLINIC.name}</div>
              <div className="text-xs text-slate-500">{CLINIC.city}</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#services" onClick={(e) => scrollToId(e, "services")} className="hover:text-slate-900">
              Services
            </a>
            <a href="#doctors" onClick={(e) => scrollToId(e, "doctors")} className="hover:text-slate-900">
              Doctors
            </a>
            <a href="#shop" onClick={(e) => scrollToId(e, "shop")} className="hover:text-slate-900">
              Shop
            </a>
            <a href="#reviews" onClick={(e) => scrollToId(e, "reviews")} className="hover:text-slate-900">
              Reviews
            </a>
            <a href="#contact" onClick={(e) => scrollToId(e, "contact")} className="hover:text-slate-900">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <WhatsAppLink className={cn("hidden md:inline-flex", BTN.base, BTN.whatsapp, "px-3 py-2 rounded-xl")}>
              <IconWhatsApp className="h-4 w-4" />
              WhatsApp
            </WhatsAppLink>
            <CallLink className={cn(BTN.base, BTN.primary, "px-3 py-2 rounded-xl")}>
              <IconPhone className="h-4 w-4" />
              Call
            </CallLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div
            className={cn(
              "absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl opacity-30 bg-gradient-to-br",
              THEME.accent
            )}
          />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-2 md:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Open for appointments
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              Gentle, modern dental care for your whole family.
            </h1>
            <p className="mt-4 text-sm text-slate-600 md:text-base">
              Implants • Root Canal • Braces/Aligners • Kids Dentistry • Cleaning & Gum Care • Cosmetic Dentistry
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <WhatsAppLink className={cn(BTN.base, BTN.whatsapp)}>
                <IconWhatsApp className="h-5 w-5" />
                Chat on WhatsApp
                <IconArrowRight className="h-5 w-5 opacity-90" />
              </WhatsAppLink>
              <CallLink className={cn(BTN.base, BTN.outline)}>
                <IconPhone className="h-5 w-5" />
                Call now
              </CallLink>
              <a href="#book" className={cn(BTN.base, BTN.outline)}>
                <IconCalendar className="h-5 w-5" />
                Book appointment
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Badge>Sterilised instruments</Badge>
              <Badge>Comfort-first approach</Badge>
              <Badge>Modern equipment</Badge>
              <Badge>Transparent pricing</Badge>
            </div>
          </div>

          {/* Hero image */}
          <div className="md:pl-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20", THEME.accent)} />
              <img
                src={CLINIC.heroImageUrl}
                alt="Clinic photo"
                className="h-[420px] w-full object-cover md:h-full"
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
            </div>
           
          </div>
        </div>
      </section>

      {/* Request a callback */}
      <section id="book" className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Request a callback</div>
                <div className="mt-1 text-xs text-slate-500">We’ll confirm on WhatsApp/Call.</div>
              </div>
              <div className={cn("h-10 w-10 rounded-2xl bg-gradient-to-br", THEME.accent)} />
            </div>

            <form
              className="mt-4 grid grid-cols-1 gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Prototype: connect this form to Google Sheets / CRM / email.");
              }}
            >
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="Full name"
                required
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="Phone number"
                inputMode="tel"
                required
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Preferred date"
                  type="date"
                />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Preferred time"
                  type="time"
                />
              </div>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200">
                {SERVICES.map((s) => (
                  <option key={s.tag} value={s.tag}>
                    {s.title}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
              <button className={cn(BTN.base, BTN.primary, "w-full")} type="submit">
                Request callback
                <IconArrowRight className="h-5 w-5 opacity-90" />
              </button>

              <div className="mt-2 text-xs text-slate-500">
                Not for emergencies. For severe pain/swelling/bleeding, please call.
              </div>
            </form>
          </Card>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-15", THEME.accent)} />
            <img src={CLINIC.bookingImageUrl} alt="Clinic" className="h-[360px] w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/80 p-3 text-xs text-slate-700 backdrop-blur">
              Quick booking, friendly follow-ups on WhatsApp.
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <ServicesGrid />

      {/* Doctors */}
      <section id="doctors" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <SectionHeading
            eyebrow="Doctor panel"
            title="Friendly experts, clear communication"
            desc="Add your real doctors here. Keep it simple: degree, specialty, experience, and clinic timings."
          />

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-200" />
                  <div>
                    <div className="text-sm font-semibold">Dr. Placeholder {i}</div>
                    <div className="text-xs text-slate-500">BDS / MDS • Specialty</div>
                    <div className="mt-1 text-xs text-slate-500">8+ years experience</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <a href="#book" onClick={(e) => scrollToId(e, "book")} className={cn(BTN.base, BTN.primary, BTN.small, "flex-1")}>
                    Consult
                    <IconArrowRight className="h-4 w-4 opacity-90" />
                  </a>
                  <WhatsAppLink className={cn(BTN.base, BTN.whatsapp, BTN.small, "flex-1")}>
                    <IconWhatsApp className="h-4 w-4" />
                    WhatsApp
                  </WhatsAppLink>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading
          eyebrow="Patient reviews"
          title="People come back because we keep it comfortable"
          desc="Add real Google review snippets once you have them."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="text-sm font-semibold">★★★★★</div>
              <div className="mt-2 text-sm text-slate-700">“Great experience. Clean clinic and gentle treatment.”</div>
              <div className="mt-3 text-xs text-slate-500">— Patient {i}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Shop */}
      <section id="shop" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <SectionHeading
            eyebrow="Merchandise"
            title="Dental essentials, recommended by our clinic"
            desc="Prototype shop section. Later we can wire this to WooCommerce/Shopify or a simple payment link + order form."
          />

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <Card key={p.title}>
                <div className="h-36 rounded-2xl bg-slate-100" />
                <div className="mt-4 text-sm font-semibold">{p.title}</div>
                <div className="mt-1 text-sm text-slate-600">{p.note}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">{p.price}</div>
                  <button
                    className={cn(BTN.base, BTN.outline, BTN.small, "rounded-xl px-3 py-2")}
                    onClick={() => alert("Prototype: connect to cart/checkout.")}
                  >
                    <IconBag className="h-4 w-4" />
                    Add to cart
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <div className="font-semibold">Store plan (recommended)</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Phase 1: simple product catalogue + WhatsApp order</li>
              <li>Phase 2: full checkout with Razorpay (WooCommerce) or Shopify</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading eyebrow="FAQ" title="Quick answers" desc="Clear info, no fluff. For diagnosis, book a consultation." />
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FAQS.map((f) => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-14 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold">Visit us</h3>
            <p className="mt-2 text-sm text-slate-600">Easy directions, fast follow-ups on WhatsApp.</p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Address</div>
                <div className="mt-2 text-sm text-slate-700">
                  {CLINIC.addressLines.map((l) => (
                    <div key={l}>{l}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hours</div>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  {CLINIC.hours.map((h) => (
                    <div key={h.day} className="flex justify-between">
                      <span>{h.day}</span>
                      <span className="text-slate-600">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <CallLink className={cn(BTN.base, BTN.primary)}>
                  <IconPhone className="h-5 w-5" />
                  Call {CLINIC.phoneDisplay}
                </CallLink>
                <WhatsAppLink className={cn(BTN.base, BTN.whatsapp)}>
                  <IconWhatsApp className="h-5 w-5" />
                  WhatsApp
                </WhatsAppLink>
              </div>
            </div>
          </div>

          {/* Google Map iframe */}
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3 md:p-4">
            <div className="rounded-2xl bg-white p-4">
              <div className="text-sm font-semibold">Find us on Google Maps</div>
              <div className="mt-1 text-sm text-slate-600">{CLINIC.mapQuery}</div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <iframe
                title="Smile & Care location"
                src={googleMapsEmbedSrc(CLINIC.mapQuery)}
                width="100%"
                height={360}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full"
                allowFullScreen
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={googleMapsDirectionsHref(CLINIC.mapQuery)}
                target="_blank"
                rel="noreferrer"
                className={cn(BTN.base, BTN.outline, BTN.small)}
              >
                Get directions
                <IconArrowRight className="h-4 w-4 opacity-90" />
              </a>
              <WhatsAppLink className={cn(BTN.base, BTN.whatsapp, BTN.small)}>
                <IconWhatsApp className="h-4 w-4" />
                WhatsApp
              </WhatsAppLink>
            </div>
          </div>
        </div>
      </section>

      {/* Floating action buttons + chat placeholder */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
        <WhatsAppLink className={cn(BTN.base, BTN.whatsapp, "rounded-2xl px-4 py-3 shadow-lg")}>
          <IconWhatsApp className="h-5 w-5" />
          WhatsApp
        </WhatsAppLink>
        <CallLink className={cn(BTN.base, BTN.outline, "rounded-2xl px-4 py-3 shadow-lg")}>
          <IconPhone className="h-5 w-5" />
          Call
        </CallLink>
        <button
          className={cn(BTN.base, BTN.outline, "rounded-2xl px-4 py-3 shadow-lg")}
          onClick={() => alert("Prototype: embed Crisp/Tawk/Chatbase script here.")}
        >
          <IconChat className="h-5 w-5" />
          Chat
        </button>
      </div>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <div className="text-sm font-semibold">{CLINIC.name}</div>
              <div className="mt-2 text-sm text-slate-600">{CLINIC.city}</div>
            </div>
            <div>
              <div className="text-sm font-semibold">Quick links</div>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <a href="#services" onClick={(e) => scrollToId(e, "services")} className="block hover:text-slate-900">
                  Services
                </a>
                <a href="#shop" onClick={(e) => scrollToId(e, "shop")} className="block hover:text-slate-900">
                  Shop
                </a>
                <a href="#reviews" onClick={(e) => scrollToId(e, "reviews")} className="block hover:text-slate-900">
                  Reviews
                </a>
                <a href="#contact" onClick={(e) => scrollToId(e, "contact")} className="block hover:text-slate-900">
                  Contact
                </a>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold">Disclaimer</div>
              <div className="mt-2 text-sm text-slate-600">
                Information on this site is general and not medical advice. For emergencies, call directly.
              </div>
            </div>
          </div>
          <div className="mt-8 text-xs text-slate-500">
            (c) {new Date().getFullYear()} {CLINIC.name}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
