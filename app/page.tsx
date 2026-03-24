"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Baby,
  Bone,
  Calendar,
  ChevronRight,
  HeartPulse,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  SmilePlus,
  Sparkles,
  Trash2,
  X,
  MessageCircle,
  Phone,
  Search,
} from "lucide-react";
import DoctorsFromSupabase from "@/components/home/doctors-from-supabase";
import BookingDoctorCalendar, { type BookingCalendarDoctor } from "@/components/home/booking-doctor-calendar";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import AuthModal from "@/components/AuthModal";
import { APP_BUILD_TIME } from "@/lib/version";

/**
 * Smile & Care Dental Clinic — Prototype
 * Single-file page component.
 *
 * This patch focuses on:
 *  - Cleaner top navigation + "Book" menu item
 *  - Mobile: hamburger drawer menu
 *  - Mobile: replace bottom action bar with a single Floating Action Button (FAB)
 *
 * No new routes, no new deps, and existing section IDs are preserved.
 */

// --- Quick config (edit these) ---
const CLINIC = {
  heroImageUrl: "/images/clinic_hero_v2.jpeg",
  bookingImageUrl: "/images/clinic_booking.png",
  logoUrl: "/images/logo.png",
  name: "Smile & Care Dental Clinic",
  city: "Kalyani, West Bengal",
  phoneDisplay: "+91 98XX-XXX-XXX",
  phoneTel: "+919831803154",
  whatsappNumber: "+919831803154", // digits only (countrycode + number)
  addressLines: ["B-9/20 CA, Block B (B9)", "Kalyani, West Bengal 741235", "India"],
  mapQuery: "B-9/20 CA, B 9, B9, Block B, Kalyani, West Bengal 741235, India",
  hours: [
    { day: "Mon-Sat", time: "10:00 AM – 8:00 PM" },
    { day: "Sunday", time: "By appointment" },
  ],
  // Payments (prototype)
  payments: { demoMode: !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, currency: "INR" as const },
} as const;

const THEME = {
  accentSolid: "bg-teal-600",
  accentSolidHover: "hover:bg-teal-700",
} as const;

const APP_BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || "unknown";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const BTN = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.98]",
  primary: cn("text-white shadow-sm hover:shadow-md hover:-translate-y-0.5", THEME.accentSolid, THEME.accentSolidHover),
  outline:
    "border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5",
  // WhatsApp brand green
  whatsapp: "text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-[#25D366] hover:bg-[#1EBE57]",
  small: "px-3 py-2 text-xs",
} as const;

function googleMapsEmbedSrc(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
function googleMapsDirectionsHref(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function WhatsAppLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
      {desc ? <p className="mt-2 text-slate-600">{desc}</p> : null}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
      {children}
    </span>
  );
}



function ShopCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

function ChipToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition",
        active
          ? "border-teal-200 bg-teal-50 text-teal-900"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
      aria-pressed={active}
    >
      <span>{label}</span>
      {active ? <X className="h-3.5 w-3.5 opacity-70" /> : null}
    </button>
  );
}


function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:bg-slate-50"
      onClick={() => setOpen((s) => !s)}
      aria-expanded={open}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-900">{q}</span>
        <ChevronRight className={cn("h-5 w-5 text-slate-500 transition", open && "rotate-90")} />
      </div>
      {open ? <p className="mt-3 text-sm text-slate-600">{a}</p> : null}
    </button>
  );
}

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
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Treatments"
        title="Our Services"
        desc="Comprehensive dental care for every member of your family"
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="group rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-teal-600">
              <Icon className="h-6 w-6 text-teal-600 transition-colors group-hover:text-white" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- Products (for cart/checkout) ---
type Product = { id: string; title: string; note: string; mrpInr: number; discountInr: number; discountPct: number; priceInr: number; stock: number; photoUrl?: string | null };
// Fallback products (if catalog_items isn't configured yet)
const FALLBACK_PRODUCTS: Product[] = [
  { id: "brush_soft", title: "Soft-Bristle Toothbrush", note: "Gentle on gums, everyday use.", mrpInr: 149, discountInr: 0, discountPct: 0, priceInr: 149, stock: 999, photoUrl: null },
  { id: "paste_fluoride", title: "Fluoride Toothpaste", note: "Cavity protection for daily brushing.", mrpInr: 199, discountInr: 0, discountPct: 0, priceInr: 199, stock: 999, photoUrl: null },
  { id: "floss", title: "Dental Floss", note: "For interdental cleaning.", mrpInr: 249, discountInr: 0, discountPct: 0, priceInr: 249, stock: 999, photoUrl: null },
  { id: "mouthwash", title: "Mouthwash", note: "Fresh breath and plaque control.", mrpInr: 299, discountInr: 0, discountPct: 0, priceInr: 299, stock: 999, photoUrl: null },
];

const FAQS = [
  { q: "Is RCT painful?", a: "Most patients feel relief after treatment. We use local anaesthesia and comfort-first steps to minimise pain." },
  { q: "How much do implants cost?", a: "Implant pricing depends on the case, bone health, and the crown type. We’ll share an estimate after consultation." },
  { q: "Do you treat kids?", a: "Yes—our clinic is family-friendly with gentle pediatric dentistry options." },
  { q: "How do I book an appointment?", a: "Use the form on this page, WhatsApp us, or call directly. We’ll confirm the slot quickly." },
  { q: "What if I have severe pain or swelling?", a: "Please call immediately. Online chat is not for emergencies." },
];

type CartItem = { productId: string; qty: number };
type CheckoutForm = { fullName: string; phone: string; address1: string; city: string; pinCode: string };

type BookingDoctor = BookingCalendarDoctor;

const WEEK_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type WeekKey = (typeof WEEK_KEYS)[number];

