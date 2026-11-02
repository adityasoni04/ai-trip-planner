// Free photos from Wikipedia (no API key needed).
// A search hit is only accepted when the article title really matches the place name,
// so "Coconut Grove" never shows a photo of an unrelated article. No match = no photo
// (the UI then shows a clearly-labelled area photo instead of a wrong one).
const mem = new Map();

const STOP = new Set([
  "the", "a", "an", "and", "of", "in", "at", "by", "de", "la", "le", "el",
  "hotel", "hotels", "resort", "resorts", "restaurant", "cafe", "bar", "inn", "lodge", "spa",
  "suites", "suite", "beach", "residency",
]);

// maps, flags, logos and diagrams make poor photos
const BAD_FILE = /\.svg$|(^|[\s_(-])(map|locator|location|flag|seal|coat|logo|emblem|diagram)($|[\s_.)-])/i;

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ");

function matches(name, title) {
  const want = norm(name).split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
  if (!want.length) return false;
  const have = new Set(norm(title).split(/\s+/).filter(Boolean));
  return want.filter((t) => have.has(t)).length / want.length >= 0.5;
}

// --- tiny request queue: a trip page asks for ~20 photos at once; Wikipedia rate-limits bursts ---
const MAX_PARALLEL = 3;
let running = 0;
const waiting = [];
function schedule(fn) {
  return new Promise((resolve, reject) => {
    const run = () => {
      running++;
      fn()
        .then(resolve, reject)
        .finally(() => {
          running--;
          waiting.shift()?.();
        });
    };
    running < MAX_PARALLEL ? run() : waiting.push(run);
  });
}

// The article must also mention the destination, so a same-named place elsewhere
// (e.g. "Coconut Grove" in Miami vs a hotel in Goa) is rejected.
function inPlace(city, text) {
  const want = norm(city).split(/\s+/).filter((t) => t.length > 2);
  if (!want.length) return true;
  const hay = norm(text);
  return want.some((t) => hay.includes(t));
}

async function wikipedia(name, city, q) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search" +
    `&gsrlimit=6&gsrsearch=${encodeURIComponent(q)}&prop=pageimages|extracts&piprop=thumbnail|name&pithumbsize=900` +
    "&exintro=1&explaintext=1&exsentences=4&exlimit=max";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`wiki ${res.status}`); // rate-limited / down: NOT cached as "no photo"
  const json = await res.json();
  const pages = Object.values(json?.query?.pages || {}).sort((a, b) => a.index - b.index);
  const hit = pages.find(
    (p) => p.thumbnail?.source && !BAD_FILE.test(p.pageimage || "") && matches(name, p.title) && (!city || inPlace(city, `${p.title} ${p.extract || ""}`))
  );
  return hit?.thumbnail.source || null;
}

async function lookup(name, city) {
  return schedule(() => wikipedia(name, city, `${name} ${city}`.trim()));
}

export function getImage(name, city = "") {
  const key = `${name}|${city}`.toLowerCase();
  if (mem.has(key)) return mem.get(key);
  try {
    const cached = sessionStorage.getItem("img3:" + key);
    if (cached !== null) {
      mem.set(key, Promise.resolve(cached || null));
      return mem.get(key);
    }
  } catch {
    /* storage unavailable */
  }
  const p = lookup(name, city).then(
    (v) => {
      try {
        sessionStorage.setItem("img3:" + key, v || ""); // a genuine "no match" is cached
      } catch {
        /* ignore */
      }
      return v;
    },
    () => {
      mem.delete(key); // transient error: allow a retry next time, don't cache
      return null;
    }
  );
  mem.set(key, p);
  return p;
}


// ---------------------------------------------------------------------------
// Destination (hero) photos — tries several free sources and only returns a URL
// that actually loads in the browser, so the hero is never blank.
// ---------------------------------------------------------------------------
const heroMem = new Map();

const preload = (u) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = u;
  });

// Wikimedia only serves standard thumbnail widths and refuses ones larger than the original
const wide = (thumb, originalWidth = 0) => {
  const w = [1280, 960, 500].find((x) => x <= originalWidth);
  return w ? thumb.replace(/\/\d+px-/, `/${w}px-`) : thumb;
};

async function wikiSummary(title) {
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.trim().replace(/ /g, "_"))}`);
  if (!res.ok) return null;
  const d = await res.json();
  if (d.type === "disambiguation") return null;
  const src = d.thumbnail?.source;
  const file = decodeURIComponent(src || "").split("/").slice(-2, -1)[0] || "";
  if (!src || BAD_FILE.test(file)) return null;
  return wide(src, d.originalimage?.width || 0);
}

async function commonsPhoto(query, mustHave) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6" +
    `&gsrlimit=12&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}&prop=imageinfo&iiprop=url|size&iiurlwidth=1400`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const pages = Object.values((await res.json())?.query?.pages || {}).sort((a, b) => a.index - b.index);
  const want = norm(mustHave).split(/\s+/).filter((t) => t.length > 2);
  const hit = pages.find((p) => {
    const i = p.imageinfo?.[0];
    const title = p.title.replace(/^File:/, "");
    return (
      i?.thumburl && i.width >= 1000 && i.width > i.height && /\.jpe?g$/i.test(title) && !BAD_FILE.test(title) &&
      (!want.length || want.some((t) => norm(title).includes(t)))
    );
  });
  return hit?.imageinfo[0].thumburl || null;
}

const store = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage unavailable */
    }
  },
};

/**
 * Resolve a loadable photo URL for a destination (or null if every source fails).
 * All sources are queried in PARALLEL and the best (highest-priority) one that loads wins,
 * so the wait is the slowest useful source, not the sum of all of them. Results persist in localStorage.
 */
export function getHeroImage({ title, name, country }) {
  const key = `${title || ""}|${name}|${country || ""}`.toLowerCase();
  if (heroMem.has(key)) return heroMem.get(key);
  const cached = store.get("hero2:" + key);
  if (cached) {
    heroMem.set(key, Promise.resolve(cached));
    return heroMem.get(key);
  }
  const steps = [
    title && (() => wikiSummary(title)),
    !title || norm(title) !== norm(name) ? () => wikiSummary(name) : null,
    country && (() => wikiSummary(`${name}, ${country}`)),
    () => wikipedia(name, country || "", `${name} ${country || ""}`.trim()),
    () => commonsPhoto(`${name} ${country || ""}`, name),
    country && (() => commonsPhoto(`${country} landscape`, country)),
  ].filter(Boolean);

  const attempts = steps.map(async (step) => {
    try {
      const u = await step();
      return u && (await preload(u)) ? u : null;
    } catch {
      return null;
    }
  });

  const p = (async () => {
    for (const attempt of attempts) {
      const u = await attempt; // all already running; we just honour priority order
      if (u) {
        store.set("hero2:" + key, u);
        return u;
      }
    }
    heroMem.delete(key); // nothing worked (offline / rate-limited): allow a retry later
    return null;
  })();
  heroMem.set(key, p);
  return p;
}
