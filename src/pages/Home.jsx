import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Brain, Hotel, Luggage, Map, Share2, Sparkles, Wallet, Wand2 } from "lucide-react";
import { Button } from "@/components/ui";
import PlaceImage, { HeroImage } from "@/components/PlaceImage";
import { cn } from "@/lib/utils";

const prompts = [
  "5 days in Kyoto for food lovers",
  "Budget backpacking through Goa",
  "Romantic week in Paris",
  "Family trip to Manali in winter",
  "Luxury weekend in Dubai",
];

const popular = [
  { name: "Goa", sub: "India", emoji: "🏖️" },
  { name: "Paris", sub: "France", emoji: "🗼" },
  { name: "Tokyo", sub: "Japan", emoji: "🗾" },
  { name: "Bali", sub: "Indonesia", emoji: "🌴" },
  { name: "Manali", sub: "India", emoji: "🏔️" },
  { name: "Dubai", sub: "UAE", geo: "United Arab Emirates", emoji: "🌆" },
];

const steps = [
  { n: "01", title: "Describe", text: "Destination, days, budget, who's coming, what you love." },
  { n: "02", title: "Generate", text: "Gemini reasons over places, prices and distances." },
  { n: "03", title: "Go", text: "Save, share, print — and head out the door." },
];

function useTyping(list) {
  const [text, setText] = useState("");
  useEffect(() => {
    let i = 0;
    let c = 0;
    let del = false;
    let t;
    const tick = () => {
      const full = list[i];
      c += del ? -1 : 1;
      setText(full.slice(0, c));
      let wait = del ? 28 : 55;
      if (!del && c === full.length) {
        del = true;
        wait = 1400;
      } else if (del && c === 0) {
        del = false;
        i = (i + 1) % list.length;
        wait = 400;
      }
      t = setTimeout(tick, wait);
    };
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [list]);
  return text;
}

const PASSES = [
  { city: "Goa", country: "India", code: "GOI", days: 3, total: "₹42,500", style: "Relaxed", emoji: "🏖️", color: "#37C1C3" },
  { city: "Tokyo", country: "Japan", code: "HND", days: 5, total: "¥210,000", style: "Packed", emoji: "🗾", color: "#F24349" },
  { city: "Paris", country: "France", code: "CDG", days: 4, total: "€1,850", style: "Balanced", emoji: "🗼", color: "#3B99DB" },
  { city: "Bali", country: "Indonesia", code: "DPS", days: 6, total: "$1,420", style: "Relaxed", emoji: "🌴", color: "#34D073" },
];

/** A boarding-pass style card that keeps "issuing" passes to new destinations. */
function BoardingPass() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % PASSES.length), 4500);
    return () => clearInterval(t);
  }, []);
  const p = PASSES[i];
  const bars = useMemo(() => Array.from({ length: 34 }, (_, k) => 1 + ((k * 7 + i * 3) % 4)), [i]);

  return (
    <div className="relative w-full max-w-[19rem] animate-float">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-3xl transition-colors duration-700" style={{ background: p.color }} />
      <div key={p.city} className="card animate-fade-up overflow-hidden !bg-slate-900/90 text-left">
        <PlaceImage name={p.city} city={p.country} emoji={p.emoji} className="h-36">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur">
            <Sparkles className="h-3 w-3 text-teal-300" /> AI boarding pass
          </span>
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <p className="font-display text-2xl font-extrabold leading-none">{p.city}</p>
              <p className="mt-1 text-xs opacity-80">{p.country}</p>
            </div>
            <p className="font-mono text-3xl font-bold tracking-widest" style={{ color: p.color }}>{p.code}</p>
          </div>
        </PlaceImage>

        {/* perforation */}
        <div className="relative my-px h-4">
          <span className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-slate-950" />
          <span className="absolute -right-2 top-0 h-4 w-4 rounded-full bg-slate-950" />
          <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-slate-50/25" />
        </div>

        <div className="grid grid-cols-3 gap-2 px-4 pb-2 pt-3">
          {[["Days", p.days], ["Est. total", p.total], ["Pace", p.style]].map(([k, v]) => (
            <div key={k}>
              <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{k}</p>
              <p className="font-display text-sm font-bold text-slate-50">{v}</p>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between gap-3 px-4 pb-4 pt-2">
          <div className="flex h-8 items-end gap-[2px]">
            {bars.map((h, k) => (
              <span key={k} className="w-[2px] rounded-sm bg-slate-50/70" style={{ height: `${h * 25}%` }} />
            ))}
          </div>
          <div className="flex gap-1.5">
            {PASSES.map((x, k) => (
              <span key={x.city} className={cn("h-1.5 rounded-full transition-all duration-500", k === i ? "w-5" : "w-1.5 bg-slate-50/25")} style={k === i ? { background: p.color } : undefined} />
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
  const typed = useTyping(prompts);

  const go = (e) => {
    e.preventDefault();
    navigate(`/plan-a-trip${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  return (
    <>
      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="tag mx-auto lg:mx-0">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" /> Powered by Google Gemini
            </span>
            <h1 className="font-display mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Your journey,
              <br />
              <span className="gradient-text">designed by AI.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400 lg:mx-0">
              Tell Xplore where you're headed. In seconds you get a day-by-day itinerary, hand-picked hotels, a real budget and a smart packing list.
            </p>

            <form onSubmit={go} className="glow-border mx-auto mt-9 max-w-xl p-2.5 lg:mx-0">
              <div className="flex items-center gap-2">
                <Wand2 className="ml-2 h-5 w-5 shrink-0 text-teal-300" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={typed || " "}
                  aria-label="Describe your trip"
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base text-slate-50 outline-none placeholder:text-slate-400"
                />
                <Button type="submit">
                  Generate <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["Goa", "Tokyo", "Bali"].map((d) => (
                <Link key={d} to={`/plan-a-trip?q=${d}`} className="tag transition hover:border-teal-300/50 hover:text-slate-50">
                  Try “{d}”
                </Link>
              ))}
            </div>
          </div>

          {/* orbiting logo */}
          <div className="relative mx-auto flex min-h-[27rem] w-full max-w-sm items-center justify-center">
            <div className="absolute h-72 w-72 animate-orbit rounded-full border border-dashed border-teal-300/25" />
            <div className="absolute h-96 w-96 animate-orbit rounded-full border border-slate-50/5 [animation-direction:reverse] [animation-duration:22s]" />
            <div className="absolute h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />
            {["#37C1C3", "#F24349", "#34D073", "#F5B027"].map((c, i) => (
              <span
                key={c}
                className="absolute h-3 w-3 rounded-full"
                style={{ background: c, boxShadow: `0 0 16px ${c}`, top: `${[8, 70, 88, 24][i]}%`, left: `${[30, 90, 40, 6][i]}%` }}
              />
            ))}
            <BoardingPass />
            <img src="/logo.png" alt="Xplore.ai" className="absolute -left-2 top-2 h-20 w-20 -rotate-12 drop-shadow-[0_14px_24px_rgba(55,193,195,0.55)] sm:-left-6" />
          </div>
        </div>
      </section>

      {/* POPULAR */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Start from a favourite</h2>
          <Link to="/plan-a-trip" className="text-sm font-semibold text-teal-300 hover:underline">Anywhere else →</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {popular.map((d) => (
            <Link key={d.name} to={`/plan-a-trip?q=${encodeURIComponent(d.name)}`} className="group">
              <HeroImage name={d.name} country={d.geo || d.sub} className="aspect-[3/4] rounded-2xl border border-slate-50/10 shadow-xl transition duration-300 group-hover:-translate-y-1.5 group-hover:border-teal-300/50 group-hover:shadow-[0_0_30px_-6px_rgba(55,193,195,0.6)]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="font-display text-lg font-bold leading-tight text-white">{d.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-300">{d.sub}</p>
                </div>
              </HeroImage>
            </Link>
          ))}
        </div>
      </section>

      {/* BENTO */}
      <section className="mx-auto mt-28 max-w-6xl px-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-300">What you get</p>
        <h2 className="font-display mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">One prompt. A complete, bookable-ready plan.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-6">
          <div className="card relative overflow-hidden p-7 md:col-span-3 md:row-span-2">
            <Brain className="h-8 w-8 text-teal-300" />
            <h3 className="font-display mt-4 text-2xl font-bold">Itineraries that think</h3>
            <p className="mt-2 text-slate-400">Activities are ordered geographically, timed realistically and priced per person — tuned to your interests and budget.</p>
            <div className="mt-6 space-y-2">
              {["09:00 · Old town walking tour", "13:00 · Local street-food crawl", "18:30 · Sunset viewpoint"].map((l, i) => (
                <div key={l} className="flex items-center gap-3 rounded-xl bg-slate-50/5 px-4 py-3 text-sm" style={{ marginLeft: i * 14 }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: ["#37C1C3", "#F5B027", "#F24349"][i] }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
          {[
            { i: Hotel, t: "Hotel picks", d: "Stays matched to budget with ratings & nightly prices.", c: "text-brand-blue", span: "md:col-span-3" },
            { i: Map, t: "Live route map", d: "Day-coloured pins on a clean map.", c: "text-brand-green", span: "md:col-span-3" },
            { i: Wallet, t: "Real budget", d: "Stay, food, transport & activities split out.", c: "text-brand-amber", span: "md:col-span-2" },
            { i: Luggage, t: "Packing list", d: "Tick items off — progress is saved.", c: "text-brand-coral", span: "md:col-span-2" },
            { i: Share2, t: "Share & print", d: "Public link or PDF in one click.", c: "text-teal-300", span: "md:col-span-2" },
          ].map((f) => (
            <div key={f.t} className={`card p-6 transition hover:-translate-y-1 hover:border-slate-50/25 ${f.span}`}>
              <f.i className={`h-6 w-6 ${f.c}`} />
              <h3 className="font-display mt-3 text-lg font-bold">{f.t}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STEPS */}
      <section className="mx-auto mt-28 max-w-5xl px-4">
        <h2 className="font-display text-center text-3xl font-bold">Three steps. Under a minute.</h2>
        <div className="relative mt-12 grid gap-8 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent md:block" />
          {steps.map((s) => (
            <div key={s.n} className="relative text-center">
              <span className="font-display mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-300/30 bg-slate-950 text-sm font-bold text-teal-300 shadow-[0_0_24px_-4px_rgba(55,193,195,0.6)]">{s.n}</span>
              <h3 className="font-display mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-28 max-w-4xl px-4">
        <div className="glow-border p-10 text-center">
          <img src="/logo.png" alt="" className="mx-auto h-14 w-14 animate-float" />
          <h2 className="font-display mt-4 text-3xl font-extrabold">Where to next?</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-400">Free to use. No credit card. Your first plan is seconds away.</p>
          <Link to="/plan-a-trip">
            <Button size="lg" className="mt-7">Plan my trip <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </>
  );
}