function weekKeyFromISODate(dateISO: string): WeekKey {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d); // local time (avoids UTC off-by-one)
  return WEEK_KEYS[dt.getDay()];
}

function isDoctorAvailableOn(d: BookingDoctor, dateISO: string): boolean {
  const key = weekKeyFromISODate(dateISO);
  const raw = (d.weekly_schedule as any)?.[key];
  const timing = typeof raw === "string" ? raw.trim() : "";
  if (!timing) return false;
  if (d.start_date && dateISO < d.start_date) return false;
  if (d.end_date && dateISO > d.end_date) return false;
  return true;
}

function timingForDay(d: BookingDoctor, dateISO: string): string {
  const key = weekKeyFromISODate(dateISO);
  const raw = (d.weekly_schedule as any)?.[key];
  return typeof raw === "string" ? raw.trim() : "";
}

function formatInr(amount: number) {
  return `₹${amount}`;
}
function clampQty(n: number) {
  if (Number.isNaN(n)) return 1;
  return Math.max(1, Math.min(99, n));
}

const NAV_ITEMS = [
  { id: "services", label: "Services" },
  { id: "doctors", label: "Doctors" },
  { id: "shop", label: "Shop" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
  { id: "book", label: "Book" },
] as const;

export default function Page() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // --- Mobile UI state ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // --- Cart state ---
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "details" | "pay" | "success">("cart");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paying, setPaying] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  // Razorpay checkout script loaded?
  const [razorpayReady, setRazorpayReady] = useState(false);

  // Catalog items (owner-managed, public readable)
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutForm>({
    fullName: "",
    phone: "",
    address1: "",
    city: "Kalyani",
    pinCode: "",
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);


  // Shop UI (search/sort/filter)
  type ShopSort = "featured" | "price_asc" | "price_desc" | "discount_desc" | "title_asc";
  const [shopQuery, setShopQuery] = useState("");
  const [shopSort, setShopSort] = useState<ShopSort>("featured");
  const [shopOnlyInStock, setShopOnlyInStock] = useState(false);
  const [shopOnlyDiscounted, setShopOnlyDiscounted] = useState(false);
  const [shopFiltersOpen, setShopFiltersOpen] = useState(false);

  // --- Booking form state ---
  const [visitDate, setVisitDate] = useState<string>("");
  const [bookingDoctorId, setBookingDoctorId] = useState<string>("");
  const [bookingDoctors, setBookingDoctors] = useState<BookingDoctor[]>([]);
  const [bookingDoctorsError, setBookingDoctorsError] = useState<string | null>(null);
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ ok: boolean; message: string } | null>(null);


  const fabRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") {
      setAuthModalOpen(false);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, [supabase]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Global smooth scroll preference
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = prefersReducedMotion ? "auto" : "smooth";

    // Dev checks (tiny test cases)
    if (process.env.NODE_ENV !== "production") {
      console.assert(/^[0-9]+$/.test(CLINIC.whatsappNumber), "CLINIC.whatsappNumber should be digits only");
      console.assert(CLINIC.mapQuery.length > 0, "CLINIC.mapQuery should not be empty");
      console.assert(CLINIC.phoneTel.startsWith("+"), "CLINIC.phoneTel should start with +countrycode");
      console.assert(FALLBACK_PRODUCTS.every((p) => p.priceInr > 0), "All products should have priceInr > 0");
      console.assert(clampQty(-10) === 1, "clampQty should floor at 1");
      console.assert(clampQty(500) === 99, "clampQty should cap at 99");
      console.assert(formatInr(123).startsWith("₹"), "formatInr should prefix ₹");
      console.assert(NAV_ITEMS.length >= 5, "NAV_ITEMS should have the section links");
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setFabOpen(false);
        setCheckoutOpen(false);
        setPaying(false);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!fabRef.current) return;
      if (fabOpen && !fabRef.current.contains(e.target as Node)) setFabOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      root.style.scrollBehavior = prev;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [fabOpen]);


