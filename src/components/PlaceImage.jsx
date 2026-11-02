import { useEffect, useState } from "react";
import { getHeroImage, getImage } from "@/lib/images";
import { cn } from "@/lib/utils";

// Dark, logo-tinted fallbacks used when no photo exists
const fallbacks = [
  "from-[#0f3d40] via-[#0f1628] to-[#0d1b3a]",
  "from-[#0d1b3a] via-[#0f1628] to-[#2a1a4d]",
  "from-[#0b3b2e] via-[#0f1628] to-[#0f3d40]",
  "from-[#0f1628] via-[#0d1b3a] to-[#134e4a]",
];

/**
 * Fills its parent box (give it a height / aspect ratio or let a flex row stretch it).
 * If no photo exists for `name`, it falls back to a photo of `fallbackName` (e.g. the city),
 * and finally to a styled tile.
 */
export default function PlaceImage({ name, city, fallbackName, fallbackCity, emoji = "📍", className, children }) {
  const [src, setSrc] = useState(null);
  const [area, setArea] = useState(false); // true when showing the fallback (area) photo
  const [state, setState] = useState("loading"); // loading | ready | none

  useEffect(() => {
    let alive = true;
    setSrc(null);
    setArea(false);
    setState("loading");
    (async () => {
      let u = await getImage(name, city);
      let isArea = false;
      if (!u && fallbackName) {
        u = await getImage(fallbackName, fallbackCity);
        isArea = Boolean(u);
      }
      if (!alive) return;
      setSrc(u);
      setArea(isArea);
      setState(u ? "ready" : "none");
    })();
    return () => {
      alive = false;
    };
  }, [name, city, fallbackName, fallbackCity]);

  const g = fallbacks[(name?.length || 0) % fallbacks.length];
  return (
    <div className={cn("relative min-h-[8rem] overflow-hidden bg-gradient-to-br", g, className)}>
      {state === "ready" && src ? (
        <>
          <img
            src={src}
            alt={name}
            loading="lazy"
            onError={() => setState("none")}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
          />
          {area && (
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">📍 Area photo</span>
          )}
        </>
      ) : state === "loading" ? (
        <div className="shimmer absolute inset-0 flex items-center justify-center">
          <img src="/logo.png" alt="" className="h-10 w-10 animate-pulse opacity-40" />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
          <span className="text-4xl opacity-80 drop-shadow-[0_0_16px_rgba(55,193,195,0.5)]">{emoji}</span>
          <span className="line-clamp-2 text-xs font-medium text-white/70">{name}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Destination photo that always shows something: Wikipedia article image -> Wikimedia Commons photos
 * -> country photo. `title` (optional) is the exact Wikipedia article title suggested by Gemini.
 */
export function HeroImage({ name, country, title, url, onResolved, className, children }) {
  const [src, setSrc] = useState(url || null);
  const [state, setState] = useState(url ? "ready" : "loading");
  const [stored, setStored] = useState(url || "");

  // a URL saved with the trip shows instantly; otherwise (or if it breaks) resolve it from the web
  useEffect(() => {
    if (stored) {
      setSrc(stored);
      setState("ready");
      return undefined;
    }
    let alive = true;
    setSrc(null);
    setState("loading");
    getHeroImage({ title, name, country }).then((u) => {
      if (!alive) return;
      setSrc(u);
      setState(u ? "ready" : "none");
      if (u) onResolved?.(u);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, name, country, stored]);

  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-[#0f3d40] via-[#0f1628] to-[#2a1a4d]", className)}>
      {state === "ready" && src ? (
        <img src={src} alt={name} className="absolute inset-0 h-full w-full animate-fade-up object-cover" onError={() => (stored ? setStored("") : setState("none"))} />
      ) : state === "loading" ? (
        <div className="shimmer absolute inset-0 flex items-center justify-center">
          <img src="/logo.png" alt="" className="h-12 w-12 animate-pulse opacity-50" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-5xl font-extrabold text-white/15 sm:text-7xl">{name}</span>
        </div>
      )}
      {children}
    </div>
  );
}
