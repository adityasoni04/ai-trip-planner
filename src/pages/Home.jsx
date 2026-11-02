import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui";
import { HeroImage } from "@/components/PlaceImage";
import { cn } from "@/lib/utils";

// Two disjoint lists so the hero and bottom inputs never show the same name at the same time.
const placesA = [
  "Kyoto", "Goa", "Paris", "Bali", "Manali", "Dubai", "Santorini", "Marrakech", "Reykjavik", "Ladakh",
  "Amalfi Coast", "Machu Picchu", "Queenstown", "Hampi", "Maldives", "Banff", "Cappadocia", "Hanoi",
  "Seoul", "Prague", "Rishikesh", "Havana", "Petra", "Zanzibar", "Lisbon", "Kerala", "Patagonia", "Vienna",
];
const placesB = [
  "Udaipur", "Cape Town", "Istanbul", "Rome", "Singapore", "Bangkok", "Tuscany", "Edinburgh", "Jaipur",
  "Sydney", "New York", "Barcelona", "Phuket", "Nara", "Darjeeling", "Amsterdam", "Cairo", "Bhutan",
  "Lake Como", "Hokkaido", "Meghalaya", "Buenos Aires", "Fiji", "Venice", "Siem Reap", "Mykonos", "Andaman", "Budapest",
];

const popular = [
  { name: "Goa", sub: "India" },
  { name: "Paris", sub: "France" },
  { name: "Tokyo", sub: "Japan" },
  { name: "Bali", sub: "Indonesia" },
  { name: "Manali", sub: "India" },
  { name: "Dubai", sub: "UAE", geo: "United Arab Emirates" },
];

const includes = [
  ["Day-by-day itinerary", "Timed activities grouped by area, with a price per person."],
  ["Hotel picks", "Stays within your budget, with ratings and nightly prices."],
  ["Route map", "Each day's stops pinned on a map."],
  ["Budget breakdown", "Stay, food, transport and activities itemised."],
  ["Packing list", "Tick items off; progress is saved."],
  ["Share & print", "Send a public link or print to PDF."],
];

const PASSES = [
  { city: "Goa", country: "India", code: "GOI", days: 3, total: "₹42,500", style: "Relaxed" },
  { city: "Tokyo", country: "Japan", code: "HND", days: 5, total: "¥210,000", style: "Packed" },
  { city: "Paris", country: "France", code: "CDG", days: 4, total: "€1,850", style: "Balanced" },
  { city: "Bali", country: "Indonesia", code: "DPS", days: 6, total: "$1,420", style: "Relaxed" },
];