// Load Razorpay checkout script (only needed when demoMode is OFF)
useEffect(() => {
  if (CLINIC.payments.demoMode) return;
  const id = "razorpay-checkout-js";
  if (document.getElementById(id)) {
    setRazorpayReady(true);
    return;
  }
  const s = document.createElement("script");
  s.id = id;
  s.src = "https://checkout.razorpay.com/v1/checkout.js";
  s.async = true;
  s.onload = () => setRazorpayReady(true);
  s.onerror = () => setRazorpayReady(false);
  document.body.appendChild(s);
}, []);


  // Load shop catalog from Supabase (preferred over fallback)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("catalog_items")
        .select("id,title,note,mrp_inr,discount_inr,discount_pct,sell_price_inr,stock,photo_url,active")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) {
        setCatalogError(error.message);
        setCatalogReady(false);
        return;
      }

      const rows = (data ?? []) as Array<{ id: string; title: string; note: string | null; mrp_inr: number | null; discount_inr: number | null; discount_pct: number | null; sell_price_inr: number | null; stock: number | null; photo_url: string | null }>;
      if (rows.length === 0) {
        setCatalogReady(false);
        return;
      }

      setProducts(
        rows.map((r) => {
          const mrp = r.mrp_inr ?? 0;
          const discount = r.discount_inr ?? 0;
          const pct = r.discount_pct ?? (mrp > 0 ? Math.round(((discount / mrp) * 100) * 100) / 100 : 0);
          const sell = r.sell_price_inr ?? Math.max(mrp - discount, 0);
          return {
            id: r.id,
            title: r.title,
            note: r.note ?? "",
            mrpInr: mrp,
            discountInr: discount,
            discountPct: pct,
            priceInr: sell,
            stock: r.stock ?? 0,
            photoUrl: r.photo_url ?? null,
          };
        })
      );
      setCatalogReady(true);
      setCatalogError(null);
    })();
  }, [supabase]);

  // Load doctors for booking dropdown (active only)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id,name,weekly_schedule,start_date,end_date,active")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) {
        setBookingDoctorsError(error.message);
        setBookingDoctors([]);
        return;
      }

      const rows = (data ?? []) as Array<{
        id: string;
        name: string;
        weekly_schedule: Record<string, string> | null;
        start_date: string | null;
        end_date: string | null;
        active: boolean | null;
      }>;

      setBookingDoctors(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          weekly_schedule: r.weekly_schedule ?? null,
          start_date: r.start_date ?? null,
          end_date: r.end_date ?? null,
        }))
      );
      setBookingDoctorsError(null);
    })();
  }, [supabase]);

  const scrollToId = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };


  const availableBookingDoctors = useMemo(() => {
    if (!visitDate) return bookingDoctors;
    return bookingDoctors.filter((d) => isDoctorAvailableOn(d, visitDate));
  }, [bookingDoctors, visitDate]);

  const selectedBookingDoctor = useMemo(() => {
    return bookingDoctors.find((d) => d.id === bookingDoctorId) ?? null;
  }, [bookingDoctors, bookingDoctorId]);

  useEffect(() => {
    if (!visitDate || !bookingDoctorId) return;
    if (!selectedBookingDoctor) return;
    if (isDoctorAvailableOn(selectedBookingDoctor, visitDate)) {
      setBookingNotice(null);
      return;
    }

    setBookingNotice("Selected doctor is not available on that day. Please choose another date or doctor.");
  }, [visitDate, bookingDoctorId, selectedBookingDoctor]);

  const cartCount = useMemo(() => cart.reduce((a, c) => a + c.qty, 0), [cart]);

  const cartLines = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p] as const));
    return cart
      .map((ci) => {
        const p = byId.get(ci.productId);
        if (!p) return null;
        return { ...ci, product: p, lineTotal: p.priceInr * ci.qty };
      })
      .filter(Boolean) as Array<{ productId: string; qty: number; product: Product; lineTotal: number }>;
  }, [cart, products]);

  const subTotal = useMemo(() => cartLines.reduce((a, l) => a + l.lineTotal, 0), [cartLines]);
  const shipping = useMemo(() => (subTotal > 499 ? 0 : subTotal > 0 ? 49 : 0), [subTotal]);
  const grandTotal = useMemo(() => subTotal + shipping, [subTotal, shipping]);


  const shopResults = useMemo(() => {
    const q = shopQuery.trim().toLowerCase();
    let list = products.slice();

    if (q) {
      list = list.filter((p) => {
        const t = (p.title ?? "").toLowerCase();
        const n = (p.note ?? "").toLowerCase();
        return t.includes(q) || n.includes(q);
      });
    }

    if (shopOnlyInStock) list = list.filter((p) => (p.stock ?? 0) > 0);

    if (shopOnlyDiscounted)
      list = list.filter((p) => (p.discountInr ?? 0) > 0 || (p.discountPct ?? 0) > 0);

    const discountPctOf = (p: Product) => {
      const mrp = p.mrpInr ?? 0;
      if (mrp <= 0) return 0;
      if ((p.discountPct ?? 0) > 0) return p.discountPct;
      const disc = p.discountInr ?? 0;
      return Math.round(((disc / mrp) * 100) * 100) / 100;
    };

    if (shopSort === "price_asc") list.sort((a, b) => a.priceInr - b.priceInr || a.title.localeCompare(b.title));
    if (shopSort === "price_desc") list.sort((a, b) => b.priceInr - a.priceInr || a.title.localeCompare(b.title));
    if (shopSort === "discount_desc")
      list.sort(
        (a, b) =>
          discountPctOf(b) - discountPctOf(a) ||
          (b.discountInr ?? 0) - (a.discountInr ?? 0) ||
          a.priceInr - b.priceInr
      );
    if (shopSort === "title_asc") list.sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [products, shopQuery, shopOnlyInStock, shopOnlyDiscounted, shopSort]);

  const shopHasActiveFilters = shopOnlyInStock || shopOnlyDiscounted || !!shopQuery.trim();
  const shopMobileScrollable = shopResults.length > 5;

  const addToCart = (productId: string) => {
  const p = products.find((x) => x.id === productId);
  const stock = p?.stock ?? 0;
  if (stock <= 0) {
    alert("Out of stock.");
    return;
  }

  setCart((prev) => {
    const idx = prev.findIndex((x) => x.productId === productId);
    if (idx >= 0) {
      const next = [...prev];
      const current = next[idx].qty;
      const desired = clampQty(current + 1);
      const capped = Math.min(desired, stock);
      next[idx] = { ...next[idx], qty: capped };
      return next;
    }
    return [...prev, { productId, qty: 1 }];
  });
  setCheckoutOpen(true);
  setCheckoutStep("cart");
};

  const updateQty = (productId: string, qty: number) => {
  const p = products.find((x) => x.id === productId);
  const stock = p?.stock ?? 0;

  // If stock is 0, remove item from cart.
  if (stock <= 0) {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
    return;
  }

  const desired = clampQty(qty);
  const capped = Math.min(desired, stock);

  setCart((prev) =>
    prev
      .map((x) => (x.productId === productId ? { ...x, qty: capped } : x))
      .filter((x) => x.qty > 0)
  );
};
  const removeItem = (productId: string) => setCart((prev) => prev.filter((x) => x.productId !== productId));

  const openCart = () => {
    setCheckoutOpen(true);
    setCheckoutStep("cart");
  };
  const proceedToDetails = () => {
    if (cartLines.length === 0) return;
    setCheckoutStep("details");
  };
  const proceedToPay = () => {
    if (!checkout.fullName.trim() || !checkout.phone.trim()) {
      alert("Please enter name and phone number.");
      return;
    }
    if (!checkout.address1.trim() || !checkout.pinCode.trim()) {
      alert("Please enter delivery address and PIN code.");
      return;
    }
    setCheckoutStep("pay");
  };
  const payNow = async () => {
    if (grandTotal <= 0) return;
    setPaying(true);
    try {
      // Step B: always create an order record securely in Supabase.
      // Pricing is computed server-side in DB via RPC (no trusting the client totals).
      if (!catalogReady) {
        alert(
          "Shop catalog is not loaded from Supabase yet.\n\nGo to Owner Dashboard → Catalog, add 1+ active items, then reload this page." +
            (catalogError ? `\n\nCatalog error: ${catalogError}` : "")
        );
        return;
      }

const { data: userData } = await supabase.auth.getUser();
if (!userData.user) {
  setAuthModalOpen(true);
  return;
}

      const { data: orderId, error } = await supabase.rpc("create_shop_order", {
        items: cart.map((ci) => ({ item_id: ci.productId, qty: ci.qty })),
        customer: {
          full_name: checkout.fullName,
          phone: checkout.phone,
          address1: checkout.address1,
          city: checkout.city,
          pin_code: checkout.pinCode,
        },
      });

      if (error) {
        console.error("create_shop_order failed", error);
        alert(`Could not create order: ${error.message}`);
        return;
      }

      setLastOrderId(orderId as string);

// Demo payment step
if (CLINIC.payments.demoMode) {
  await new Promise((r) => setTimeout(r, 650));
  setCheckoutStep("success");
  setCart([]);
  return;
}

// Real payment via Razorpay
if (!razorpayReady || !(window as any).Razorpay) {
  alert("Payment system is loading. Please try again in a moment.");
  return;
}

const createRes = await fetch("/api/razorpay/create-order", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ order_id: orderId }),
});

