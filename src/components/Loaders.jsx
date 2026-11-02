import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Page / auth loader — the brand pin bouncing on a rippling map point. */
export function PinLoader({ label, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 py-24", className)}>
      <div className="relative flex h-32 w-32 items-end justify-center">
        <span className="absolute bottom-2 h-10 w-24 animate-ripple rounded-full border border-teal-300/60" />
        <span className="absolute bottom-2 h-10 w-24 animate-ripple rounded-full border border-blue-400/50 [animation-delay:.6s]" />
        <img src="/logo.png" alt="" className="relative mb-3 h-20 w-20 animate-pin-bounce drop-shadow-[0_10px_20px_rgba(55,193,195,0.5)]" />
        <span className="absolute bottom-1 h-2 w-12 rounded-full bg-black/60 blur-sm" />
      </div>
      {label && <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>}
    </div>
  );
}

/** Button loader — four-colour segmented ring taken from the logo. */
export const SegSpinner = ({ className }) => <span className={cn("seg-spinner", className)} aria-label="Loading" />;

/** Inline "thinking" dots used while searching places. */
export function WaveDots({ className }) {
  const colors = ["bg-brand-teal", "bg-brand-blue", "bg-brand-green", "bg-brand-amber"];
  return (
    <span className={cn("inline-flex items-end gap-1", className)} aria-label="Searching">
      {colors.map((c, i) => (
        <span key={c} className={cn("h-1.5 w-1.5 animate-wave rounded-full", c)} style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </span>
  );
}

/** Map loader — radar sweep. */
export function RadarLoader({ className }) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-2xl border border-slate-50/10 bg-slate-950/60", className)}>
      <div className="relative h-44 w-44 rounded-full border border-teal-300/30">
        <div className="absolute inset-6 rounded-full border border-teal-300/25" />
        <div className="absolute inset-14 rounded-full border border-teal-300/20" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-teal-300/15" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-teal-300/15" />
        <div
          className="absolute inset-0 animate-sweep rounded-full"
          style={{ background: "conic-gradient(from 0deg, rgba(55,193,195,0) 70%, rgba(55,193,195,.55))" }}
        />
        <span className="absolute left-[30%] top-[28%] h-2 w-2 animate-node-pop rounded-full bg-brand-coral" />
        <span className="absolute left-[62%] top-[58%] h-2 w-2 animate-node-pop rounded-full bg-brand-amber [animation-delay:.7s]" />
      </div>
      <p className="absolute bottom-4 font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">Locating stops</p>
    </div>
  );
}

const LOG = [
  "reading your preferences",
  "scanning destinations & neighbourhoods",
  "ranking hotels by budget fit",
  "sequencing each day by distance",
  "pricing activities & meals",
  "assembling your packing list",
  "finalising itinerary",
];

/** Generation loader — an AI "route drawing" with a streaming log. */
export function RouteLoader({ place }) {
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setChars((c) => {
        if (c >= LOG[line].length) return c;
        return c + 1;
      });
    }, 28);
    return () => clearInterval(t);
  }, [line]);

  useEffect(() => {
    const t = setInterval(() => {
      setLine((l) => (l + 1) % LOG.length);
      setChars(0);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const nodes = [
    { x: 14, y: 118, c: "#37C1C3" },
    { x: 100, y: 62, c: "#3B99DB" },
    { x: 180, y: 80, c: "#34D073" },
    { x: 250, y: 38, c: "#F5B027" },
    { x: 306, y: 60, c: "#F24349" },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/90 p-6 backdrop-blur-md">
      <div className="glow-border w-full max-w-md p-7 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-teal-300">Xplore AI · planning</p>
        <h2 className="font-display mt-2 text-2xl font-bold">
          Building your trip to <span className="gradient-text">{place}</span>
        </h2>

        <div className="relative mx-auto mt-6 h-[160px] w-[320px] max-w-full">
          <svg viewBox="0 0 320 160" className="absolute inset-0 h-full w-full" fill="none">
            <defs>
              <linearGradient id="rl" x1="0" x2="1">
                <stop offset="0" stopColor="#37C1C3" />
                <stop offset=".5" stopColor="#3B99DB" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path d="M14 118 C 70 10, 120 170, 180 80 S 270 20, 306 60" stroke="rgba(255,255,255,.08)" strokeWidth="2" strokeDasharray="3 6" />
            <path
              d="M14 118 C 70 10, 120 170, 180 80 S 270 20, 306 60"
              stroke="url(#rl)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="400"
              className="animate-draw"
            />
            {nodes.map((n, i) => (
              <g key={i}>
                <circle cx={n.x} cy={n.y} r="11" fill={n.c} opacity=".18" className="animate-node-pop" style={{ animationDelay: `${i * 0.35}s`, transformOrigin: `${n.x}px ${n.y}px` }} />
                <circle cx={n.x} cy={n.y} r="4.5" fill={n.c} />
              </g>
            ))}
          </svg>
          <img src="/logo.png" alt="" className="route-runner" />
        </div>

        <div className="mt-4 rounded-xl border border-slate-50/10 bg-slate-50/5 px-4 py-3 text-left font-mono text-xs text-slate-300">
          <span className="text-brand-green">▸</span> {LOG[line].slice(0, chars)}
          <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-caret bg-teal-300" />
        </div>

        <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-slate-50/10">
          <div className="gradient-bg absolute inset-y-0 w-1/3 animate-indeterminate rounded-full" />
        </div>
        <p className="mt-3 text-xs text-slate-500">Usually 10–30 seconds</p>
      </div>
    </div>
  );
}