function useTyping(list) {
  const [text, setText] = useState("");
  useEffect(() => {
    let c = 0;
    let del = false;
    let t;
    let deck = [];
    // shuffled deck: every name shows once before any repeats, and never twice in a row
    const next = (prev) => {
      if (!deck.length) {
        deck = [...list].sort(() => Math.random() - 0.5);
        if (deck[deck.length - 1] === prev) deck.unshift(deck.pop());
      }
      return deck.pop();
    };
    let full = next();
    const tick = () => {
      c += del ? -1 : 1;
      setText(full.slice(0, c));
      let wait = del ? 28 : 55;
      if (!del && c === full.length) {
        del = true;
        wait = 1400;
      } else if (del && c === 0) {
        del = false;
        full = next(full);
        wait = 400;
      }
      t = setTimeout(tick, wait);
    };
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [list]);
  return text;
}

/** Arched destination photo with a boarding-pass summary overlapping it; cycles through sample plans. */
function HeroVisual() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % PASSES.length), 4500);
    return () => clearInterval(t);
  }, []);
  const p = PASSES[i];
  const bars = useMemo(() => Array.from({ length: 34 }, (_, k) => 1 + ((k * 7 + i * 3) % 4)), [i]);

  return (
    <div className="relative mx-auto w-full max-w-md pb-14 lg:ml-auto lg:mr-0">
      <HeroImage
        key={`img-${p.city}`}
        name={p.city}
        country={p.country}
        className="ml-auto aspect-[4/5] w-[78%] rounded-b-xl rounded-t-[999px] border border-slate-50/10"
      />
      <div key={`pass-${p.city}`} className="absolute bottom-0 left-0 w-[66%] min-w-[15rem] animate-fade-up rounded-xl border border-slate-50/15 bg-[var(--surface)] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between px-4 pt-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Sample plan</p>
            <p className="font-display mt-1 text-2xl leading-none">{p.city}</p>
          </div>
          <p className="font-mono text-2xl font-medium tracking-widest text-teal-300">{p.code}</p>
        </div>
        <div className="mx-4 my-3 border-t border-dashed border-slate-50/25" />
        <div className="grid grid-cols-3 gap-2 px-4">
          {[["Days", p.days], ["Est. total", p.total], ["Pace", p.style]].map(([k, v]) => (
            <div key={k}>
              <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{k}</p>
              <p className="font-display text-sm">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end justify-between gap-3 px-4 pb-4 pt-3">
          <div className="flex h-7 items-end gap-[2px]" aria-hidden="true">
            {bars.map((h, k) => (
              <span key={k} className="w-[2px] bg-slate-50/60" style={{ height: `${h * 25}%` }} />
            ))}
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {PASSES.map((x, k) => (
              <span key={x.city} className={cn("h-1.5 rounded-full transition-all duration-500", k === i ? "w-5 bg-slate-50" : "w-1.5 bg-slate-50/25")} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const typedA = useTyping(placesA);
  const typedB = useTyping(placesB);

  const go = (e) => {
    e.preventDefault();
    navigate(`/plan-a-trip${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
          <div className="animate-fade-up">
            <h1 className="font-display text-5xl leading-[1] sm:text-7xl">
              Plan a trip in <em className="gradient-text italic">one sentence.</em>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-slate-400">
              Say where you're going. Xplore returns a day-by-day itinerary, hotel options, a budget and a packing list.
            </p>

            <form onSubmit={go} className="mt-10 flex max-w-xl items-center gap-2 rounded-xl border border-slate-50/20 bg-[var(--surface)] p-2 transition focus-within:border-slate-50/60">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={typedA || " "}
                aria-label="Describe your trip"
                className="min-w-0 flex-1 bg-transparent px-3 py-4 font-display text-2xl text-slate-50 sm:text-3xl outline-none placeholder:text-slate-400"
              />
              <Button type="submit">
                Generate <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-4 text-sm text-slate-400">
              Or try{" "}
              {["Goa", "Tokyo", "Bali"].map((d, i) => (
                <span key={d}>
                  {i > 0 && ", "}
                  <Link to={`/plan-a-trip?q=${d}`} className="font-medium text-slate-50 underline decoration-slate-50/30 underline-offset-4 hover:decoration-slate-50">
                    {d}
                  </Link>
                </span>
              ))}
              .
            </p>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* POPULAR */}
      <section className="mx-auto max-w-6xl border-t border-slate-50/10 px-4 pt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl sm:text-4xl">Popular destinations</h2>
          <Link to="/plan-a-trip" className="shrink-0 text-sm font-medium underline decoration-slate-50/30 underline-offset-4 hover:decoration-slate-50">
            Anywhere else
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {popular.map((d) => (
            <Link key={d.name} to={`/plan-a-trip?q=${encodeURIComponent(d.name)}`} className="group block">
              <HeroImage name={d.name} country={d.geo || d.sub} className="aspect-[3/4] rounded-lg border border-slate-50/10 [&_img]:transition [&_img]:duration-500 group-hover:[&_img]:scale-105" />
              <p className="font-display mt-3 text-lg leading-tight">{d.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{d.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* INCLUDES */}
      <section className="mx-auto mt-32 max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-5xl leading-[1.02] sm:text-6xl">
              What a plan <em className="gradient-text italic">includes</em>
            </h2>
            <p className="mt-5 max-w-sm text-lg text-slate-400">Everything you need to go, generated from one sentence.</p>
          </div>
          <ul className="border-t border-slate-50/30">
            {includes.map(([t, d], i) => (
              <li
                key={t}
                className="group grid cursor-default grid-cols-[3rem_1fr_auto] items-center gap-x-2 border-b border-slate-50/10 px-4 py-6 transition-colors duration-300 hover:rounded-xl hover:border-transparent hover:bg-slate-50"
              >
                <span className="font-mono text-sm text-slate-400 transition-colors group-hover:text-slate-950/60">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-3xl transition-colors group-hover:text-slate-950 sm:text-4xl">{t}</h3>
                  <p className="mt-1.5 text-slate-400 transition-colors group-hover:text-slate-950/70">{d}</p>
                </div>
                <ArrowUpRight className="h-7 w-7 -translate-x-2 translate-y-2 text-slate-950 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-28 max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-2xl">
          <HeroImage name="Kyoto" country="Japan" className="!absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative px-6 py-16 text-white sm:px-14 sm:py-24">
            <h2 className="font-display text-5xl !text-white sm:text-7xl">
              Where to <em className="italic">next?</em>
            </h2>
            <p className="mt-4 text-lg text-white/75">Free to use. No card needed.</p>
            <form onSubmit={go} className="mt-8 flex max-w-xl items-center gap-2 rounded-xl bg-white p-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={typedB || " "}
                aria-label="Describe your trip"
                className="min-w-0 flex-1 bg-transparent px-3 py-4 font-display text-2xl text-neutral-900 sm:text-3xl outline-none placeholder:text-neutral-500"
              />
              <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98]">
                Plan my trip <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