const createJson = await createRes.json().catch(() => ({} as any));
if (!createRes.ok) {
  console.error("Razorpay create-order failed:", createJson);

  const msg =
    (createJson as any)?.details?.error?.description ||
    (createJson as any)?.details?.description ||
    (createJson as any)?.details?.error ||
    (createJson as any)?.error ||
    "Failed to create Razorpay order.";

  alert(
    typeof msg === "string"
      ? msg
      : JSON.stringify(createJson, null, 2)
  );
  return;
}

const { razorpay_order_id, amount_paise, key_id } = createJson as any;

const rz = (window as any).Razorpay;
const options: any = {
  key: key_id,
  amount: amount_paise,
  currency: "INR",
  name: "Smile & Care",
  description: "Clinic order payment",
  order_id: razorpay_order_id,
  prefill: {
    name: checkout.fullName ?? "",
    contact: checkout.phone ?? "",
  },
  notes: {
    internal_order_id: String(orderId),
  },
  modal: {
    ondismiss: () => {
      // User closed Razorpay checkout — keep the order in pending state
      alert("Payment cancelled. Your order is still saved, you can try again.");
    },
  },
  handler: async (resp: any) => {
    try {
      const verifyRes = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internal_order_id: orderId,
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        }),
      });
      const verifyJson = await verifyRes.json().catch(() => ({} as any));
      if (!verifyRes.ok || !(verifyJson as any)?.verified) {
        alert((verifyJson as any)?.error || "Payment verification failed. Please contact reception.");
        return;
      }

      setCheckoutStep("success");
      setCart([]);
    } catch (e: any) {
      alert(e?.message || "Payment verification failed.");
    }
  },
  theme: { color: "#0f766e" },
};

const instance = new rz(options);
instance.open();
    } finally {
      setPaying(false);
    }
  };
  const closeOverlay = () => {
    setCheckoutOpen(false);
    setPaying(false);
  };

  const checkoutTitle =
    checkoutStep === "cart"
      ? "Your cart"
      : checkoutStep === "details"
      ? "Checkout details"
      : checkoutStep === "pay"
      ? "Payment"
      : "Order placed";

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_600px_at_20%_0%,rgba(20,184,166,0.14),transparent_60%),radial-gradient(900px_600px_at_80%_10%,rgba(14,165,233,0.12),transparent_60%)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand */}
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <Image
                src={CLINIC.logoUrl}
                alt={`${CLINIC.name} logo`}
                fill
                sizes="40px"
                className="object-contain p-1"
                priority
              />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-900">{CLINIC.name}</div>
              <div className="truncate text-xs text-slate-600">{CLINIC.city}</div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((it) => (
              <a
                key={it.id}
                href={`#${it.id}`}
                onClick={(e) => scrollToId(e, it.id)}
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                {it.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <button onClick={openCart} className={cn(BTN.base, BTN.outline)} type="button">
              <ShoppingCart className="h-4 w-4" />
              Cart
              {cartCount > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>

            <WhatsAppLink className={cn(BTN.base, BTN.whatsapp)}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </WhatsAppLink>

            <CallLink className={cn(BTN.base, BTN.primary)}>
              <Phone className="h-4 w-4" />
              Call
            </CallLink>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={openCart}
              className={cn(BTN.base, BTN.outline, "px-3")}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={cn(BTN.base, BTN.outline, "px-3")}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen ? (
          <div className="md:hidden">
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            />
            <div className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-slate-200 bg-white opacity-100 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-bold text-slate-900">Menu</div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(BTN.base, BTN.outline, "px-3")}
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1 bg-white p-4">
                {NAV_ITEMS.map((it) => (
                  <a
                    key={it.id}
                    href={`#${it.id}`}
                    onClick={(e) => {
                      scrollToId(e, it.id);
                      setMobileMenuOpen(false);
                    }}
                    className="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    {it.label}
                  </a>
                ))}
              </div>

              <div className="mt-auto space-y-2 border-t border-slate-200 p-4">
                <CallLink className={cn(BTN.base, BTN.primary, "w-full")}>
                  <Phone className="h-4 w-4" />
                  Call
                </CallLink>
                <WhatsAppLink className={cn(BTN.base, BTN.whatsapp, "w-full")}>
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </WhatsAppLink>
                <button
                  type="button"
                  onClick={() => {
                    openCart();
                    setMobileMenuOpen(false);
                  }}
                  className={cn(BTN.base, BTN.outline, "w-full")}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Cart
                  {cartCount > 0 ? (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              Open for appointments
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Gentle, modern dental care for your whole family.
            </h1>
            <p className="mt-4 text-slate-600">
              Implants • Root Canal • Braces/Aligners • Kids Dentistry • Cleaning &amp; Gum Care • Cosmetic Dentistry
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <WhatsAppLink className={cn(BTN.base, BTN.whatsapp)}>
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </WhatsAppLink>

              <CallLink className={cn(BTN.base, BTN.primary)}>
                <Phone className="h-4 w-4" />
                Call now
              </CallLink>

              <a href="#book" onClick={(e) => scrollToId(e, "book")} className={cn(BTN.base, BTN.outline)}>
                <Calendar className="h-4 w-4" />
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

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-teal-200/50 via-sky-200/30 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={CLINIC.heroImageUrl}
                  alt="Clinic hero"
                  fill
                  sizes="(max-width: 768px) 90vw, 520px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Modern equipment
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                    <HeartPulse className="h-3.5 w-3.5 text-teal-600" /> Patient-friendly
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                    <SmilePlus className="h-3.5 w-3.5 text-teal-600" /> Family care
                  </span>
                </div>
              </div>
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
          <div className="mt-10">
            <DoctorsFromSupabase
              scrollToId={scrollToId}
              cn={cn}
              BTN={BTN}
              WhatsAppLink={WhatsAppLink}
              onSelectDoctor={(doc) => {
                setBookingDoctorId(doc.id);
                setBookingNotice(null);
              }}
            />
          </div>
        </div>
      </section>

      {/* Shop */}
      <section id="shop" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <SectionHeading
            eyebrow="Merchandise"
            title="Dental essentials, recommended by our clinic"
            desc="Owner-managed catalog (Supabase). Checkout creates a secure order record. Payments are still in Demo mode."
          />

          
          {/* Search + Sort */}
          <div className="mt-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={shopQuery}
                  onChange={(e) => setShopQuery(e.target.value)}
                  placeholder="Search products (title or notes)…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={shopSort}
                  onChange={(e) => setShopSort(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200 md:w-56"
                >
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="discount_desc">Discount: High → Low</option>
                  <option value="title_asc">Title: A → Z</option>
                </select>

                <button
                  type="button"
                  className={cn(BTN.base, BTN.outline, BTN.small, "md:hidden")}
                  onClick={() => setShopFiltersOpen(true)}
                >
                  Filters
                </button>
              </div>
            </div>

            {/* Desktop filter chips */}
            <div className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
              <ChipToggle
                active={shopOnlyInStock}
                label="In stock"
                onClick={() => setShopOnlyInStock((v) => !v)}
              />
              <ChipToggle
                active={shopOnlyDiscounted}
                label="Discounted"
                onClick={() => setShopOnlyDiscounted((v) => !v)}
              />
              {shopHasActiveFilters ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  onClick={() => {
                    setShopQuery("");
                    setShopOnlyInStock(false);
                    setShopOnlyDiscounted(false);
                    setShopSort("featured");
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>

            {/* Mobile active filter chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2 md:hidden">
              {shopOnlyInStock ? (
                <ChipToggle active label="In stock" onClick={() => setShopOnlyInStock(false)} />
              ) : null}
              {shopOnlyDiscounted ? (
                <ChipToggle active label="Discounted" onClick={() => setShopOnlyDiscounted(false)} />
              ) : null}
              {shopHasActiveFilters ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  onClick={() => {
                    setShopQuery("");
                    setShopOnlyInStock(false);
                    setShopOnlyDiscounted(false);
                    setShopSort("featured");
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-2 text-xs text-slate-600">
              Showing <b>{shopResults.length}</b> item{shopResults.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Products */}
          {shopResults.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
              No products match your search/filters.
            </div>
          ) : (
            <>
              {/* Desktop: one-row horizontal shop strip */}
              <div className="mt-6 hidden md:block">
                <div className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-3">
                  {shopResults.map((p) => {
                    const discounted = (p.discountInr ?? 0) > 0 || (p.discountPct ?? 0) > 0;
                    return (
                      <ShopCard key={p.id} className="w-64 shrink-0 snap-start">
                        <div className="h-28 overflow-hidden rounded-2xl bg-slate-100">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                              No photo
                            </div>
                          )}
                        </div>

                        <div className="mt-3 text-sm font-semibold text-slate-900">{p.title}</div>
                        <div className="mt-1 truncate text-xs text-slate-600">{p.note}</div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-sm">
                            <div className="font-semibold text-slate-900">{formatInr(p.priceInr)}</div>

                            {discounted ? (
                              <div className="text-xs text-red-600 line-through">{formatInr(p.mrpInr)}</div>
                            ) : (
                              <div className="text-xs text-slate-500">MRP {formatInr(p.mrpInr)}</div>
                            )}

                            {discounted ? (
                              <div className="mt-1 text-xs font-semibold text-red-700">
                                Save {formatInr(p.discountInr)}
                                {p.discountPct > 0 ? ` (${p.discountPct}%)` : ""}
                              </div>
                            ) : null}

                            <div className={cn("mt-1 text-xs", p.stock > 0 ? "text-slate-600" : "text-rose-700")}>
                              {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                            </div>
                          </div>

                          <button
                            className={cn(
                              BTN.base,
                              BTN.outline,
                              BTN.small,
                              "rounded-xl px-3 py-2",
                              p.stock <= 0 && "cursor-not-allowed opacity-50"
                            )}
                            onClick={() => addToCart(p.id)}
                            disabled={p.stock <= 0}
                          >
                            <ShoppingBag className="h-4 w-4" />
                            Add
                          </button>
                        </div>
                      </ShopCard>
                    );
                  })}
                </div>
                <div className="mt-1 text-xs text-slate-500">Tip: scroll horizontally to see more items.</div>
              </div>

              {/* Mobile: compact list */}
              <div
                className={cn(
                  "mt-6 md:hidden",
                  shopMobileScrollable
                    ? "max-h-[70vh] overflow-y-auto pr-1 overscroll-contain space-y-3"
                    : "space-y-3"
                )}
              >
                {shopResults.map((p) => {
                  const discounted = (p.discountInr ?? 0) > 0 || (p.discountPct ?? 0) > 0;
                  return (
                    <ShopCard key={p.id} className="p-3">
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-400">
                              No photo
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">{p.title}</div>
                              <div className="mt-0.5 truncate text-xs text-slate-600">{p.note}</div>
                            </div>

                            <button
                              className={cn(
                                BTN.base,
                                BTN.outline,
                                "rounded-xl px-3 py-2 text-xs",
                                p.stock <= 0 && "cursor-not-allowed opacity-50"
                              )}
                              onClick={() => addToCart(p.id)}
                              disabled={p.stock <= 0}
                            >
                              <ShoppingBag className="h-4 w-4" />
                              Add
                            </button>
                          </div>

                          <div className="mt-2 flex items-end justify-between gap-3">
                            <div className="text-xs">
                              <div className="text-sm font-semibold text-slate-900">{formatInr(p.priceInr)}</div>
                              {discounted ? (
                                <div className="text-xs text-red-600 line-through">{formatInr(p.mrpInr)}</div>
                              ) : (
                                <div className="text-xs text-slate-500">MRP {formatInr(p.mrpInr)}</div>
                              )}
                              {discounted ? (
                                <div className="mt-1 text-xs font-semibold text-red-700">
                                  Save {formatInr(p.discountInr)}
                                  {p.discountPct > 0 ? ` (${p.discountPct}%)` : ""}
                                </div>
                              ) : null}
                            </div>

                            <div className={cn("text-xs", p.stock > 0 ? "text-slate-600" : "text-rose-700")}>
                              {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ShopCard>
                  );
                })}
              </div>
            </>
          )}

          {!catalogReady ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-semibold">Catalog not configured yet</div>
              <div className="mt-1 text-slate-600">
                Add items in <b>Owner Dashboard → Catalog</b>, mark them <b>active</b>, then refresh.
              </div>
              {catalogError ? <div className="mt-2 text-rose-700">Load error: {catalogError}</div> : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className={cn(BTN.base, BTN.primary)} onClick={openCart}>
              <ShoppingBag className="h-5 w-5" />
              View cart & checkout
              {cartCount > 0 ? (
                <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/90 px-2 text-xs font-bold text-slate-900">
                  {cartCount}
                </span>
              ) : null}
            </button>
            <div className="text-sm text-slate-600">Free shipping above ₹499. Otherwise ₹49.</div>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {shopFiltersOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShopFiltersOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Filters</div>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={() => setShopFiltersOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="flex items-center gap-3 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={shopOnlyInStock}
                    onChange={(e) => setShopOnlyInStock(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600"
                  />
                  In stock only
                </label>

                <label className="flex items-center gap-3 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={shopOnlyDiscounted}
                    onChange={(e) => setShopOnlyDiscounted(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600"
                  />
                  Discounted
                </label>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  className={cn(BTN.base, BTN.outline, "flex-1")}
                  onClick={() => {
                    setShopQuery("");
                    setShopOnlyInStock(false);
                    setShopOnlyDiscounted(false);
                    setShopSort("featured");
                  }}
                >
                  Clear
                </button>
                <button type="button" className={cn(BTN.base, BTN.primary, "flex-1")} onClick={() => setShopFiltersOpen(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

{/* Reviews (placeholder id preserved) */}
      <section id="reviews" className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Trust" title="Patient Reviews" desc="We can embed Google reviews or curated testimonials later." />
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <div className="text-sm font-semibold text-slate-900">“Very gentle and professional.”</div>
              <div className="mt-3 text-xs text-slate-600">— Patient A</div>
            </Card>
            <Card>
              <div className="text-sm font-semibold text-slate-900">“Clinic is clean, staff is helpful.”</div>
              <div className="mt-3 text-xs text-slate-600">— Patient B</div>
            </Card>
            <Card>
              <div className="text-sm font-semibold text-slate-900">“Quick appointment confirmation.”</div>
              <div className="mt-3 text-xs text-slate-600">— Patient C</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking */}
      <section id="book" className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Appointment"
            title="Book a visit"
            desc="Send your details and we’ll confirm the slot on WhatsApp/Call."
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
<form
  onSubmit={async (e) => {
    e.preventDefault();
    setBookingSubmitting(true);
    setBookingResult(null);
    setBookingNotice(null);

    try {
      // Guard: if date is chosen but no doctors are available, don't submit.
      if (visitDate && availableBookingDoctors.length === 0) {
        setBookingResult({
          ok: false,
          message: "No doctors are available on this date. Please choose another date.",
        });
        return;
      }

      const fd = new FormData(e.currentTarget);
      const fullName = String(fd.get("full_name") ?? "").trim();
      const phone = String(fd.get("phone") ?? "").trim();
      const service = String(fd.get("service") ?? "").trim();
      const date = String(fd.get("visit_date") ?? "").trim();
      const doctorId = String(fd.get("doctor_id") ?? "").trim();

      if (!fullName) {
        setBookingResult({ ok: false, message: "Please enter your full name." });
        return;
      }
      if (!phone) {
        setBookingResult({ ok: false, message: "Please enter your phone number." });
        return;
      }

      const payload: any = {
        full_name: fullName,
        phone,
        service: service || null,
        preferred_date: date || null,
        doctor_id: doctorId || null,
        status: "new",
        source: "web",
      };

      const { error } = await supabase
        .from("booking_requests")
        .insert(payload);

      if (error) {
        setBookingResult({ ok: false, message: error.message });
        return;
      }

      setBookingResult({
        ok: true,
        message: "Request received. Reception will call you to confirm.",
      });

      // Reset form fields
      (e.currentTarget as HTMLFormElement).reset();
      setVisitDate("");
      setBookingDoctorId("");
    } finally {
      setBookingSubmitting(false);
    }
  }}
  className="space-y-4"
>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Full name</label>
                  <input
                    name="full_name"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Phone</label>
                  <input
                    name="phone"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                    placeholder="10-digit mobile"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Preferred visit date</label>
                  <input
                    name="visit_date"
                    type="date"
                    value={visitDate}
                    onChange={(e) => {
                      setVisitDate(e.target.value);
                      setBookingNotice(null);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Reception will call back to confirm the exact time.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Doctor <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <select
                    name="doctor_id"
                    value={bookingDoctorId}
                    onChange={(e) => {
                      setBookingDoctorId(e.target.value);
                      setBookingNotice(null);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                  >
                    <option value="">Any doctor (optional)</option>
                    {bookingDoctors.map((d) => {
                      const extra = visitDate ? timingForDay(d, visitDate) : "";
                      return (
                        <option key={d.id} value={d.id}>
                          {d.name}{extra ? ` — ${extra}` : ""}
                        </option>
                      );
                    })}
                  </select>

                  {bookingDoctorsError ? (
                    <p className="mt-1 text-xs text-rose-700">Could not load doctors: {bookingDoctorsError}</p>
                  ) : null}

                  {visitDate && availableBookingDoctors.length === 0 ? (
                    <p className="mt-1 text-xs text-rose-700">
                      No doctors are available on this date. Please choose another date.
                    </p>
                  ) : null}

                  {bookingNotice ? <p className="mt-1 text-xs text-amber-700">{bookingNotice}</p> : null}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Service</label>
                  <select
                    name="service"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                    defaultValue={services[0]?.title ?? ""}
                  >
                    {services.map((s) => (
                      <option key={s.title} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={bookingSubmitting || (!!visitDate && availableBookingDoctors.length === 0)}
                  className={cn(
                    BTN.base,
                    BTN.primary,
                    "w-full",
                    (bookingSubmitting || (visitDate && availableBookingDoctors.length === 0)) && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  {bookingSubmitting ? "Submitting…" : "Request appointment"}
                </button>

                {bookingResult ? (
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm",
                      bookingResult.ok
                        ? "border-teal-200 bg-teal-50 text-teal-900"
                        : "border-rose-200 bg-rose-50 text-rose-800"
                    )}
                  >
                    {bookingResult.message}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <WhatsAppLink className={cn(BTN.base, BTN.whatsapp, BTN.small)}>
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </WhatsAppLink>
                  <CallLink className={cn(BTN.base, BTN.outline, BTN.small)}>
                    <Phone className="h-4 w-4" />
                    Call
                  </CallLink>
                </div>
              </form>
            </Card>

            <BookingDoctorCalendar
              key={`${selectedBookingDoctor?.id ?? "none"}:${visitDate ? visitDate.slice(0, 7) : "none"}`}
              doctor={selectedBookingDoctor}
              selectedDate={visitDate}
              onSelectDate={(dateISO) => {
                setVisitDate(dateISO);
                setBookingNotice(null);
              }}
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Visit" title="Contact & Location" desc="Find us on the map or get directions." />
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <div className="text-sm font-bold text-slate-900">{CLINIC.name}</div>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                {CLINIC.addressLines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <CallLink className={cn(BTN.base, BTN.primary, "w-full")}>
                  <Phone className="h-4 w-4" />
                  Call {CLINIC.phoneDisplay}
                </CallLink>
                <WhatsAppLink className={cn(BTN.base, BTN.whatsapp, "w-full")}>
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp us
                </WhatsAppLink>
                <a
                  className={cn(BTN.base, BTN.outline, "w-full")}
                  href={googleMapsDirectionsHref(CLINIC.mapQuery)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ChevronRight className="h-4 w-4" />
                  Get directions
                </a>
              </div>
            </Card>

            <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3 md:p-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <iframe
                  title="Smile & Care location"
                  src={googleMapsEmbedSrc(CLINIC.mapQuery)}
                  width="100%"
                  height="360"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block w-full"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <SectionHeading eyebrow="FAQ" title="Common questions" desc="Quick answers for patients." />
            <div className="grid gap-4">
              {FAQS.map((f) => (
                <FAQItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/60 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="text-sm font-bold text-slate-900">{CLINIC.name}</div>
              <div className="mt-1 text-xs text-slate-600">{CLINIC.city}</div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {NAV_ITEMS.map((it) => (
                <a
                  key={it.id}
                  href={`#${it.id}`}
                  onClick={(e) => scrollToId(e, it.id)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  {it.label}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 text-xs text-slate-500">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} {CLINIC.name}. Created by{" "}
              <a
                href="https://acubemanagement.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                @Acube
              </a>
              .
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Version: {APP_BUILD_VERSION}
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile FAB (replaces any bottom fixed action bar) */}
      {!checkoutOpen ? (
      <div ref={fabRef} className="fixed bottom-5 right-5 z-50 md:hidden">
        {fabOpen ? (
          <div className="mb-3 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={openCart}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-lg"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart {cartCount > 0 ? `(${cartCount})` : ""}
            </button>

            <WhatsAppLink className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </WhatsAppLink>

            <CallLink className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
              <Phone className="h-4 w-4" />
              Call
            </CallLink>

            <button
              type="button"
              onClick={() => {
                // For now, "Chat" opens WhatsApp (later we can swap to website chat widget)
                window.open(
                  `https://wa.me/${CLINIC.whatsappNumber}?text=${encodeURIComponent("Hi, I have a question.")}`,
                  "_blank",
                  "noopener,noreferrer"
                );
                setFabOpen(false);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-lg"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setFabOpen((s) => !s)}
          className={cn(
            "inline-flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition",
            fabOpen ? "bg-slate-900 text-white" : "bg-teal-600 text-white"
          )}
          aria-label={fabOpen ? "Close quick actions" : "Open quick actions"}
          aria-expanded={fabOpen}
        >
          {fabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
      ) : null}

      {/* Cart / checkout overlay */}
      {checkoutOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:p-4 sm:items-center">
          <button type="button" className="absolute inset-0" aria-label="Close checkout" onClick={closeOverlay} />
          <div className="relative flex h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div className="text-sm font-bold text-slate-900">{checkoutTitle}</div>
              <button type="button" className={cn(BTN.base, BTN.outline, "px-3")} onClick={closeOverlay}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-24 sm:pb-5">
              {checkoutStep === "cart" ? (
                <div className="space-y-4">
                  {cartLines.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Your cart is empty.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cartLines.map((l) => (
                        <div key={l.productId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{l.product.title}</div>
                            <div className="text-xs text-slate-600">{formatInr(l.product.priceInr)} each</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button type="button" className={cn(BTN.base, BTN.outline, "px-3")} onClick={() => updateQty(l.productId, l.qty - 1)}>
                              <Minus className="h-4 w-4" />
                            </button>
                            <div className="w-8 text-center text-sm font-semibold">{l.qty}</div>
                            <button type="button" className={cn(BTN.base, BTN.outline, "px-3")} onClick={() => updateQty(l.productId, l.qty + 1)}>
                              <Plus className="h-4 w-4" />
                            </button>
                            <button type="button" className={cn(BTN.base, BTN.outline, "px-3")} onClick={() => removeItem(l.productId)} aria-label="Remove item">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-xl bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-900">{formatInr(subTotal)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-slate-600">Shipping</span>
                      <span className="font-semibold text-slate-900">{formatInr(shipping)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-slate-700">Total</span>
                      <span className="text-base font-bold text-slate-900">{formatInr(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" className={cn(BTN.base, BTN.outline, "w-1/2")} onClick={closeOverlay}>
                      Continue shopping
                    </button>
                    <button
                      type="button"
                      className={cn(BTN.base, BTN.primary, "w-1/2")}
                      onClick={proceedToDetails}
                      disabled={cartLines.length === 0}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}

              {checkoutStep === "details" ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Full name</label>
                      <input
                        value={checkout.fullName}
                        onChange={(e) => setCheckout((s) => ({ ...s, fullName: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Phone</label>
                      <input
                        value={checkout.phone}
                        onChange={(e) => setCheckout((s) => ({ ...s, phone: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="10-digit mobile"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Address</label>
                    <input
                      value={checkout.address1}
                      onChange={(e) => setCheckout((s) => ({ ...s, address1: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                      placeholder="House/Street"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">City</label>
                      <input
                        value={checkout.city}
                        onChange={(e) => setCheckout((s) => ({ ...s, city: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">PIN</label>
                      <input
                        value={checkout.pinCode}
                        onChange={(e) => setCheckout((s) => ({ ...s, pinCode: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="PIN code"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" className={cn(BTN.base, BTN.outline, "w-1/2")} onClick={() => setCheckoutStep("cart")}>
                      Back
                    </button>
                    <button type="button" className={cn(BTN.base, BTN.primary, "w-1/2")} onClick={proceedToPay}>
                      Pay
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}

              {checkoutStep === "pay" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Demo payment enabled. Total: <b>{formatInr(grandTotal)}</b>
                  </div>
                  <button type="button" className={cn(BTN.base, BTN.primary, "w-full")} onClick={payNow} disabled={paying}>
                    {paying ? "Processing..." : `Pay ${formatInr(grandTotal)}`}
                  </button>
                  <button type="button" className={cn(BTN.base, BTN.outline, "w-full")} onClick={() => setCheckoutStep("details")}>
                    Back
                  </button>
                </div>
              ) : null}

              {checkoutStep === "success" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
                    Payment successful (demo). Order stored securely in Supabase.
                    {lastOrderId ? (
                      <div className="mt-2 text-xs text-teal-900">
                        Order ID: <span className="font-mono font-semibold">{lastOrderId}</span>
                      </div>
                    ) : null}
                  </div>
                  <button type="button" className={cn(BTN.base, BTN.primary, "w-full")} onClick={closeOverlay}>
                    Close
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <AuthModal
  open={authModalOpen}
  onClose={() => setAuthModalOpen(false)}
  title="Owner sign in required"
  nextPath="/"
/>
    </div>
  );
}
